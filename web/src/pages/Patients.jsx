import {useDash} from "../state/DashContext.jsx";
import {NM,curDept} from "../engine/model.js";
import PatientTwin from "../twins/PatientTwin.jsx";
const STL={En_route:"في الطريق",Waiting:"في الانتظار",In_service:"قيد الخدمة"};
export default function Patients(){
  const {D,Dv,pt,setPt,clock}=useDash();
  return <div className="two"><section className="card"><h2>رحلة المريض <small>المرضى التفاعليون</small></h2>
    <div className="pts">{D.meta.interactive_patient_ids.map(id=><button key={id} aria-pressed={id===pt} onClick={()=>setPt(id)}>{id}</button>)}</div>
    <PatientTwin D={Dv} id={pt} clock={clock}/></section>
  <section className="card tw"><h2>كل الحالات التفاعلية عند T+{clock} د</h2><table><thead><tr><th>المريض</th><th>الفرز</th><th>الحالة</th><th>الموقع</th></tr></thead><tbody>
    {D.meta.interactive_patient_ids.map(id=>{const p=Dv.patients.find(x=>x.patient_id===id);return <tr key={id}><td>{id}</td><td>{p?p.triage_level:"—"}</td><td>{p?STL[p.status]:"محوَّل"}</td><td>{p?NM[curDept(Dv,p,clock)]:"منشأة مجاورة"}</td></tr>})}</tbody></table></section></div>;}
