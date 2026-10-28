# Weitere Modelle für Shop und Truhe. Wird an den Kopf von kaffee.py angehängt
# (dort stehen mat, box, cyl, sphere, group, tisch, stuhl, theke, luxusofen ...).

WEISS = mat('Weiss', '#f3eee2', .4)
SCHWARZ_GLANZ = mat('SchwarzGlanz', '#141414', .15)
GLAS = mat('GlasKlar', '#dff2f7', .02, 0, None, 0, .25)
GLAS.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 1
SPIEGEL = mat('Spiegel', '#e8eef0', .02, 1)
KREIDE = mat('Kreidetafel', '#26332c', .9)
ZITRONE = mat('Zitrone', '#f2d23c', .5)
FLAMME = mat('Flamme', '#ffcf6a', .4, 0, '#ffb84a', 12)
NEON_R = mat('NeonRot', '#ff5a4a', .3, 0, '#ff3a2a', 10)
NEON_G = mat('NeonGruen', '#7dff8a', .3, 0, '#4aff6a', 8)
KORB = mat('Korb', '#b98a4e', .9)


def dreh(o, e):
    # box() backt die Position ins Mesh; zum Drehen den Ursprung erst in die Mitte legen
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    o.rotation_euler = e


def text_mesh(t, size, loc, m, rot=(math.pi / 2, 0, 0), extrude=.01):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.data.body, o.data.size, o.data.align_x, o.data.align_y, o.data.extrude = t, size, 'CENTER', 'CENTER', extrude
    o.data.materials.append(m)
    bpy.ops.object.convert(target='MESH')
    return bpy.context.object


def kerze(x, y, z, h=.16):
    return [cyl(.025, h, (x, y, z + h / 2), WEISS, 16), sphere(.018, (x, y, z + h + .02), FLAMME, 1, (1, 1, 1.8))]


# ---------- Shop ----------
def lavagna():
    o = [box((.7, .04, .9), (0, 0, 1.05), KREIDE, .01), box((.78, .05, .06), (0, 0, 1.52), HOLZ, .01), box((.78, .05, .06), (0, 0, .58), HOLZ, .01),
         box((.06, .05, .98), (-.37, 0, 1.05), HOLZ, .01), box((.06, .05, .98), (.37, 0, 1.05), HOLZ, .01)]
    for x in (-.35, .35):
        o.append(box((.05, .05, 1.4), (x, -.18, .68), HOLZ, .005, ))
        dreh(o[-1], (.25, 0, 0))
        o.append(box((.05, .05, 1.4), (x, .18, .68), HOLZ, .005))
        dreh(o[-1], (-.25, 0, 0))
    o.append(text_mesh('Piatto del giorno', .07, (0, -.03, 1.36), WEISS, extrude=.002))
    for i, w in enumerate((.5, .42, .46, .3)):
        o.append(box((w, .005, .015), (-.05 + (.5 - w) / -2 + .02, -.025, 1.22 - i * .1), WEISS, 0))
    o.append(text_mesh('8 €', .09, (.22, -.03, .78), mat('KreideGelb', '#f4c64f', .8), extrude=.002))
    return o


def mandolino(m=None):
    m = m or HOLZ
    o = [sphere(.22, (0, 0, .9), m, 3, (1, .55, 1.35)), cyl(.075, .01, (0, -.12, .95), DUNKEL, 24, rot=(math.pi / 2, 0, 0)),
         box((.07, .04, .45), (0, -.06, 1.42), GRIFF, .01), box((.1, .05, .14), (0, -.04, 1.7), GRIFF, .01)]
    for i in range(4):
        o.append(box((.004, .004, .8), (-.018 + i * .012, -.13, 1.25), CHROM, 0))
    # Ständer
    o += [box((.36, .3, .04), (0, .05, .52), HOLZ, .01), box((.04, .04, .5), (0, .18, .78), HOLZ, .005)]
    for x in (-.16, .16):
        o.append(box((.04, .04, .52), (x, .05, .26), HOLZ, .005))
    return o


