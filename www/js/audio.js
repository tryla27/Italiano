/* Vorlese-Stimme, Hintergrundmusik und Geräusche. */
/* ---------- Speech ---------- */
// In der Android-App spricht die native Stimme (Capacitor-Plugin), im Browser die Web-Stimme.
const NativeTTS=(()=>{try{const C=window.Capacitor;return C&&C.isNativePlatform&&C.isNativePlatform()?(C.Plugins&&C.Plugins.TextToSpeech)||null:null;}catch(e){return null;}})();
// Wirksame Lautstärke: 0, wenn in den Einstellungen „Alles stumm“ an ist.
const vol=k=>S.muted?0:S.vol[k];
const canSpeak=!!NativeTTS||"speechSynthesis" in window; // Gerätestimme (Ersatz, wenn eine Aufnahme fehlt)
// Männer und Frauen klingen verschieden: eigene italienische Männer-/Frauenstimme, wenn das Gerät eine hat,
// sonst dieselbe Stimme etwas tiefer bzw. höher. Ohne Sprecher (Vokabeln, Notizbuch) spricht die Standardstimme.
const MALE_VOICE=/\b(male|uomo|luca|cosimo|diego|giorgio|paolo|roberto|benigno|calogero|giuseppe|marco)\b|it-it-x-it[cd]/i;
const FEMALE_VOICE=/\b(female|donna|alice|federica|elsa|isabella|paola|bianca|carla|chiara|silvia|emma)\b|it-it-x-it[ab]/i;
const voiceSex=v=>{const n=(v.name||"")+" "+(v.voiceURI||"");return /female/i.test(n)?"f":MALE_VOICE.test(n)?"m":FEMALE_VOICE.test(n)?"f":null;};
const sexOf=who=>!who?null:who==="Signor Esposito"?"m":CHARS[who]?(CHARS[who].f?"f":"m"):null;
function pickVoice(list,sex){
  const it=list.map((v,i)=>({v,i})).filter(x=>/^it/i.test(x.v.lang||""));
  const own=sex&&it.find(x=>voiceSex(x.v)===sex);
  return {voice:own||it[0]||null,pitch:own||!sex?1:sex==="m"?.92:1.06};
}
let nativeVoices=null;
if(NativeTTS&&NativeTTS.getSupportedVoices)NativeTTS.getSupportedVoices().then(r=>{nativeVoices=(r&&r.voices)||[];}).catch(()=>{nativeVoices=[];});
/* Aufgenommene Stimmen (tools/stimmen, Kokoro): Frauen sprechen mit Sara, Männer mit Nicola.
   Jede Figur klingt etwas anders (VOICE_RATE: kleiner = langsamer und tiefer, größer = schneller und heller).
   Ohne Sprecher (Vokabeln, Bücher, eigene Antworten, Anrufer) spricht Sara.
   Sätze mit Zahlen oder Pizzen werden aus aufgenommenen Bausteinen zusammengesetzt.
   Gibt es keine Aufnahme (neuer Satz, ohne Internet), spricht wie früher die Stimme des Geräts. */
const VOICE_RATE={"Nonna Pina":.92,"Zio Gennaro":.93,"Signor Bianchi":.95,"Signor Marino":.95,"Signor Esposito":.96,"Dottor Ferri":.97,
  "Signor Moretti":.97,"Dottoressa Severini":.97,"Professoressa Conte":.98,"Signora Rossi":1,"Marco":1,"Signora Lucia":1.01,
  "Turista Klaus":1.02,"Chiara":1.03,"Matteo":1.04,"Giulia":1.05,"Sofia":1.06};
