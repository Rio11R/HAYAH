import logo from "../assets/hayah_logo.svg";
export default function Navbar({page,go}){
  return <div className="nav"><img src={logo} alt="حياة HAYAH"/><span className="sp"/><span className="tag">بيانات اصطناعية</span>
    <button className={"btn "+(page==="home"?"":"o")} onClick={()=>go("home")}>الرئيسية</button>
    <button className={"btn "+(page==="dashboard"?"":"o")} onClick={()=>go("dashboard")}>مركز القيادة</button></div>;}
