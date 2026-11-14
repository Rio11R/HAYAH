import {NM,curDept} from "../engine/model.js";
const STL={En_route:"في الطريق",Waiting:"في الانتظار",In_service:"قيد الخدمة"};
export default function PatientTwin({D,id,clock}){
  const p=D.patients.find(x=>x.patient_id===id);
  if(!p)return <p className="sub">هذا المريض حُوِّل إلى منشأة مجاورة بقرار معتمد، ولم يعد ضمن هذه الشبكة.</p>;
  const cur=curDept(D,p,clock);
  const full=p.status==="En_route"?["Ambulance",...p.predicted_path]:[p.current_department_id,...p.predicted_path.filter(x=>x!==p.current_department_id)];
  const ci=full.indexOf(cur),a=D.ambulances.find(x=>x.ambulance_id===p.ambulance_id);
  return <><div className="path">{full.map((k,i)=><span key={i} style={{display:"contents"}}><span className={"step "+(i===ci?"cur":i<ci?"past":"")}>{NM[k]}</span>{i<full.length-1&&<span className="arr">←</span>}</span>)}</div>
  <div className="dstats" style={{marginTop:14}}><div><b>{p.triage_level}</b>مستوى الفرز</div><div><b>{STL[p.status]}</b>الحالة</div>
  <div><b>{a&&a.eta_minutes>clock?(a.eta_minutes-clock)+" د":"—"}</b>وصول الإسعاف</div><div><b>{NM[cur]}</b>الموقع عند T+{clock} د</div></div></>;}
