# Python-Nachbau von face() aus www/js/grafik.js plus Körper
import sys
CHARS={
 "Giulia":dict(f=1,skin="#f5d6be",hair="#d9b25a",style="pony",shirt="#2f8f86",lips="#d9667a",ear=1),
 "Marco":dict(skin="#d39b6e",hair="#1d1d1d",style="short",shirt="#c0503f",beard=1),
 "Signor Bianchi":dict(skin="#e8b896",hair="#a8a8a8",style="short",shirt="#3a6ea5",mus=1),
}
def face(c,mood=2):
    hc=c['hair'];st=c.get('style');h=""
    if st in("long","bangs"):h+=f'<path d="M21 50 Q21 20 50 20 Q79 20 79 50 L82 92 Q50 98 18 92 Z" fill="{hc}"/>'
    if st=="bob":h+=f'<path d="M22 50 Q22 21 50 21 Q78 21 78 50 L79 72 Q50 78 21 72 Z" fill="{hc}"/>'
    if st=="pony":h+=f'<path d="M70 34 Q92 42 84 74 Q80 60 72 50 Z" fill="{hc}"/>'
    h+=f'<circle cx="50" cy="52" r="26" fill="{c["skin"]}"/>'
    if c.get('ear'):h+='<circle cx="25" cy="60" r="2.6" fill="#f4c64f"/><circle cx="75" cy="60" r="2.6" fill="#f4c64f"/>'
    if st in("long","pony","bob"):h+=f'<path d="M24 50 Q24 24 50 24 Q76 24 76 50 Q70 34 54 32 Q40 38 24 50Z" fill="{hc}"/>'
    if st=="short":h+=f'<path d="M25 46 Q27 25 50 25 Q73 25 75 46 Q68 34 50 34 Q32 34 25 46Z" fill="{hc}"/>'
    h+='<circle cx="41" cy="51" r="3" fill="#1d1d1d"/><circle cx="59" cy="51" r="3" fill="#1d1d1d"/>'
    if c.get('f'):h+='<path d="M37 47 L39 48.5 M63 47 L61 48.5" stroke="#1d1d1d" stroke-width="1.4"/>'
    h+='<circle cx="34" cy="61" r="4.5" fill="#e88" opacity=".35"/><circle cx="66" cy="61" r="4.5" fill="#e88" opacity=".35"/>'
    if c.get('beard'):h+=f'<path d="M28 58 Q30 80 50 80 Q70 80 72 58 Q66 72 50 72 Q34 72 28 58Z" fill="{hc}" opacity=".85"/>'
    if c.get('mus'):h+=f'<path d="M41 61 Q50 57 59 61 Q50 64 41 61Z" fill="{hc}"/>'
    lips=c.get('lips');h+=f'<path d="M41 65 Q50 73 59 65" stroke="{lips or "#5a2a20"}" stroke-width="{3.6 if lips else 3}" fill="none" stroke-linecap="round"/>'
    return h
def body(name,s):
    c=CHARS[name];shirt=c['shirt'];skin=c['skin'];pants="#3b4a6b" if c.get('f') else "#4a3b2e";shoe="#2a1e17"
    def leg(dx):return f'<path d="M{50+dx*5} 148 L{50+dx*15} 203" stroke="{pants}" stroke-width="15" stroke-linecap="round"/><ellipse cx="{50+dx*15+(4 if dx>=0 else -4)+4}" cy="208" rx="10" ry="5.5" fill="{shoe}"/>'
    def arm(x,d):return f'<path d="M{x} 90 Q{x+d*5} 120 {x+d*10} 140" stroke="{shirt}" stroke-width="11" stroke-linecap="round" fill="none"/><circle cx="{x+d*10}" cy="143" r="5.5" fill="{skin}"/>'
    def arm(x,d,sw):return f'<path d="M{x} 86 Q{x+d*9} 112 {x+d*13+sw*6} 136" stroke="{shirt}" stroke-width="11" stroke-linecap="round" fill="none"/><circle cx="{x+d*13+sw*6}" cy="139" r="5.5" fill="{skin}"/>'
    b=leg(-s)+leg(s)
    if c.get('f'):b+=f'<path d="M33 76 Q50 70 67 76 L76 150 Q50 158 24 150 Z" fill="{shirt}"/>'
    else:b+=f'<rect x="29" y="74" width="42" height="64" rx="16" fill="{shirt}"/><rect x="30" y="132" width="40" height="22" rx="8" fill="{pants}"/>'
    b+=arm(32,-1,-s)+arm(68,1,s)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 18 100 198" width="500" height="990">{b}{face(c)}</svg>'
out=sys.argv[1]
for n,p in [("Marco",.7),("Giulia",-.7),("Signor Bianchi",.5)]:
    open(f'{out}/{n.replace(" ","_")}.svg','w').write(body(n,p))
