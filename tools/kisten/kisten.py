"""Rendert für jede Zutat eine Holzkiste voller 3D-Ware (Blender, Cycles).

Aufruf (Blender 4.2 als Python-Modul, pip install bpy==4.2.0 unter Python 3.11):
    python kisten.py AUSGABE_ORDNER [SAMPLES] [zutat1,zutat2,...]
Ergebnis: AUSGABE_ORDNER/<zutat>.png mit durchsichtigem Hintergrund und weichem Schatten.
Danach mit `python webp.py` in www/bilder/kisten/ als WebP ablegen.
"""
import bpy, bmesh, math, random, sys, os
from mathutils import Vector, Euler

args = [a for a in sys.argv[1:] if a != "--"]
OUT = args[0] if args else "kisten_out"
SAMPLES = int(args[1]) if len(args) > 1 else 64
ONLY = args[2].split(",") if len(args) > 2 else None
RES = 384
os.makedirs(OUT, exist_ok=True)


def lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1,)


# ---------- Materialien ----------
def node_mat(name, col, rough=.5, sss=0.0, metal=0.0, bump=0.0, bscale=8.0, spec=.5, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = lin(col) if isinstance(col, str) else col
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Specular IOR Level"].default_value = spec
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (0.3, 0.2, 0.15)
        b.inputs["Subsurface Scale"].default_value = 0.05
    if bump:
        n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = bscale; n.inputs["Detail"].default_value = 6
        bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = bump
        nt.links.new(n.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def mix_mat(name, a, b_, kind="noise", scale=6.0, lo=.45, hi=.55, rough=.5, sss=0.0, bump=0.0):
    """Zwei Farben über ein Muster gemischt (Adern, Fettaugen, Maserung)."""
    m = node_mat(name, a, rough=rough, sss=sss, bump=bump)
    nt = m.node_tree
    bs = nt.nodes["Principled BSDF"]
    if kind == "voronoi":
        t = nt.nodes.new("ShaderNodeTexVoronoi"); t.inputs["Scale"].default_value = scale; fac = t.outputs["Distance"]
    elif kind == "wave":
        t = nt.nodes.new("ShaderNodeTexWave"); t.inputs["Scale"].default_value = scale; t.inputs["Distortion"].default_value = 6
        t.inputs["Detail"].default_value = 4; fac = t.outputs["Fac"]
    else:
        t = nt.nodes.new("ShaderNodeTexNoise"); t.inputs["Scale"].default_value = scale; t.inputs["Detail"].default_value = 8; fac = t.outputs["Fac"]
    r = nt.nodes.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].position = lo; r.color_ramp.elements[0].color = lin(a) if isinstance(a, str) else a
    r.color_ramp.elements[1].position = hi; r.color_ramp.elements[1].color = lin(b_) if isinstance(b_, str) else b_
    nt.links.new(fac, r.inputs["Fac"]); nt.links.new(r.outputs["Color"], bs.inputs["Base Color"])
    return m


# ---------- Formen ----------
def smooth(o, sub=0):
    for p in o.data.polygons:
        p.use_smooth = True
    if sub:
        md = o.modifiers.new("s", "SUBSURF"); md.levels = sub; md.render_levels = sub
    return o


def add(o, m):
    o.data.materials.clear(); o.data.materials.append(m); return o


def sphere(r=1, loc=(0, 0, 0), scale=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=seg // 2)
    o = bpy.context.object; o.scale = scale; return smooth(o)


def cyl(r=1, d=1, loc=(0, 0, 0), rot=(0, 0, 0), v=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc, rotation=rot, vertices=v)
    return bpy.context.object


def cube(size=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot); o = bpy.context.object; o.scale = size; return o


def cone(r1, r2, d, loc=(0, 0, 0), rot=(0, 0, 0), v=16):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=d, location=loc, rotation=rot, vertices=v)
    return smooth(bpy.context.object)


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    for o in objs:
        for md in list(o.modifiers):
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.join()
    o = bpy.context.object; o.name = name
    return o


def deform(o, amt=.04, seed=1):
    """Etwas Unregelmäßigkeit, damit nichts nach Kugel aus dem Baukasten aussieht."""
    rnd = random.Random(seed)
    tex = bpy.data.textures.new("d%d" % seed, "CLOUDS"); tex.noise_scale = .6
    md = o.modifiers.new("d", "DISPLACE"); md.texture = tex; md.strength = amt; md.mid_level = .5
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier="d")
    return o


def leaf(length=.3, width=.14, col="#3f9a45", curl=.08, name="blatt", serr=0):
    """Ein Blatt als gebogene Fläche mit Mittelrippe."""
    bm = bmesh.new()
    n = 8
    rows = []
    for i in range(n + 1):
        t = i / n
        w = width * math.sin(math.pi * min(1, t * 1.05)) * (1 - .3 * t)
        if serr and i % 2:
            w *= .7
        y = t * length
        z = curl * (t ** 2) + .02 * math.sin(t * 3)
        rows.append([bm.verts.new((-w, y, z + .025 * w / max(width, 1e-3))), bm.verts.new((0, y, z - .01)), bm.verts.new((w, y, z + .025 * w / max(width, 1e-3)))])
    for i in range(n):
        for j in range(2):
            bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    sol = o.modifiers.new("t", "SOLIDIFY"); sol.thickness = .006
    smooth(o, 1)
    return o


# ---------- Die Ware ----------
M = {}


def m(key, *a, **k):
    if key not in M:
        M[key] = node_mat(key, *a, **k)
    return M[key]


