import {INT,NM} from "../engine/model.js";
const f=v=>Math.round(v*100)+"%";
export default function SimPanel({D,TR,AP,toggle,approve,sB,sS}){
  const dv=sB.tot-sS.tot;
  return <section className="card"><h2>محاكاة التدخلات قبل الاعتماد <small>القرار النهائي للمستخدم المخوّل</small></h2>
  <div className="sim"><div>{INT.map(o=><label key={o.id} className={"opt "+(TR.has(o.id)?"on ":"")+(AP.has(o.id)?"done":"")}>
      <input type="checkbox" checked={TR.has(o.id)||AP.has(o.id)} onChange={()=>toggle(o.id)}/>
      <div><b>{o.t}{AP.has(o.id)?" ✓ معتمد":""}</b><span>{o.d}</span></div></label>)}
    <button className="approve" disabled={!TR.size} onClick={approve}>اعتماد القرار البشري وتنفيذ {TR.size||""} تدخل</button></div>
  <div><table><thead><tr><th>القسم</th><th>الذروة الحالية</th><th>الذروة بالتدخل</th><th>الأثر</th></tr></thead><tbody>
    {D.departments.map(d=>{const k=d.department_id,a=sB.o[k],b=sS.o[k],ch=b.peak-a.peak;
      return <tr key={k}><td>{NM[k]}</td><td>{f(a.peak)}</td><td>{f(b.peak)}</td><td className={ch<-.005?"d":ch>.005?"u":""}>{Math.abs(ch)<.005?"—":(ch<0?"▼ ":"▲ ")+Math.abs(Math.round(ch*100))+"%"}</td></tr>;})}</tbody></table>
    <div className="dstats" style={{marginTop:12}}><div><b>{sB.crit} ← {sS.crit}</b>أقسام تبلغ الحالة الحرجة خلال 90 د</div><div><b className={dv>0?"d":""}>{Math.round(sB.tot)} ← {Math.round(sS.tot)}</b>دقائق-مريض فوق السعة</div></div>
    <div className="sub">{TR.size?"هذه مقارنة محاكاة (نتيجة محاكاة)؛ لن يتغير شيء حتى تعتمد القرار.":"اختر تدخلًا أو أكثر لمقارنة أثره على رحلة المريض قبل تنفيذه."}</div></div></div></section>;}