def frigo():
    creme = mat('FrigoCreme', '#efe6d2', .3)
    return [box((.7, .65, 1.75), (0, 0, .9), creme, .08), box((.7, .02, .01), (0, -.33, 1.18), DUNKEL, 0),
            box((.04, .05, .35), (.28, -.36, 1.45), CHROM, .015), box((.04, .05, .25), (.28, -.36, .95), CHROM, .015),
            box((.66, .6, .05), (0, 0, .03), DUNKEL, .01)]


def vetrina_frigo():
    rot = mat('KuehlRot', '#c0392b', .3)
    o = [box((.9, .05, 1.9), (0, .32, .95), rot, .02), box((.05, .65, 1.9), (-.43, .02, .95), rot, .02), box((.05, .65, 1.9), (.43, .02, .95), rot, .02),
         box((.9, .65, .2), (0, .02, .1), rot, .02), box((.8, .02, 1.55), (0, -.32, 1.0), GLAS, .01),
         box((.04, .04, .6), (.36, -.36, 1.0), CHROM, .01), box((.86, .6, .18), (0, .02, 1.82), mat('KuehlSchild', '#f3eee2', .4), .02)]
    cols = ['#2f6b3a', '#e6ad5e', '#c93a24', '#3a6ea5', '#f3eee2']
    for j in range(4):
        z = .35 + j * .38
        o.append(box((.78, .5, .02), (0, .02, z), CHROM, 0))
        for i in range(6):
            o.append(cyl(.035, .25 if i % 2 else .2, (-.3 + i * .12, .02, z + .13), mat('Kuehl' + cols[(i + j) % 5], cols[(i + j) % 5], .2)))
    o.append(text_mesh('Bibite', .1, (0, -.305, 1.82), DUNKEL, extrude=.003))
    return o


def fass(x, y, z, r=.32, l=.75):
    o = [cyl(r, l, (x, y, z), HOLZ, 32, rot=(0, math.pi / 2, 0))]
    o.append(sphere(r * 1.08, (x, y, z), HOLZ, 3, (l / r * .5, 1, 1)))
    for dx in (-l * .38, 0, l * .38):
        o.append(cyl(r * (1.1 if dx == 0 else 1.03), .04, (x + dx, y, z), mat('Eisen', '#3a3a3a', .4, 1), 32, rot=(0, math.pi / 2, 0)))
    o.append(cyl(.035, .06, (x - l / 2 - .02, y, z - r * .5), mat('Hahn', '#c9a04a', .3, 1), 12, rot=(0, math.pi / 2, 0)))
    return o


def botti():
    o = fass(0, -.05, .42) + fass(0, .7, .42)
    for y in (-.25, .9):
        o.append(box((.9, .08, .12), (0, y - .3 * (y > 0), .06), HOLZ, .01))
    o += [box((.08, 1.3, .1), (-.3, .32, .1), HOLZ, .01), box((.08, 1.3, .1), (.3, .32, .1), HOLZ, .01)]
    return o + fass(0, .32, 1.0, .28, .65)


def insegna():
    o = [box((1.4, .06, .5), (0, 0, 2.2), mat('SchildDunkel', '#1b221f', .5), .03)]
    o.append(text_mesh('PIZZERIA', .2, (0, -.05, 2.24), NEON_R, extrude=.02))
    o.append(text_mesh('PAROLA', .11, (0, -.05, 2.06), NEON_G, extrude=.015))
    for x in (-.5, .5):
        o.append(box((.04, .3, .04), (x, .15, 2.2), CHROM, .005))
    return o