def mm(key, *a, **k):
    if key not in M:
        M[key] = mix_mat(key, *a, **k)
    return M[key]


STEM = lambda: m("stiel", "#4f7a2a", .6)


def p_pomodoro():
    b = add(deform(sphere(.17, scale=(1, 1, .85), seg=32), .02, 2), m("tomate", "#d22a1a", .18, sss=.1, coat=.4))
    cal = []
    for i in range(5):
        a = i / 5 * math.tau
        l = add(cone(.035, .0, .1, loc=(math.cos(a) * .04, math.sin(a) * .04, .145), rot=(math.sin(a) * 1.3, -math.cos(a) * 1.3, 0), v=6), STEM())
        l.scale = (1, .35, 1); cal.append(l)
    cal.append(add(cyl(.012, .05, loc=(0, 0, .17), v=8), STEM()))
    return join([b] + cal, "pomodoro"), .32


def p_mozzarella(r=.15, col="#f8f4ea", knot=False, name="mozz"):
    b = add(deform(sphere(r, scale=(1, 1, .9), seg=32), .01, 3), m(name, col, .35, sss=.6))
    parts = [b]
    if knot:
        parts.append(add(sphere(r * .28, loc=(0, 0, r * .95), scale=(1, 1, 1.3)), M[name]))
    return join(parts, name), r * 2


def p_basilico():
    parts = []
    for i in range(7):
        l = leaf(.16, .07, curl=.05)
        l.rotation_euler = (random.uniform(-.6, -.2), 0, i / 7 * math.tau); l.location = (0, 0, .02 * (i % 2))
        add(l, m("basilikum", "#2f8a35", .35, sss=.2))
        parts.append(l)
    parts.append(add(cyl(.01, .2, loc=(0, 0, -.06), v=6), STEM()))
    return join(parts, "basilico"), .3


def p_aglio():
    parts = []
    mat_ = m("knoblauch", "#efe6d6", .55, sss=.3, bump=.15, bscale=30)
    for i in range(8):
        a = i / 8 * math.tau
        c = sphere(.055, loc=(math.cos(a) * .05, math.sin(a) * .05, 0), scale=(.8, .8, 1.25))
        c.rotation_euler = (math.sin(a) * .4, -math.cos(a) * .4, 0); parts.append(add(c, mat_))
    parts.append(add(cone(.035, .008, .1, loc=(0, 0, .1)), mat_))
    return join(parts, "aglio"), .2


def p_origano():
    parts = [add(cyl(.006, .32, rot=(math.pi / 2, 0, 0), v=6), m("zweig", "#6b5a3a", .8))]
    mt = m("oregano", "#6f8a3a", .7)
    for i in range(26):
        y = random.uniform(-.15, .15)
        s = sphere(.018, loc=(random.uniform(-.02, .02), y, random.uniform(-.01, .02)), scale=(1, 1, .4), seg=8)
        parts.append(add(s, mt))
    return join(parts, "origano"), .1


def p_olio():
    g = m("glas", "#c8b02a", .05)
    g.node_tree.nodes["Principled BSDF"].inputs["Transmission Weight"].default_value = .85
    body = add(cyl(.06, .3, loc=(0, 0, .15), v=24), g)
    smooth(body)
    neck = add(cone(.06, .022, .1, loc=(0, 0, .35)), g)
    cap = add(cyl(.025, .05, loc=(0, 0, .42), v=16), m("deckel", "#2a5a2a", .3, metal=.6))
    lab = add(cyl(.0615, .1, loc=(0, 0, .14), v=24), m("etikett", "#f3eee2", .7))
    return join([body, neck, cap, lab], "olio"), .15


def p_prosciutto(raw=False):
    """Schinken: Keule mit Schwarte, oben angeschnitten (rot mit weißem Fettrand bzw. rosa Kochschinken)."""
    rind = m("schwarte%d" % raw, "#c98a4a" if raw else "#d9a070", .45, bump=.2, coat=.2)
    leg = add(deform(sphere(.2, scale=(1.7, 1, .75), seg=32), .04, 5), rind)
    shank = add(cone(.1, .05, .3, loc=(.4, 0, -.02), rot=(0, math.pi / 2, 0), v=24), rind)
    fat = add(cyl(.17, .02, loc=(-.08, 0, .14), v=32), m("fett", "#f6ece0", .5, sss=.3)); fat.scale = (1.5, 1, 1)
    face = add(cyl(.15, .025, loc=(-.08, 0, .145), v=32), mm("anschnitt%d" % raw, "#a8202c" if raw else "#e88a92", "#c8404a" if raw else "#f2b0b4", "noise", 12, .4, .6, rough=.35, sss=.2))
    face.scale = (1.5, 1, 1)
    parts = [leg, shank, fat, face]
    if raw:
        parts.append(add(cyl(.03, .1, loc=(.58, 0, -.02), rot=(0, math.pi / 2, 0)), m("knochen", "#efe6d0", .6)))
    return join(parts, "crudo" if raw else "prosciutto"), .45


def p_carciofi():
    parts = []
    mt = mm("artischocke", "#7f9a4a", "#7a4a7a", "noise", 4, .55, .75, rough=.55)
    for ring in range(5):
        n = 7 + ring
        for i in range(n):
            a = i / n * math.tau + ring * .4
            r = .03 + ring * .018
            z = .14 - ring * .03
            p = sphere(.05, loc=(math.cos(a) * r, math.sin(a) * r, z), scale=(.9, .35, 1.1), seg=10)
            p.rotation_euler = (0, .5 + ring * .15, a); p.rotation_mode = "ZYX"; p.rotation_euler = (0, -(.4 + ring * .17), a)
            parts.append(add(p, mt))
    parts.append(add(cyl(.02, .1, loc=(0, 0, -.02), v=8), STEM()))
    return join(parts, "carciofi"), .22


