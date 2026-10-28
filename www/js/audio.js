/* Vorlese-Stimme, Hintergrundmusik und Geräusche. */
/* ---------- Speech ---------- */
// In der Android-App spricht die native Stimme (Capacitor-Plugin), im Browser die Web-Stimme.
const NativeTTS=(()=>{try{const C=window.Capacitor;return C&&C.isNativePlatform&&C.isNativePlatform()?(C.Plugins&&C.Plugins.TextToSpeech)||null:null;}catch(e){return null;}})();
// Wirksame Lautstärke: 0, wenn in den Einstellungen „Alles stumm“ an ist.
const vol=k=>S.muted?0:S.vol[k];
const canSpeak=!!NativeTTS||"speechSynthesis" in window;
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
function speak(t,who){
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
