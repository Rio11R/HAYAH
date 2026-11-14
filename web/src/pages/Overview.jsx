import { useMemo } from "react";
import { useDash } from "../state/DashContext.jsx";
import { toScene, NM } from "../engine/model.js";
import Scene3D from "../scene/Scene3D.jsx";
import NetworkMap from "../components/NetworkMap.jsx";
import HospitalTwin from "../twins/HospitalTwin.jsx";
import DepartmentTwin from "../twins/DepartmentTwin.jsx";
import AmbulanceTwin from "../twins/AmbulanceTwin.jsx";
export default function Overview({ go }) {
  const { Dv, base, clock, AP, DV, sel, setSel, view, setView, sB, log } =
    useDash();
  const scene = useMemo(() => toScene(Dv, base, clock), [Dv, base, clock]);
  const sat = Object.entries(sB.o)
    .filter(([, v]) => v.sat !== null)
    .sort((a, b) => a[1].sat - b[1].sat);
  return (
    <>
      <HospitalTwin
        D={Dv}
        rows={base}
        clock={clock}
        applied={AP.size + Object.keys(DV).length}
      />
      <div className="dgrid">
        <section className="card">
          <h2>
            التوأم الرقمي للشبكة <small>اضغط على أي قسم للتفاصيل</small>
            <span className="seg">
              <button
                aria-pressed={view === "3d"}
                onClick={() => setView("3d")}
              >
                ثلاثي الأبعاد
              </button>
              <button
                aria-pressed={view === "map"}
                onClick={() => setView("map")}
              >
                المخطط
              </button>
            </span>
          </h2>
          {view === "3d" ? (
            <Scene3D
              S={scene}
              selected={sel}
              onSelect={setSel}
              height="400px"
            />
          ) : (
            <NetworkMap
              D={Dv}
              rows={base}
              clock={clock}
              sel={sel}
              onSel={setSel}
            />
          )}
          <div className="chips">
            {Dv.ambulances.map((a) => (
              <AmbulanceTwin key={a.ambulance_id} a={a} clock={clock} />
            ))}
          </div>
          <div className="depts">
            {Dv.departments.map((d) => (
              <DepartmentTwin
                key={d.department_id}
                k={d.department_id}
                r={base[clock][d.department_id]}
                selected={d.department_id === sel}
                onSelect={setSel}
              />
            ))}
          </div>
        </section>
        <section className="card">
          <h2>ملخص سريع</h2>
          <div className="dstats" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <b>
                {sat.length
                  ? NM[sat[0][0]] + " +" + sat[0][1].sat + " د"
                  : "لا تشبّع"}
              </b>
              أقرب تشبّع متوقع
            </div>
            <div>
              <b>{sB.crit} من 5</b>أقسام تبلغ الحرج خلال 90 د
            </div>
            <div>
              <b>
                {Object.keys(DV).length} / {Dv.ambulances.length}
              </b>
              إسعافات محوّلة لمنشآت مجاورة
            </div>
            <div>
              <b>{log[0] ? log[0].text : "لا قرارات بعد"}</b>آخر قرار بشري
            </div>
          </div>
          <div className="row s">
            <button className="btn sm" onClick={() => go("simulation")}>
              المحاكاة والقرارات ←
            </button>
            <button className="btn o sm" onClick={() => go("ambulances")}>
              الإسعاف والتحويل ←
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
