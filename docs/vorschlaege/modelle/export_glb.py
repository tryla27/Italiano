import bpy, bmesh, math, sys, os, random
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
MODE = 'oefen'
SAMPLES = int(argv[1]) if len(argv) > 1 else 160
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
FEUER = mat('Feuer', '#ff8a2a', .5, 0, '#ff6a10', 9)
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
    o += [box((.62, .5, .42), (0, -.62, 1.15), DUNKEL, .05), box((.5, .04, .3), (0, -.88, 1.12), FEUER, .02),
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




def etagenofen():
    o = [box((1.3, .9, .08), (0, 0, .62), CHROM, .01)]
    for x in (-.58, .58):
        for y in (-.38, .38):
            o.append(box((.06, .06, .62), (x, y, .31), CHROM, .005))
    for i in range(2):
        z = .95 + i * .55
        o += [box((1.3, .9, .5), (0, 0, z), CHROM, .02), box((.9, .03, .26), (-.1, -.46, z), DUNKEL, .01),
              box((.84, .02, .2), (-.1, -.47, z), mat('Glut', '#ff9a40', .4, 0, '#ff7a1a', 4), 0),
              box((.95, .05, .04), (-.1, -.49, z + .18), DUNKEL, .01)]
        for k in range(2):
            o.append(cyl(.035, .04, (.5, -.47, z + .1 - k * .16), DUNKEL, 16, rot=(math.pi / 2, 0, 0)))
    o.append(box((1.34, .94, .05), (0, 0, 1.52), mat('OfenRot', '#c0392b', .4), .01))
    return o


def luxusofen():
    kachel = checker('Mosaik', '#d9a63a', '#7a2a1e', 14, .3)
    kachel.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = .6
    o = [box((2.2, 2.0, .95), (0, 0, .475), mat('Sockel', '#e9dcc3', .7), .04),
         box((2.3, 2.1, .07), (0, 0, .98), MARMOR, .01),
         box((2.25, .03, .5), (0, -1.01, .45), mat('Fliese', '#2c4a7a', .3), .01)]
    o.append(sphere(1.0, (0, .1, 1.0), kachel, 4, (1, 1, .8)))
    o += [box((.75, .6, .5), (0, -.72, 1.25), DUNKEL, .08), box((.62, .04, .36), (0, -1.03, 1.2), FEUER, .02),
          box((1.0, .18, .14), (0, -.98, 1.55), GOLD, .03), cyl(.16, 1.2, (0, .45, 2.3), mat('Kupfer', '#c47a45', .25, 1)),
          cyl(.24, .12, (0, .45, 2.95), mat('Kupfer', '#c47a45', .25, 1), r2=.12)]
    for i in range(6):
        o.append(cyl(.05, .5, (-.9 + (i % 3) * .1, -.95, .1 + (i // 3) * .1), HOLZ, 12, rot=(0, math.pi / 2, .2)))
    return o


def schild(text, x, sub):
    box((2.1, .06, .55), (x, -1.66, .27), mat('Tafel', '#1b221f', .6), .03)
    for t, z, size, m in ((text, .32, .2, mat('Schrift', '#f3eee2', .5)), (sub, .08, .13, mat('Schrift2', '#f4c64f', .5))):
        bpy.ops.object.text_add(location=(x, -1.7, z + .04), rotation=(math.pi / 2, 0, 0))
        o = bpy.context.object
        o.data.body = t
        o.data.size = size
        o.data.align_x = 'CENTER'
        o.data.extrude = .01
        o.data.materials.append(m)


MESSING = mat('Messing', '#c9a04a', .25, 1)
KUPFER = mat('Kupfer', '#c47a45', .25, 1)
GRIFF = wood('Griff', '#3a1d0c', '#6e3a1a')


def tasse(x, y, z):
    return [cyl(.045, .06, (x, y, z + .03), MARMOR, 24), cyl(.07, .01, (x, y, z + .005), MARMOR, 24)]


def mokka():
    o = [box((.42, .42, .1), (0, 0, .05), DUNKEL, .02), cyl(.12, .02, (0, 0, .11), mat('Brenner', '#333333', .4, 1), 24)]
    o += [cyl(.1, .2, (0, 0, .22), CHROM, 8, r2=.075), cyl(.075, .03, (0, 0, .335), CHROM, 8),
          cyl(.075, .2, (0, 0, .45), CHROM, 8, r2=.1), cyl(.1, .015, (0, 0, .555), CHROM, 8),
          sphere(.025, (0, 0, .58), DUNKEL), box((.03, .1, .16), (0, .14, .45), DUNKEL, .01),
          cyl(.015, .06, (0, -.11, .52), CHROM, 8, r2=.005, rot=(.8, 0, 0))]
    return o + tasse(.25, -.1, 0)


def kleine_maschine():
    rot = mat('KaffeeRot', '#c0392b', .3)
    o = [box((.42, .4, .46), (0, .02, .23), rot, .05), box((.42, .4, .05), (0, .02, .48), CHROM, .02),
         box((.34, .14, .03), (0, -.12, .02), CHROM, .01), cyl(.05, .08, (0, -.12, .33), CHROM, 24),
         box((.04, .2, .03), (0, -.25, .3), GRIFF, .01), cyl(.025, .02, (.14, -.19, .4), DUNKEL, 16, rot=(math.pi / 2, 0, 0))]
    return o + tasse(0, -.12, .035)


def siebtraeger():
    o = [box((.95, .55, .55), (0, 0, .4), CHROM, .04), box((.95, .55, .12), (0, 0, .06), DUNKEL, .02),
         box((.95, .56, .1), (0, 0, .5), mat('KaffeeRot', '#c0392b', .3), .02), box((.8, .4, .03), (0, -.05, .7), CHROM, .01),
         box((.8, .2, .02), (0, -.3, .13), CHROM, .01), cyl(.05, .07, (0, -.28, .62), MESSING, 24, rot=(math.pi / 2, 0, 0))]
    for x in (-.22, .22):
        o += [cyl(.07, .08, (x, -.32, .38), CHROM, 24), box((.04, .22, .035), (x, -.48, .36), GRIFF, .015)]
        o += tasse(x, -.32, .14)
    o += [cyl(.012, .3, (.42, -.32, .38), CHROM, 12, rot=(.25, 0, 0))]
    for i in range(4):
        o += tasse(-.3 + i * .2, -.05, .72)
    return o


def hebelmaschine():
    o = [box((1.25, .6, .45), (0, 0, .32), KUPFER, .05), box((1.25, .6, .1), (0, 0, .05), DUNKEL, .02),
         box((1.25, .62, .08), (0, 0, .58), MESSING, .02), cyl(.36, .45, (0, .05, .85), CHROM, 48),
         sphere(.36, (0, .05, 1.08), CHROM, 4, (1, 1, .7)), sphere(.08, (0, .05, 1.38), MESSING, 3),
         box((.18, .04, .08), (0, .05, 1.47), MESSING, .01), box((1.05, .2, .02), (0, -.33, .13), MESSING, .01)]
    for x in (-.38, 0, .38):
        o += [cyl(.07, .14, (x, -.33, .52), MESSING, 24), cyl(.015, .55, (x, -.38, .82), CHROM, 12, rot=(-.2, 0, 0)),
              sphere(.04, (x, -.44, 1.08), GRIFF, 2, (1, 1, 1.6))]
        o += tasse(x, -.33, .14)
    return o




def wandlampe_teile():
    messing = mat('Messing', '#c9a04a', .3, 1)
    return [box((.14, .03, .24), (0, -.015, 0), messing, .01), cyl(.015, .28, (0, -.16, -.02), messing, 12, rot=(math.pi / 2, 0, 0)),
            cyl(.02, .1, (0, -.3, .02), messing, 12), cyl(.07, .16, (0, -.3, .14), mat('SchirmGlas', '#fff3d6', .3, 0, '#ffd99a', 3), 32, r2=.13),
            sphere(.045, (0, -.3, .12), LICHT)]


# Prozedurale Texturen kann glTF nicht mitnehmen: durch Durchschnittsfarbe ersetzen
FLACH = {'Holz': '#7a4422', 'HolzHell': '#b47c48', 'Griff': '#552c14', 'Tuch': '#d4574a', 'Mosaik': '#b8802e', 'Boden': '#8a8f86'}
for m in bpy.data.materials:
    if m.name in FLACH and m.use_nodes:
        b = m.node_tree.nodes['Principled BSDF']
        for l in list(b.inputs['Base Color'].links) + list(b.inputs['Normal'].links):
            m.node_tree.links.remove(l)
        b.inputs['Base Color'].default_value = hexc(FLACH[m.name])

modelle = {
    'ofen-1-elettrico': einfacher_ofen, 'ofen-2-piani': etagenofen, 'ofen-3-legna': steinofen, 'ofen-4-napoletano': luxusofen,
    'kaffee-1-caffettiera': mokka, 'kaffee-2-macchinetta': kleine_maschine, 'kaffee-3-espresso': siebtraeger, 'kaffee-4-leva': hebelmaschine,
    'theke': lambda: theke(3.4), 'tisch': tisch, 'stuhl': stuhl, 'tischgruppe': lambda: tischgruppe('tg', (0, 0)),
    'pflanze': lambda: pflanze(1.2), 'regal': regal, 'bild': lambda: bild(.8, .6, '#4aa3df'), 'wandlampe': wandlampe_teile,
}
for name, f in modelle.items():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    f()
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), export_format='GLB', export_apply=True, export_lights=False, export_cameras=False)
    print('EXPORT', name)
