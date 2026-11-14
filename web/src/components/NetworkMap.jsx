import {NM,ST,COL,sc} from "../engine/model.js";
const POS={Ambulance:[70,180],"ED-01":[250,180],"RAD-CT":[430,80],"LAB-01":[430,285],"ICU-01":[650,80],"WARD-01":[650,285]};
export default function NetworkMap({D,rows,clock,sel,onSel}){
  const E={};D.patients.forEach(p=>{const seq=[p.current_department_id,...p.predicted_path.filter(x=>x!==p.current_department_id)];
    for(let i=0;i<seq.length-1;i++){const k=seq[i]+">"+seq[i+1];E[k]=(E[k]||0)+1;}});
  const reduce=typeof matchMedia!=="undefined"&&matchMedia("(prefers-reduced-motion:reduce)").matches,C=2*Math.PI*34;
  return <svg viewBox="0 0 760 360" className="map" role="img" aria-label="خريطة تدفق المرضى بين الأقسام">
    {Object.entries(E).map(([k,n])=>{const [a,b]=k.split(">");if(!POS[a]||!POS[b])return null;const [x1,y1]=POS[a],[x2,y2]=POS[b];
      const mx=(x1+x2)/2+(y2-y1)*.12,my=(y1+y2)/2-(x2-x1)*.12,d=`M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
      return <g key={k}><path d={d} fill="none" stroke="#11998e" strokeOpacity=".5" strokeWidth={1+Math.min(n,12)/3}/>
        {!reduce&&Array.from({length:Math.min(n,4)}).map((_,i)=><circle key={i} r="3.2" fill="#b0fdff"><animateMotion dur={(3+n%3)+"s"} begin={"-"+i*.9+"s"} repeatCount="indefinite" path={d}/></circle>)}</g>;})}
    {Object.entries(POS).map(([k,[x,y]])=>{let st="Normal",pc,sub;
      if(k==="Ambulance"){const n=D.ambulances.filter(a=>!a.diverted&&a.eta_minutes>clock).length;pc=n;sub=n+" في الطريق";}
      else{const r=rows[clock][k];st=sc(r.load);pc=Math.round(r.load*100)+"%";}
      const f=k==="Ambulance"?0:Math.min(rows[clock][k].load,1)*C;
      return <g key={k} className="node" tabIndex="0" role="button" aria-label={NM[k]+" "+pc} transform={`translate(${x},${y})`}
        onClick={()=>k!=="Ambulance"&&onSel(k)} onKeyDown={e=>{if((e.key==="Enter"||e.key===" ")&&k!=="Ambulance"){e.preventDefault();onSel(k);}}}>
        <circle className="bg" r="42" fill="#04282b" stroke={k===sel?"#08d3e6":"#0d4a4e"} strokeWidth="2"/>
        <circle r="34" fill="none" stroke="#0a3f43" strokeWidth="7"/>
        <circle r="34" fill="none" stroke={COL[st]} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${f} ${C}`} transform="rotate(-90)"/>
        <text textAnchor="middle" y="6" fill="#fff" fontSize="16" fontWeight="700">{pc}</text>
        <text textAnchor="middle" y="68" fill="#c7f4ff" fontSize="14">{NM[k]}</text>
        <text textAnchor="middle" y="84" fill={k==="Ambulance"?"#7fb3b8":COL[st]} fontSize="11">{k==="Ambulance"?sub:ST[st]}</text></g>;})}
  </svg>;}