def p_olive(col="#3a3a2a", name="olive", r=.035):
    o = add(sphere(r, scale=(1, 1, 1.35), seg=16), m(name, col, .15, coat=.6))
    return o, r * 2.1


def p_tonno():
    can = add(cyl(.13, .09, v=32), m("dose", "#c8ccd0", .2, metal=1))
    lab = add(cyl(.1305, .065, v=32), m("tonnoetikett", "#1f6fb8", .4))
    top = add(cyl(.12, .002, loc=(0, 0, .046), v=32), m("deckelmetall", "#d8dce0", .15, metal=1))
    stripe = add(cyl(.131, .018, v=32), m("gelbstreifen", "#f4c64f", .4))
    return join([can, lab, top, stripe], "tonno"), .27


def p_cipolla():
    o = add(deform(sphere(.12, scale=(1, 1, .95), seg=24), .015, 9), mm("zwiebel", "#b0508a", "#e3b0d8", "wave", 2, .3, .7, rough=.3, sss=.1))
    tip = add(cone(.03, .002, .07, loc=(0, 0, .13)), M["zwiebel"])
    return join([o, tip], "cipolla"), .25


def p_acciughe():
    mt = mm("sardelle", "#8c9aa6", "#dfe6ea", "wave", 2, .4, .6, rough=.15)
    body = add(sphere(.03, scale=(4, 1, .7), seg=16), mt)
    tail = add(cone(.035, .0, .05, loc=(-.14, 0, 0), rot=(0, math.pi / 2, 0), v=3), mt); tail.scale = (.4, 1, 1)
    return join([body, tail], "acciughe"), .1


def p_capperi():
    return p_olive("#6f7f3a", "kapern", .02)


def p_peperoni(col):
    parts = []
    mt = m("paprika" + col, col, .12, coat=.5)
    for i in range(4):
        a = i / 4 * math.tau
        parts.append(add(sphere(.07, loc=(math.cos(a) * .04, math.sin(a) * .04, 0), scale=(1, 1, 1.4), seg=20), mt))
    parts.append(add(cyl(.012, .06, loc=(0, 0, .11), v=8), STEM()))
    return join(parts, "peperoni"), .22


def p_melanzane():
    b = add(deform(sphere(.08, scale=(2.4, 1, 1), seg=24), .01, 11), m("aubergine", "#3a1a40", .1, coat=.8))
    capg = add(cone(.06, .02, .05, loc=(.2, 0, 0), rot=(0, math.pi / 2, 0), v=6), STEM())
    return join([b, capg], "melanzane"), .2


def wedge(r, h, ang, body, rind, name, holes=None):
    """Käsekeil: Tortenstück aus einem Laib, mit Rinde außen."""
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=48)
    o = bpy.context.object
    cut1 = cube((r * 2, r * 2, h * 2), loc=(0, -r * 2, 0)); cut2 = cube((r * 2, r * 2, h * 2), loc=(0, r * 2, 0))
    cut2.rotation_euler = (0, 0, ang)
    cut2.location = (math.cos(ang + math.pi / 2) * r * 2, math.sin(ang + math.pi / 2) * r * 2, 0)
    for c in (cut1, cut2):
        bo = o.modifiers.new("b", "BOOLEAN"); bo.object = c; bo.operation = "DIFFERENCE"
        bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="b"); bpy.data.objects.remove(c)
    add(o, body)
    rd = cyl(r * 1.01, h * 1.01, v=48)
    for c in (cube((r * 2, r * 2, h * 2), loc=(0, -r * 2, 0)),):
        bo = rd.modifiers.new("b", "BOOLEAN"); bo.object = c; bo.operation = "DIFFERENCE"
        bpy.context.view_layer.objects.active = rd; bpy.ops.object.modifier_apply(modifier="b"); bpy.data.objects.remove(c)
    inner = cyl(r * .97, h * 1.2, v=48)
    bo = rd.modifiers.new("b", "BOOLEAN"); bo.object = inner; bo.operation = "DIFFERENCE"
    bpy.context.view_layer.objects.active = rd; bpy.ops.object.modifier_apply(modifier="b"); bpy.data.objects.remove(inner)
    cut2 = cube((r * 2, r * 2, h * 2)); cut2.rotation_euler = (0, 0, ang)
    cut2.location = (math.cos(ang + math.pi / 2) * r * 2, math.sin(ang + math.pi / 2) * r * 2, 0)
    bo = rd.modifiers.new("b", "BOOLEAN"); bo.object = cut2; bo.operation = "DIFFERENCE"
    bpy.context.view_layer.objects.active = rd; bpy.ops.object.modifier_apply(modifier="b"); bpy.data.objects.remove(cut2)
    add(rd, rind)
    return join([o, rd], name)


def p_formaggio_keil(name, col, rind, r=.22, h=.12, ang=1.1, kind=None):
    if kind == "gorgonzola":
        body = mm("gorgo", "#4f7f98", "#efe8cc", "noise", 14, .44, .47, rough=.55)
    elif kind == "parmigiano":
        body = node_mat("parm", "#f0d790", .75, bump=.4, bscale=40)
    else:
        body = node_mat(name + "k", col, .5, sss=.2, bump=.05, bscale=20)
    rd = node_mat(name + "r", rind, .6, bump=.2, bscale=12)
    o = wedge(r, h, ang, body, rd, name)
    return o, r * 1.3


