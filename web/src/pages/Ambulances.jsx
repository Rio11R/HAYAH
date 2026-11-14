import {useState,useMemo} from "react";
import {useDash} from "../state/DashContext.jsx";
import {run,summ} from "../engine/model.js";
import {compare} from "../engine/routing.js";
import RouteScene3D from "../scene/RouteScene3D.jsx";import FactorPanel from "../components/FactorPanel.jsx";import HospitalCompare from "../components/HospitalCompare.jsx";
export default function Ambulances(){
  const {D,base,AP,DV,divIds,sB,divert,undivert}=useDash();
  const [aid,setAid]=useState("AMB-103"),[cond,setCond]=useState({td:"off",wx:"clear",corr:false,handover:5}),[tg,setTg]=useState(null);
  const amb=D.ambulances.find(a=>a.ambulance_id===aid),dv=DV[aid];
  const cmp=useMemo(()=>compare(D,base,amb,cond),[D,base,amb,cond]);
  const target=tg&&cmp.list.some(h=>h.id===tg)?tg:cmp.best.id,th=cmp.list.find(h=>h.id===target);
  const eff=useMemo(()=>summ(run(D,AP,new Set([...divIds,aid]))),[D,AP,divIds,aid]);
  return <><section className="card"><h2>الإسعاف والتحويل <small>اختر إسعافًا لمقارنة الوجهات قبل قرار التحويل</small></h2>
    <div className="pts">{D.ambulances.map(a=><button key={a.ambulance_id} aria-pressed={a.ambulance_id===aid} onClick={()=>{setAid(a.ambulance_id);setTg(null)}}>🚑 {a.ambulance_id} · {a.eta_minutes} د{DV[a.ambulance_id]?" · محوّل":""}</button>)}</div>
    <div className="dgrid"><RouteScene3D list={cmp.list} selected={target} onSelect={setTg} label={aid} height="460px"/><FactorPanel cond={cond} setCond={setCond}/></div></section>
  <div style={{marginTop:14}}><HospitalCompare cmp={cmp} cond={cond} target={target} setTarget={setTg}/></div>
  <section className="card" style={{marginTop:14}}><h2>قرار التحويل <small>القرار النهائي للمستخدم المخوّل</small></h2>
    {dv?<><p>تم اعتماد تحويل {aid} إلى <b>{dv.name}</b>؛ لم يعد مريضه ضمن هذه الشبكة.</p><button className="btn o" onClick={()=>undivert(aid)}>إلغاء التحويل</button></>:<>
    <div className="dstats"><div><b>{sB.crit} ← {eff.crit}</b>أقسام حرجة في حياة خلال 90 د لو حُوّل</div><div><b className={sB.tot-eff.tot>0?"d":""}>{Math.round(sB.tot)} ← {Math.round(eff.tot)}</b>دقائق-مريض فوق السعة في حياة</div></div>
    <button className="approve" disabled={target==="HAYAH"} onClick={()=>divert(aid,th)}>{target==="HAYAH"?"الوجهة الحالية هي حياة — لا تحويل":"اعتماد تحويل "+aid+" إلى "+th.name}</button>
    <div className="sub">مقارنة محاكاة فقط؛ لا يتغير شيء حتى تعتمد القرار. المنشآت المجاورة افتراضية.</div></>}</section></>;}
