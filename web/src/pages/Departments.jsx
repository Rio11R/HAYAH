import {useDash} from "../state/DashContext.jsx";
import DeptDetail from "../components/DeptDetail.jsx";import DepartmentTwin from "../twins/DepartmentTwin.jsx";
export default function Departments(){
  const {Dv,base,scen,sB,clock,sel,setSel,TR}=useDash();
  return <div className="dgrid"><section className="card"><h2>الأقسام <small>اختر قسمًا لعرض تفاصيله وتوقع حمله</small></h2>
    <div className="depts" style={{gridTemplateColumns:"1fr 1fr"}}>{Dv.departments.map(d=><DepartmentTwin key={d.department_id} k={d.department_id} r={base[clock][d.department_id]} selected={d.department_id===sel} onSelect={setSel}/>)}</div></section>
    <DeptDetail D={Dv} k={sel} base={base} scen={scen} sB={sB} clock={clock} diff={TR.size>0}/></div>;}