def p_friarielli(col="#2a5f25", name="friarielli", n=6, ln=.26):
    parts = [add(cyl(.008, ln, loc=(0, ln / 2 - .04, 0), rot=(math.pi / 2, 0, 0), v=6), m("stiel2", "#4a7a2a", .5))]
    for i in range(n):
        l = leaf(ln * .55, .06, curl=.04, serr=1)
        l.rotation_euler = (.2, random.uniform(-.5, .5), (i % 2 - .5) * 1.4); l.location = (0, i * ln / n, .01)
        parts.append(add(l, m(name, col, .4, sss=.1)))
    return join(parts, name), .16


def p_ricotta():
    bas = add(cone(.1, .08, .09, loc=(0, 0, .045), v=24), mm("korb", "#b8935a", "#7a5a30", "wave", 40, .4, .6, rough=.8))
    top = add(deform(sphere(.095, loc=(0, 0, .09), scale=(1, 1, .55), seg=24), .01, 12), m("ricotta", "#fbf8f0", .7, sss=.4, bump=.3, bscale=30))
    return join([bas, top], "ricotta"), .22


def p_cozze():
    sh = add(deform(sphere(.05, scale=(2, 1, .6), seg=16), .006, 13), m("muschel", "#1c1e2a", .2, coat=.5))
    sh2 = add(deform(sphere(.05, loc=(0, 0, .02), scale=(2, 1, .5), seg=16), .006, 14), M["muschel"])
    sh2.rotation_euler = (.25, 0, 0)
    return join([sh, sh2], "cozze"), .12


def p_gamberi():
    mt = m("garnele", "#f2784a", .25, sss=.3, coat=.4)
    parts = []
    for i in range(6):
        a = i / 6 * 3.6
        s = sphere(.035 - i * .003, loc=(math.cos(a) * .07, math.sin(a) * .07, 0), scale=(1, 1.2, 1), seg=12)
        parts.append(add(s, mt))
    tail = add(cone(.03, .0, .05, loc=(math.cos(3.9) * .07, math.sin(3.9) * .07, 0), rot=(math.pi / 2, 0, 3.9), v=3), mt)
    parts.append(tail)
    return join(parts, "gamberi"), .16


def p_prezzemolo():
    parts = [add(cyl(.006, .2, loc=(0, 0, -.08), v=6), STEM())]
    for i in range(14):
        a = random.uniform(0, math.tau)
        s = sphere(.025, loc=(math.cos(a) * random.uniform(0, .05), math.sin(a) * random.uniform(0, .05), random.uniform(0, .05)), scale=(1, 1, .5), seg=10)
        parts.append(add(deform(s, .01, 20 + i), m("petersilie", "#2f7a2f", .5, sss=.15)))
    return join(parts, "prezzemolo"), .14


def p_scamorza(col="#e8b366", name="scamorza"):
    mt = m(name, col, .3, sss=.3, coat=.3)
    b = add(sphere(.08, scale=(1, 1, 1), seg=24), mt)
    neck = add(sphere(.035, loc=(0, 0, .09), scale=(1, 1, 1.1), seg=16), mt)
    knot = add(sphere(.02, loc=(0, 0, .13)), mt)
    return join([b, neck, knot], name), .18


def p_provola():
    o, s = p_mozzarella(.11, "#c98a46", True, "provola")
    return o, s


def p_patate():
    """Kartoffel: unregelmäßige gelbbraune Knolle mit Erde und ein paar Augen."""
    mt = mm("kartoffel", "#d8b070", "#b08350", "noise", 3, .35, .65, rough=.8, bump=.05)
    b = add(deform(sphere(.1, scale=(1.35, 1, .8), seg=24), .01, 11), mt)
    eyes = [add(sphere(.007, loc=(random.uniform(-.1, .1), random.uniform(-.06, .06), .076), scale=(1, 1, .4)), m("auge", "#8a6a4a", .9)) for _ in range(3)]
    return join([b] + eyes, "patate"), .24


def p_melone():
    """Melone (Cantalupo): rund, orange-grünlich mit hellem Netz und Längsrippen, kleiner Stiel."""
    mt = mm("melone", "#8a8a3a", "#d9b46a", "voronoi", 22, .2, .5, rough=.7, bump=.15)
    b = add(deform(sphere(.19, scale=(1.08, 1, .95), seg=32), .012, 13), mt)
    ribs = []
    for i in range(10):
        a = i / 10 * math.tau
        r = add(sphere(.19, scale=(.07, 1.07, .97), seg=16), m("rippe", "#8a9a4a", .7))
        r.rotation_euler = (0, 0, a); ribs.append(r)
    st = add(cyl(.015, .05, loc=(.205, 0, 0), rot=(0, math.pi / 2, 0), v=8), STEM())
    return join([b] + ribs + [st], "melone"), .4


# ---------- Gedrehte und gezogene Formen (für Wurst, Zucchini, Pilze) ----------
def _mesh(bm, name):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    return smooth(o)


def _bridge(bm, rings, v):
    for a, b in zip(rings, rings[1:]):
        if len(a) == 1:
            for j in range(v):
                bm.faces.new((a[0], b[(j + 1) % v], b[j]))
        elif len(b) == 1:
            for j in range(v):
                bm.faces.new((a[j], a[(j + 1) % v], b[0]))
        else:
            for j in range(v):
                bm.faces.new((a[j], a[(j + 1) % v], b[(j + 1) % v], b[j]))


