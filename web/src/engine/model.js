// نموذج التوقع والمحاكاة على خط زمني (0–90 دقيقة). كل الأرقام اصطناعية.
export const NM = {
  "ED-01": "الطوارئ",
  "RAD-CT": "الأشعة CT",
  "LAB-01": "المختبر",
  "ICU-01": "العناية المركزة",
  "WARD-01": "التنويم",
  Ambulance: "الإسعاف",
};
export const ST = { Normal: "مستقر", Warning: "تحذير", Critical: "حرج" };
export const COL = {
  Normal: "#3ddc97",
  Warning: "#ffb547",
  Critical: "#ff5d6c",
};
export const H = 90;
// افتراضات معلنة: معدل الدخول الخلفي LAM ومعدل الإنجاز MU لكل قسم (تحتاج اعتماد الفريق)
const LAM = {
  "ED-01": 0.7,
  "RAD-CT": 0.75,
  "LAB-01": 0.5,
  "ICU-01": 0.02,
  "WARD-01": 0.12,
};
const MU = {
  "ED-01": 0.02,
  "RAD-CT": 0.05,
  "LAB-01": 0.08,
  "ICU-01": 0.004,
  "WARD-01": 0.01,
};
export const INT = [
  { id: "ct", t: "تشغيل نوبة إضافية لجهاز CT", d: "سعة +2 وسرعة إنجاز +50%" },
  {
    id: "ed",
    t: "نقل 4 حالات مستقرة من الطوارئ إلى التنويم",
    d: "تخفيف الضغط فورًا؛ التنويم لديه أسرّة شاغرة",
  },
  { id: "lab", t: "تسريع نتائج المختبر (مسار عاجل)", d: "سرعة إنجاز +50%" },
  {
    id: "icu",
    t: "فتح سريرين إضافيين في العناية المركزة",
    d: "سعة +2 بعد اعتماد الكادر",
  },
];
export const sc = (l) =>
  l >= 0.9 ? "Critical" : l >= 0.7 ? "Warning" : "Normal";
export function run(D, set, div = new Set()) {
  const S = {},
    P = [];
  D.departments.forEach(
    (d) =>
      (S[d.department_id] = {
        cap: d.capacity,
        occ: d.occupied,
        lam: LAM[d.department_id],
        mu: MU[d.department_id],
      }),
  );
  D.patients.forEach((p, i) => {
    if (!p.next_department_id || div.has(p.ambulance_id)) return;
    if (p.status === "En_route") {
      const a = D.ambulances.find((x) => x.ambulance_id === p.ambulance_id);
      P.push({ t: a.eta_minutes, to: p.next_department_id, id: p.patient_id });
    } else if (p.current_department_id !== p.next_department_id)
      P.push({
        t: 6 + ((i * 7) % 40),
        to: p.next_department_id,
        id: p.patient_id,
      });
  });
  if (set.has("ct")) {
    S["RAD-CT"].cap += 2;
    S["RAD-CT"].mu *= 1.5;
  }
  if (set.has("ed")) {
    S["ED-01"].occ -= 4;
    S["WARD-01"].occ += 4;
  }
  if (set.has("lab")) S["LAB-01"].mu *= 1.5;
  if (set.has("icu")) S["ICU-01"].cap += 2;
  const rows = [];
  for (let t = 0; t <= H; t++) {
    const r = {};
    for (const k in S) {
      const s = S[k],
        pr = P.filter((x) => x.to === k && x.t > t).length;
      r[k] = { occ: s.occ, pr, cap: s.cap, load: (s.occ + pr) / s.cap };
    }
    rows.push(r);
    for (const k in S) {
      const s = S[k];
      P.filter((x) => x.to === k && x.t === t + 1).forEach(() => s.occ++);
      s.occ = Math.max(0, s.occ + s.lam - s.mu * s.occ);
    }
  }
  return rows;
}
export function summ(rows) {
  const o = {};
  let tot = 0,
    crit = 0;
  for (const k in rows[0]) {
    let peak = 0,
      sat = null,
      ov = 0;
    rows.forEach((r, t) => {
      const x = r[k];
      peak = Math.max(peak, x.load);
      if (sat === null && x.occ >= x.cap) sat = t;
      ov += Math.max(0, x.occ - x.cap);
    });
    o[k] = { peak, sat, ov };
    tot += ov;
    if (peak >= 0.9) crit++;
  }
  return { o, tot, crit };
}
// البيانات "الفعّالة" بعد التحويلات المعتمدة: DV = {ambulance_id: {id,name}}
export function effective(D, DV) {
  const ids = Object.keys(DV);
  if (!ids.length) return D;
  return {
    ...D,
    ambulances: D.ambulances.map((a) =>
      DV[a.ambulance_id]
        ? { ...a, diverted: true, divertTo: DV[a.ambulance_id].name }
        : a,
    ),
    patients: D.patients.filter((p) => !DV[p.ambulance_id]),
  };
}
export function curDept(D, p, clock) {
  if (p.status !== "En_route") return p.current_department_id;
  const a = D.ambulances.find((x) => x.ambulance_id === p.ambulance_id);
  return clock >= a.eta_minutes ? p.next_department_id : "Ambulance";
}
// محوّل: حالة الخط الزمني ← شكل البيانات الذي يقرؤه مشهد الثلاثي الأبعاد
export function toScene(D, rows, clock) {
  const r = rows[clock],
    departments = {};
  D.departments.forEach((d) => {
    const k = d.department_id;
    departments[k] = {
      capacity: r[k].cap,
      occupied: r[k].occ,
      predicted_incoming: r[k].pr,
      load: r[k].load,
    };
  });
  return {
    departments,
    ambulances: D.ambulances.map((a) => ({
      ambulance_id: a.ambulance_id,
      patient_id: a.patient_id,
      eta_minutes: Math.max(0, a.eta_minutes - clock),
      status: a.diverted
        ? "diverted"
        : a.eta_minutes > clock
          ? "en_route"
          : "arrived",
    })),
    patients: D.patients.map((p) => ({
      ...p,
      current_department_id: curDept(D, p, clock),
    })),
  };
}
