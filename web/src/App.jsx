import {useState,useEffect} from "react";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import {DashProvider} from "./state/DashContext.jsx";
import DashLayout,{PAGES} from "./components/DashLayout.jsx";
import Overview from "./pages/Overview.jsx";import Departments from "./pages/Departments.jsx";import Simulation from "./pages/Simulation.jsx";
import Ambulances from "./pages/Ambulances.jsx";import Patients from "./pages/Patients.jsx";
const VIEW={dashboard:Overview,departments:Departments,simulation:Simulation,ambulances:Ambulances,patients:Patients};
const get=()=>{const h=location.hash.slice(1);return h in PAGES?h:"home"};
export default function App(){
  const [page,setPage]=useState(get());
  useEffect(()=>{const h=()=>{setPage(get());window.scrollTo(0,0)};addEventListener("hashchange",h);return()=>removeEventListener("hashchange",h)},[]);
  const go=p=>{location.hash=p},V=VIEW[page];
  return <DashProvider><Navbar page={page==="home"?"home":"dashboard"} go={p=>go(p)}/>
    {page==="home"?<Landing go={()=>go("dashboard")}/>:<DashLayout page={page} go={go}><V go={go}/></DashLayout>}</DashProvider>;}