def lathe(pts, v=32, name="dreh"):
    """Rotationskörper um die z-Achse aus Punkten (Radius, Höhe), von oben nach unten."""
    bm = bmesh.new(); rings = []
    for r, z in pts:
        if r < 1e-5:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(j / v * math.tau), r * math.sin(j / v * math.tau), z)) for j in range(v)])
    _bridge(bm, rings, v)
    return _mesh(bm, name)


def tube(prof, L, n=40, v=20, bend=0.0, ridge=0.0, ridges=5, wob=0.0, seed=1, name="rohr"):
    """Länglicher Körper entlang x: prof(t) gibt den Radius, bend biegt ihn, ridge macht flache Längsrippen."""
    rnd = random.Random(seed); ph = [rnd.uniform(0, math.tau) for _ in range(3)]
    bm = bmesh.new(); rings = []
    for i in range(n + 1):
        t = i / n; r = prof(t); x = (t - .5) * L; zc = bend * (1 - (2 * t - 1) ** 2)
        if r < 1e-5:
            rings.append([bm.verts.new((x, 0, zc))]); continue
        ring = []
        for j in range(v):
            a = j / v * math.tau
            rr = r * (1 + ridge * math.cos(ridges * a) + wob * math.sin(t * 9 + ph[0]) * math.sin(a * 2 + ph[1]))
            ring.append(bm.verts.new((x, rr * math.cos(a), zc + rr * math.sin(a))))
        rings.append(ring)
    _bridge(bm, rings, v)
    return _mesh(bm, name)


def obj_mat(name, cols, scale=(1, 1, 1), kind="noise", nscale=6.0, rough=.5, sss=0.0, bump=0.0, bscale=20.0, coat=0.0, detail=8):
    """Farbverlauf (Liste aus (Position, Farbe)) über ein Muster in Objekt-Koordinaten, das sich strecken lässt
    (Längsstreifen der Zucchini, Fettaugen in der Wurst, Rillen unter dem Pilzhut)."""
    mt = node_mat(name, cols[0][1], rough=rough, sss=sss, bump=bump, bscale=bscale, coat=coat)
    nt = mt.node_tree; bs = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = scale
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    if kind == "voronoi":
        t = nt.nodes.new("ShaderNodeTexVoronoi"); t.inputs["Scale"].default_value = nscale; fac = t.outputs["Distance"]
    elif kind == "radial":  # feine Linien rund um die z-Achse (Lamellen)
        g = nt.nodes.new("ShaderNodeTexGradient"); g.gradient_type = "RADIAL"
        nt.links.new(mp.outputs["Vector"], g.inputs["Vector"])
        mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = nscale * math.tau
        sn = nt.nodes.new("ShaderNodeMath"); sn.operation = "SINE"
        nt.links.new(g.outputs["Fac"], mul.inputs[0]); nt.links.new(mul.outputs[0], sn.inputs[0])
        t = None; fac = sn.outputs[0]
    else:
        t = nt.nodes.new("ShaderNodeTexNoise"); t.inputs["Scale"].default_value = nscale; t.inputs["Detail"].default_value = detail; fac = t.outputs["Fac"]
    if t is not None:
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
    r = nt.nodes.new("ShaderNodeValToRGB"); cr = r.color_ramp
    cr.elements[0].position, cr.elements[0].color = cols[0][0], lin(cols[0][1])
    cr.elements[1].position, cr.elements[1].color = cols[-1][0], lin(cols[-1][1])
    for p, c in cols[1:-1]:
        e = cr.elements.new(p); e.color = lin(c)
    nt.links.new(fac, r.inputs["Fac"]); nt.links.new(r.outputs["Color"], bs.inputs["Base Color"])
    return mt


def om(key, *a, **k):
    if key not in M:
        M[key] = obj_mat(key, *a, **k)
    return M[key]


def ring(r, tr, loc, name="faden"):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=tr, location=loc, rotation=(0, math.pi / 2, 0), major_segments=24, minor_segments=6)
    return smooth(bpy.context.object)


# Salami: dunkelrote, faltige Haut mit weißem Edelschimmel, mit Bindfaden geschnürt; eine Hälfte angeschnitten
SALAMI_HAUT = lambda: om("salamihaut", [(.3, "#4a2220"), (.5, "#6e342c"), (.62, "#9a7468"), (.75, "#d6ccc0")], scale=(.5, 1, 1), nscale=26, rough=.85, bump=.4, bscale=70)
SALAMI_FLEISCH = lambda: om("salamifleisch", [(.07, "#f3e2d6"), (.1, "#9a1e26"), (.3, "#8a1a22"), (.6, "#6e1219")], kind="voronoi", nscale=55, rough=.4, sss=.1)


def p_salame(cut=False, seed=1):
    L, R = .42, .058
    prof = lambda t: R * (min(1, t * 9) ** .45 if not cut else 1) * min(1, (1 - t) * 9) ** .45
    b = add(tube(prof, L, n=48, v=24, bend=.006, wob=.04, seed=seed, name="wurst"), SALAMI_HAUT())
    parts = [b]
    for i in range(6):  # Bindfaden quer
        x = -L / 2 + .05 + i * (L - .1) / 5
        parts.append(add(ring(prof((x + L / 2) / L) * 1.0, .0024, (x, 0, 0)), m("faden", "#cdbb96", .9)))
    parts.append(add(cyl(.0024, L * .96, loc=(0, 0, R * .99), rot=(0, math.pi / 2, 0), v=6), M["faden"]))
    parts.append(add(sphere(.008, loc=(L / 2 + .004, 0, 0)), M["faden"]))
    if cut:
        parts.append(add(cyl(R * .97, .004, loc=(-L / 2 + .001, 0, 0), rot=(0, math.pi / 2, 0), v=32), SALAMI_FLEISCH()))
    return join(parts, "salame"), .14