def agenda():
    leder = mat('Leder', '#7a2a2a', .5)
    o = [box((.28, .36, .03), (-.15, 0, 1.06), leder, .01), box((.28, .36, .03), (.15, 0, 1.06), leder, .01),
         box((.27, .34, .025), (-.145, 0, 1.085), WEISS, .005), box((.27, .34, .025), (.145, 0, 1.085), WEISS, .005),
         box((.02, .2, .003), (.05, .05, 1.1), mat('Band', '#c0392b', .5), 0), cyl(.008, .16, (.25, -.1, 1.1), GOLD, 8, rot=(0, math.pi / 2, .5))]
    for i in range(6):
        o.append(box((.18, .003, .004), (.15, .12 - i * .045, 1.098), mat('Tinte', '#3a4a6a', .5), 0))
        dreh(o[-1], (0, 0, math.pi / 2))
    # Stehpult
    o += [box((.7, .45, .04), (0, 0, 1.02), HOLZ, .01), box((.08, .08, 1.0), (0, .1, .5), HOLZ, .01), box((.45, .45, .05), (0, .1, .025), HOLZ, .01)]
    return o


def lampadario():
    o = [cyl(.01, .6, (0, 0, 1.3), GOLD, 8), cyl(.12, .1, (0, 0, .98), GOLD, 24), sphere(.07, (0, 0, .86), GOLD, 2)]
    bpy.ops.mesh.primitive_torus_add(major_radius=.45, minor_radius=.02, location=(0, 0, .8))
    t = bpy.context.object
    t.data.materials.append(GOLD)
    o.append(t)
    for i in range(8):
        a = i * math.pi / 4
        x, y = math.cos(a) * .45, math.sin(a) * .45
        o += [cyl(.012, .45, (x / 2, y / 2, .85), GOLD, 8, rot=(math.pi / 2, 0, a + math.pi / 2)), cyl(.03, .04, (x, y, .83), GOLD, 12)]
        o += kerze(x, y, .85, .12)
        o.append(sphere(.03, (math.cos(a + .4) * .38, math.sin(a + .4) * .38, .7), mat('Kristall', '#ffffff', .02, 0, None, 0, .5), 1, (1, 1, 1.6)))
    return o


def pianoforte():
    o = [box((1.5, .6, 1.3), (0, .1, .75), SCHWARZ_GLANZ, .03), box((1.5, .35, .06), (0, -.32, .78), SCHWARZ_GLANZ, .01),
         box((1.4, .14, .03), (0, -.38, .82), WEISS, .003), box((1.5, .05, .25), (0, -.45, .6), SCHWARZ_GLANZ, .01),
         box((.05, .3, .75), (-.72, -.3, .4), SCHWARZ_GLANZ, .01), box((.05, .3, .75), (.72, -.3, .4), SCHWARZ_GLANZ, .01),
         box((.5, .02, .3), (0, -.2, 1.15), SCHWARZ_GLANZ, .005)]
    for i in range(36):
        if i % 7 in (0, 3):
            continue
        o.append(box((.022, .08, .025), (-.68 + i * .039, -.36, .845), DUNKEL, .002))
    o += kerze(.55, .15, 1.4) + kerze(-.55, .15, 1.4)
    o += [box((.9, .38, .06), (0, -.85, .48), SCHWARZ_GLANZ, .02), box((.86, .34, .04), (0, -.85, .52), mat('Samt', '#7a2a2a', .9), .015)]
    for x in (-.38, .38):
        for y in (-.98, -.72):
            o.append(box((.05, .05, .46), (x, y, .23), SCHWARZ_GLANZ, .005))
    return o


def tavolo_candele():
    t = tisch(deko=False)
    t += kerze(-.06, 0, .78, .2) + kerze(.06, .04, .78, .14)
    t.append(cyl(.09, .02, (0, .02, .785), GOLD, 24))
    grp = group(t, 'tisch_k')
    chairs = [group(stuhl(), 'st', (math.cos(a) * .72, math.sin(a) * .72), a - math.pi / 2) for a in [i * math.pi / 2 + math.pi / 4 for i in range(4)]]
    group([grp] + chairs, 'tavolo_candele')
    return []


def forno_oro():
    teile = luxusofen()
    for o in teile:
        if o.data.materials and o.data.materials[0].name.startswith(('Mosaik', 'Kupfer', 'Sockel')):
            o.data.materials[0] = GOLD
    return teile


