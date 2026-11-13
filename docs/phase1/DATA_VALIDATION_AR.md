# نتائج فحص البيانات — Phase 1

This document preserves the original Phase 1 observational report. Active reproduction examples now use the canonical dataset path; they do not make the historical results a fresh validation of the reconciled workspace. See `README_AR.md` for reconciliation provenance and current validation results.

المرجع المحلي: `87ee702750e24e4ecebb241d1fd1f3a0220ce467`، والملف المفحوص هو JSON الأصلي دون تعديل. نُفّذ الفحص على هذه النسخة؛ تعذرت مزامنة Git عبر الـProxy سابقًا، وأذن الريان بالمتابعة محليًا. هذا تحقق من لقطة اصطناعية، وليس اعتمادًا سريريًا أو اعتمادًا نهائيًا لـDEC-06.

## المدقق الأصلي

من جذر المستودع:

```bash
python info/validate_hayah_data.py data/hayah_master_data_v0_3.json
```

النتيجة الفعلية: رمز خروج **0**، **0 أخطاء**، **5 تحذيرات/قرارات**، و`PASS: structural and snapshot consistency checks`.

| المجموعة | العدد الفعلي |
|---|---:|
| المرضى | 50 |
| سيارات الإسعاف | 3 |
| الأقسام | 5 |
| الطاقم | 15 |
| المعدات | 5 |
| الأسرّة | 88 |

لا معرفات كيانات مكررة: **166 معرفًا فريدًا** في المجموعات الست، حتى عند مقارنتها معًا. الحالات التفاعلية الثماني هي `PAT-001` إلى `PAT-008` بالترتيب المحدد في `meta.interactive_patient_ids`. توجد بيانات مستشفى واحد في `meta.hospital` بمعرف `HOSP-01` و`meta.synthetic = true`. السجلات لا تحتوي مفاتيح مستشفى مستقلة؛ استنتاج انتمائها للمستشفى الواحد يخص بنية هذه العينة، ولا يثبت ربطًا متعدد المستشفيات.

## تحقق إضافي من العينة

نُفّذت قراءة إضافية للحقول الموجودة: جميع الحقول المدرجة أدناه موجودة بالأنواع المتوقعة من هذه العينة، لا `null` ولا أرقام غير منتهية، ولا قيم نصية فارغة إلا `ambulance_id` و`next_department_id` وفق الاتفاق الموجود. قيم الوقت في المعدات قابلة للقراءة كتاريخ ISO. **0 أخطاء إضافية**.

فُحصت جميع عناصر `predicted_path`، ومراجع الأقسام والموارد، والربط المتبادل بين المرضى والإسعاف، ومعرفات القائمة التفاعلية ومفاتيح `meta.triage_basis`؛ جميعها تشير إلى سجلات موجودة. هذه فحوص وصفية للعينة الحالية، ولا تفرض قاموسًا سريريًا أو قيم حالات جديدة.

| القسم | السعة | الإشغال | الانتظار المتتبَّع | القادم الثابت | المرضى المتتبَّعون حاليًا | الطاقم | المعدات | الأسرّة: مشغول/متاح/خارج الخدمة |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| ED-01 | 40 | 32 | 11 | 4 | 16 | 4 | 2 | 32 / 8 / 0 |
| RAD-CT | 15 | 13 | 2 | 5 | 5 | 4 | 1 | لا أسرّة |
| LAB-01 | 20 | 6 | 4 | 5 | 6 | 2 | 1 | لا أسرّة |
| ICU-01 | 8 | 5 | 0 | 2 | 5 | 2 | 1 | 5 / 3 / 0 |
| WARD-01 | 40 | 15 | 3 | 7 | 15 | 3 | 0 | 15 / 24 / 1 |

المدقق الأصلي تحقّق من توافق `queue_length` و`predicted_incoming` و`status` مع قواعد اللقطة الموجودة بالفعل في `meta.derivation_rules`. لم تُنشأ معادلات جديدة، ولم يُنفّذ حساب ضغط تشغيلي حي. نسب التقرير الأصلي (90%، 120%، 55%، 87.5%، 55%) تخص قاعدته الحالية فقط؛ نسبة CT البالغة 120% تمثل طلبًا متوقعًا يتجاوز السعة، لا إشغالًا فعليًا أكبر منها.

## التحذيرات الخمسة الفعلية