def p_salame_scheibe():
    a = add(cyl(.06, .007, v=32), SALAMI_HAUT())
    b = add(cyl(.057, .009, v=32), SALAMI_FLEISCH())
    return join([a, b], "scheibe"), .12


# Salsiccia: grobe, rosarote Bratwurst im glänzenden Naturdarm, als Kette mit gedrehten Enden
def p_salsiccia(links=3, seed=1):
    def prof(t):
        u = (t * links) % 1
        return .038 * (.18 + .82 * math.sin(math.pi * u) ** .22) * (1 + .04 * math.sin(t * 23))
    mt = om("wurst", [(.4, "#8e3c38"), (.52, "#b45a50"), (.6, "#d08c7c"), (.66, "#ecd2c2")], nscale=55, detail=12,
            rough=.3, sss=.25, coat=.35, bump=.2, bscale=60)
    o = add(tube(prof, .155 * links, n=36 * links, v=20, bend=.04 * random.Random(seed).uniform(-1, 1), wob=.05, seed=seed, name="salsiccia"), mt)
    o.rotation_euler = (0, 0, 0)
    return o, .1


# Zucchini: dunkelgrün mit hellen Längsstreifen und Sprenkeln, leicht keulenförmig und gebogen, kantiger Stiel
def p_zucchine(seed=1):
    rnd = random.Random(seed)
    L, R = .44, .047
    prof = lambda t: R * (.78 + .3 * t) * min(1, t * 7) ** .5 * min(1, (1 - t) * 5) ** .55
    mt = om("zucchini", [(.42, "#17361a"), (.52, "#2e5a24"), (.6, "#6f9446"), (.7, "#a8bf74")], scale=(1.2, 14, 14), nscale=3.5, rough=.45, coat=.1, bump=.08, bscale=90)
    b = add(tube(prof, L, n=44, v=30, bend=rnd.uniform(.01, .03), ridge=.035, ridges=5, wob=.03, seed=seed, name="zucchine"), mt)
    st = add(cone(.022, .012, .05, loc=(-L / 2 - .015, 0, 0), rot=(0, -math.pi / 2, 0), v=5), m("zstiel", "#9aa868", .75, bump=.3, bscale=40))
    fl = add(sphere(.012, loc=(L / 2 - .004, 0, .002), scale=(.5, 1, 1), seg=10), m("bluete", "#8a7a3a", .9))
    return join([b, st, fl], "zucchine"), .12


# Funghi: Champignons mit gewölbtem, am Rand eingerolltem Hut, Lamellen darunter, kurzem dickem Stiel
def p_funghi(braun=True, seed=1):
    rnd = random.Random(seed)
    R, h = .085 * rnd.uniform(.9, 1.1), .062
    top = [(0, h)] + [(R * math.sin(a), h * math.cos(a) ** .8 if a < math.pi / 2 else -.012 * math.sin((a - math.pi / 2) * 3))
                      for a in [i / 14 * math.radians(112) for i in range(1, 15)]]
    if braun:
        hut = om("pilzbraun", [(.3, "#6a4630"), (.55, "#8e6444"), (.8, "#b08a64")], scale=(1, 1, .3), nscale=7, rough=.55, bump=.12, bscale=25)
    else:
        hut = om("pilzweiss", [(.35, "#c9b89c"), (.55, "#e2d6c2"), (.8, "#f2ebde")], scale=(1, 1, .3), nscale=9, rough=.6, sss=.15, bump=.15, bscale=30)
    cap_ = add(deform(lathe(top + [(R * .9, -.016)], v=40, name="hut"), .004, seed), hut)
    gill = add(lathe([(R * .9, -.016), (R * .62, -.006), (.03, .006)], v=40, name="lamellen"),
               om("lamellen", [(.0, "#3e2a20"), (.5, "#6e5240"), (1, "#a8907a")], kind="radial", nscale=70, rough=.8))
    stem = add(lathe([(.032, .006), (.035, -.03), (.036, -.05), (.03, -.056), (0, -.056)], v=24, name="stiel"),
               om("pilzstiel", [(.4, "#e2d6c0"), (.7, "#f2ebde")], scale=(1, 1, 4), nscale=10, rough=.6, sss=.1))
    return join([cap_, gill, stem], "funghi"), .2


