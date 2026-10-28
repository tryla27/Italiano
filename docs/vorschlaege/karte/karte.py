"""Karte für Pizzeria Parola: Golf von Neapel von oben, passend zu PLACES in www/js/karte.js.
Kartenkoordinaten (SVG-viewBox 400 x 540, y nach unten) -> Welt: X = x/10 - 20, Y = 27 - y/10."""
import bpy, bmesh, math, sys, os, random
from mathutils import Vector, noise

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
SAMPLES = int(argv[1]) if len(argv) > 1 else 128
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
random.seed(11)

PLACES = {'pizzeria': (112, 250), 'mercato': (282, 150), 'gelateria': (296, 300), 'porto': (150, 402), 'capri': (336, 448)}


def W(x, y):
    return x / 10 - 20, 27 - y / 10


def hexc(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def mix(a, b, t):
    t = max(0, min(1, t))
    return [a[i] + (b[i] - a[i]) * t for i in range(3)]


def smooth(e0, e1, x):
    t = max(0, min(1, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


# Küstenlinie in Kartenkoordinaten: Bucht unter dem Hafen und Strand nach rechts
def shore_y(x):
    return 418 - 26 * math.sin((x - 20) / 380 * math.pi * 1.0) + 40 * math.exp(-((x - 245) / 55) ** 2) - 18 * math.exp(-((x - 150) / 40) ** 2)


VES = (78, 92)      # Vesuv-Gipfel (Karte)
CAPRI = (336, 470)


def height(mx, my):
    """Höhe in Metern an Kartenpunkt (mx, my)."""
    sy = shore_y(mx)
    d_shore = sy - my            # >0 an Land
    n = noise.noise(Vector((mx / 60, my / 60, 0)))
    land = .35 + .25 * n
    h = land * smooth(-4, 18, d_shore) - 1.6 * (1 - smooth(-30, 0, d_shore))
    # Vesuv mit Krater und Somma-Rücken
    d = math.hypot(mx - VES[0], my - VES[1])
    R = 150
    if d < R:
        t = 1 - d / R
        ang = math.atan2(my - VES[1], mx - VES[0])
        rid = noise.ridged_multi_fractal(Vector((mx / 70, my / 70, 1.3)), 1.0, 2.0, 4, 1.0, 2.0)
        warp = 1.6 * noise.noise(Vector((mx / 35, my / 35, 4))) + .8 * noise.noise(Vector((mx / 12, my / 12, 6)))
        gully = abs(math.sin(ang * 17 + warp)) ** 1.5 * (.6 + .6 * noise.noise(Vector((mx / 20, my / 20, 8))))
        m = 22 * t ** 1.35 + 1.6 * rid * t + 1.6 * gully * min(1, t * 3) * (1 - t)
        m -= 7 * math.exp(-(d / 14) ** 2)                                 # Krater
        ang = math.atan2(my - VES[1], mx - VES[0])
        m += 5 * math.exp(-((d - 40) / 9) ** 2) * smooth(.2, 1.4, -math.sin(ang + .6))  # Somma-Rücken im Norden
        h = max(h, m)
    # Capri
    dc = math.hypot((mx - CAPRI[0]) / 62, (my - CAPRI[1]) / 26)
    if dc < 1.6:
        h = max(h, -1.6 + 2.4 * smooth(1.6, .75, dc) + 3.2 * smooth(.85, .1, dc) * (1 + .3 * noise.noise(Vector((mx / 15, my / 15, 5)))))
    return h


# ---------- Gelände ----------
NX, NY = 400, 540
bm = bmesh.new()
cols = []
SAND, GRAS, WIESE, FELD = hexc('#ecd6a2'), hexc('#97ad62'), hexc('#bcc27c'), hexc('#e0cc8e')
FELS, ASCHE, KRATER, MEERB = hexc('#8b7a66'), hexc('#6f6763'), hexc('#4a403c'), hexc('#d9c792')
verts = []
for j in range(NY + 1):
    row = []
    for i in range(NX + 1):
        mx, my = i * 400 / NX, j * 540 / NY
        h = height(mx, my)
        x, y = W(mx, my)
        row.append(bm.verts.new((x, y, h)))
        d_shore = shore_y(mx) - my
        dc = math.hypot((mx - CAPRI[0]) / 62, (my - CAPRI[1]) / 26)
        n2 = noise.noise(Vector((mx / 22, my / 22, 2)))
        if h < -.05:
            c = mix(MEERB, SAND, (h + 1.6) / 1.6)
        elif h < .6 and (d_shore < 24 or 1.0 < dc < 1.25):
            c = SAND
        else:
            c = mix(WIESE, FELD, .5 + .7 * n2)
            c = mix(c, GRAS, smooth(-.2, .5, noise.noise(Vector((mx / 40, my / 40, 9)))))
            if h > 2:
                c = mix(c, FELS, smooth(5, 13, h))
            if h > 13:
                c = mix(c, ASCHE, smooth(13, 20, h))
            dv = math.hypot(mx - VES[0], my - VES[1])
            if dv < 14:
                c = mix(c, KRATER, smooth(14, 6, dv))
        cols.append(c)
    verts.append(row)
for j in range(NY):
    for i in range(NX):
        bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
me = bpy.data.meshes.new('gelaende')
bm.to_mesh(me)
bm.free()
ca = me.color_attributes.new('farbe', 'FLOAT_COLOR', 'POINT')
for k, c in enumerate(cols):
    ca.data[k].color = (*c, 1)
terr = bpy.data.objects.new('gelaende', me)
sc.collection.objects.link(terr)
for p in me.polygons:
    p.use_smooth = True
tm = bpy.data.materials.new('gelaende')
tm.use_nodes = True
nt = tm.node_tree
b = nt.nodes['Principled BSDF']
at = nt.nodes.new('ShaderNodeVertexColor')
at.layer_name = 'farbe'
nt.links.new(at.outputs['Color'], b.inputs['Base Color'])
b.inputs['Roughness'].default_value = .9
me.materials.append(tm)


def mat(name, col, rough=.6, metal=0, alpha=1):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bb = m.node_tree.nodes['Principled BSDF']
    bb.inputs['Base Color'].default_value = (*hexc(col), 1)
    bb.inputs['Roughness'].default_value = rough
    bb.inputs['Metallic'].default_value = metal
    bb.inputs['Alpha'].default_value = alpha
    return m


# ---------- Meer ----------
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
sea = bpy.context.object
sea.scale = (60, 70, 1)
wm = mat('meer', '#1f86ad', .08, 0, .72)
sea.data.materials.append(wm)


# ---------- Straßen ----------
def qbez(p0, p1, p2, n=60):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1])
            for t in [k / n for k in range(n + 1)]]


