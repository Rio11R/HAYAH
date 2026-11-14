import { NM, ST, sc } from "../engine/model.js";
import LoadChart from "./LoadChart.jsx";
import StaffTwin from "../twins/StaffTwin.jsx";
import BedTwin from "../twins/BedTwin.jsx";
import EquipmentTwin from "../twins/EquipmentTwin.jsx";
export default function DeptDetail({ D, k, base, scen, sB, clock, diff }) {
  const r = base[clock][k],
    st = sc(r.load),
    sat = sB.o[k].sat,
    qs = D.patients.filter(
      (p) => p.current_department_id === k && p.status === "Waiting",
    ).length;
  const hasBeds = D.beds.some((b) => b.department_id === k);
  return (
    <section className="card">
      <h2>
        {NM[k]} <span className={"pill " + st}>{ST[st]}</span>
        <small>{k}</small>
      </h2>
      <div className="dstats">
        <div>
          <b>
            {Math.round(r.occ)}/{r.cap}
          </b>
          الإشغال الحالي
        </div>
        <div>
          <b>{r.pr}</b>قادمون متوقعون
        </div>
        <div>
          <b>{qs}</b>في الانتظار (متتبَّعون)
        </div>
        <div>
          <b>{sat === null ? "لا تشبّع" : "+" + sat + " د"}</b>موعد التشبّع
          المتوقع
        </div>
        <StaffTwin D={D} k={k} />
        {hasBeds ? <BedTwin D={D} k={k} /> : <EquipmentTwin D={D} k={k} />}
      </div>
      <div className="drow" style={{ marginBottom: 4 }}>
        <span>توقع الحمل خلال 90 دقيقة</span>
        <span>
          {diff && (
            <>
              <span style={{ color: "#3ddc97" }}>— مع التدخل</span> ·{" "}
              <span>- - الحالي</span>
            </>
          )}
        </span>
      </div>
      <LoadChart k={k} base={base} scen={scen} clock={clock} diff={diff} />
    </section>
  );
}
