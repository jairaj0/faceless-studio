// ReactBits-style animated backgrounds — self-contained React components
// (React-only, no external imports) so they run in the Code-layer runtime
// and export. Each `code` is added as a full-frame code layer.

export interface BgPreset {
  id: string;
  name: string;
  swatch: string; // CSS background for the gallery thumbnail
  code: string;
}

const aurora = `export default function Aurora(){
  return (
    <div style={{width:'100%',height:'100%',background:'#05060a',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:'-25%',filter:'blur(70px)',
        background:'radial-gradient(circle at 30% 30%,#6d5efc,transparent 45%),radial-gradient(circle at 70% 55%,#19c3a6,transparent 45%),radial-gradient(circle at 50% 85%,#ff5d8f,transparent 45%)',
        animation:'au 14s ease-in-out infinite'}}/>
      <style>{'@keyframes au{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.25) translate(5%,-4%)}}'}</style>
    </div>
  );
}`;

const gradientMesh = `export default function Mesh(){
  return (
    <div style={{width:'100%',height:'100%',
      background:'linear-gradient(120deg,#1e1b4b,#312e81,#0f766e,#831843)',
      backgroundSize:'300% 300%',animation:'gm 12s ease infinite'}}>
      <style>{'@keyframes gm{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}'}</style>
    </div>
  );
}`;

const beams = `export default function Beams(){
  return (
    <div style={{width:'100%',height:'100%',background:'#070710',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,
        background:'conic-gradient(from 0deg at 50% 50%,#6d5efc22,transparent 20%,#19c3a622 40%,transparent 60%,#ff5d8f22 80%,transparent)',
        animation:'bm 18s linear infinite'}}/>
      <style>{'@keyframes bm{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}`;

const grid = `export default function Grid(){
  return (
    <div style={{width:'100%',height:'100%',background:'#0a0e17',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,
        backgroundImage:'linear-gradient(#1e2a44 1px,transparent 1px),linear-gradient(90deg,#1e2a44 1px,transparent 1px)',
        backgroundSize:'48px 48px',animation:'gr 6s linear infinite'}}/>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 50%,transparent 30%,#0a0e17 80%)'}}/>
      <style>{'@keyframes gr{to{background-position:48px 48px}}'}</style>
    </div>
  );
}`;

const particles = `export default function Particles(){
  const ref = React.useRef(null);
  React.useEffect(()=>{
    const c=ref.current; const x=c.getContext('2d');
    const dpr=window.devicePixelRatio||1; let raf;
    const W=c.offsetWidth, H=c.offsetHeight; c.width=W*dpr; c.height=H*dpr; x.scale(dpr,dpr);
    const ps=Array.from({length:90},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,r:Math.random()*2+1}));
    const loop=()=>{ x.clearRect(0,0,W,H);
      ps.forEach((p,i)=>{ p.x=(p.x+p.vx+W)%W; p.y=(p.y+p.vy+H)%H;
        x.fillStyle='#8b7bff'; x.beginPath(); x.arc(p.x,p.y,p.r,0,7); x.fill();
        for(let j=i+1;j<ps.length;j++){ const q=ps[j]; const d=Math.hypot(p.x-q.x,p.y-q.y);
          if(d<120){ x.strokeStyle='rgba(139,123,255,'+(1-d/120)*0.25+')'; x.beginPath(); x.moveTo(p.x,p.y); x.lineTo(q.x,q.y); x.stroke(); } }
      });
      raf=requestAnimationFrame(loop); };
    loop(); return ()=>cancelAnimationFrame(raf);
  },[]);
  return <div style={{width:'100%',height:'100%',background:'#0b0f1a'}}><canvas ref={ref} style={{width:'100%',height:'100%',display:'block'}}/></div>;
}`;