def stella():
    bm = bmesh.new()
    pts = []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5
        r = .3 if i % 2 == 0 else .13
        pts.append(bm.verts.new((math.cos(a) * r, 0, math.sin(a) * r)))
    f = bm.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, -.05, 0), verts=[v for v in ext['geom'] if isinstance(v, bmesh.types.BMVert)])
    me = bpy.data.meshes.new('stern')
    bm.to_mesh(me)
    bm.free()
    s = bpy.data.objects.new('stern', me)
    sc.collection.objects.link(s)
    s.location = (0, -.04, 2.2)
    me.materials.append(GOLD)
    return [s, cyl(.38, .04, (0, 0, 2.2), HOLZ, 48, rot=(math.pi / 2, 0, 0)), cyl(.4, .02, (0, .01, 2.2), GOLD, 48, rot=(math.pi / 2, 0, 0)),
            text_mesh('Il Maestro', .07, (0, -.03, 1.92), GOLD, extrude=.005)]


def ombrellone():
    o = [cyl(.025, 2.2, (0, 0, 1.1), WEISS, 12), cyl(.28, .06, (0, 0, .03), DUNKEL, 24)]
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=1.2, radius2=.05, depth=.45, location=(0, 0, 2.0))
    c = bpy.context.object
    c.data.materials.append(mat('SchirmRot', '#c0392b', .7))
    c.data.materials.append(WEISS)
    for i, p in enumerate(c.data.polygons):
        p.material_index = (i % 2) if len(p.vertices) < 5 else 0
    o += [c, sphere(.05, (0, 0, 2.25), WEISS, 1)]
    return o


def vespa(farbe='#8fd1c0', akzent='#f3eee2'):
    lack = mat('Vespa' + farbe, farbe, .2)
    ak = mat('VespaAk' + akzent, akzent, .3)
    o = [sphere(.32, (0, .3, .5), lack, 3, (1, 1.6, .9)), box((.36, .7, .05), (0, -.15, .3), lack, .03),
         box((.42, .08, .75), (0, -.55, .65), lack, .06), sphere(.12, (0, -.6, .32), lack, 2, (1.2, 1.5, .8)),
         box((.32, .5, .1), (0, .25, .82), mat('Sattel', '#5a3b24', .6), .04), cyl(.015, .55, (0, -.58, 1.08), CHROM, 12, rot=(0, math.pi / 2, 0)),
         cyl(.07, .06, (0, -.64, 1.0), CHROM, 24, rot=(math.pi / 2, 0, 0)), sphere(.05, (0, -.67, 1.0), mat('Scheinwerfer', '#fff6d0', .2, 0, '#fff0b0', 3), 2),
         box((.04, .1, .5), (0, -.62, .55), ak, .01)]
    for y in (-.62, .42):
        bpy.ops.mesh.primitive_torus_add(major_radius=.17, minor_radius=.06, location=(0, y, .2), rotation=(0, math.pi / 2, 0))
        t = bpy.context.object
        t.data.materials.append(DUNKEL)
        o += [t, cyl(.11, .08, (0, y, .2), CHROM, 24, rot=(0, math.pi / 2, 0))]
    return o


def vespa_epoca():
    o = vespa('#e9dcc3', '#c0392b')
    bpy.ops.mesh.primitive_torus_add(major_radius=.15, minor_radius=.05, location=(0, .78, .55), rotation=(math.pi / 2, 0, 0))
    t = bpy.context.object
    t.data.materials.append(DUNKEL)
    return o + [t, cyl(.1, .07, (0, .78, .55), CHROM, 24, rot=(math.pi / 2, 0, 0)), box((.5, .06, .06), (0, .62, .62), CHROM, .02)]


