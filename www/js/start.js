/* Start: Spielstand laden, mit Claude-Konto abgleichen, nach App-Updates suchen. */
/* ---------- Start: Spielstand laden, Cloud abgleichen, nach Updates suchen ---------- */
let UPDATE=null;
const APP_BUILD="__APP_BUILD__", APP_REPO="__APP_REPO__"; // werden beim App-Bau automatisch ersetzt
const isNativeApp=(()=>{try{return !!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());}catch(e){return false;}})();
(function boot(){
  let raw=null; try{raw=localStorage.getItem(KEY);}catch(e){}
  if(raw)applySave(raw);
  render();
  (async()=>{try{
    if(!window.claude||!window.claude.use)return;
    const [db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    const uid=user?await user.id():null; if(!db||!uid)return;
    dbRef=db.doc("data/users/"+uid+"/spielstand");
    const snap=await dbRef.get(), d=snap.exists?snap.data():null;
    if(d&&typeof d.state==="string"&&(d.savedAt||0)>savedAt){
      const raw2=JSON.stringify({savedAt:d.savedAt,state:d.state});
      if(applySave(raw2)){try{localStorage.setItem(KEY,raw2);}catch(e){}}
      cloudState="cloud"; render(); return;
    }
    if(savedAt)await cloudSave(); else cloudState="cloud";
    if(screen==="home")render();
  }catch(e){}})();
  (async()=>{
    if(!isNativeApp||APP_REPO.indexOf("__")===0)return;
    try{
      const r=await fetch("https://api.github.com/repos/"+APP_REPO+"/releases/latest",{cache:"no-store"}); if(!r.ok)return;
      const j=await r.json(), n=parseInt(String(j.tag_name||"").split(".").pop(),10), cur=parseInt(APP_BUILD,10);
      if(n>cur){const apk=(j.assets||[]).find(x=>/\.apk$/i.test(x.name));UPDATE={tag:j.tag_name,url:apk?apk.browser_download_url:j.html_url};if(screen==="home")render();}
    }catch(e){}
  })();
})();
