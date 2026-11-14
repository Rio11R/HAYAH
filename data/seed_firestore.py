"""
HAYAH-1 — رفع ملفات JSON إلى Firestore (idempotent: تشغيله أكثر من مرة آمن).

الاستخدام:
    pip install firebase-admin
    python seed_firestore.py --key serviceAccount.json            # رفع فعلي
    python seed_firestore.py --dry-run                            # عدّ فقط بدون اتصال
"""
import argparse, json, sys

MASTER = "hayah_master_data_v0_3.json"
EXTRA = "hayah_equipment_beds_sensors_v0_1.json"


def build_docs(master, extra):
    """يرجع dict: {collection: {doc_id: data}}"""
    out = {}
    triage = master["meta"].get("triage_basis", {})

    # --- الجداول الرئيسية: doc id = المعرّف الأصلي ---
    out["departments"] = {d["department_id"]: d for d in master["departments"]}
    out["ambulances"] = {a["ambulance_id"]: a for a in master["ambulances"]}
    out["staff"] = {s["staff_id"]: s for s in master["staff"]}
    out["beds"] = {b["bed_id"]: b for b in master["beds"]}

    # patients + سبب الفرز مدمج (بدل collection منفصل)
    out["patients"] = {
        p["patient_id"]: {**p, "triage_basis": triage.get(p["patient_id"], "")}
        for p in master["patients"]
    }

    # equipment = master + catalog مدموجين
    catalog = {c["equipment_id"]: c for c in extra["availability"]["equipment_catalog"]}
    out["equipment"] = {
        e["equipment_id"]: {**catalog.get(e["equipment_id"], {}), **e}
        for e in master["equipment"]
    }

    # sensors + آخر قراءة مدمجة في نفس المستند
    readings = {r["sensor_id"]: r for r in extra["virtual_sensors"]["initial_readings"]}
    sensors = {}
    for s in extra["virtual_sensors"]["sensors"]:
        sensors[s["sensor_id"]] = {**s, "last_reading": readings.get(s["sensor_id"])}
    # حساسات الأسرّة تُولَّد من القالب (88 سرير)
    tpl = extra["virtual_sensors"]["sensor_templates"][0]
    for b in master["beds"]:
        sid = tpl["sensor_id_pattern"].format(bed_id=b["bed_id"])
        sensors[sid] = {
            "sensor_id": sid, "sensor_type": tpl["sensor_type"], "entity_type": "bed",
            "entity_id": b["bed_id"], "department_id": b["department_id"],
            "field": tpl["field"], "unit": tpl["unit"],
            "update_interval_seconds": tpl["update_interval_seconds"],
            "max_staleness_seconds": tpl["max_staleness_seconds"],
            "last_reading": {"value": 1 if b["status"] == "occupied" else 0,
                             "timestamp": extra["meta"]["snapshot_timestamp"], "quality": "good"},
        }
    out["sensors"] = sensors

    # config: وثائق مفردة للقواعد (تُقرأ كلها مرة واحدة)
    av = extra["availability"]
    out["config"] = {
        "meta": master["meta"],
        "transitions": {"items": av["transitions"]},
        "state_models": av["state_models"],
        "availability_impact": av["availability_impact"],
        "sensor_profiles": extra["virtual_sensors"]["update_frequency_profiles"],
    }
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", help="مسار serviceAccount.json")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    master = json.load(open(MASTER, encoding="utf-8"))
    extra = json.load(open(EXTRA, encoding="utf-8"))
    docs = build_docs(master, extra)

    total = sum(len(v) for v in docs.values())
    for c, v in docs.items():
        print(f"{c:<12} {len(v)} docs")
    print(f"TOTAL        {total} docs")
    if args.dry_run:
        return

    import firebase_admin
    from firebase_admin import credentials, firestore
    firebase_admin.initialize_app(credentials.Certificate(args.key))
    db = firestore.client()

    batch, n = db.batch(), 0
    for coll, items in docs.items():
        for doc_id, data in items.items():
            batch.set(db.collection(coll).document(doc_id), data)  # set = upsert
            n += 1
            if n % 400 == 0:           # حد Firestore: 500 عملية/batch
                batch.commit(); batch = db.batch()
    batch.commit()
    print("✅ done")


if __name__ == "__main__":
    sys.exit(main())
