# HAYAH — تسليم Phase 1

هذه المرحلة أدوات فحص بيانات محلية للقراءة فقط، باستخدام Python 3.9+ والمكتبة القياسية دون تثبيت حزم. ليست اختيارًا لتقنية التطبيق النهائية ولا تنفيذًا للتوائم المتغيرة أو التنبؤ أو المحاكاة. لم تُبنَ واجهة ولم يبدأ Phase 2.

## المرجع ونطاق العمل

- قاعدة الفرع: `87ee702750e24e4ecebb241d1fd1f3a0220ce467`، وهي مراجعة النسخة المحلية المطابقة لـ main عند التحقق الأول عبر موصل GitHub.
- العمل على الفرع `phase1/read-only-data-foundation`؛ لا دمج في main.
- قُرئت المصادر الأربعة: MPS v0.3 PDF، JSON الأصلي، تقرير التدقيق، والمدقق الأصلي. الموافقات في MPS ملزمة؛ الاقتراحات التقنية تبقى معلقة.
- الأصل الاصطناعي الوحيد بقي كما هو: 50 مريضًا، 3 سيارات إسعاف، مستشفى افتراضي واحد. الحالات التفاعلية الثماني ضمن الخمسين.
- لم تُغير ملفات المصدر الأربعة أو README الأصلي. أدوات الفحص لا تكتب إلى ملف البيانات ولا تستبدل قيمه الفارغة أو توحد حالات الأحرف.

## الملفات الجديدة

| الملف | الغرض |
|---|---|
| `hayah_inspect.py` | محمل وقراءة مجموعات وسجلات وموارد ومؤشرات وروابط؛ أوامر سطر أوامر محلية |
| `tests/test_hayah_inspect.py` | اختبارات القراءة والعلاقات والبيانات غير الصالحة وعدم تغير البيانات |
| `docs/phase1/DATA_VALIDATION_AR.md` | التدقيق الفعلي، الأعداد والقيود وحدود الفحص |
| `docs/phase1/PROPOSED_FRONTEND_CONTRACT.md` | مدخلات ومخرجات العمليات السبع المقترحة لنور؛ غير معتمدة |
| `docs/phase1/PENDING_DECISIONS_AR.md` | خيارات وتوصيات وآثار وأصحاب اعتماد DEC-04/05/06 والعوائق |
| `docs/phase1/validation-output.txt` | مخرجات تشغيل المدقق الأصلي |
| `docs/phase1/test-output.txt` | مخرجات تنفيذ الاختبارات الفعلية |
| `docs/phase1/source-sha256.json` | بصمات المصادر الأربعة قبل التطوير للتحقق من ثباتها |
| `docs/phase1/README_AR.md` | تعليمات الاستخدام وإعادة الاختبار والتسليم وخطة المرحلة التالية |

## الاستخدام وإعادة الاختبار

من جذر المستودع:

```bash
python -B validate_hayah_data.py hayah_master_data_v0.3.json
python -B -m unittest discover -s tests -v
python -B hayah_inspect.py relationships
python -B hayah_inspect.py get patients PAT-001
python -B hayah_inspect.py get ambulances AMB-101
python -B hayah_inspect.py list departments
python -B hayah_inspect.py resources WARD-01
python -B hayah_inspect.py cases
python -B hayah_inspect.py indicators RAD-CT
```

`snapshot` يعرض كامل البيانات وmetadata؛ ويمكن تمرير `--data PATH` قبل اسم الأمر لفحص نسخة أخرى. المسار الافتراضي للـJSON بجوار الأداة، ولا يتوقف على مجلد تشغيلها.

```python
from hayah_inspect import DatasetInspector

demo = DatasetInspector.load('hayah_master_data_v0.3.json')
patient = demo.get('patients', 'PAT-001')
ambulance = demo.get('ambulances', 'AMB-101')
cases = demo.interactive_patients()
resources = demo.resources('ED-01')
indicators = demo.operational_indicators()  # سجلات الأقسام فقط، لا حساب جديد
errors = demo.relationship_errors()        # [] للنسخة الأصلية
```

كل نتيجة بيانات نسخة عميقة مستقلة؛ لا توجد دالة حفظ أو تحديث. `get` حساس لحالة الأحرف ويثير `KeyError` للمعرف المفقود، واسم مجموعة غير معروف يثير `ValueError`. `resources` و`operational_indicators(id)` يرفضان القسم غير الموجود. `interactive_patients` يتبع ترتيب metadata ويرفض المرجع المفقود بدل اختلاق بديل.

المحمل يتحقق من بنية المجموعات والسجلات والمعرفات وقائمة الاختيار اللازمة للقراءة الآمنة، ويثير `DataInspectionError` عند فسادها. أخطاء قراءة الملف وفك JSON تحتفظ بأنواع Python الأصلية. نجاح التحميل ليس بديلًا لتشغيل المدقق؛ لا يفرض المحمل مخططًا نهائيًا لكل الحقول أو اعتمادًا سريريًا. نتيجة `relationship_errors` تفحص المراجع في الاتجاهين وجميع عناصر المسارات والموارد وmetadata. كود خروج CLI هو 0 للنجاح، 1 لأخطاء العلاقات المكتشفة، و2 لخطأ مدخل/قراءة/معرف؛ هذا سلوك أداة فحص فقط وليس عقد التطبيق المقترح.

