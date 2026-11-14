// نموذج اختيار الوجهة للإسعاف. المنشآت المجاورة افتراضية (اصطناعية) وليست منشآت حقيقية.
export const WX = {
  clear: { t: "صافٍ", f: 1 },
  rain: { t: "مطر", f: 0.85 },
  dust: { t: "غبار / ضباب", f: 0.8 },
};
export const TD = {
  off: { t: "خارج الذروة", f: 1 },
  peak: { t: "ساعة الذروة", f: 0.85 },
};
export const CORR = 1.15; // ممر أولوية / تحكم بالإشارات: +15% سرعة (افتراض)
export const V0 = 50; // سرعة أساس بالكم/ساعة لتقدير المسافة (افتراض)
export const STEPS = [
  "المسافة (الأساس)",
  "ازدحام المسار",
  "الطقس",
  "وقت اليوم",
  "ممر الأولوية",
];
const HAY = {
  id: "HAYAH",
  name: "مستشفى حياة (الحالي)",
  ratio: 1,
  route: 1,
  rt: "خفيف",
  bearing: 0,
  ct: true,
  icu: true,
};
// ratio: نسبة المسافة إلى مسافة حياة، route: معامل سرعة المسار (1 خفيف، .8 متوسط، .6 كثيف)، edLoad: حمل الطوارئ
export const HOSP = [
  {
    id: "H-A",
    name: "مستشفى مجاور (أ) · افتراضي",
    ratio: 0.85,
    route: 0.8,
    rt: "متوسط",
    bearing: -50,
    edLoad: 0.62,
    ct: true,
    icu: true,
  },
  {
    id: "H-B",
    name: "مستشفى مجاور (ب) · افتراضي",
    ratio: 1.3,
    route: 1,
    rt: "خفيف",
    bearing: 70,
    edLoad: 0.48,
    ct: true,
    icu: false,
  },
  {
    id: "H-C",
    name: "مستشفى مجاور (ج) · افتراضي",
    ratio: 1.7,
    route: 0.6,
    rt: "كثيف",
    bearing: 150,
    edLoad: 0.85,
    ct: false,
    icu: true,
  },
];
export const waitOf = (load) => Math.round(8 + 60 * Math.max(0, load - 0.5)); // افتراض: انتظار الطوارئ بالدقائق
export function compare(D, rows, amb, cond) {
  const p = D.patients.find((x) => x.patient_id === amb.patient_id),
    path = p.predicted_path;
  const need = { ct: path.includes("RAD-CT"), icu: path.includes("ICU-01") };
  const fw = WX[cond.wx].f,
    ft = TD[cond.td].f,
    fc = cond.corr ? CORR : 1,
    dist0 = (amb.eta_minutes / 60) * V0;
  const list = [HAY, ...HOSP].map((h) => {
    const t0 = amb.eta_minutes * h.ratio,
      t1 = t0 / h.route,
      t2 = t1 / fw,
      t3 = t2 / ft,
      t4 = t3 / fc,
      eta = t4;
    let load = h.edLoad;
    if (h.id === "HAYAH") {
      const r = rows[Math.min(90, Math.round(eta))];
      load = Math.max(
        r["ED-01"].load,
        need.ct ? r["RAD-CT"].load : 0,
        need.icu ? r["ICU-01"].load : 0,
      );
    }
    const wait = waitOf(load),
      pen = (need.ct && !h.ct) || (need.icu && !h.icu) ? 15 : 0;
    return {
      ...h,
      km: dist0 * h.ratio,
      eta,
      steps: [t0, t1 - t0, t2 - t1, t3 - t2, t4 - t3],
      load,
      wait,
      pen,
      total: eta + cond.handover + wait + pen,
    };
  });
  return {
    p,
    need,
    list,
    best: list.reduce((a, b) => (b.total < a.total ? b : a)),
  };
}