const REC=(()=>{const o={};try{for(const v in STIMMEN)o[v]=new Set(STIMMEN[v].split(" "));}catch(e){}return o;})();
const recNorm=t=>String(t).trim().replace(/\s+/g," ");
// Dieselbe Kennung wie tools/stimmen/aufnehmen.py: FNV-1a über die Zeichen, Base36
function recKey(t){let h=0x811c9dc5;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(36);}
// Ganzer Satz aufgenommen? Sonst in möglichst wenige Bausteine zerlegen (an Leerzeichen), sonst null.
function recParts(v,t){
  const all=REC[v], bs=REC[v+"b"]; if(!all)return null;
  t=recNorm(t); const k=recKey(t); if(all.has(k))return [k];
  if(!bs)return null;
  const w=t.split(" "), n=w.length, best=[[]];
  for(let i=0;i<n;i++){if(!best[i])continue;
    for(let j=i+1;j<=n;j++){const kk=recKey(w.slice(i,j).join(" "));if(bs.has(kk)&&(!best[j]||best[j].length>best[i].length+1))best[j]=best[i].concat(kk);}}
  return best[n]||null;
}
const recBuf=new Map(); // zuletzt gehörte Aufnahmen, fertig dekodiert
function recLoad(url){
  if(recBuf.has(url)){const p=recBuf.get(url);recBuf.delete(url);recBuf.set(url,p);return p;}
  const p=fetch(url).then(r=>{if(!r.ok)throw new Error(url);return r.arrayBuffer();})
    .then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no)));
  p.catch(()=>recBuf.delete(url));
  recBuf.set(url,p); while(recBuf.size>40)recBuf.delete(recBuf.keys().next().value);
  return p;
}
let recNow=null;
function stopVoice(){
  if(recNow){const r=recNow;recNow=null;r.src.forEach(s=>{try{s.stop();}catch(e){}});duck(false);}
  try{if(NativeTTS)NativeTTS.stop().catch(()=>{});else speechSynthesis.cancel();}catch(e){}
}
// Spielt die Bausteine nahtlos hintereinander; false, wenn eine Aufnahme fehlt
async function recPlay(v,parts,rate,tok){
  try{
    const bufs=await Promise.all(parts.map(k=>recLoad(`stimmen/${v}/${k}.mp3`)));
    if(recNow!==tok)return true;
    if(AC.state==="suspended")AC.resume();
    const g=AC.createGain(); g.gain.value=vol("voice"); g.connect(AC.destination);
    let t=AC.currentTime+.03;
    bufs.forEach(b=>{const s=AC.createBufferSource();s.buffer=b;s.playbackRate.value=rate;s.connect(g);s.start(t);tok.src.push(s);t+=b.duration/rate+.05;});
    tok.src[tok.src.length-1].onended=()=>{if(recNow===tok){recNow=null;duck(false);}};
    duck(true); return true;
  }catch(e){return false;}
}
function speak(t,who){
  if(vol("voice")<=0)return;
  const sex=sexOf(who), v=sex||"f", parts=initAudio()?recParts(v,t):null;
  stopVoice();
  if(parts){
    const tok={src:[]}; recNow=tok;
    recPlay(v,parts,VOICE_RATE[who]||1,tok).then(ok=>{if(!ok&&recNow===tok){recNow=null;deviceSpeak(t,who);}});
    return;
  }
  deviceSpeak(t,who);
}
function deviceSpeak(t,who){
  if(!canSpeak||vol("voice")<=0)return;
  const sex=sexOf(who);
  if(NativeTTS){
    const p=pickVoice(nativeVoices||[],sex), opt={text:t,lang:"it-IT",rate:.9,pitch:p.pitch,volume:vol("voice"),category:"playback"};
    if(p.voice&&sex)opt.voice=p.voice.i;
    duck(true);
    NativeTTS.stop().catch(()=>{}).then(()=>NativeTTS.speak(opt))
      .then(()=>duck(false)).catch(()=>duck(false));
    return;
  }
  try{const u=new SpeechSynthesisUtterance(t);u.lang="it-IT";u.volume=vol("voice");
    const p=pickVoice(speechSynthesis.getVoices(),sex);if(p.voice)u.voice=p.voice.v;u.pitch=p.pitch;u.rate=.88;
    u.onstart=()=>duck(true);u.onend=u.onerror=()=>duck(false);
    speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}
}
if(canSpeak){try{speechSynthesis.getVoices();}catch(e){}}