STRASSE = mat('strasse', '#cdb58a', .85)
MITTE = mat('mitte', '#fff6e0', .6)
ROADS = [qbez((112, 250), (200, 210), (282, 150)), qbez((112, 250), (210, 280), (296, 300)), qbez((112, 250), (120, 330), (150, 402)),
         qbez((296, 300), (340, 330), (400, 330)), qbez((282, 150), (330, 110), (400, 95))]


def strasse(pts, breite=.75):
    bm = bmesh.new()
    prev = []
    for k, (mx, my) in enumerate(pts):
        a = pts[max(k - 1, 0)]
        c = pts[min(k + 1, len(pts) - 1)]
        dx, dy = c[0] - a[0], c[1] - a[1]
        l = math.hypot(dx, dy) or 1
        nx, ny = -dy / l, dx / l
        row = []
        for s in (-1, 1):
            px, py = mx + s * nx * breite * 10, my + s * ny * breite * 10
            x, y = W(px, py)
            row.append(bm.verts.new((x, y, max(height(px, py), height(mx, my)) + .06)))
        if prev:
            bm.faces.new((prev[0], prev[1], row[1], row[0]))
        prev = row
    me = bpy.data.meshes.new('strasse')
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('strasse', me)
    sc.collection.objects.link(o)
    me.materials.append(STRASSE)
    # Mittellinie gestrichelt
    for k in range(2, len(pts) - 2, 4):
        mx, my = pts[k]
        x, y = W(mx, my)
        a, c = pts[k - 1], pts[k + 1]
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, height(mx, my) + .09), rotation=(0, 0, math.atan2(-(c[1] - a[1]), c[0] - a[0])))
        d = bpy.context.object
        d.scale = (.45, .08, .02)
        d.data.materials.append(MITTE)


for r in ROADS:
    strasse(r)

# ---------- Häuser, Bäume, Hafen ----------
WAENDE = [mat('wand%d' % i, c, .8) for i, c in enumerate(('#f0d39b', '#e9b77a', '#f3e0c0', '#e48a6a', '#f5e6c8', '#d9a07a'))]
DACH = mat('dach', '#c0503f', .7)
BAUM = [mat('baum1', '#5f8f45', .8), mat('baum2', '#73a352', .8)]
ZYPRESSE = mat('zypresse', '#3f6b35', .8)


def frei(mx, my, rad=62):
    if any(math.hypot(mx - px, my - py) < rad for px, py in PLACES.values()):
        return False
    # Schild unter jedem Ort freihalten
    if any(abs(mx - px) < 66 and py + 40 < my < py + 92 for px, py in PLACES.values()):
        return False
    if 330 < mx and my < 75:
        return False  # Kompass
    return True


def auf_strasse(mx, my):
    return any(math.hypot(mx - px, my - py) < 11 for r in ROADS for px, py in r[::2])


