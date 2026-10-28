import bpy, bmesh, math, sys, os, random
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
MODE, OUT = argv[0], argv[1]
SAMPLES = int(argv[2]) if len(argv) > 2 else 160
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
random.seed(7)


def hexc(h, a=1):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], a)


MATS = {}


def mat(name, col, rough=.5, metal=0, emit=None, es=0, alpha=1):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hexc(col)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = hexc(emit)
        b.inputs['Emission Strength'].default_value = es
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    MATS[name] = m
    return m


def checker(name, c1, c2, scale, rough=.4):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    ck = nt.nodes.new('ShaderNodeTexChecker')
    ck.inputs['Color1'].default_value = hexc(c1)
    ck.inputs['Color2'].default_value = hexc(c2)
    ck.inputs['Scale'].default_value = scale
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(tc.outputs['Object'], ck.inputs['Vector'])
    nt.links.new(ck.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    return m


def wood(name, c1, c2):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (.4, 8, 8)
    ns = nt.nodes.new('ShaderNodeTexNoise')
    ns.inputs['Scale'].default_value = 3
    ns.inputs['Detail'].default_value = 8
    cr = nt.nodes.new('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].position = .35
    cr.color_ramp.elements[0].color = hexc(c1)
    cr.color_ramp.elements[1].position = .7
    cr.color_ramp.elements[1].color = hexc(c2)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], ns.inputs['Vector'])
    nt.links.new(ns.outputs['Fac'], cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = .6
    return m


HOLZ = wood('Holz', '#5a3018', '#8f5530')
HOLZ_HELL = wood('HolzHell', '#a06a3c', '#c8925a')
TUCH = checker('Tuch', '#c0392b', '#f3eee2', 9, .8)
BODEN = checker('Boden', '#2f3a35', '#efe7d6', 2.2, .35)
MARMOR = mat('Marmor', '#efe9df', .2)
CHROM = mat('Chrom', '#a9b0b4', .25, 1)
GOLD = mat('Gold', '#f4c64f', .3, 1)
DUNKEL = mat('Dunkel', '#1d1d1d', .6)
TERRA = mat('Terrakotta', '#b8562f', .7)
CREME = mat('Creme', '#e9dcc3', .85)
GRUEN = mat('Gruen', '#2f6b3a', .5)
BLATT = mat('Blatt', '#4f9a45', .6)
ZIEGEL = mat('Ziegel', '#a4452c', .9)
FEUER = mat('Feuer', '#ff8a2a', .5, 0, '#ff7a1a', 25)
LICHT = mat('Lampe', '#fff1c9', .4, 0, '#ffdca0', 12)
FENSTER = mat('Fenster', '#bfe3f2', .1, 0, '#cfeaff', 3)


def obj_add():
    o = bpy.context.object
    return o


def box(size, loc, m, bev=.01, rot=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=(0, 0, rot))
    o = bpy.context.object
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bev:
        md = o.modifiers.new('b', 'BEVEL')
        md.width = bev
        md.segments = 2
    o.data.materials.append(m)
    return o


def cyl(r, h, loc, m, verts=32, r2=None, rot=(0, 0, 0)):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    o = bpy.context.object
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    return o


def sphere(r, loc, m, sub=2, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.object
    o.scale = scale
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    return o


def group(objs, name, loc=(0, 0, 0), rot=0, lift=0):
    e = bpy.data.objects.new(name, None)
    sc.collection.objects.link(e)
    for o in objs:
        o.parent = e
    e.location = (loc[0], loc[1], lift)
    e.rotation_euler = (0, 0, rot)
    return e


# ---------- Möbel (alle um den Ursprung gebaut, Boden z=0) ----------
def tisch(deko=True):
    o = [cyl(.5, .03, (0, 0, .76), TUCH, 48), cyl(.46, .03, (0, 0, .73), HOLZ),
         cyl(.05, .7, (0, 0, .38), DUNKEL), cyl(.28, .03, (0, 0, .015), DUNKEL)]
    if deko:
        o += [cyl(.04, .14, (.08, .05, .85), mat('Glas', '#7fb07a', .05)), sphere(.035, (.08, .05, .95), mat('Rose', '#e5533f', .5)),
              cyl(.13, .015, (-.2, -.15, .785), MARMOR, 32), cyl(.13, .015, (.22, -.12, .785), MARMOR, 32)]
    return o


def stuhl():
    o = [box((.42, .42, .05), (0, 0, .46), HOLZ, .01)]
    for x in (-.18, .18):
        for y in (-.18, .18):
            o.append(box((.04, .04, .46), (x, y, .23), HOLZ, 0))
    o += [box((.04, .04, .5), (-.18, .18, .72), HOLZ, 0), box((.04, .04, .5), (.18, .18, .72), HOLZ, 0),
          box((.4, .03, .16), (0, .18, .88), HOLZ, .01), box((.38, .38, .04), (0, 0, .5), mat('Polster', '#c0503f', .8), .015)]
    return o


def tischgruppe(name, loc, rot=0, lift=0, n=4):
    t = group(tisch(), name + '_t')
    chairs = []
    for i in range(n):
        a = i * 2 * math.pi / n + (math.pi / 4 if n == 4 else 0)
        # Stuhllehne zeigt vom Tisch weg
        chairs.append(group(stuhl(), name + '_s%d' % i, (math.cos(a) * .72, math.sin(a) * .72), a - math.pi / 2))
    return group([t] + chairs, name, loc, rot, lift)


def theke(length, kasse=True):
    o = [box((length, .7, .98), (0, 0, .49), HOLZ_HELL, .02), box((length + .08, .78, .05), (0, 0, 1.0), MARMOR, .01),
         box((length - .1, .02, .7), (0, -.36, .45), GRUEN, .01)]
    for i in range(int(length / .6)):
        o.append(box((.42, .025, .5), (-length / 2 + .35 + i * .6, -.37, .45), HOLZ_HELL, .01))
    if kasse:
        o += [box((.38, .32, .16), (length / 2 - .4, 0, 1.11), mat('Kasse', '#3c4842', .4), .02),
              box((.3, .04, .2), (length / 2 - .4, .1, 1.28), DUNKEL, .01, ),
              box((.28, .3, .04), (length / 2 - .4, -.05, 1.21), mat('Tasten', '#f4c64f', .5), .005)]
    return o


def einfacher_ofen():
    return [box((1.0, .8, .25), (0, 0, 1.43), mat('OfenRot', '#c0392b', .4), .02), box((.9, .75, 1.3), (0, 0, .65), CHROM, .03), box((.6, .03, .35), (0, -.38, .8), DUNKEL, .01),
            box((.56, .02, .3), (0, -.39, .8), mat('Glut', '#ff9a40', .4, 0, '#ff7a1a', 4), 0),
            box((.7, .04, .04), (0, -.4, 1.05), DUNKEL, .01)]


def steinofen():
    o = [box((1.9, 1.7, .9), (0, 0, .45), ZIEGEL, .03), box((2.0, 1.8, .06), (0, 0, .93), MARMOR, .01)]
    d = sphere(.85, (0, .1, .95), mat('Kuppel', '#c9a27a', .9), 3, (1, 1, .75))
    o.append(d)
    o += [box((.62, .5, .42), (0, -.62, 1.15), DUNKEL, .05), box((.5, .1, .3), (0, -.75, 1.12), FEUER, .03),
          box((.8, .14, .1), (0, -.86, 1.42), ZIEGEL, .02), cyl(.14, 1.4, (0, .35, 2.1), CHROM),
          box((.22, .22, .2), (.6, -.9, 1.06), HOLZ, .01)]
    for i in range(4):
        o.append(cyl(.05, .5, (.45 + (i % 2) * .1, -.95, .1 + i * .07), HOLZ, 12, rot=(0, math.pi / 2, .3)))
    return o


def kaffeemaschine():
    return [box((.6, .45, .45), (0, 0, 1.25), CHROM, .03), box((.6, .45, .05), (0, 0, 1.5), mat('Rot', '#c0392b', .3), .01),
            cyl(.04, .1, (-.15, -.2, 1.12), DUNKEL), cyl(.04, .1, (.15, -.2, 1.12), DUNKEL),
            cyl(.04, .07, (-.15, -.22, 1.05), MARMOR), cyl(.04, .07, (.15, -.22, 1.05), MARMOR)]


def pflanze(h=1.0):
    o = [cyl(.22, .4, (0, 0, .2), TERRA, 24, r2=.17)]
    for i in range(14):
        a = random.uniform(0, 6.28)
        r = random.uniform(.05, .22)
        o.append(sphere(random.uniform(.12, .2), (math.cos(a) * r, math.sin(a) * r, .4 + random.uniform(.1, h * .8)), BLATT, 1,
                        (1, 1, random.uniform(.8, 1.4))))
    return o


LICHTER = []


def wandlampe(x, y, rot, z=2.25):
    # Messing-Wandleuchte: Platte an der Wand, Arm nach vorn, Tulpenschirm nach oben
    messing = mat('Messing', '#c9a04a', .3, 1)
    o = [box((.14, .03, .24), (0, -.015, 0), messing, .01), cyl(.015, .28, (0, -.16, -.02), messing, 12, rot=(math.pi / 2, 0, 0)),
         cyl(.02, .1, (0, -.3, .02), messing, 12), cyl(.07, .16, (0, -.3, .14), mat('SchirmGlas', '#fff3d6', .3, 0, '#ffd99a', 3), 32, r2=.13),
         sphere(.045, (0, -.3, .12), LICHT)]
    group(o, 'wandlampe', (x, y), rot).location.z = z
    # Punktlicht 40 cm vor der Wand (rot 0: Rückwand, rot 90°: linke Wand)
    LICHTER.append((x + .4 * math.sin(rot), y - .4 * math.cos(rot), z + .1))


def lampe(z_top=3.0, z=2.2):
    return [cyl(.008, z_top - z, (0, 0, (z_top + z) / 2), DUNKEL, 8), cyl(.25, .22, (0, 0, z), mat('Schirm', '#2f6b3a', .4), 32, r2=.06),
            sphere(.07, (0, 0, z - .08), LICHT)]


def regal(n=6):
    o = [box((1.6, .25, .04), (0, 0, 0), HOLZ, .005), box((1.6, .25, .04), (0, 0, .45), HOLZ, .005)]
    cols = ['#2f6b3a', '#7a2a2a', '#e6ad5e', '#3a6ea5']
    for j in (0, 1):
        for i in range(n):
            x = -.7 + i * .28
            if (i + j) % 3 == 2:
                o.append(cyl(.06, .14, (x, 0, .09 + j * .45), mat('Dose', '#c93a24', .4)))
            else:
                o.append(cyl(.035, .3, (x, 0, .17 + j * .45), mat('Flasche' + str(i % 4), cols[i % 4], .1)))
    return o


def bild(w, h, col):
    return [box((w + .08, .03, h + .08), (0, 0, 0), GOLD, .01), box((w, .02, h), (0, -.01, 0), mat('Bild' + col, col, .8), 0)]


# ---------- Raum ----------
RW, RD, RH = 9.0, 7.0, 3.2
box((RW, RD, .1), (0, 0, -.05), BODEN, 0)
box((RW, .2, RH), (0, RD / 2 + .1, RH / 2), CREME, 0)
box((.2, RD, RH), (-RW / 2 - .1, 0, RH / 2), CREME, 0)
box((RW, .04, 1.0), (0, RD / 2 - .02, .5), TERRA, 0)
box((.04, RD, 1.0), (-RW / 2 + .02, 0, .5), TERRA, 0)
box((RW, .06, .06), (0, RD / 2 - .04, 1.02), HOLZ, 0)
box((.06, RD, .06), (-RW / 2 + .04, 0, 1.02), HOLZ, 0)
# Fenster mit Blick nach draußen
for wx in (1.2, 3.2):
    box((1.3, .05, 1.4), (wx, RD / 2 - .01, 1.9), FENSTER, 0)
    box((1.42, .08, .08), (wx, RD / 2 - .03, 2.62), HOLZ, 0)
    box((1.42, .08, .08), (wx, RD / 2 - .03, 1.18), HOLZ, 0)
    box((.08, .08, 1.5), (wx - .69, RD / 2 - .03, 1.9), HOLZ, 0)
    box((.08, .08, 1.5), (wx + .69, RD / 2 - .03, 1.9), HOLZ, 0)
    box((.05, .06, 1.4), (wx, RD / 2 - .03, 1.9), HOLZ, 0)

voll = MODE in ('voll', 'edit', 'handy')

# Theke mit Kasse, Ofen
group(theke(3.4), 'theke', (-2.2, 1.6))
if voll:
    group(steinofen(), 'steinofen', (-3.3, 2.5), 0)
    group(kaffeemaschine(), 'kaffee', (-3.2, 1.6))
    for i in range(2):
        group(regal(), 'regal%d' % i, (-1.6, RD / 2 - .15, 1.6 + i * .7))
    g = group(regal(), 'regalL', (-RW / 2 + .15, -.6, 1.7), math.pi / 2)
    tische = [(.6, .4), (2.6, .4), (.6, -1.6), (2.6, -1.6), (-1.6, -1.2), (-3.2, -2.4), (2.6, 1.9)]
    for i, (x, y) in enumerate(tische):
        if MODE == 'edit' and i == 3:
            continue
        tischgruppe('tg%d' % i, (x, y), random.uniform(-.2, .2))
    for (x, y, h) in ((-4.0, -3.0, 1.2), (4.0, 3.0, 1.4), (4.0, -3.0, 1.0), (-0.2, 3.0, 1.1), (-4.0, .8, 1.3)):
        group(pflanze(h), 'pflanze', (x, y))
    for x in (.1, 2.2, 4.2):
        wandlampe(x, RD / 2 - .02, 0)
    for y in (-3.0, -.6, 2.3):
        wandlampe(-RW / 2 + .02, y, math.pi / 2, 2.55 if y == -.6 else 2.25)
    for i, (x, col) in enumerate(((-.9, '#4aa3df'), (-3.6, '#e6ad5e'))):
        group(bild(.8, .6, col), 'bild', (x if i == 0 else -RW / 2 + .03, RD / 2 - .02 if i == 0 else -2.2, 2.0), 0 if i == 0 else math.pi / 2)
    group(bild(.6, .8, '#6bbb5f'), 'bild', (-RW / 2 + .03, 1.2, 2.1), math.pi / 2)
    # Girlande in Italienfarben
    for i in range(18):
        x = -RW / 2 + .3 + i * .48
        z = 2.95 - .18 * math.sin(i / 17 * math.pi)
        c = ('#2f8f46', '#f3eee2', '#c0392b')[i % 3]
        bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=.12, depth=.22, location=(x, RD / 2 - .1, z - .1), rotation=(math.pi / 2, 0, 0))
        bpy.context.object.rotation_euler = (math.pi, 0, 0)
        bpy.context.object.data.materials.append(mat('Wimpel' + c, c, .7))
else:
    group(einfacher_ofen(), 'ofen', (-3.0, 3.0))
    tischgruppe('tg0', (.8, -.2), .1, n=2)
    tischgruppe('tg1', (2.6, -1.6), -.1, n=2)
    for x in (-1.4, 2.2):
        wandlampe(x, RD / 2 - .02, 0)
    wandlampe(-RW / 2 + .02, -1.0, math.pi / 2)
    group(pflanze(.8), 'pflanze', (4.0, 3.0))

if MODE == 'edit':
    # Bodenraster
    gm = mat('Raster', '#ffffff', .5, 0, '#bfefff', 1.5)
    for i in range(-18, 19):
        box((.015, RD, .004), (i * .25, 0, .003), gm, 0)
    for j in range(-14, 15):
        box((RW, .015, .004), (0, j * .25, .003), gm, 0)
    # Möbelstück wird gerade gezogen: angehoben, grüner Zielbereich darunter
    tischgruppe('zieh', (2.6, -1.6), .3, lift=.45)
    ziel = mat('Ziel', '#6bbb5f', .5, 0, '#6bbb5f', 2.5)
    z = box((2.0, 2.0, .01), (2.6, -1.6, .008), ziel, 0)
    z.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = .55
    for dx, dy, sx, sy in ((0, 1, 2.0, .05), (0, -1, 2.0, .05), (1, 0, .05, 2.0), (-1, 0, .05, 2.0)):
        box((sx, sy, .02), (2.6 + dx, -1.6 + dy, .015), mat('ZielRand', '#6bbb5f', .5, 0, '#9cff8a', 6), 0)
    sphere(.5, (2.6, -1.6, .02), mat('Schatten', '#000000', 1), 2, (1.6, 1.6, .02))

# ---------- Licht ----------
sc.world = bpy.data.worlds.new('w')
sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = hexc('#26302b')
sc.world.node_tree.nodes['Background'].inputs[1].default_value = .5


def area(name, loc, energy, col, size, target=(0, 0, 0)):
    l = bpy.data.lights.new(name, 'AREA')
    l.energy = energy
    l.color = col
    l.size = size
    o = bpy.data.objects.new(name, l)
    sc.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()


area('key', (4, -6, 9), 2500, (1, .9, .78), 6)
area('fill', (-6, -8, 5), 600, (.85, .9, 1), 6)
area('fenster', (2.2, RD / 2 + 2, 2.2), 1500, (.8, .9, 1), 3, (2, 0, 0))
for pos in LICHTER:
    l = bpy.data.lights.new('lp', 'POINT')
    l.energy = 120
    l.color = (1, .78, .5)
    lo = bpy.data.objects.new('lp', l)
    sc.collection.objects.link(lo)
    lo.location = pos

# ---------- Kamera ----------
cam = bpy.data.cameras.new('cam')
co = bpy.data.objects.new('cam', cam)
sc.collection.objects.link(co)
sc.camera = co
if MODE == 'handy':
    cam.lens = 30
    co.location = (3.6, -6.4, 4.6)
    target = (-.4, .6, .7)
    sc.render.resolution_x, sc.render.resolution_y = 768, 1344
elif MODE == 'edit':
    cam.lens = 34
    co.location = (7.5, -8.5, 6.8)
    target = (1.4, -.8, .4)
    sc.render.resolution_x, sc.render.resolution_y = 1280, 1024
else:
    cam.lens = 52
    co.location = (9.5, -11.5, 10.5)
    target = (-.2, .2, .4)
    sc.render.resolution_x, sc.render.resolution_y = 1280, 1024
co.rotation_euler = (Vector(target) - co.location).to_track_quat('-Z', 'Y').to_euler()

sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.refresh_devices()
for d in prefs.devices:
    d.use = (d.type == 'OPTIX')
sc.cycles.device = 'GPU'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.render.filepath = os.path.join(OUT, 'restaurant-%s.png' % MODE)
bpy.ops.render.render(write_still=True)
