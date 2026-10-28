import bpy, bmesh, math, sys, os, random
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
MODE, OUT = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


def hexc(h, a=1):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*c, a)


def mat(name, col, rough=.5, metal=0, emit=None, es=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hexc(col)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = hexc(emit)
        b.inputs['Emission Strength'].default_value = es
    return m


def wood():
    m = bpy.data.materials.new('Holz')
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (.35, 7, 7)
    ns = nt.nodes.new('ShaderNodeTexNoise')
    ns.inputs['Scale'].default_value = 3
    ns.inputs['Detail'].default_value = 10
    ns.inputs['Roughness'].default_value = .62
    ns.inputs['Distortion'].default_value = .4
    cr = nt.nodes.new('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].position = .35
    cr.color_ramp.elements[0].color = hexc('#4a2410')
    cr.color_ramp.elements[1].position = .7
    cr.color_ramp.elements[1].color = hexc('#9a5a2b')
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], ns.inputs['Vector'])
    nt.links.new(ns.outputs['Fac'], cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], b.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = .25
    nt.links.new(ns.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = .72
    return m


HOLZ = wood()
GOLD = mat('Gold', '#f4c64f', .25, 1)
ROT = mat('Rot', '#a8322a', .4)
DUNKEL = mat('Innen', '#2a160b', .8)
GLUT = mat('Glut', '#ffd27a', .3, 0, '#ffcf6a', 0)


def parent_to(o, p):
    o.parent = p
    o.matrix_parent_inverse = p.matrix_world.inverted()


def box(name, size, loc, m, bev=.03, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bev:
        md = o.modifiers.new('b', 'BEVEL')
        md.width = bev
        md.segments = 3
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    if parent:
        parent_to(o, parent)
    return o


def halfcyl(name, r, length, loc, m, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=r, depth=length, location=(0, 0, 0), rotation=(0, math.pi / 2, 0))
    o = bpy.context.object
    o.name = name
    bpy.ops.object.transform_apply(rotation=True)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 0, 1), clear_inner=True)
    bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
    bm.to_mesh(o.data)
    bm.free()
    o.location = loc
    md = o.modifiers.new('b', 'BEVEL')
    md.width = .025
    md.segments = 3
    md.limit_method = 'ANGLE'
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    if parent:
        parent_to(o, parent)
    return o


W, D, H = 2.0, 1.3, 1.05
root = bpy.data.objects.new('Truhe', None)
sc.collection.objects.link(root)

# Korpus aus Wänden, damit man hineinsieht
t = .09
parts = [box('boden', (W, D, t), (0, 0, t / 2), HOLZ),
         box('vorne', (W, t, H), (0, -D / 2 + t / 2, H / 2), HOLZ, 0),
         box('hinten', (W, t, H), (0, D / 2 - t / 2, H / 2), HOLZ, 0),
         box('links', (t, D - .01, H), (-W / 2 + t / 2, 0, H / 2), HOLZ, 0),
         box('rechts', (t, D - .01, H), (W / 2 - t / 2, 0, H / 2), HOLZ, 0),
         box('innen', (W - 2 * t - .01, D - 2 * t - .01, .02), (0, 0, H * .6), DUNKEL, 0)]

# Münzen und Edelsteine
random.seed(3)
for i in range(160):
    x = random.uniform(-W / 2 + .2, W / 2 - .2)
    y = random.uniform(-D / 2 + .2, D / 2 - .2)
    z = H * .62 + random.uniform(0, .3) * (1 - abs(x) / W)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.075, depth=.018, location=(x, y, z),
                                        rotation=(random.uniform(-.6, .6), random.uniform(-.6, .6), 0))
    o = bpy.context.object
    o.data.materials.append(GOLD)
    bpy.ops.object.shade_smooth()
    parts.append(o)
for col, loc in (('#e5533f', (-.35, -.1, H * .88)), ('#6bbb5f', (.4, .15, H * .86)), ('#4aa3df', (.05, .25, H * .9))):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.1, location=loc)
    o = bpy.context.object
    gm = mat('Stein' + col, col, .05)
    gm.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = .6
    o.data.materials.append(gm)
    parts.append(o)

