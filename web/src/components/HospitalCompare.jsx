import {STEPS} from "../engine/routing.js";
export default function HospitalCompare({cmp,cond,target,setTarget}){
  const mx=Math.max(...cmp.list.map(h=>h.total)),t=cmp.list.find(h=>h.id===target),hay=cmp.list[0];
  const F=v=>Math.round(v);
  return <><section className="card tw"><h2>مقارنة الوجهات <small>مريض {cmp.p.patient_id} · فرز {cmp.p.triage_level} · يحتاج {[cmp.need.ct&&"CT",cmp.need.icu&&"ICU"].filter(Boolean).join(" + ")||"طوارئ فقط"}</small></h2>
    <table><thead><tr><th></th><th>المستشفى</th><th>المسافة</th><th>المسار</th><th>الوصول</th><th>التسليم</th><th>الانتظار</th><th>قدرة</th><th>الإجمالي حتى بدء الرعاية</th></tr></thead><tbody>
    {cmp.list.map(h=><tr key={h.id} className={(h.id===target?"on ":"")+(h.id===cmp.best.id?"best":"")} onClick={()=>setTarget(h.id)} style={{cursor:"pointer"}}>
      <td><input type="radio" readOnly checked={h.id===target}/></td><td><b>{h.id===cmp.best.id?"★ ":""}{h.name}</b></td><td>{h.km.toFixed(1)} كم</td><td>{h.rt}</td><td>{F(h.eta)} د</td><td>{cond.handover} د</td><td>{h.wait} د</td>
      <td className={h.pen?"u":"d"}>{h.pen?"+"+h.pen+" د":"✓"}</td><td><b>{F(h.total)} د</b><div className="mb" style={{width:h.total/mx*130}}/></td></tr>)}</tbody></table>
    <div className="sub">★ = الأقل زمنًا إجماليًا. {t&&t.id!=="HAYAH"?`الفرق مقابل البقاء في حياة: ${F(t.total-hay.total)>0?"+":""}${F(t.total-hay.total)} د.`:""}</div></section>
  {t&&<section className="card"><h2>تفكيك زمن الوصول إلى: {t.name}</h2>
    {t.steps.map((s,i)=><div className="fb" key={i}><span>{STEPS[i]}</span><div className="fbar"><i className={i&&s<-.05?"neg":""} style={{width:Math.min(100,Math.abs(s)/Math.max(...t.steps.map(Math.abs))*100)+"%"}}/></div><b>{i?(s>=0?"+":"")+s.toFixed(1):s.toFixed(1)} د</b></div>)}
    <div className="fb"><span><b>الوصول المتوقع</b></span><div/><b>{t.eta.toFixed(1)} د</b></div></section>}</>;}