PROTO = {
    "pomodoro": (p_pomodoro, "pile"), "mozzarella": (lambda: p_mozzarella(), "pile"), "basilico": (p_basilico, "pile"),
    "aglio": (p_aglio, "pile"), "origano": (p_origano, "bunch"), "olio": (p_olio, "upright"),
    "salame": (p_salame, "logs"), "prosciutto": (lambda: p_prosciutto(False), "few"), "funghi": (p_funghi, "pile"),
    "carciofi": (p_carciofi, "pile"), "olive": (lambda: p_olive(), "pile"), "tonno": (p_tonno, "stack"),
    "cipolla": (p_cipolla, "pile"), "acciughe": (p_acciughe, "pile"), "capperi": (p_capperi, "pile"),
    "peperoni": (None, "pile"), "zucchine": (p_zucchine, "logs"), "melanzane": (p_melanzane, "logs"),
    "gorgonzola": (lambda: p_formaggio_keil("gorgonzola", "", "#d9c88f", kind="gorgonzola"), "wedges"),
    "parmigiano": (lambda: p_formaggio_keil("parmigiano", "", "#c89a3a", r=.3, h=.16, ang=.9, kind="parmigiano"), "wedges"),
    "fontina": (lambda: p_formaggio_keil("fontina", "#f2dc95", "#a8743a", r=.25, h=.1), "wedges"),
    "crudo": (lambda: p_prosciutto(True), "few"), "rucola": (lambda: p_friarielli("#3f7a22", "rucola", 7, .2), "pile"),
    "salsiccia": (p_salsiccia, "logs"), "friarielli": (lambda: p_friarielli(), "pile"), "ricotta": (p_ricotta, "upright"),
    "cozze": (p_cozze, "pile"), "gamberi": (p_gamberi, "pile"), "prezzemolo": (p_prezzemolo, "pile"),
    "bufala": (lambda: p_mozzarella(.17, "#fdfbf4", True, "bufala"), "pile"),
    "scamorza": (lambda: p_scamorza(), "pile"), "pecorino": (lambda: p_formaggio_keil("pecorino", "#f1e6c2", "#8a6a3a", r=.24, h=.14, ang=1.0), "wedges"),
    "provola": (p_provola, "pile"),
    "patate": (p_patate, "pile"), "melone": (p_melone, "pile"),
}

# Mehrere Spielarten derselben Ware, damit die Kiste nicht wie kopiert aussieht
VARIANTEN = {
    "salame": [lambda: p_salame(False, 1), lambda: p_salame(True, 2), lambda: p_salame(False, 3)],
    "salsiccia": [lambda: p_salsiccia(3, 1), lambda: p_salsiccia(3, 2), lambda: p_salsiccia(2, 3)],
    "zucchine": [lambda: p_zucchine(1), lambda: p_zucchine(2), lambda: p_zucchine(3)],
    "funghi": [lambda: p_funghi(True, 1), lambda: p_funghi(True, 2), lambda: p_funghi(False, 3)],
}

# ---------- Kiste ----------
CW, CD, CH = .8, .58, .46  # halbe Breite, halbe Tiefe, Höhe innen


def crate():
    wood = mm("holz", "#d4a467", "#a8743f", "noise", 2.5, .4, .7, rough=.7, bump=.15)
    dark = mm("holzdunkel", "#8a5a2e", "#6a4220", "noise", 3, .4, .7, rough=.75)
    parts = []
    t = .035
    for z in (.07, .23, .39):  # drei Latten pro Seite mit Spalt
        for sx in (-1, 1):
            parts.append(add(cube((t, CD + t, .065), loc=(sx * (CW + t), 0, z)), wood))
        for sy in (-1, 1):
            parts.append(add(cube((CW + 2 * t, t, .065), loc=(0, sy * (CD + t), z)), wood))
    parts.append(add(cube((.22, .004, .05), loc=(0, -(CD + t * 2.05), .23)), m("stempel", "#7a3a22", .8)))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(add(cube((.05, .05, CH / 2 + .02), loc=(sx * (CW + t * 2.2), sy * (CD + t * 2.2), CH / 2)), dark))
    parts.append(add(cube((CW + .02, CD + .02, .02), loc=(0, 0, .0)), dark))
    for o in parts:
        md = o.modifiers.new("bv", "BEVEL"); md.width = .008; md.segments = 2
    return parts


# Vergrößerung pro Zutat, damit auch Kleines in der Kiste gut zu erkennen ist
SC = {"acciughe": 2.0, "capperi": 2.6, "olive": 2.0, "origano": 1.8, "gamberi": 2.4, "olio": 1.7, "salame": 1.5,
      "salsiccia": 1.7, "zucchine": 1.35, "melanzane": 1.3, "funghi": 1.3, "cozze": 1.5, "ricotta": 1.3, "aglio": 1.15,
      "carciofi": 1.2, "prezzemolo": 1.3, "rucola": 1.1, "friarielli": 1.1, "basilico": 1.1, "tonno": 1.1}


