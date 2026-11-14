import {useEffect,useRef} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {CSS2DRenderer,CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {NM as AR,sc as stat} from "../engine/model.js";
const ratio=d=>d.load; // النسبة جاهزة من النموذج (مصدر واحد)
const COL={Normal:0x11998e,Warning:0xffb04a,Critical:0xff5c72},CY=0x08d3e6;
// تخطيط التوأم ثلاثي الأبعاد: [x,z,عرض,عمق]
const LAY={"ED-01":[-5,3,5,4],"RAD-CT":[1,3,3.6,3.6],"LAB-01":[6.5,3,4,3.4],"ICU-01":[-2.5,-4.5,3,3],"WARD-01":[4.5,-4.5,6,4]};
const H=c=>1.4+c/11;
export default function Scene3D({S,selected,onSelect,auto=false,height="520px"}){
  const host=useRef(),sRef=useRef(S),selRef=useRef(selected),cbRef=useRef(onSelect);
  sRef.current=S;selRef.current=selected;cbRef.current=onSelect;
  useEffect(()=>{
    const el=host.current,W=()=>el.clientWidth,Hh=()=>el.clientHeight;
    const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(W(),Hh());el.appendChild(r.domElement);
    const lr=new CSS2DRenderer();lr.setSize(W(),Hh());Object.assign(lr.domElement.style,{position:"absolute",inset:0,pointerEvents:"none"});el.appendChild(lr.domElement);
    const sc=new THREE.Scene();sc.fog=new THREE.FogExp2(0x041c1f,.022);
    const cam=new THREE.PerspectiveCamera(45,W()/Hh(),.1,200);cam.position.set(18,15,21);
    const ctl=new OrbitControls(cam,r.domElement);ctl.enableDamping=true;ctl.maxPolarAngle=1.45;ctl.minDistance=8;ctl.maxDistance=55;ctl.autoRotate=auto;ctl.autoRotateSpeed=.7;ctl.target.set(0.5,1,-.5);
    sc.add(new THREE.AmbientLight(0x9ff,.55));const dl=new THREE.DirectionalLight(0xffffff,1.1);dl.position.set(8,18,10);sc.add(dl);
    const pl=new THREE.PointLight(CY,40,40);pl.position.set(0,8,0);sc.add(pl);
    // الأرضية
    const grid=new THREE.GridHelper(60,60,CY,0x0a5a63);grid.material.transparent=true;grid.material.opacity=.28;sc.add(grid);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(15,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x0b4a52,transparent:true,opacity:.35}));disc.position.y=.01;sc.add(disc);
    const ring=new THREE.Mesh(new THREE.RingGeometry(14.6,15,96).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:CY,transparent:true,opacity:.7}));ring.position.y=.02;sc.add(ring);
    // جسيمات عائمة
    const pg=new THREE.BufferGeometry(),pa=[];for(let i=0;i<260;i++)pa.push((Math.random()-.5)*50,Math.random()*16,(Math.random()-.5)*50);
    pg.setAttribute("position",new THREE.Float32BufferAttribute(pa,3));const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xb0fdff,size:.07,transparent:true,opacity:.7}));sc.add(pts);
    // الأقسام
    const deps={},pickables=[];
    Object.entries(LAY).forEach(([id,[x,z,w,d]])=>{
      const h=H(sRef.current.departments[id].capacity),g=new THREE.Group();g.position.set(x,0,z);
      const shell=new THREE.Mesh(new THREE.BoxGeometry(w,h,d).translate(0,h/2,0),new THREE.MeshPhysicalMaterial({color:0x0e5a62,transparent:true,opacity:.22,roughness:.1,metalness:.2,depthWrite:false}));shell.userData.id=id;pickables.push(shell);
      const edge=new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry),new THREE.LineBasicMaterial({color:CY}));
      const fm=new THREE.MeshStandardMaterial({color:0x11998e,emissive:0x11998e,emissiveIntensity:.8,transparent:true,opacity:.85});
      const fill=new THREE.Mesh(new THREE.BoxGeometry(w*.86,1,d*.86).translate(0,.5,0),fm);
      const base=new THREE.Mesh(new THREE.BoxGeometry(w+.5,.12,d+.5).translate(0,.06,0),new THREE.MeshStandardMaterial({color:0x053335,emissive:CY,emissiveIntensity:.25}));
      const div=document.createElement("div");div.className="lbl";const lab=new CSS2DObject(div);lab.position.set(0,h+.9,0);
      g.add(shell,edge,fill,base,lab);sc.add(g);deps[id]={g,fill,fm,div,h,cur:0,w,d};});
    // مسارات المرضى بين الأقسام
    const links=[];const lg=new THREE.Group();sc.add(lg);
    const C=id=>new THREE.Vector3(LAY[id][0],.25,LAY[id][1]);
    const pairs=new Set();sRef.current.patients.forEach(p=>p.predicted_path.forEach((a,i,arr)=>{if(arr[i+1])pairs.add(a+">"+arr[i+1]);}));
    pairs.forEach(k=>{const [a,b]=k.split(">"),A=C(a),B=C(b),M=A.clone().lerp(B,.5);M.y=3.2;
      const cv=new THREE.QuadraticBezierCurve3(A,M,B);
      lg.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cv.getPoints(30)),new THREE.LineBasicMaterial({color:CY,transparent:true,opacity:.35})));
      const orb=new THREE.Mesh(new THREE.SphereGeometry(.14),new THREE.MeshBasicMaterial({color:0xb0fdff}));lg.add(orb);links.push({cv,orb,o:Math.random()});});
    // الإسعاف
    const ambs={};
    sRef.current.ambulances.forEach((a,i)=>{
      const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(1.3,.7,.7).translate(0,.5,0),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.25}));
      const bar=new THREE.Mesh(new THREE.BoxGeometry(.5,.18,.5).translate(0,1,0),new THREE.MeshBasicMaterial({color:0xff5c72}));
      const hl=new THREE.PointLight(0xff5c72,8,6);hl.position.y=1.2;
      const dv=document.createElement("div");dv.className="lbl small";const lab=new CSS2DObject(dv);lab.position.set(0,2,0);
      g.add(b,bar,hl,lab);g.position.set(-15+i*3,0,16);sc.add(g);ambs[a.ambulance_id]={g,bar,dv,spawn:new THREE.Vector3(-15+i*3,0,16)};});
    // التفاعل
    const ray=new THREE.Raycaster(),m=new THREE.Vector2();let down=null;
    const pd=e=>{down=[e.clientX,e.clientY]};
    const pu=e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const b=r.domElement.getBoundingClientRect();
      m.set(((e.clientX-b.left)/b.width)*2-1,-((e.clientY-b.top)/b.height)*2+1);ray.setFromCamera(m,cam);const h=ray.intersectObjects(pickables)[0];if(h&&cbRef.current)cbRef.current(h.object.userData.id);};
    r.domElement.addEventListener("pointerdown",pd);r.domElement.addEventListener("pointerup",pu);
    const ro=new ResizeObserver(()=>{r.setSize(W(),Hh());lr.setSize(W(),Hh());cam.aspect=W()/Hh();cam.updateProjectionMatrix();});ro.observe(el);
    let raf,t0=performance.now();
    const loop=()=>{raf=requestAnimationFrame(loop);const t=(performance.now()-t0)/1000,S=sRef.current;
      Object.entries(deps).forEach(([id,o])=>{const d=S.departments[id],rt=ratio(d),s=stat(rt),col=COL[s];
        o.cur+=(Math.min(1.15,rt)-o.cur)*.08;const fh=Math.max(.05,o.cur*o.h*.95);o.fill.scale.y=fh;
        o.fm.color.setHex(col);o.fm.emissive.setHex(col);o.fm.emissiveIntensity=s==="Critical"?.7+.6*Math.sin(t*5):.6;
        const sel=selRef.current===id;o.g.position.y=sel?.25+.1*Math.sin(t*3):0;
        o.div.className="lbl "+s+(sel?" sel":"");o.div.textContent=AR[id]+" · "+Math.round(rt*100)+"%";});
      links.forEach(l=>{l.orb.position.copy(l.cv.getPoint((t*.15+l.o)%1));});
      S.ambulances.forEach(a=>{const o=ambs[a.ambulance_id];if(a.status==="diverted"){o.g.visible=false;o.dv.style.visibility="hidden";return;}o.g.visible=true;o.dv.style.visibility="";const p=S.patients.find(x=>x.patient_id===a.patient_id),to=p.current_department_id!=="Ambulance"?p.current_department_id:p.next_department_id;
        const [x,z,w,d]=LAY[to],door=new THREE.Vector3(x,0,z+d/2+1.4),en=a.status==="en_route",k=en?Math.min(1,a.eta_minutes/26):0;
        const goal=door.clone().lerp(o.spawn,k);o.g.position.lerp(goal,.06);o.g.lookAt(door.x,0,door.z+(k>0?0:5));
        o.bar.material.color.setHex(en&&Math.floor(t*4)%2?0xff5c72:0x08d3e6);o.dv.textContent=a.ambulance_id+(en?" · "+a.eta_minutes+"د":" · وصل");});
      pts.rotation.y=t*.01;ring.material.opacity=.5+.2*Math.sin(t*2);
      ctl.update();r.render(sc,cam);lr.render(sc,cam);};
    loop();
    return()=>{cancelAnimationFrame(raf);ro.disconnect();r.domElement.removeEventListener("pointerdown",pd);r.domElement.removeEventListener("pointerup",pu);ctl.dispose();r.dispose();el.innerHTML="";};
  },[auto]);
  return <div ref={host} className="scene" style={{height}}/>;}
