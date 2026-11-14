export default function AmbulanceTwin({a,clock}){
  if(a.diverted)return <span className="chip done">🚑 {a.ambulance_id} · حُوِّل إلى {a.divertTo} ✓</span>;
  const left=a.eta_minutes-clock;
  return <span className={"chip "+(left>0?"":"done")}>🚑 {a.ambulance_id} · {left>0?"وصول بعد "+left+" د":"وصل"}</span>;}