def haus(mx, my, rot):
    x, y = W(mx, my)
    z = height(mx, my)
    w, d, h = random.uniform(1.1, 1.7), random.uniform(.9, 1.3), random.uniform(.7, 1.1)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z + h / 2), rotation=(0, 0, rot))
    o = bpy.context.object
    o.scale = (w, d, h)
    o.data.materials.append(random.choice(WAENDE))
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=.72, depth=.5, location=(x, y, z + h + .2), rotation=(0, 0, rot + math.pi / 4))
    r = bpy.context.object
    r.scale = (w * .98, d * .98, 1)
    r.data.materials.append(DACH)


def baum(mx, my):
    x, y = W(mx, my)
    z = height(mx, my)
    if random.random() < .35:
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=.32, depth=1.6, location=(x, y, z + .8))
        bpy.context.object.data.materials.append(ZYPRESSE)
    else:
        s = random.uniform(.45, .75)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=s, location=(x, y, z + s * .9))
        bpy.context.object.data.materials.append(random.choice(BAUM))
    bpy.ops.object.shade_smooth()


# Häuser in Gruppen entlang der Straßen, Bäume dazwischen und am Berg
for r in ROADS:
    for (mx, my) in r[3::5]:
        for _ in range(4):
            ox, oy = random.uniform(-30, 30), random.uniform(-30, 30)
            hx, hy = mx + ox, my + oy
            if 0 < hx < 400 and 0 < hy < 540 and frei(hx, hy, 58) and not auf_strasse(hx, hy) and height(hx, hy) > .1 and shore_y(hx) - hy > 12:
                haus(hx, hy, math.atan2(oy, ox) + random.uniform(-.3, .3))
for _ in range(320):
    mx, my = random.uniform(0, 400), random.uniform(0, 540)
    h = height(mx, my)
    if .1 < h < 11 and frei(mx, my, 52) and not auf_strasse(mx, my) and shore_y(mx) - my > 10:
        baum(mx, my)
for _ in range(60):  # Capri grün
    mx, my = CAPRI[0] + random.uniform(-45, 45), CAPRI[1] + random.uniform(-14, 14)
    if height(mx, my) > .8 and not (abs(mx - 336) < 62 and my < 495 and my > 400):
        baum(mx, my)

# Hafen: Mole und Boote
mx, my = 150, 402
for (ax, ay, bx, by) in ((108, 430, 190, 440), (190, 440, 205, 470)):
    x0, y0 = W(ax, ay)
    x1, y1 = W(bx, by)
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, .2), rotation=(0, 0, math.atan2(y1 - y0, x1 - x0)))
    o = bpy.context.object
    o.scale = (math.hypot(x1 - x0, y1 - y0), .9, .5)
    o.data.materials.append(mat('mole', '#c9b99a', .9))
BOOTE = [mat('boot%d' % i, c, .5) for i, c in enumerate(('#e5533f', '#f3eee2', '#2f8f86', '#f4c64f', '#3a6ea5'))]
for (bx, by, rot) in ((95, 455, .3), (120, 462, -.2), (60, 470, .5), (215, 500, 1.2), (255, 520, .1), (40, 505, -.4), (175, 515, .8), (390, 470, .2), (300, 505, -.6)):
    if not frei(bx, by, 50):
        continue
    x, y = W(bx, by)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.5, location=(x, y, .05), rotation=(0, 0, rot))
    o = bpy.context.object
    o.scale = (2.2, .75, .4)
    o.data.materials.append(random.choice(BOOTE))
    bpy.ops.object.shade_smooth()

# ---------- Licht und Kamera ----------
sc.world = bpy.data.worlds.new('w')
sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (*hexc('#bcd9e8'), 1)
sc.world.node_tree.nodes['Background'].inputs[1].default_value = .45
sun = bpy.data.lights.new('sonne', 'SUN')
sun.energy = 4.5
sun.angle = math.radians(6)
sun.color = (1, .95, .86)
so = bpy.data.objects.new('sonne', sun)
sc.collection.objects.link(so)
so.rotation_euler = (math.radians(55), 0, math.radians(-135))  # Licht von oben links (Nordwest) für das Relief
sun.use_shadow = False
sun2 = bpy.data.lights.new('sonne2', 'SUN')
sun2.energy = 1.6
sun2.angle = math.radians(4)
so2 = bpy.data.objects.new('sonne2', sun2)
sc.collection.objects.link(so2)
so2.rotation_euler = (math.radians(18), 0, math.radians(-135))  # kurze Schatten für Häuser und Bäume

cam = bpy.data.cameras.new('cam')
cam.type = 'ORTHO'
cam.ortho_scale = 54
co = bpy.data.objects.new('cam', cam)
sc.collection.objects.link(co)
co.location = (0, 0, 60)
sc.camera = co
sc.render.resolution_x, sc.render.resolution_y = 800, 1080
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'

sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.refresh_devices()
for d in prefs.devices:
    d.use = (d.type == 'OPTIX')
sc.cycles.device = 'GPU'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.render.filepath = os.path.join(OUT, 'karte.png')
bpy.ops.render.render(write_still=True)
