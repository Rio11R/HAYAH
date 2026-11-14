# HAYAH | حياة — الواجهة الأمامية (React + Vite + Three.js)
بيانات اصطناعية فقط. تقرأ `src/data` (نسخة مطابقة لـ `../data`).

## التشغيل
    npm install
    npm run dev      # http://localhost:5173
    npm run build

## لوحة القيادة (خط زمني 0–90 دقيقة)
- شريط زمني مع تشغيل/إيقاف/إعادة وعلامات وصول الإسعاف وأوقات التشبّع المتوقعة.
- مؤشرات KPI، وتوأم الشبكة (ثلاثي الأبعاد أو مخطط)، وبطاقات الأقسام، وتفاصيل القسم مع منحنى توقع الحمل.
- محاكاة 5 تدخلات (قبل/بعد)، ثم اعتماد بشري يُسجَّل في سجل القرارات.
- رحلة المريض للحالات التفاعلية.

## البنية
- `src/engine/` data.js (قراءة JSON) · model.js (run/summ/curDept/toScene).
- `src/twins/` كل توأم في ملف: Hospital, Department, Patient, Ambulance, Bed, Staff, Equipment.
- `src/components/` Timeline, NetworkMap, LoadChart, DeptDetail, SimPanel, DecisionLog, Navbar.
- `src/scene/Scene3D.jsx` المشهد ثلاثي الأبعاد · `src/pages/` Landing, Dashboard.

## افتراضات تحتاج اعتماد
معدلات `LAM`/`MU` في `model.js` (دخول خلفي وإنجاز لكل قسم) وأثر التدخلات الخمسة افتراضات نموذجية، وليست قياسًا سريريًا ولا قاعدة معتمدة في MPS.
