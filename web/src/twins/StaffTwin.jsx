export default function StaffTwin({D,k}){
  const s=D.staff.filter(x=>x.department_id===k),busy=s.filter(x=>x.status==="Busy").length;
  return <div><b>{s.length?busy+"/"+s.length:"—"}</b>الكادر المشغول</div>;}