def barca():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1, location=(0, 0, 0))
    h = bpy.context.object
    bm = bmesh.new()
    bm.from_mesh(h.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, .15), plane_no=(0, 0, 1), clear_outer=True)
    bm.to_mesh(h.data)
    bm.free()
    h.scale = (.7, 2.0, .55)
    h.location = (0, 0, .55)
    h.data.materials.append(mat('BootWeiss', '#f3eee2', .4))
    bpy.ops.object.shade_smooth()
    o = [h, box((1.0, .05, .08), (0, -1.0, .6), mat('BootBlau', '#2c6ea5', .4), .02), box((1.2, .9, .04), (0, -.2, .52), HOLZ, .01),
         box((1.2, .2, .05), (0, .3, .6), HOLZ, .01), box((1.2, .2, .05), (0, -.7, .6), HOLZ, .01)]
    for s in (-1, 1):
        o.append(box((.04, 1.6, .03), (s * .6, -.1, .72), HOLZ, .005))
        dreh(o[-1], (0, s * .15, s * .3))
    return o


def terrazza():
    o = [box((3.0, 2.0, .12), (0, 0, .06), HOLZ_HELL, .01)]
    for i in range(10):
        o.append(box((.01, 2.0, .005), (-1.35 + i * .3, 0, .122), HOLZ, 0))
    weiss = mat('Balustrade', '#f3eee2', .6)
    for side in ((0, -1, 3.0, 0), (-1.5, 0, 2.0, math.pi / 2), (1.5, 0, 2.0, math.pi / 2)):
        x, y, l, rot = side
        o.append(box((l, .1, .06), (x, y if y else 0, .95), weiss, .01, rot))
        n = int(l / .2)
        for k in range(n + 1):
            p = -l / 2 + k * l / n
            px, py = (x + p, y) if rot == 0 else (x, p)
            o.append(cyl(.03, .8, (px, py, .52), weiss, 10))
    o += pflanze_teile(1.2, -.7) + pflanze_teile(-1.2, -.7)
    return o


def pflanze_teile(x, y, h=.8):
    teile = pflanze(h)
    for t in teile:
        t.location = (t.location.x + x, t.location.y + y, t.location.z + .12)
    return teile


def bancone_vetrina():
    o = theke(2.4)
    o += [box((1.2, .5, .38), (-.4, -.05, 1.22), GLAS, .01), box((1.22, .52, .03), (-.4, -.05, 1.42), CHROM, .005)]
    cols = ['#e6ad5e', '#f3eee2', '#c93a24', '#6e3a1a']
    for i in range(6):
        o.append(cyl(.07, .05, (-.85 + i * .18, -.05, 1.07), mat('Gebaeck' + cols[i % 4], cols[i % 4], .6), 16))
    return o


def bancone_marmo():
    o = theke(2.8)
    for t in o:
        if t.data.materials[0].name in ('HolzHell', 'Gruen'):
            t.data.materials[0] = MARMOR
    o.append(box((2.85, .05, .06), (0, -.4, .06), GOLD, .01))
    return o


def basilico():
    o = [cyl(.12, .2, (0, 0, .1), TERRA, 24, r2=.09)]
    for i in range(16):
        a = random.uniform(0, 6.28)
        r = random.uniform(.02, .09)
        o.append(sphere(.045, (math.cos(a) * r, math.sin(a) * r, .22 + random.uniform(0, .18)), mat('Basilikum', '#4fa33f', .5), 1, (1.3, .7, .5)))
    return o


# ---------- Truhe ----------
def fiori():
    vase = mat('Vase', '#3a6ea5', .2)
    o = [cyl(.09, .3, (0, 0, .15), vase, 24, r2=.06), cyl(.06, .05, (0, 0, .32), vase, 24, r2=.08)]
    cols = ['#e5533f', '#f4c64f', '#f3eee2', '#d9667a', '#a587c4']
    for i in range(9):
        a = i * 2.4
        x, y = math.cos(a) * .08 * (i % 3) / 2, math.sin(a) * .08 * (i % 3) / 2
        o.append(cyl(.006, .35, (x, y, .5), mat('Stiel', '#4f8a3a', .6), 6))
        o.append(sphere(.045, (x * 1.6, y * 1.6, .68 + (i % 3) * .04), mat('Bluete' + cols[i % 5], cols[i % 5], .6), 1, (1, 1, .7)))
    return o


