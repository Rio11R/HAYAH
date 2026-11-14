import {NM,ST,COL,sc} from "../engine/model.js";
export default function DepartmentTwin({k,r,selected,onSelect}){
  const st=sc(r.load);
  return <button className="dc" aria-pressed={selected} onClick={()=>onSelect(k)}>
    <div className="t"><span>{NM[k]}</span><span className={"pill "+st}>{ST[st]}</span></div>
    <div className="dbar"><i style={{width:Math.min(r.load,1)*100+"%",background:COL[st]}}/></div>
    <div className="drow"><span>الحمل {Math.round(r.load*100)}%</span><span>قادم {r.pr}</span></div></button>;}
