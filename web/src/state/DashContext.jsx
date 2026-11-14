import {createContext,useContext,useState,useMemo,useEffect} from "react";
import {D} from "../engine/data.js";
import {run,summ,effective,H,INT} from "../engine/model.js";
const Ctx=createContext(null);export const useDash=()=>useContext(Ctx);
const now=()=>new Date().toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"});
// حالة مشتركة بين كل صفحات لوحة القيادة (الدقيقة، القرارات، التحويلات، السجل)
export function DashProvider({children}){
  const [clock,setClock]=useState(0),[playing,setPlaying]=useState(false),[AP,setAP]=useState(new Set()),[TR,setTR]=useState(new Set()),
    [DV,setDV]=useState({}),[sel,setSel]=useState("RAD-CT"),[pt,setPt]=useState("PAT-001"),[log,setLog]=useState([]),[view,setView]=useState("3d");
  useEffect(()=>{if(!playing)return;const i=setInterval(()=>setClock(c=>c>=H?0:c+1),600);return()=>clearInterval(i)},[playing]);
  const divIds=useMemo(()=>new Set(Object.keys(DV)),[DV]);
  const base=useMemo(()=>run(D,AP,divIds),[AP,divIds]),scen=useMemo(()=>run(D,new Set([...AP,...TR]),divIds),[AP,TR,divIds]);
  const sB=useMemo(()=>summ(base),[base]),sS=useMemo(()=>summ(scen),[scen]),Dv=useMemo(()=>effective(D,DV),[DV]);
  const add=text=>setLog(l=>[{time:now(),text,t:clock},...l]);
  const toggle=id=>{if(AP.has(id))return;const n=new Set(TR);n.has(id)?n.delete(id):n.add(id);setTR(n)};
  const approve=()=>{add("اعتُمد: "+[...TR].map(i=>INT.find(o=>o.id===i).t).join("، "));setAP(new Set([...AP,...TR]));setTR(new Set())};
  const divert=(aid,h)=>{setDV({...DV,[aid]:{id:h.id,name:h.name}});add(`اعتُمد تحويل ${aid} إلى ${h.name}`)};
  const undivert=aid=>{const n={...DV};delete n[aid];setDV(n);add(`أُلغي تحويل ${aid}`)};
  const reset=()=>{setClock(0);setAP(new Set());setTR(new Set());setDV({});setLog([]);setPlaying(false)};
  return <Ctx.Provider value={{D,clock,setClock,playing,setPlaying,AP,TR,DV,divIds,sel,setSel,pt,setPt,log,view,setView,base,scen,sB,sS,Dv,toggle,approve,divert,undivert,reset}}>{children}</Ctx.Provider>;}
