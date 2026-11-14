export default function BedTwin({D,k}){
  const b=D.beds.filter(x=>x.department_id===k);
  return <div><b>{b.filter(x=>x.status==="available").length} شاغر</b>الأسرّة (من {b.length})</div>;}
