import {sc} from "../engine/model.js";
// التوأم المجمع للمستشفى: مؤشرات تُحسب من حالة الأقسام
export default function HospitalTwin({D,rows,clock,applied}){
  const r=rows[clock];let c=0,inc=0;for(const k in r){if(sc(r[k].load)==="Critical")c++;inc+=r[k].pr;}
  const nxt=D.ambulances.filter(a=>!a.diverted).map(a=>a.eta_minutes-clock).filter(x=>x>0).sort((a,b)=>a-b)[0];
  const K=[[c,"أقسام في الحالة الحرجة الآن",c>0],[inc,"مرضى متوقع وصولهم إلى الأقسام"],[nxt!==undefined?nxt+" د":"—","وصول أقرب إسعاف"],[applied,"قرارات معتمدة قيد التطبيق"]];
  return <section className="kpis" aria-live="polite">{K.map((x,i)=><div key={i} className={"kpi "+(x[2]?"bad":"")}><b>{x[0]}</b><span>{x[1]}</span></div>)}</section>;}