def fill(key):
    random.seed(hash(key) % 1000)
    k_sc = SC.get(key, 1.0)
    gen, mode = PROTO[key]
    protos = []
    if key == "peperoni":
        for c in ("#d8281a", "#f2b52a", "#2f8a2a"):
            protos.append(p_peperoni(c))
    elif key in VARIANTEN:
        for i, f in enumerate(VARIANTEN[key]):
            random.seed(hash(key) % 1000 + i)
            protos.append(f())
    else:
        for i in range(2 if mode in ("pile",) else 1):
            random.seed(hash(key) % 1000 + i)
            protos.append(gen())
    size = protos[0][1] * k_sc
    for o, _ in protos:
        o.location = (0, 0, -50)  # Vorlage aus dem Bild
    # Unterlage aus Stroh/Papier, damit nichts durchscheint
    bed = add(deform(cube((CW * .98, CD * .98, .05), loc=(0, 0, CH - .14)), .03, 99), m("papier", "#d9c7a0", .9, bump=.3))
    placed = []

    def put(loc, rot, sc=1.0, pi=None):
        src = protos[pi if pi is not None else random.randrange(len(protos))][0]
        o = src.copy(); bpy.context.collection.objects.link(o)
        sc *= k_sc
        o.location = loc; o.rotation_euler = rot; o.scale = (sc, sc, sc); placed.append(o)

    top = CH - .08
    if mode in ("pile", "bunch"):
        d = size * .92
        nx, ny = max(1, int(2 * CW / d)), max(1, int(2 * CD / d))
        for layer in range(3):
            off = d / 2 * layer
            for i in range(nx):
                for j in range(ny):
                    x = -CW + d / 2 + i * (2 * CW - d) / max(1, nx - 1) + random.uniform(-.2, .2) * d + off * .5
                    y = -CD + d / 2 + j * (2 * CD - d) / max(1, ny - 1) + random.uniform(-.2, .2) * d
                    if abs(x) > CW - d * .35 or abs(y) > CD - d * .35:
                        continue
                    mound = .16 * (1 - (x / CW) ** 2) * (1 - (y / CD) ** 2)
                    if layer == 2 and mound < .08:
                        continue
                    z = top - d * .3 + layer * d * .5 + mound + d * .25
                    rot = (random.uniform(-.5, .5), random.uniform(-.5, .5), random.uniform(0, math.tau)) if mode == "pile" else (0, 0, random.uniform(-.4, .4) + math.pi / 2)
                    if key == "funghi" and random.random() < .3:  # ein paar liegen umgekippt und zeigen die Lamellen
                        rot = (random.uniform(1.9, 2.6), random.uniform(-.4, .4), random.uniform(0, math.tau))
                    put((x, y, z), rot, random.uniform(.92, 1.08))
    elif mode == "logs":
        d = size * 1.0
        n = max(1, int(2 * CD / d))
        for layer in range(2):
            for j in range(n):
                y = -CD + d / 2 + j * (2 * CD - d) / max(1, n - 1) + (d / 2 if layer else 0)
                if abs(y) > CD - d * .4:
                    continue
                L = .5 if key in ("salame",) else .45
                for x in ([-.36, .36] if key != "acciughe" else [-.5, -.12, .26, .55]):
                    put((x + random.uniform(-.05, .05), y, top - .05 + d * .4 + layer * d * .7 + .03 * (1 - (y / CD) ** 2)),
                        (random.uniform(-.1, .1), 0, random.uniform(-.15, .15) + (math.pi if random.random() < .5 else 0)))
        if key == "salame":  # ein paar Scheiben obendrauf
            sch = p_salame_scheibe()[0]; sch.location = (0, 0, -50)
            for x, y in ((-.2, -.12), (-.05, -.18), (.1, -.1), (.22, -.2), (.02, .02)):
                o = sch.copy(); bpy.context.collection.objects.link(o)
                o.location = (x, y, top + size * 1.25); o.rotation_euler = (random.uniform(-.25, .25), random.uniform(-.25, .25), 0)
                o.scale = (k_sc,) * 3; placed.append(o)
    elif mode == "upright":
        d = size * 1.05
        nx, ny = int(2 * CW / d), int(2 * CD / d)
        for i in range(nx):
            for j in range(ny):
                x = -CW + d / 2 + i * d + (2 * CW - nx * d) / 2
                y = -CD + d / 2 + j * d + (2 * CD - ny * d) / 2
                put((x, y, top - .02), (0, 0, random.uniform(0, math.tau)))
    elif mode == "stack":
        d = size * 1.02
        nx, ny = int(2 * CW / d), int(2 * CD / d)
        for layer in range(3):
            for i in range(nx):
                for j in range(ny):
                    if layer == 2 and (i + j) % 2:
                        continue
                    x = -CW + d / 2 + i * d + (2 * CW - nx * d) / 2
                    y = -CD + d / 2 + j * d + (2 * CD - ny * d) / 2
                    put((x, y, top - .05 + layer * .092), (0, 0, random.uniform(0, math.tau)))
    elif mode == "wedges":
        spots = [(-.45, -.22, .2), (.42, -.24, -.3), (-.42, .26, 2.6), (.4, .28, 3.4), (0, -.05, 1.2), (-.1, .3, 4.4), (.12, -.3, 5.4)]
        for k, (x, y, a) in enumerate(spots):
            put((x, y, top + (.14 if k >= 4 else .02)), (random.uniform(-.15, .15), random.uniform(-.15, .15), a), 1.9)
    elif mode == "few":
        put((-.05, -.24, top + .14), (0, 0, .15), 1.25)
        put((.05, .26, top + .16), (0, .05, math.pi + .1), 1.25)
    return placed


# ---------- Szene ----------
def scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = RES
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Punchy"
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = lin("#cfe0f0"); w.node_tree.nodes["Background"].inputs[1].default_value = .7
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 5)); s = bpy.context.object
    s.rotation_euler = (math.radians(40), math.radians(12), math.radians(-35)); s.data.energy = 3.2; s.data.angle = math.radians(8)
    bpy.ops.object.light_add(type="AREA", location=(-2.5, -3, 2.5)); a = bpy.context.object
    a.data.energy = 250; a.data.size = 3; a.rotation_euler = Euler((math.radians(55), 0, math.radians(-40)))
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0)); p = bpy.context.object; p.is_shadow_catcher = True
    bpy.ops.object.camera_add(location=(1.25, -2.05, 2.25)); cam = bpy.context.object; sc.camera = cam
    cam.data.lens = 46
    tc = bpy.data.objects.new("ziel", None); bpy.context.collection.objects.link(tc); tc.location = (0, 0, .3)
    con = cam.constraints.new("TRACK_TO"); con.target = tc; con.track_axis = "TRACK_NEGATIVE_Z"; con.up_axis = "UP_Y"
    return sc


keys = ONLY or list(PROTO)
for k in keys:
    sc = scene(); M.clear()
    crate(); fill(k)
    sc.render.filepath = os.path.join(OUT, k + ".png")
    bpy.ops.render.render(write_still=True)
    print("fertig", k, flush=True)
