import {useEffect,useRef} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {CSS2DRenderer,CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {sc} from "../engine/model.js";
const CY=0x08d3e6,COL={Normal:0x11998e,Warning:0xffb04a,Critical:0xff5c72},RC=f=>f>=1?0x3ddc97:f>=.8?0xffb04a:0xff5c72;
// مشهد "رادار": الإسعاف في المركز، والمستشفيات حوله على مسافات تناسب بُعدها
export default function RouteScene3D({list,selected,onSelect,label,height="440px"}){
  const host=useRef(),L=useRef(list),S=useRef(selected),CB=useRef(onSelect),LB=useRef(label);
  L.current=list;S.current=selected;CB.current=onSelect;LB.current=label;
  useEffect(()=>{
    const el=host.current,W=()=>el.clientWidth,Hh=()=>el.clientHeight;
    const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(W(),Hh());el.appendChild(r.domElement);
    const lr=new CSS2DRenderer();lr.setSize(W(),Hh());Object.assign(lr.domElement.style,{position:"absolute",inset:0,pointerEvents:"none"});el.appendChild(lr.domElement);
    const sc3=new THREE.Scene(),cam=new THREE.PerspectiveCamera(45,W()/Hh(),.1,200);cam.position.set(0,23,27);
    const ctl=new OrbitControls(cam,r.domElement);ctl.enableDamping=true;ctl.maxPolarAngle=1.45;ctl.minDistance=8;ctl.maxDistance=60;ctl.target.set(-1,0,1);
    sc3.add(new THREE.AmbientLight(0x9ff,.6));const dl=new THREE.DirectionalLight(0xffffff,1);dl.position.set(6,16,8);sc3.add(dl);
    const grid=new THREE.GridHelper(50,50,CY,0x0a5a63);grid.material.transparent=true;grid.material.opacity=.25;sc3.add(grid);
    [7,10,12].forEach((rad,i)=>{const m=new THREE.Mesh(new THREE.RingGeometry(rad-.04,rad+.04,96).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:CY,transparent:true,opacity:.35-i*.08}));m.position.y=.02;sc3.add(m);});
    // الإسعاف
    const amb=new THREE.Group();amb.add(new THREE.Mesh(new THREE.BoxGeometry(1.3,.7,.7).translate(0,.5,0),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.3})),
      new THREE.Mesh(new THREE.BoxGeometry(.5,.18,.5).translate(0,1,0),new THREE.MeshBasicMaterial({color:0xff5c72})));
    const ad=document.createElement("div");ad.className="lbl small";const al=new CSS2DObject(ad);al.position.set(0,2,0);amb.add(al);sc3.add(amb);
    // المستشفيات والمسارات
    const N={};
    L.current.forEach(h=>{const rad=7*h.ratio,a=h.bearing*Math.PI/180,pos=new THREE.Vector3(rad*Math.cos(a),0,rad*Math.sin(a));
      const g=new THREE.Group();g.position.copy(pos);
      const shell=new THREE.Mesh(new THREE.BoxGeometry(3,4,3).translate(0,2,0),new THREE.MeshPhysicalMaterial({color:0x0e5a62,transparent:true,opacity:.25,depthWrite:false}));shell.userData.id=h.id;
      const edge=new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry),new THREE.LineBasicMaterial({color:h.id==="HAYAH"?0xb0fdff:CY}));
      const fm=new THREE.MeshStandardMaterial({color:0x11998e,emissive:0x11998e,emissiveIntensity:.7,transparent:true,opacity:.85});
      const fill=new THREE.Mesh(new THREE.BoxGeometry(2.5,1,2.5).translate(0,.5,0),fm);
      const base=new THREE.Mesh(new THREE.BoxGeometry(3.6,.12,3.6).translate(0,.06,0),new THREE.MeshStandardMaterial({color:0x053335,emissive:h.id==="HAYAH"?0xb0fdff:CY,emissiveIntensity:.35}));
      const dv=document.createElement("div");const lab=new CSS2DObject(dv);lab.position.set(0,4.9,0);g.add(shell,edge,fill,base,lab);sc3.add(g);
      const cv=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,.3,0),new THREE.Vector3(pos.x/2,1.6,pos.z/2),new THREE.Vector3(pos.x,.3,pos.z));
      const rm=new THREE.MeshBasicMaterial({color:RC(h.route),transparent:true,opacity:.4});sc3.add(new THREE.Mesh(new THREE.TubeGeometry(cv,24,.06,6),rm));
      N[h.id]={g,fill,fm,dv,cv,rm,shell,cur:0};});
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.28),new THREE.MeshBasicMaterial({color:0xb0fdff}));sc3.add(dot);
    const ray=new THREE.Raycaster(),m=new THREE.Vector2();let down=null;
    const pd=e=>{down=[e.clientX,e.clientY]},pu=e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const b=r.domElement.getBoundingClientRect();
      m.set(((e.clientX-b.left)/b.width)*2-1,-((e.clientY-b.top)/b.height)*2+1);ray.setFromCamera(m,cam);
      const h=ray.intersectObjects(Object.values(N).map(n=>n.shell))[0];if(h&&CB.current)CB.current(h.object.userData.id);};
    r.domElement.addEventListener("pointerdown",pd);r.domElement.addEventListener("pointerup",pu);
    const ro=new ResizeObserver(()=>{r.setSize(W(),Hh());lr.setSize(W(),Hh());cam.aspect=W()/Hh();cam.updateProjectionMatrix();});ro.observe(el);
    let raf;const t0=performance.now();
    const loop=()=>{raf=requestAnimationFrame(loop);const t=(performance.now()-t0)/1000;ad.textContent=LB.current||"";
      const best=L.current.reduce((a,b)=>b.total<a.total?b:a);
      L.current.forEach(h=>{const n=N[h.id],stt=sc(h.load),sel=S.current===h.id;
        n.cur+=(Math.min(1.15,h.load)-n.cur)*.08;n.fill.scale.y=Math.max(.05,n.cur*3.8);n.fm.color.setHex(COL[stt]);n.fm.emissive.setHex(COL[stt]);
        n.g.position.y=sel?.2+.1*Math.sin(t*3):0;n.rm.opacity=sel?1:.35;
        n.dv.className="lbl "+stt+(sel?" sel":"");n.dv.innerHTML=(h.id===best.id?"★ ":"")+h.name+"<br>ETA "+Math.round(h.eta)+" د · الإجمالي "+Math.round(h.total)+" د";});
      const sn=N[S.current];if(sn){dot.visible=true;dot.position.copy(sn.cv.getPoint((t*.18)%1));}else dot.visible=false;
      amb.children[1].material.color.setHex(Math.floor(t*4)%2?0xff5c72:CY);
      ctl.update();r.render(sc3,cam);lr.render(sc3,cam);};
    loop();
    return()=>{cancelAnimationFrame(raf);ro.disconnect();r.domElement.removeEventListener("pointerdown",pd);r.domElement.removeEventListener("pointerup",pu);ctl.dispose();r.dispose();el.innerHTML="";};
  },[]);
  return <div ref={host} className="scene" style={{height}}/>;}
