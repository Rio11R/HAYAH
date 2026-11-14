import {useDash} from "../state/DashContext.jsx";
import SimPanel from "../components/SimPanel.jsx";import DecisionLog from "../components/DecisionLog.jsx";
export default function Simulation(){
  const {D,TR,AP,toggle,approve,sB,sS,log}=useDash();
  return <><SimPanel D={D} TR={TR} AP={AP} toggle={toggle} approve={approve} sB={sB} sS={sS}/><div style={{marginTop:14}}><DecisionLog log={log}/></div></>;}