/* ---------- Music (3 Pixabay tracks, each played twice) & sound effects ---------- */
let AC=null, musicGain=null, sfxGain=null, musicOn=false, ducked=false;
const mtof=m=>440*Math.pow(2,(m-69)/12);
const TRACKS=["music/italian-tarantella.mp3","music/italian-sweetness.mp3","music/tarantella-napoletana.mp3"];
const PLAYS_PER_TRACK=2;
const song=new Audio(); song.preload="auto"; song.src=TRACKS[0];
let trackI=0, playsLeft=PLAYS_PER_TRACK;
song.addEventListener("ended",()=>{
  playsLeft--;
  if(playsLeft<=0){trackI=(trackI+1)%TRACKS.length;playsLeft=PLAYS_PER_TRACK;song.src=TRACKS[trackI];}
  else song.currentTime=0;
  song.play().catch(()=>{});
});
function initAudio(){
  if(AC)return true;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    musicGain=AC.createGain();sfxGain=AC.createGain();
    musicGain.connect(AC.destination);sfxGain.connect(AC.destination);
    try{AC.createMediaElementSource(song).connect(musicGain);}catch(e){}
    applyVolume(); return true;
  }catch(e){AC=null;return false;}
}
function applyVolume(){
  if(!AC)return;
  musicGain.gain.setTargetAtTime(vol("music")*.8*(ducked?.35:1),AC.currentTime,.08);
  if(vol("music")<=0&&musicOn){song.pause();musicOn=false;}
  sfxGain.gain.setTargetAtTime(vol("sfx")*.8,AC.currentTime,.02);
}
function duck(on){ducked=on;applyVolume();}
function pluck(t,f,dur,vol,out){
  const o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),lp=AC.createBiquadFilter();
  o.type="sawtooth";o2.type="triangle";o.frequency.value=f;o2.frequency.value=f*1.003;
  lp.type="lowpass";lp.frequency.value=2600;lp.Q.value=1;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(lp);o2.connect(lp);lp.connect(g);g.connect(out);
  o.start(t);o2.start(t);o.stop(t+dur+.02);o2.stop(t+dur+.02);
}
function tone(t,f,dur,vol,type,out,f2){
  const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.02);
}
// Rauschen mit Bandpass, der von f0 nach f1 gleitet (Zischen, Glitzern)
function noise(t,dur,vol,f0,f1){
  const n=Math.ceil(AC.sampleRate*dur), b=AC.createBuffer(1,n,AC.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain();
  s.buffer=b; f.type="bandpass"; f.Q.value=1.2; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+dur*.3); g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t+dur+.02);
}
function startMusic(){
  if(!initAudio()||musicOn)return;
  if(AC.state==="suspended")AC.resume();
  musicOn=true;
  song.play().catch(()=>{musicOn=false;});
}
function sfx(kind){
  if(!AC||vol("sfx")<=0)return;
  if(AC.state==="suspended")AC.resume();
  const t=AC.currentTime+.005;
  if(kind==="click")tone(t,1400,.05,.25,"triangle",sfxGain,900);
  if(kind==="select")tone(t,700,.07,.3,"square",sfxGain,1050);
  if(kind==="right"){[72,76,79,84].forEach((n,i)=>pluck(t+i*.07,mtof(n),.35,.32,sfxGain));tone(t+.28,mtof(96),.4,.08,"sine",sfxGain);}
  if(kind==="wrong"){tone(t,180,.32,.35,"sawtooth",sfxGain,110);tone(t+.02,190,.3,.25,"square",sfxGain,120);}
  if(kind==="kasse"){tone(t,mtof(96),.5,.18,"triangle",sfxGain);tone(t+.06,mtof(103),.6,.14,"triangle",sfxGain);[88,93].forEach((n,i)=>tone(t+.12+i*.08,mtof(n),.22,.12,"sine",sfxGain));}
  // Ladentür: Knarren, Türglöckchen, Zufallen
  if(kind==="door"){tone(t,140,.35,.12,"sawtooth",sfxGain,220);[100,105,100].forEach((n,i)=>tone(t+.18+i*.07,mtof(n),.5,.12,"triangle",sfxGain));tone(t+.5,90,.12,.35,"sine",sfxGain,50);}
  // Truhe: Holz knarzt, Luft zischt nach oben, warmer Akkord mit Glitzern
  if(kind==="chestopen"){tone(t,90,.18,.4,"sine",sfxGain,60);tone(t+.25,110,.15,.35,"sine",sfxGain,70);tone(t+.45,160,.35,.1,"sawtooth",sfxGain,260);
    noise(t+.55,.7,.25,500,4000);tone(t+.62,55,.6,.45,"sine",sfxGain,40);
    [60,64,67,72,76,79,84].forEach((n,i)=>pluck(t+.65+i*.06,mtof(n),.9,.22,sfxGain));tone(t+.7,mtof(72),1.4,.07,"sine",sfxGain);tone(t+.7,mtof(79),1.4,.05,"sine",sfxGain);
    [96,100,103,108].forEach((n,i)=>tone(t+1.05+i*.09,mtof(n),.35,.05,"sine",sfxGain));}
  if(kind==="reveal"){noise(t,.25,.12,1500,6000);[79,84,88].forEach((n,i)=>pluck(t+.05+i*.07,mtof(n),.5,.25,sfxGain));}
  if(kind==="rare"){noise(t,.5,.18,800,7000);[67,72,76,79,84,88,91,96].forEach((n,i)=>pluck(t+i*.065,mtof(n),.8,.24,sfxGain));
    [72,76,79,84].forEach(n=>tone(t+.55,mtof(n),1.6,.06,"triangle",sfxGain));[100,103,108].forEach((n,i)=>tone(t+.7+i*.12,mtof(n),.4,.05,"sine",sfxGain));}
  if(kind==="coins"){[88,93].forEach((n,i)=>tone(t+i*.09,mtof(n),.25,.2,"sine",sfxGain));}
}
document.addEventListener("pointerdown",()=>{
  const was=musicOn; initAudio();
  if(vol("music")>0)startMusic(); else if(AC&&AC.state==="suspended")AC.resume();
  if(!was&&musicOn&&screen==="home")setTimeout(()=>{if(screen==="home"&&!volOpen)render();},300);
},{capture:true});
document.addEventListener("visibilitychange",()=>{
  if(!AC)return;
  if(document.hidden){song.pause();AC.suspend();}
  else{AC.resume();if(musicOn)song.play().catch(()=>{});}
});
