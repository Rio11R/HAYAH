# HAYAH | حياة

HAYAH is a prototype for exploring hospital operations and patient flow with synthetic data. It pairs a React-based dashboard with a Python data validator.

> **Live demo:** [hayah-9exm.vercel.app](https://hayah-9exm.vercel.app/)

![HAYAH live demo screenshot](assets/hayah-live-demo.png)

## What you can explore

- A hospital network view, available as a 3D scene or a map
- A 90-minute operational timeline with department and ambulance activity
- Patient, department, and resource details
- Prototype scenario simulations for comparing operational interventions

The interface supports operational exploration only. It does not provide clinical advice, and its predictions and scenario assumptions are not approved for real-world decisions.

## Data

The project uses synthetic data only; it is not connected to a real hospital or medical system. The master dataset includes:

- 50 patients and 3 ambulances
- 5 departments
- 15 staff records, 5 equipment records, and 88 beds

The dataset is in [`data/hayah_master_data_v0_3.json`](data/hayah_master_data_v0_3.json). The web app also contains a copy under `web/src/data/`.

## Run the web app locally

```bash
cd web
npm install
npm run dev
```

Vite prints the local URL when the development server starts. To create a production build:

```bash
npm run build
```

## Validate the dataset

The validator requires Python 3.9 or later and uses only the standard library. From the repository root, run:

```bash
python validate_hayah_data.py data/hayah_master_data_v0_3.json
```

It checks required sections, unique IDs, patient and ambulance links, department metrics, bed totals, and the interactive patient selection. A successful run exits with status `0`; validation errors produce a non-zero exit status.

The current dataset passes with **0 errors** and **5 warnings/decisions**. The warnings document assumptions that still need review, including static incoming-patient estimates, background occupancy, bed-capacity rules, status casing, and unapproved prediction formulas.

## Repository layout

```text
data/                       Synthetic source datasets
web/                        React, Vite, and Three.js frontend
validate_hayah_data.py      Dataset validator
HAYAH_Data_Audit_v0.3_AR.md Arabic audit summary
```

## Limitations

- All records are synthetic and intended for demonstration.
- Incoming-patient estimates are a static snapshot, not live calculations.
- Some occupancy figures include untracked background patients.
- Prediction and simulation rules remain prototype assumptions.
- Do not use this project for clinical care, staffing decisions, or live hospital operations.

---

# النسخة العربية | حياة

حياة نموذج أولي لاستكشاف العمليات في المستشفى وتدفق المرضى باستخدام بيانات اصطناعية. يجمع المشروع بين لوحة معلومات مبنية باستخدام React وأداة للتحقق من البيانات باستخدام Python.

> **التجربة المباشرة:** [hayah-9exm.vercel.app](https://hayah-9exm.vercel.app/)

![لقطة شاشة للتجربة المباشرة لحياة](assets/hayah-live-demo.png)

## ما الذي يمكنك استكشافه؟

- عرض شبكة المستشفى بشكل ثلاثي الأبعاد أو كمخطط
- خط زمني تشغيلي لمدة 90 دقيقة يعرض نشاط الأقسام وسيارات الإسعاف
- تفاصيل المرضى والأقسام والموارد
- محاكاة أولية لسيناريوهات تقارن بين التدخلات التشغيلية

تدعم الواجهة استكشاف العمليات فقط. ولا تقدم نصائح سريرية، كما أن التنبؤات وافتراضات السيناريوهات غير معتمدة للاستخدام في قرارات واقعية.

## البيانات

يستخدم المشروع بيانات اصطناعية فقط، وهو غير متصل بأي مستشفى أو نظام طبي حقيقي. تتضمن مجموعة البيانات الرئيسية:

- 50 مريضًا و3 سيارات إسعاف
- 5 أقسام
- 15 سجلًا للموظفين، و5 سجلات للمعدات، و88 سريرًا

توجد مجموعة البيانات في [`data/hayah_master_data_v0_3.json`](data/hayah_master_data_v0_3.json). كما توجد نسخة منها ضمن `web/src/data/`.

## تشغيل تطبيق الويب محليًا

```bash
cd web
npm install
npm run dev
```

يعرض Vite عنوان التطبيق المحلي عند بدء خادم التطوير. لإنشاء نسخة إنتاجية:

```bash
npm run build
```

## التحقق من مجموعة البيانات

تتطلب أداة التحقق Python 3.9 أو إصدارًا أحدث، وتستخدم المكتبات القياسية المرفقة مع Python فقط. شغّل الأمر التالي من المجلد الرئيسي للمستودع:

```bash
python validate_hayah_data.py data/hayah_master_data_v0_3.json
```

تتحقق الأداة من الأقسام المطلوبة، وتفرّد المعرّفات، وروابط المرضى وسيارات الإسعاف، ومؤشرات الأقسام، وإجمالي الأسرّة، وقائمة المرضى التفاعلية. تنتهي العملية برمز `0` عند نجاح التحقق، وبرمز غير صفري عند وجود أخطاء.

تجتاز مجموعة البيانات الحالية التحقق مع **0 أخطاء** و**5 تحذيرات أو نقاط تحتاج إلى قرار**. وتشمل هذه النقاط تقديرات المرضى القادمين الثابتة، والإشغال الناتج عن مرضى غير مدرجين، وقواعد سعة الأسرّة، واختلاف كتابة الحالات، وصيغ التنبؤ غير المعتمدة.

## بنية المستودع

```text
data/                       مجموعات البيانات الاصطناعية
web/                        الواجهة الأمامية باستخدام React وVite وThree.js
validate_hayah_data.py      أداة التحقق من مجموعة البيانات
HAYAH_Data_Audit_v0.3_AR.md ملخص التدقيق باللغة العربية
```

## القيود

- جميع السجلات اصطناعية ومخصصة للعرض التوضيحي.
- تقديرات المرضى القادمين لقطة ثابتة وليست حسابات مباشرة.
- تتضمن بعض أرقام الإشغال مرضى افتراضيين غير مدرجين في البيانات.
- تظل قواعد التنبؤ والمحاكاة افتراضات خاصة بالنموذج الأولي.
- لا تستخدم هذا المشروع للرعاية السريرية أو قرارات التوظيف أو تشغيل المستشفيات فعليًا.