للتحقق من بقاء المصادر الأربعة دون تعديل:

```bash
python -B - <<'PY'
import hashlib, json
from pathlib import Path
expected = json.loads(Path('docs/phase1/source-sha256.json').read_text())
for name, digest in expected.items():
    assert hashlib.sha256(Path(name).read_bytes()).hexdigest() == digest, name
print('Source hashes unchanged: 4/4')
PY
```

## نتائج الاختبارات الفعلية

نجح المدقق الأصلي برمز خروج 0: لا أخطاء و5 تحذيرات/قرارات موثقة. نُفّذت 27 حالة اختبار آلي ونجحت جميعها، بما فيها الاختبارات السلبية للمراجع المكسورة والمعرفات/البنية غير الصالحة، واختبارات CLI والنسخ العميقة وثبات بايتات المصدر. السجل الفعلي في `test-output.txt`، وتفاصيل التدقيق وحدوده في `DATA_VALIDATION_AR.md`. ليست هذه اختبارات للمحاكاة أو للتنبؤ أو لتكامل واجهة لم يُنفّذ بعد.

## الحفظ والمراجعة

أُجيز العمل بالنسخة المحلية رغم فشل Git عبر Proxy. لا تُعاد محاولة المسار الفاشل، ولا تُغيّر إعدادات الشبكة أو الاعتمادات. تُحفظ التغييرات أولًا في commit محلي، وتُصدّر كـ patch وحزمة Git وأرشيف مصدر في `/workspace/work/hayah-phase1/exports/`. يورد تقرير التسليم hash الفعلي ونتيجة التحقق من الصادرات ورابط PR إذا نجح موصل GitHub المعتمد. قد يختلف hash commit المنشور عبر API عن المحلي لاختلاف بيانات commit؛ تُتحقق مطابقة شجرة الملفات، ولا يُدّعى نشر hash المحلي دون إثبات.

لتصدير أو إعادة إنشاء التسليم على جهاز يملك المستودع والفرع:

```bash
git format-patch --stdout 87ee702750e24e4ecebb241d1fd1f3a0220ce467..phase1/read-only-data-foundation > hayah-phase1.patch
git bundle create hayah-phase1.bundle phase1/read-only-data-foundation
git archive --format=zip --output=hayah-phase1-source.zip phase1/read-only-data-foundation
```

لتطبيق patch بعد تنزيله أو نقله، داخل نسخة نظيفة من المستودع:

```bash
git switch -c review/hayah-phase1 87ee702750e24e4ecebb241d1fd1f3a0220ce467
git am /path/to/hayah-phase1.patch
python -B validate_hayah_data.py hayah_master_data_v0.3.json
python -B -m unittest discover -s tests -v
```

إذا لم تتوفر المراجعة الأساسية محليًا، اجلبها أولًا بالطريقة المعتمدة على جهازك. لا تطبق patch فوق عمل زملاء غير محفوظ. للمراجعة من الحزمة دون اتصال: `git clone hayah-phase1.bundle HAYAH-phase1-review` ثم شغّل أوامر الاختبار داخل المجلد الجديد. لا يلزم الدمج أو النشر لتشغيل الأدوات.

## ما يحتاج اعتمادًا وخطة Phase 2 المقترحة

1. يراجع الريان ونور وعبدالإله نتائج Phase 1؛ يثبت أحمد والفريق القرارات المعلقة بحسب أصحاب المسؤولية في ملف القرارات. يلزم تحديد أثر ETA، السعة الفعالة، وانتقالات الحالة؛ لا يوجد اعتماد تلقائي بسبب نجاح الاختبارات.
2. بعد موافقة منفصلة على Phase 2، ينفذ الريان ونور تجربة التقنية القصيرة لـ DEC-05، ويثبتون مع عبدالإله DEC-06 وأمثلة المدخلات والمخرجات، مع مراجعة عمار وتاج للموارد.
3. بعد اعتماد قواعد الحالة والتنبؤ، تنفيذ مصدر حالة واحد للعرض وحدث `AMB-101` من 7 إلى 4 دقائق، مع اختبار الترابط وتفسير أثره يدويًا. لا تعديل لملف JSON الأصلي ولا اختراع أثر قبل اعتماد القاعدة.
4. اعتماد DEC-04 وافتراضات الخدمة والتدخلات ومقاييس المقارنة والتوصية؛ ثم تنفيذ البدائل الثلاثة من نفس البداية، مع اختبارات تكرار النتائج وعدم تلويث الأصل.
5. ربط المقارنة والتوصية والقبول/الرفض مع نور واختبار تدفق العرض كاملًا؛ القبول المسجل يطبق التغيير على حالة العرض/المحاكاة فقط. الرفض لا يطبق تدخلًا. بعد تثبيت التدفق الأساسي، توسيع العرض للحالات الثماني وتجربة التشغيل على جهاز آخر.

هذه خطة تالية فقط؛ يتوقف العمل عند تسليم Phase 1 ومراجعتها. لا يبدأ Phase 2 تلقائيًا.