1. `WARD-01`: سرير خارج الخدمة محسوب ضمن السعة الإجمالية 40. يلزم اعتماد معنى السعة الفعّالة قبل الحساب الحي.
2. `predicted_incoming` لقطة ثابتة؛ تغيير ETA يحتاج قاعدة زمنية/إعادة حساب معتمدة.
3. الإشغال يتضمن مرضى خلفية غير مفصّلين؛ لا يُعاد حسابه من عدد السجلات المتتبَّعة وحده. الفرق ظاهر في ED وCT.
4. كتابة الحالات تختلف: `En_route`/`en_route` و`Available`/`available`. لم تُوحّد القيم.
5. محرك السيناريوهات وقواعد التنبؤ تحتاج اعتماد الفريق ضمن DEC-04 وDEC-06.

هذه تحذيرات وقرارات موثقة وليست أخطاء بنيوية. أعداد الطاقم والمعدات رمزية، ولا تتوافر أوقات خدمة تكفي لتقدير انتظار أو نتائج محاكاة موثوقة. وجود `schema_basis` لا يحسم DEC-06، وأوصاف `triage_basis` ليست قواعد لاتخاذ قرار طبي.

## حدود المدقق الأصلي

المدقق يعمل على الملف الحالي بنجاح، لكنه ليس JSON Schema مكتملًا: لا يفحص كل عناصر المسار مقابل معرفات الأقسام، ولا يرفض كل حالات النوع غير المناسب أو `NaN`/`Infinity`، وقد يرفع استثناء عند نقص بعض الحقول بدل إرجاع رسالة فحص. لا نعدّ ذلك خطأ في العينة الحالية. الفحص الإضافي الآتي يكمّل قراءة هذه العينة فقط؛ اعتماد المخطط النهائي ما زال معلّقًا.

لإعادة فحص الأنواع والقيم والمراجع الإضافية دون حزمة خارجية، شغّل من جذر المستودع:

```bash
python - <<'PY'
import json, math
from datetime import datetime
from pathlib import Path

d = json.loads(Path('data/hayah_master_data_v0_3.json').read_text(encoding='utf-8-sig'))
fields = {
    'patients': 'patient_id status triage_level ambulance_id current_department_id next_department_id predicted_path',
    'ambulances': 'ambulance_id eta_minutes status patient_id',
    'departments': 'department_id type capacity occupied queue_length predicted_incoming status',
    'staff': 'staff_id department_id role status',
    'equipment': 'equipment_id department_id status last_update',
    'beds': 'bed_id department_id status',
}
numeric = {'eta_minutes', 'capacity', 'occupied', 'queue_length', 'predicted_incoming'}
ids = {s: {r[fs.split()[0]] for r in d[s]} for s, fs in fields.items()}
all_ids = [r[fs.split()[0]] for s, fs in fields.items() for r in d[s]]
assert len(all_ids) == len(set(all_ids)) == 166
for section, fs in fields.items():
    for r in d[section]:
        for f in fs.split():
            v = r[f]
            if f == 'predicted_path':
                assert isinstance(v, list) and v
                assert all(isinstance(x, str) and x in ids['departments'] for x in v)
            elif f == 'triage_level':
                assert type(v) is int
            elif f in numeric:
                assert type(v) in (int, float) and math.isfinite(v) and v >= 0
                if f == 'capacity': assert v > 0
            else:
                assert isinstance(v, str) and (v or f in ('ambulance_id', 'next_department_id'))
        if section == 'equipment': datetime.fromisoformat(r['last_update'].replace('Z', '+00:00'))
for p in d['patients']:
    assert p['current_department_id'] in ids['departments'] | {'Ambulance'}
    assert not p['next_department_id'] or p['next_department_id'] in ids['departments']
    if p['ambulance_id']:
        assert any(a['ambulance_id'] == p['ambulance_id'] and a['patient_id'] == p['patient_id'] for a in d['ambulances'])
for a in d['ambulances']:
    assert a['patient_id'] in ids['patients']
    assert [p['patient_id'] for p in d['patients'] if p['ambulance_id'] == a['ambulance_id']] == [a['patient_id']]
for s in ('staff', 'equipment', 'beds'):
    assert all(r['department_id'] in ids['departments'] for r in d[s])
interactive = d['meta']['interactive_patient_ids']
assert len(interactive) == len(set(interactive)) == 8 and set(interactive) <= ids['patients']
assert set(d['meta']['triage_basis']) == ids['patients']
assert d['meta']['synthetic'] is True and d['meta']['hospital']['hospital_id'] == 'HOSP-01'
print('PASS: supplemental observational checks; 166 unique entity IDs')
PY
```

بصمة SHA-256 لملف JSON الأصلي: `91f80829952bb3d2f9667bd2b5c946950ce716efa1769f315add3031ae3a55de`.