def orologio():
    o = [cyl(.3, .05, (0, 0, 2.0), HOLZ, 48, rot=(math.pi / 2, 0, 0)), cyl(.26, .02, (0, -.03, 2.0), WEISS, 48, rot=(math.pi / 2, 0, 0))]
    for i in range(12):
        a = i * math.pi / 6
        o.append(box((.015, .01, .05 if i % 3 else .08), (math.sin(a) * .21, -.045, 2.0 + math.cos(a) * .21), DUNKEL, 0))
        dreh(o[-1], (0, a, 0))
    o += [box((.015, .01, .14), (.03, -.05, 2.06), DUNKEL, 0), box((.012, .01, .19), (-.06, -.055, 1.96), DUNKEL, 0)]
    dreh(o[-2], (0, .5, 0))
    dreh(o[-1], (0, 2.2, 0))
    o.append(sphere(.02, (0, -.06, 2.0), GOLD, 1))
    return o


def candela():
    o = [cyl(.1, .03, (0, 0, .015), GOLD, 24), cyl(.025, .2, (0, 0, .12), GOLD, 16, r2=.015), cyl(.05, .03, (0, 0, .235), GOLD, 16)]
    return o + kerze(0, 0, .25, .22)


def specchio():
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.4, depth=.04, location=(0, 0, 1.7), rotation=(math.pi / 2, 0, 0))
    f = bpy.context.object
    f.scale = (1, 1.45, 1)
    f.data.materials.append(GOLD)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.34, depth=.02, location=(0, -.02, 1.7), rotation=(math.pi / 2, 0, 0))
    s = bpy.context.object
    s.scale = (1, 1.45, 1)
    s.data.materials.append(SPIEGEL)
    o = [f, s, sphere(.06, (0, -.01, 2.3), GOLD, 2)]
    for x in (-.4, .4):
        o.append(sphere(.04, (x, -.01, 1.7), GOLD, 1))
    return o


def limoni():
    o = [cyl(.25, .16, (0, 0, .08), KORB, 32, r2=.3)]
    bpy.ops.mesh.primitive_torus_add(major_radius=.3, minor_radius=.025, location=(0, 0, .16))
    t = bpy.context.object
    t.data.materials.append(KORB)
    o.append(t)
    for i in range(11):
        a = i * 2.2
        r = .05 + (i % 3) * .07
        o.append(sphere(.075, (math.cos(a) * r, math.sin(a) * r, .17 + (i % 2) * .05), ZITRONE, 2, (1.25, 1, 1)))
    for i in range(4):
        o.append(sphere(.06, (math.cos(i * 1.6) * .2, math.sin(i * 1.6) * .2, .24), mat('Blatt2', '#3f7a35', .5), 1, (1.6, .6, .2)))
    return o


def tappeto():
    o = [box((2.0, 1.3, .015), (0, 0, .008), mat('Teppich', '#a8322a', .95), 0), box((1.75, 1.05, .016), (0, 0, .009), mat('TeppichMitte', '#e6ad5e', .95), 0),
         box((1.45, .75, .017), (0, 0, .01), mat('TeppichInnen', '#2c4a7a', .95), 0)]
    for x in (-1.0, 1.0):
        for k in range(14):
            o.append(box((.08, .015, .004), (x + (.04 if x > 0 else -.04), -.6 + k * .092, .004), WEISS, 0))
    return o


def pulcinella():
    o = [box((.35, .35, .9), (0, 0, .45), HOLZ, .02), box((.42, .42, .05), (0, 0, .92), MARMOR, .01), cyl(.04, .3, (0, 0, 1.1), DUNKEL, 12)]
    o.append(sphere(.17, (0, 0, 1.38), WEISS, 3, (1, 1, 1.15)))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=.18, location=(0, -.03, 1.43))
    m = bpy.context.object
    m.scale = (1, .6, .55)
    m.data.materials.append(SCHWARZ_GLANZ)
    o.append(m)
    o.append(cyl(.04, .14, (0, -.17, 1.38), SCHWARZ_GLANZ, 16, r2=.012, rot=(1.9, 0, 0)))
    o += [sphere(.022, (-.06, -.13, 1.47), WEISS, 1), sphere(.022, (.06, -.13, 1.47), WEISS, 1)]
    o.append(cyl(.16, .5, (0, .02, 1.75), WEISS, 32, r2=.04))
    return o