# Goldbeschläge und roter Zierstreifen
for x in (-.62, .62):
    parts.append(box('bandv', (.16, .03, H + .02), (x, -D / 2 - .005, H / 2), GOLD, .01))
    parts.append(box('bandh', (.16, .03, H + .02), (x, D / 2 + .005, H / 2), GOLD, .01))
for sy in (-1, 1):
    parts.append(box('kanteo', (W + .04, .1, .07), (0, sy * (D / 2 - .03), H - .03), GOLD, .015))
for sx in (-1, 1):
    parts.append(box('kanteo', (.1, D + .04, .07), (sx * (W / 2 - .03), 0, H - .03), GOLD, .015))
parts.append(box('kanteu', (W + .04, D + .04, .08), (0, 0, .04), GOLD, .015))
for cx in (-1, 1):
    for cy in (-1, 1):
        parts.append(box('ecke', (.12, .12, H), (cx * (W / 2 - .04), cy * (D / 2 - .04), H / 2), GOLD, .02))
parts.append(box('streifen', (W + .01, .02, .18), (0, -D / 2 - .01, H * .45), ROT, .01))
for o in parts:
    o.parent = root

# Deckel am Scharnier hinten
hinge = bpy.data.objects.new('Scharnier', None)
sc.collection.objects.link(hinge)
hinge.location = (0, D / 2, H)
hinge.parent = root
halfcyl('deckel', D / 2, W, (0, 0, H), HOLZ, hinge)
for x in (-.62, .62):
    halfcyl('deckelband', D / 2 + .02, .16, (x, 0, H), GOLD, hinge)
box('schloss', (.32, .08, .38), (0, -D / 2 - .05, H + .02), GOLD, .03, hinge)
box('loch', (.06, .02, .12), (0, -D / 2 - .095, H), DUNKEL, .01, hinge)

# Leuchten im Inneren und Lichtstrahl
glow = box('glut', (W - .25, D - .25, .01), (0, 0, H * .97), GLUT, 0)
glow.parent = root
glow.visible_camera = False
glow.visible_glossy = False
pl = bpy.data.lights.new('innen', 'POINT')
pl.color = (1, .8, .45)
pl.shadow_soft_size = .4
plo = bpy.data.objects.new('innenlicht', pl)
sc.collection.objects.link(plo)
plo.location = (0, 0, H * .95)
plo.parent = root

bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=.85, radius2=2.6, depth=5, location=(0, 0, H + 2.5), end_fill_type='NOTHING')
beam = bpy.context.object
beam.parent = root
SM = bpy.data.materials.new('Strahl')
SM.use_nodes = True
nt = SM.node_tree
nt.nodes.clear()
outn = nt.nodes.new('ShaderNodeOutputMaterial')
add = nt.nodes.new('ShaderNodeAddShader')
tr = nt.nodes.new('ShaderNodeBsdfTransparent')
em = nt.nodes.new('ShaderNodeEmission')
em.inputs['Color'].default_value = hexc('#ffd98a')
tc = nt.nodes.new('ShaderNodeTexCoord')
sep = nt.nodes.new('ShaderNodeSeparateXYZ')
fade = nt.nodes.new('ShaderNodeMapRange')  # unten hell, oben ausblenden
fade.inputs['From Min'].default_value = 0
fade.inputs['From Max'].default_value = 1
fade.inputs['To Min'].default_value = 1
fade.inputs['To Max'].default_value = 0
lw = nt.nodes.new('ShaderNodeLayerWeight')
lw.inputs['Blend'].default_value = .85
inv = nt.nodes.new('ShaderNodeMath')
inv.operation = 'SUBTRACT'
inv.inputs[0].default_value = 1
mul = nt.nodes.new('ShaderNodeMath')
mul.operation = 'MULTIPLY'
strength = nt.nodes.new('ShaderNodeMath')
strength.operation = 'MULTIPLY'
strength.name = 'staerke'
strength.inputs[1].default_value = 0
nt.links.new(tc.outputs['Generated'], sep.inputs[0])
nt.links.new(sep.outputs['Z'], fade.inputs['Value'])
nt.links.new(lw.outputs['Facing'], inv.inputs[1])
nt.links.new(fade.outputs['Result'], mul.inputs[0])
pw = nt.nodes.new('ShaderNodeMath')
pw.operation = 'POWER'
pw.inputs[1].default_value = 3
nt.links.new(inv.outputs[0], pw.inputs[0])
nt.links.new(pw.outputs[0], mul.inputs[1])
nt.links.new(mul.outputs[0], strength.inputs[0])
nt.links.new(strength.outputs[0], em.inputs['Strength'])
nt.links.new(tr.outputs[0], add.inputs[0])
nt.links.new(em.outputs[0], add.inputs[1])
nt.links.new(add.outputs[0], outn.inputs['Surface'])
beam.data.materials.append(SM)
beam.visible_shadow = False
beam.visible_diffuse = False
beam.visible_glossy = False

