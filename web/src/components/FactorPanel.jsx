import { WX, TD, CORR } from "../engine/routing.js";
// عوامل تؤثر على سرعة وصول الإسعاف وزمن بدء الرعاية
export default function FactorPanel({ cond, setCond }) {
  const up = (o) => setCond({ ...cond, ...o });
  return (
    <section className="card">
      <h2>
        عوامل سرعة الوصول <small>غيّرها وشاهد أثرها فورًا</small>
      </h2>
      <div className="fgrid">
        <label>
          وقت اليوم
          <select value={cond.td} onChange={(e) => up({ td: e.target.value })}>
            {Object.entries(TD).map(([k, v]) => (
              <option key={k} value={k}>
                {v.t} (×{v.f})
              </option>
            ))}
          </select>
        </label>
        <label>
          الطقس
          <select value={cond.wx} onChange={(e) => up({ wx: e.target.value })}>
            {Object.entries(WX).map(([k, v]) => (
              <option key={k} value={k}>
                {v.t} (×{v.f})
              </option>
            ))}
          </select>
        </label>
        <label className="chk">
          <input
            type="checkbox"
            checked={cond.corr}
            onChange={(e) => up({ corr: e.target.checked })}
          />{" "}
          ممر أولوية / تحكم بالإشارات (×{CORR})
        </label>
        <label>
          زمن تسليم المريض: <b>{cond.handover} د</b>
          <input
            type="range"
            min="3"
            max="15"
            value={cond.handover}
            onChange={(e) => up({ handover: +e.target.value })}
          />
        </label>
      </div>
      <ul className="flist">
        <li>
          <b>المسافة:</b> أساس زمن الوصول لكل وجهة.
        </li>
        <li>
          <b>ازدحام المسار:</b> خفيف / متوسط / كثيف لكل طريق (في الجدول).
        </li>
        <li>
          <b>الطقس ووقت اليوم:</b> يخفضان السرعة المتوقعة.
        </li>
        <li>
          <b>الممر والإشارات:</b> يرفعان السرعة.
        </li>
        <li>
          <b>حمل الطوارئ في الوجهة:</b> يحدد الانتظار بعد الوصول.
        </li>
        <li>
          <b>القدرة:</b> غياب CT أو ICU المطلوب يضيف زمن تحويل داخلي (+15 د).
        </li>
      </ul>
      <p className="note">
        كل المعاملات افتراضات اصطناعية تحتاج اعتماد الفريق؛ ليست قياسات حقيقية.
      </p>
    </section>
  );
}
