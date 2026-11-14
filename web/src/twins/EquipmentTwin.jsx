export default function EquipmentTwin({D,k}){
  const e=D.equipment.filter(x=>x.department_id===k);
  return <div><b>{e.length?e.filter(x=>x.status==="available").length+"/"+e.length+" جاهز":"—"}</b>الأجهزة</div>;}