const starfield = `export default function Starfield(){
  const ref=React.useRef(null);
  React.useEffect(()=>{
    const c=ref.current; const x=c.getContext('2d'); const dpr=window.devicePixelRatio||1; let raf;
    const W=c.offsetWidth,H=c.offsetHeight; c.width=W*dpr; c.height=H*dpr; x.scale(dpr,dpr);
    const st=Array.from({length:160},()=>({x:Math.random()*W,y:Math.random()*H,z:Math.random()*2+0.3}));
    const loop=()=>{ x.fillStyle='#05060a'; x.fillRect(0,0,W,H); x.fillStyle='#fff';
      st.forEach(s=>{ s.y+=s.z; if(s.y>H){s.y=0;s.x=Math.random()*W;} x.globalAlpha=s.z/2.3; x.fillRect(s.x,s.y,s.z,s.z); });
      x.globalAlpha=1; raf=requestAnimationFrame(loop); };
    loop(); return ()=>cancelAnimationFrame(raf);
  },[]);
  return <div style={{width:'100%',height:'100%'}}><canvas ref={ref} style={{width:'100%',height:'100%',display:'block'}}/></div>;
}`;

const floatingDots = `export default function Dots(){
  const dots=Array.from({length:36});
  return (
    <div style={{width:'100%',height:'100%',background:'#0b0f1a',position:'relative',overflow:'hidden'}}>
      {dots.map((_,i)=>(
        <div key={i} style={{position:'absolute',left:((i*53)%100)+'%',top:((i*37)%100)+'%',
          width:6,height:6,borderRadius:'50%',background:i%2?'#19c3a6':'#8b7bff',
          animation:'fd 4s ease-in-out '+((i%10)*0.2)+'s infinite alternate'}}/>
      ))}
      <style>{'@keyframes fd{from{transform:translateY(0);opacity:.3}to{transform:translateY(-50px);opacity:1}}'}</style>
    </div>
  );
}`;

const waves = `export default function Waves(){
  return (
    <div style={{width:'100%',height:'100%',background:'linear-gradient(#0b1224,#0a0e17)',position:'relative',overflow:'hidden'}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{position:'absolute',left:'-50%',right:'-50%',bottom:(-40+i*20)+'%',height:'60%',
          borderRadius:'45%',background:['#6d5efc','#19c3a6','#ff5d8f'][i],opacity:0.18,
          animation:'wv '+(10+i*3)+'s linear infinite'}}/>
      ))}
      <style>{'@keyframes wv{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}`;

export const BACKGROUNDS: BgPreset[] = [
  { id: "aurora", name: "Aurora", swatch: "radial-gradient(circle at 30% 30%,#6d5efc,transparent),radial-gradient(circle at 70% 70%,#19c3a6,transparent),#05060a", code: aurora },
  { id: "mesh", name: "Gradient Mesh", swatch: "linear-gradient(120deg,#312e81,#0f766e,#831843)", code: gradientMesh },
  { id: "beams", name: "Beams", swatch: "conic-gradient(from 0deg,#6d5efc,#070710,#19c3a6,#070710,#ff5d8f)", code: beams },
  { id: "grid", name: "Grid", swatch: "linear-gradient(#1e2a44 1px,transparent 1px),linear-gradient(90deg,#1e2a44 1px,transparent 1px) #0a0e17", code: grid },
  { id: "particles", name: "Particles", swatch: "radial-gradient(circle,#8b7bff 1px,transparent 1px) #0b0f1a", code: particles },
  { id: "starfield", name: "Starfield", swatch: "radial-gradient(circle,#fff 1px,transparent 1px) #05060a", code: starfield },
  { id: "dots", name: "Floating Dots", swatch: "radial-gradient(circle at 30% 40%,#8b7bff 3px,transparent 3px),radial-gradient(circle at 70% 60%,#19c3a6 3px,transparent 3px) #0b0f1a", code: floatingDots },
  { id: "waves", name: "Waves", swatch: "linear-gradient(#6d5efc,#19c3a6,#ff5d8f)", code: waves },
];