# Boden und Hintergrund in den Spielfarben
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
bpy.context.object.data.materials.append(mat('Boden', '#26302b', .85))
sc.world = bpy.data.worlds.new('w')
sc.world.use_nodes = True
bg = sc.world.node_tree.nodes['Background']
bg.inputs[0].default_value = hexc('#1b221f')
bg.inputs[1].default_value = .6


def area(name, loc, energy, col, size):
    l = bpy.data.lights.new(name, 'AREA')
    l.energy = energy
    l.color = col
    l.size = size
    o = bpy.data.objects.new(name, l)
    sc.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector((0, 0, .8)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()


area('key', (-3.5, -4.5, 5), 900, (1, .92, .8), 3)
area('rim', (3.5, 4, 3.5), 700, (.7, .85, 1), 2.5)
area('fill', (4, -3, 1.5), 180, (1, .85, .7), 3)

cam = bpy.data.cameras.new('cam')
cam.lens = 40
co = bpy.data.objects.new('cam', cam)
sc.collection.objects.link(co)
sc.camera = co
co.location = (2.1, -5.4, 3.3)
co.rotation_euler = (Vector((0, 0, 1.75)) - co.location).to_track_quat('-Z', 'Y').to_euler()

# Animation: wackeln, zusammenducken, aufspringen, nachfedern
gb = GLUT.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
st = SM.node_tree.nodes['staerke'].inputs[1]


def key(f, ang, glow_s, beam_s, light_w, shake=0, sq=1):
    hinge.rotation_euler = (math.radians(ang), 0, 0)
    hinge.keyframe_insert('rotation_euler', frame=f)
    root.rotation_euler = (0, 0, math.radians(shake))
    root.keyframe_insert('rotation_euler', frame=f)
    root.scale = (1 / math.sqrt(sq), 1 / math.sqrt(sq), sq)
    root.keyframe_insert('scale', frame=f)
    gb.default_value = glow_s
    gb.keyframe_insert('default_value', frame=f)
    st.default_value = beam_s
    st.keyframe_insert('default_value', frame=f)
    pl.energy = light_w
    pl.keyframe_insert('energy', frame=f)


for k in [(1, 0, 0, 0, 0, 0, 1), (4, 0, 0, 0, 0, -4, 1), (7, 0, 0, 0, 0, 4, 1), (10, 0, 0, 0, 0, -5, .96),
          (13, 0, 0, 0, 0, 5, .92), (16, -4, 2, 0, 50, 0, .85), (19, -118, 25, .5, 400, 0, 1.07),
          (22, -98, 22, .4, 350, 0, .98), (25, -108, 20, .32, 320, 0, 1.0), (36, -105, 18, .28, 300, 0, 1.0)]:
    key(*k)

sc.frame_start, sc.frame_end = 1, 36
sc.render.fps = 24
sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.refresh_devices()
for d in prefs.devices:
    d.use = (d.type == 'OPTIX')
sc.cycles.device = 'GPU'
sc.cycles.use_denoising = True

if MODE == 'still':
    sc.render.resolution_x, sc.render.resolution_y = 768, 1344
    sc.cycles.samples = 384
    for f, n in ((1, 'truhe-zu'), (30, 'truhe-offen')):
        sc.frame_set(f)
        sc.render.filepath = os.path.join(OUT, n + '.png')
        bpy.ops.render.render(write_still=True)
else:
    sc.render.resolution_x, sc.render.resolution_y = 540, 960
    sc.cycles.samples = 64
    sc.render.filepath = os.path.join(OUT, 'anim_')
    bpy.ops.render.render(animation=True)
