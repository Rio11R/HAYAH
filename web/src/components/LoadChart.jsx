import { H } from "../engine/model.js";
export default function LoadChart({ k, base, scen, clock, diff }) {
  const W = 520,
    Hh = 150,
    X = (t) => 10 + (t / H) * (W - 20),
    Y = (l) => Hh - 10 - (Math.min(l, 1.4) / 1.4) * (Hh - 20);
  const line = (rows, c, dash) => (
    <polyline
      fill="none"
      stroke={c}
      strokeWidth="2.4"
      strokeDasharray={dash ? "5 4" : undefined}
      points={rows.map((r, t) => X(t) + "," + Y(r[k].load)).join(" ")}
    />
  );
  return (
    <svg
      viewBox={`0 0 ${W} ${Hh}`}
      style={{ width: "100%", direction: "ltr" }}
      role="img"
      aria-label="توقع الحمل خلال 90 دقيقة"
    >
      <line
        x1="10"
        x2={W - 10}
        y1={Y(0.9)}
        y2={Y(0.9)}
        stroke="#ff5d6c"
        strokeOpacity=".5"
        strokeDasharray="3 4"
      />
      <text
        x={W - 12}
        y={Y(0.9) - 4}
        fill="#ff5d6c"
        fontSize="10"
        textAnchor="end"
      >
        90% حرج
      </text>
      <line
        x1="10"
        x2={W - 10}
        y1={Y(0.7)}
        y2={Y(0.7)}
        stroke="#ffb547"
        strokeOpacity=".5"
        strokeDasharray="3 4"
      />
      <text
        x={W - 12}
        y={Y(0.7) - 4}
        fill="#ffb547"
        fontSize="10"
        textAnchor="end"
      >
        70%
      </text>
      {line(base, diff ? "#7fb3b8" : "#08d3e6", diff)}
      {diff && line(scen, "#3ddc97")}
      <line
        x1={X(clock)}
        x2={X(clock)}
        y1="4"
        y2={Hh - 4}
        stroke="#fff"
        strokeOpacity=".6"
      />
      <text x="12" y={Hh - 1} fill="#7fb3b8" fontSize="10">
        الآن
      </text>
      <text x={W - 12} y={Hh - 1} fill="#7fb3b8" fontSize="10" textAnchor="end">
        +90 د
      </text>
    </svg>
  );
}