def corno():
    rot = mat('CornoRot', '#d1261c', .2)
    o = [cyl(.12, .12, (0, 0, .06), HOLZ, 24), box((.03, .03, .4), (0, 0, .32), GOLD, .005)]
    n = 14
    for i in range(n):
        t = i / (n - 1)
        a = t * 1.6
        x, z = .25 * (1 - math.cos(a)), .55 + .45 * math.sin(a)
        o.append(sphere(.085 * (1 - t * .85) + .008, (x - .1, 0, z), rot, 2))
    o.append(cyl(.09, .08, (-.1, 0, .55), GOLD, 24))
    return o


def presepe():
    o = [box((1.0, .7, .08), (0, 0, .04), mat('Moos', '#4f7a3a', .95), .02), box((.7, .45, .02), (0, .05, .55), HOLZ, .01)]
    for x in (-.32, .32):
        o.append(box((.05, .05, .5), (x, -.12, .32), HOLZ, .005))
        o.append(box((.05, .05, .5), (x, .22, .32), HOLZ, .005))
    o.append(box((.7, .03, .45), (0, .26, .3), HOLZ_HELL, .01))
    o.append(box((.45, .5, .03), (-.2, .05, .66), HOLZ, .005))
    dreh(o[-1], (0, -.5, 0))
    o.append(box((.45, .5, .03), (.2, .05, .66), HOLZ, .005))
    dreh(o[-1], (0, .5, 0))
    for x, c, h in ((-.18, '#3a6ea5', .22), (.18, '#7a4a2a', .25), (.38, '#a8322a', .2), (-.38, '#e6ad5e', .18)):
        o += [cyl(.05, h, (x, -.05, .08 + h / 2), mat('Figur' + c, c, .6), 16, r2=.03), sphere(.035, (x, -.05, .1 + h), mat('Haut', '#f1c7a5', .6), 2)]
    o += [box((.16, .1, .06), (0, -.02, .11), mat('Krippe', '#b98a4e', .9), .01), sphere(.03, (0, -.02, .16), WEISS, 1)]
    o.append(stern_klein(0, .05, .85))
    return o


def stern_klein(x, y, z):
    bm = bmesh.new()
    pts = [bm.verts.new((math.cos(math.pi / 2 + i * math.pi / 5) * (.09 if i % 2 == 0 else .04), 0, math.sin(math.pi / 2 + i * math.pi / 5) * (.09 if i % 2 == 0 else .04))) for i in range(10)]
    bm.faces.new(pts)
    me = bpy.data.meshes.new('sternk')
    bm.to_mesh(me)
    bm.free()
    s = bpy.data.objects.new('sternk', me)
    sc.collection.objects.link(s)
    s.location = (x, y, z)
    me.materials.append(mat('SternLicht', '#f4c64f', .3, 0, '#ffd56a', 4))
    return s


NEU = {
    'bancone-vetrina': bancone_vetrina, 'bancone-marmo': bancone_marmo, 'basilico': basilico, 'lavagna': lavagna, 'mandolino': mandolino,
    'frigo': frigo, 'vetrina-frigo': vetrina_frigo, 'botti': botti, 'insegna': insegna, 'agenda': agenda, 'lampadario': lampadario,
    'pianoforte': pianoforte, 'tavolo-candele': tavolo_candele, 'forno-oro': forno_oro, 'stella': stella, 'ombrellone': ombrellone,
    'vespa': vespa, 'barca': barca, 'terrazza': terrazza,
    'fiori': fiori, 'orologio': orologio, 'candela': candela, 'specchio': specchio, 'limoni': limoni, 'tappeto': tappeto,
    'pulcinella': pulcinella, 'corno': corno, 'presepe': presepe, 'mandolino-oro': lambda: mandolino(GOLD), 'vespa-epoca': vespa_epoca,
}
