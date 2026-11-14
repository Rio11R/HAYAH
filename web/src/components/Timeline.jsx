import {H,NM} from "../engine/model.js";
// الخط الزمني: شريط تمرير مع علامات وصول الإسعاف وأوقات التشبّع المتوقعة
export default function Timeline({D,clock,setClock,playing,setPlaying,onReset,sB}){
  const M=[];D.ambulances.filter(a=>!a.diverted).forEach(a=>M.push({t:a.eta_minutes,l:"🚑 "+a.ambulance_id,c:"#08d3e6"}));
  Object.entries(sB.o).forEach(([k,v])=>{if(v.sat!==null)M.push({t:v.sat,l:"⚠ "+NM[k],c:"#ff5d6c"});});
  M.sort((a,b)=>a.t-b.t);
  return <div className="tl"><div className="tlc">
    <button className="btn sm" onClick={()=>setPlaying(!playing)}>{playing?"إيقاف":"تشغيل"}</button>
    <button className="btn o sm" onClick={onReset}>إعادة</button>
    <div className="tlr"><input type="range" min="0" max={H} value={clock} onChange={e=>setClock(+e.target.value)} aria-label="الزمن بالدقائق"/>
      <div className="mk">{M.map((m,i)=><span key={i} style={{insetInlineStart:`calc(${m.t/H*100}% )`,top:(i%3)*15,color:m.c}} onClick={()=>setClock(m.t)}>▾ {m.l} +{m.t}</span>)}</div></div>
    <span className="clock">+{clock} د</span></div></div>;}
