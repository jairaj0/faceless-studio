import { createServer, type Server } from "http";
import { networkInterfaces } from "os";

let server: Server | null = null;
const PORT = 8787;

function lanIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const ni of nets[name] ?? []) {
      if (ni.family === "IPv4" && !ni.internal) return ni.address;
    }
  }
  return "localhost";
}

export function stopPreviewServer(): void {
  if (server) {
    server.close();
    server = null;
  }
}

export function startPreviewServer(scene: unknown): Promise<{ url: string }> {
  stopPreviewServer();
  const html = viewerHtml(scene);
  server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
  return new Promise((resolve) => {
    server!.listen(PORT, "0.0.0.0", () => resolve({ url: `http://${lanIP()}:${PORT}` }));
  });
}

/**
 * Self-contained viewer page: scene JSON + a compact vanilla renderer that
 * mirrors the in-app SceneRenderer (text/shape/image/svg/html-code) and plays
 * the timeline. No build dependency — works on any device on the LAN.
 */
function viewerHtml(scene: unknown): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Faceless Studio — Preview</title>
<style>
  html,body{margin:0;height:100%;background:#0a0a0a;overflow:hidden;font-family:-apple-system,system-ui,sans-serif}
  #wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
  #stageScale{transform-origin:center center}
  #stage{position:relative;overflow:hidden}
  #bar{position:fixed;left:0;right:0;bottom:0;height:36px;background:#181818;display:flex;align-items:center;gap:10px;padding:0 12px;color:#ddd;font-size:13px}
  #seek{flex:1;accent-color:#8b7bff}
  button{background:#2a2a2a;color:#fff;border:1px solid #3a3a3a;border-radius:5px;height:26px;cursor:pointer}
</style></head>
<body>
<div id="wrap"><div id="stageScale"><div id="stage"></div></div></div>
<div id="bar">
  <button id="play">►</button>
  <span id="tc" style="font-family:monospace;min-width:120px"></span>
  <input id="seek" type="range" min="0" step="1" value="0">
</div>
<script>
const SCENE = ${JSON.stringify(scene)};
const E = {
  linear:t=>t, easeIn:t=>t*t, easeOut:t=>1-(1-t)*(1-t),
  easeInOut:t=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2,
  easeOutCubic:t=>1-Math.pow(1-t,3),
  easeOutBack:t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);}
};
function ev(p,t,fb){
  if(p==null) return fb;
  if(typeof p==='number') return p;
  if(!p.length) return fb;
  if(t<=p[0].t) return p[0].v;
  const last=p[p.length-1]; if(t>=last.t) return last.v;
  for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];if(t>=a.t&&t<=b.t){const s=(b.t-a.t)||1;const lt=(t-a.t)/s;return a.v+(b.v-a.v)*(E[a.ease||'easeOut'](lt));}}
  return last.v;
}
function tStyle(el,tf,t){
  tf=tf||{};
  const x=ev(tf.x,t,0),y=ev(tf.y,t,0),sc=ev(tf.scale,t,1),sx=ev(tf.scaleX,t,1)*sc,sy=ev(tf.scaleY,t,1)*sc,r=ev(tf.rotation,t,0),o=ev(tf.opacity,t,1);
  el.style.position='absolute';el.style.left=x+'px';el.style.top=y+'px';el.style.opacity=o;
  el.style.transform='rotate('+r+'deg) scale('+sx+','+sy+')';
  el.style.transformOrigin=((tf.anchorX||0)*100)+'% '+((tf.anchorY||0)*100)+'%';
}
function build(layer){
  let el, update;
  if(layer.type==='text'){
    el=document.createElement('div');
    el.style.fontWeight=layer.fontWeight||400;el.style.color=layer.color||'#fff';
    el.style.fontSize=(layer.fontSize)+'px';el.style.lineHeight=layer.lineHeight||1;
    if(layer.width){el.style.width=layer.width+'px';el.style.whiteSpace='pre-wrap';}else{el.style.whiteSpace='pre';}
    el.style.textAlign=layer.align||'left';if(layer.letterSpacing)el.style.letterSpacing=layer.letterSpacing+'px';
    update=t=>{ if(layer.reveal!=null){el.textContent=layer.text.slice(0,Math.ceil(ev(layer.reveal,t,1)*layer.text.length));}else{el.textContent=layer.text;} };
  } else if(layer.type==='rect'){
    el=document.createElement('div');el.style.width=layer.width+'px';el.style.height=layer.height+'px';
    el.style.background=layer.fill||'#888';el.style.borderRadius=(layer.radius||0)+'px';update=()=>{};
  } else if(layer.type==='ellipse'){
    el=document.createElement('div');el.style.width=layer.width+'px';el.style.height=layer.height+'px';
    el.style.background=layer.fill||'#888';el.style.borderRadius='50%';if(layer.blur)el.style.filter='blur('+layer.blur+'px)';update=()=>{};
  } else if(layer.type==='image'){
    el=document.createElement('img');el.src=layer.src;el.style.width=layer.width+'px';el.style.height=layer.height+'px';
    el.style.objectFit=layer.fit||'cover';if(layer.radius)el.style.borderRadius=layer.radius+'px';update=()=>{};
  } else if(layer.type==='svg'){
    el=document.createElement('div');el.style.width=layer.width+'px';el.style.height=layer.height+'px';el.innerHTML=layer.svg;update=()=>{};
  } else if(layer.type==='code'){
    el=document.createElement('div');el.style.width=layer.width+'px';el.style.height=layer.height+'px';
    if(layer.lang==='html'){const f=document.createElement('iframe');f.style.width='100%';f.style.height='100%';f.style.border='none';f.setAttribute('sandbox','allow-scripts');f.srcdoc='<style>html,body{margin:0;height:100%;overflow:hidden}</style>'+layer.code;el.appendChild(f);}
    else {el.style.display='flex';el.style.alignItems='center';el.style.justifyContent='center';el.style.color='#888';el.textContent='[React layer — open in app]';}
    update=()=>{};
  } else { el=document.createElement('div'); update=()=>{}; }
  return {el, update:(t)=>{ update(t); tStyle(el,layer.transform,t); el.style.display=(t<(layer.start||0)||t>(layer.end==null?SCENE.duration:layer.end))?'none':''; }};
}
const stage=document.getElementById('stage');
stage.style.width=SCENE.width+'px';stage.style.height=SCENE.height+'px';stage.style.background=SCENE.background||'#000';
const built=SCENE.layers.map(l=>{const b=build(l);stage.appendChild(b.el);return b;});
function fit(){const s=Math.min((innerWidth)/SCENE.width,(innerHeight-36)/SCENE.height);document.getElementById('stageScale').style.transform='scale('+s+')';}
addEventListener('resize',fit);fit();
let t=0,playing=false,last=null;
const seek=document.getElementById('seek');seek.max=SCENE.duration;
const tc=document.getElementById('tc');const fps=SCENE.fps||30;
function fmt(ms){const f=Math.round(ms/(1000/fps))%fps;const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')+':'+String(f).padStart(2,'0');}
function apply(){built.forEach(b=>b.update(t));seek.value=t;tc.textContent=fmt(t)+' / '+fmt(SCENE.duration);}
apply();
const audio=SCENE.audio?Object.assign(new Audio(),{src:SCENE.audio.dataUrl}):null;
document.getElementById('play').onclick=()=>{playing=!playing;document.getElementById('play').textContent=playing?'❚❚':'►';if(playing&&t>=SCENE.duration)t=0;if(audio){if(playing){audio.currentTime=t/1000;audio.play();}else audio.pause();}last=null;if(playing)requestAnimationFrame(loop);};
seek.oninput=()=>{playing=false;document.getElementById('play').textContent='►';t=+seek.value;if(audio)audio.currentTime=t/1000;apply();};
function loop(ts){if(!playing)return;if(last!=null){t+=ts-last;if(t>=SCENE.duration){t=SCENE.duration;playing=false;document.getElementById('play').textContent='►';}}last=ts;apply();if(playing)requestAnimationFrame(loop);}
</script>
</body></html>`;
}
