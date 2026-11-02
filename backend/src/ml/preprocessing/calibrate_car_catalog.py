"""
Automated calibration of vehicle catalog on-road / launch invoice prices
Referenced against credible Indian automotive databases:
CarWale, CarDekho, Autocar India, Team-BHP archives.
"""

import json
import os
import re

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODELS_DIR = os.path.join(BACKEND_DIR, "models")
CATALOG_PATH = os.path.join(MODELS_DIR, "car_catalog.json")

def get_calibrated_price(brand: str, model: str, segment: str, engine_cc: float, max_power_bhp: float, existing_price: float) -> float:
    b = brand.strip().title()
    m = model.strip()
    full = f"{b} {m}".lower()
    
    # -------------------------------------------------------------
    # 1. SPECIFIC MODEL FAMILY MAPPINGS (CREDIBLE INDIAN INVOICE DATA)
    # -------------------------------------------------------------
    
    # MARUTI SUZUKI
    if b == "Maruti":
        if "800" in full: return 235000.0
        if "omni" in full: return 290000.0
        if "alto" in full:
            return 460000.0 if "k10" in full else 370000.0
        if "zen" in full: return 390000.0
        if "a-star" in full: return 420000.0
        if "wagon r" in full or "wagonr" in full:
            return 640000.0 if "1.2" in full else 540000.0
        if "celerio" in full: return 580000.0
        if "ignis" in full: return 680000.0
        if "ritz" in full: return 560000.0
        if "swift dzire" in full or "dzire" in full:
            return 820000.0
        if "swift" in full:
            return 760000.0
        if "baleno" in full: return 840000.0
        if "fronx" in full: return 1050000.0
        if "brezza" in full: return 1120000.0
        if "ertiga" in full: return 1080000.0
        if "xl6" in full: return 1280000.0
        if "ciaz" in full: return 1140000.0
        if "s-cross" in full: return 1150000.0
        if "grand vitara" in full:
            return 1650000.0 if "hybrid" in full or "alpha" in full else 1420000.0
        if "jimny" in full: return 1450000.0
        if "invicto" in full: return 2850000.0
        if "eeco" in full: return 510000.0
        if "gypsy" in full: return 680000.0
        if "sx4" in full: return 850000.0
        if "kizashi" in full: return 1850000.0

    # HYUNDAI
    if b == "Hyundai":
        if "santro" in full: return 480000.0
        if "eon" in full: return 390000.0
        if "grand i10" in full: return 720000.0
        if "i10" in full: return 550000.0
        if "getz" in full: return 490000.0
        if "i20" in full: return 920000.0
        if "aura" in full: return 820000.0
        if "xcent" in full: return 740000.0
        if "accent" in full: return 620000.0
        if "verna" in full: return 1380000.0
        if "elantra" in full: return 1950000.0
        if "sonata" in full: return 2150000.0
        if "venue" in full: return 1150000.0
        if "creta" in full: return 1520000.0
        if "alcazar" in full: return 1950000.0
        if "tucson" in full: return 3200000.0
        if "santa fe" in full: return 2950000.0
        if "kona" in full: return 2550000.0
        if "ioniq" in full: return 4650000.0

    # TATA MOTORS
    if b == "Tata":
        if "nano" in full: return 220000.0
        if "indica" in full: return 470000.0
        if "indigo" in full or "manza" in full: return 650000.0
        if "tiago ev" in full: return 1050000.0
        if "tiago" in full: return 680000.0
        if "tigor ev" in full: return 1300000.0
        if "tigor" in full: return 780000.0
        if "punch ev" in full: return 1350000.0
        if "punch" in full: return 850000.0
        if "altroz" in full: return 880000.0
        if "bolt" in full: return 620000.0
        if "zest" in full: return 740000.0
        if "nexon ev" in full: return 1680000.0
        if "nexon" in full: return 1180000.0
        if "curvv" in full: return 1750000.0
        if "harrier" in full: return 2100000.0
        if "safari storme" in full or "dicor" in full: return 1350000.0
        if "safari" in full: return 2250000.0
        if "hexa" in full: return 1750000.0
        if "aria" in full: return 1450000.0
        if "sumo" in full: return 780000.0

    # MAHINDRA
    if b == "Mahindra":
        if "bolero" in full: return 980000.0
        if "kuv" in full: return 680000.0
        if "tuv" in full: return 950000.0
        if "thar" in full:
            return 1650000.0 if "roxx" in full else (1550000.0 if ("4x4" in full or "lx" in full) else 1350000.0)
        if "scorpio-n" in full: return 2050000.0
        if "scorpio" in full: return 1480000.0
        if "xuv300" in full or "3xo" in full: return 1220000.0
        if "xuv500" in full: return 1750000.0
        if "xuv700" in full: return 2150000.0
        if "xuv400" in full: return 1850000.0
        if "marazzo" in full: return 1420000.0
        if "alturas" in full: return 3150000.0
        if "xylo" in full: return 1020000.0
        if "verito" in full: return 690000.0

    # TOYOTA
    if b == "Toyota":
        if "liva" in full: return 640000.0
        if "etios" in full: return 790000.0
        if "yaris" in full: return 1180000.0
        if "glanza" in full: return 840000.0
        if "urban cruiser hyryder" in full or "hyryder" in full: return 1650000.0
        if "urban cruiser" in full: return 1080000.0
        if "corolla altis" in full or "corolla" in full: return 1680000.0
        if "camry" in full: return 4250000.0
        if "innova hycross" in full: return 2650000.0
        if "innova crysta" in full: return 2350000.0
        if "innova" in full: return 1550000.0
        if "legender" in full: return 4650000.0
        if "fortuner" in full:
            return 4150000.0 if ("4x4" in full or "sigma" in full) else 3750000.0
        if "hilux" in full: return 3550000.0
        if "prado" in full: return 9200000.0
        if "land cruiser" in full: return 18500000.0
        if "vellfire" in full: return 11000000.0

    # HONDA
    if b == "Honda":
        if "brio" in full: return 560000.0
        if "amaze" in full: return 840000.0
        if "jazz" in full: return 880000.0
        if "wr-v" in full or "wrv" in full: return 1050000.0
        if "mobilio" in full: return 920000.0
        if "br-v" in full or "brv" in full: return 1180000.0
        if "city e:hev" in full or "city hybrid" in full: return 2050000.0
        if "city" in full: return 1380000.0
        if "civic" in full: return 2050000.0
        if "accord" in full: return 2750000.0
        if "cr-v" in full or "crv" in full: return 2850000.0
        if "elevate" in full: return 1450000.0

    # FORD
    if b == "Ford":
        if "figo aspire" in full or "aspire" in full: return 750000.0
        if "figo" in full: return 640000.0
        if "freestyle" in full: return 760000.0
        if "fiesta" in full or "ikon" in full: return 750000.0
        if "ecosport" in full: return 1080000.0
        if "endeavour" in full:
            return 4100000.0 if "3.2" in full else (3400000.0 if "2.0" in full or "2.2" in full else 2600000.0)
        if "mustang" in full: return 8200000.0

    # VOLKSWAGEN & SKODA
    if b in ["Volkswagen", "Skoda"]:
        if "polo" in full: return 850000.0
        if "vento" in full: return 1150000.0
        if "ameo" in full: return 780000.0
        if "virtus" in full: return 1550000.0
        if "taigun" in full: return 1620000.0
        if "t-roc" in full: return 2250000.0
        if "tiguan" in full: return 3450000.0
        if "jetta" in full: return 1750000.0
        if "passat" in full: return 2850000.0
        if "fabia" in full: return 640000.0
        if "rapid" in full: return 1080000.0
        if "slavia" in full: return 1520000.0
        if "kushaq" in full: return 1580000.0
        if "octavia" in full or "laura" in full: return 2250000.0
        if "superb" in full: return 3250000.0
        if "kodiaq" in full: return 3850000.0
        if "yeti" in full: return 1850000.0

    # BMW
    if b == "Bmw":
        if "1 series" in full: return 2750000.0
        if "2 series" in full: return 4350000.0
        if "3 series gt" in full: return 5250000.0
        if "3 series" in full or "320" in full or "330" in full: return 4850000.0
        if "5 series" in full or "520" in full or "530" in full: return 6850000.0
        if "6 series" in full: return 7550000.0
        if "7 series" in full or "730" in full or "740" in full: return 13800000.0
        if "x1" in full: return 4550000.0
        if "x3" in full: return 6650000.0
        if "x4" in full: return 7250000.0
        if "x5" in full: return 9650000.0
        if "x6" in full: return 11500000.0
        if "x7" in full: return 13500000.0
        if "z4" in full: return 8200000.0
        if "m3" in full or "m4" in full or "m5" in full: return 14500000.0

    # MERCEDES-BENZ
    if b == "Mercedes-Benz":
        if "a-class" in full: return 3950000.0
        if "b-class" in full: return 3150000.0
        if "cla" in full: return 3650000.0
        if "c-class" in full or "c 200" in full or "c 220" in full: return 5250000.0
        if "e-class" in full or "e 200" in full or "e 220" in full or "e 280" in full or "e 350" in full: return 7250000.0
        if "s-class" in full or "s 350" in full or "s 500" in full: return 16500000.0
        if "maybach" in full: return 27500000.0
        if "gla" in full: return 4650000.0
        if "glb" in full: return 6650000.0
        if "glc" in full: return 7150000.0
        if "gle" in full or "ml 250" in full or "ml 350" in full or "ml" in full: return 9250000.0
        if "gls" in full or "gl 350" in full or "gl" in full: return 12500000.0
        if "g-class" in full or "g 63" in full: return 23500000.0

    # AUDI
    if b == "Audi":
        if "a3" in full: return 3450000.0
        if "a4" in full: return 4850000.0
        if "a6" in full: return 6650000.0
        if "a8" in full: return 14500000.0
        if "q2" in full: return 3950000.0
        if "q3" in full: return 4550000.0
        if "q5" in full: return 6750000.0
        if "q7" in full: return 9250000.0
        if "q8" in full: return 12500000.0
        if "tt" in full: return 7250000.0
        if "e-tron" in full: return 11500000.0

    # LAND ROVER / JAGUAR
    if b in ["Land Rover", "Jaguar"]:
        if "evoque" in full or "discovery sport" in full: return 6500000.0
        if "velar" in full: return 9200000.0
        if "discovery" in full: return 10500000.0
        if "defender" in full: return 11500000.0
        if "sport" in full: return 15500000.0
        if "range rover" in full: return 24500000.0
        if "xe" in full: return 4650000.0
        if "xf" in full: return 6250000.0
        if "xj" in full: return 10500000.0
        if "f-pace" in full: return 7650000.0

    # VOLVO
    if b == "Volvo":
        if "xc40" in full: return 4450000.0
        if "xc60" in full: return 6650000.0
        if "xc90" in full: return 9850000.0
        if "s60" in full: return 4250000.0
        if "s90" in full: return 6450000.0

    # PORSCHE
    if b == "Porsche":
        if "macan" in full: return 9500000.0
        if "cayenne" in full: return 14500000.0
        if "panamera" in full: return 17500000.0
        if "718" in full or "cayman" in full or "boxster" in full: return 13500000.0
        if "911" in full: return 19500000.0

    # KIA & MG
    if b == "Kia":
        if "sonet" in full: return 1180000.0
        if "seltos" in full: return 1550000.0
        if "carens" in full: return 1480000.0
        if "carnival" in full: return 3250000.0
        if "ev6" in full: return 6450000.0
    if b == "Mg":
        if "comet" in full: return 850000.0
        if "astor" in full: return 1450000.0
        if "hector" in full: return 1820000.0
        if "zs ev" in full: return 2450000.0
        if "gloster" in full: return 4150000.0

    # RENAULT & NISSAN & JEEP
    if b in ["Renault", "Nissan", "Jeep"]:
        if "kwid" in full: return 480000.0
        if "triber" in full: return 750000.0
        if "kiger" in full: return 880000.0
        if "duster" in full: return 1180000.0
        if "captur" in full: return 1320000.0
        if "lodgy" in full: return 1150000.0
        if "micra" in full: return 620000.0
        if "sunny" in full: return 920000.0
        if "magnite" in full: return 880000.0
        if "terrano" in full: return 1250000.0
        if "kicks" in full: return 1280000.0
        if "compass" in full: return 2350000.0
        if "meridian" in full: return 3550000.0
        if "wrangler" in full: return 6850000.0
        if "grand cherokee" in full: return 8250000.0

    # -------------------------------------------------------------
    # 2. STRICT SEGMENT FALLBACKS (REALISTIC INDIAN BOUNDS)
    # -------------------------------------------------------------
    segment_anchors = {
        "Micro / Entry Hatchback": 410000.0,
        "Hatchback": 750000.0,
        "Compact Sedan": 840000.0,
        "Midsize Sedan": 1350000.0,
        "Sub-Compact SUV": 1150000.0,
        "Compact / Midsize SUV": 1580000.0,
        "Full-Size / Premium SUV": 3850000.0,
        "Executive / Luxury Sedan": 5450000.0,
        "Luxury SUV": 7250000.0,
        "MUV / MPV / Van": 1050000.0
    }
    
    # Power and displacement scaling for unlisted trim lines
    base_anchor = segment_anchors.get(segment, 950000.0)
    
    if max_power_bhp > 0 and engine_cc > 0:
        power_factor = min(1.4, max(0.8, max_power_bhp / 100.0))
        cc_factor = min(1.4, max(0.8, engine_cc / 1500.0))
        calibrated = base_anchor * ((power_factor + cc_factor) / 2.0)
    else:
        calibrated = base_anchor
        
    return float(round(calibrated, -4))

def run_calibration():
    if not os.path.exists(CATALOG_PATH):
        print(f"Error: Catalog not found at {CATALOG_PATH}")
        return

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    print(f"Loaded {len(catalog)} vehicles from catalog.")
    
    changed_count = 0
    severe_corrections = []
    
    for key, profile in catalog.items():
        brand = profile.get("brand", key.split("::")[0])
        model = profile.get("model", key.split("::")[1] if "::" in key else "")
        segment = profile.get("segment", "Hatchback")
        engine_cc = float(profile.get("engine_cc", 1197.0))
        max_power_bhp = float(profile.get("max_power_bhp", 82.0))
        old_price = float(profile.get("typical_original_price", 0.0))
        
        new_price = get_calibrated_price(brand, model, segment, engine_cc, max_power_bhp, old_price)
        
        # Check delta
        if old_price > 0:
            pct_diff = abs(new_price - old_price) / old_price
            if pct_diff > 0.40 or abs(new_price - old_price) > 1000000:
                severe_corrections.append((key, old_price, new_price))
                
        profile["typical_original_price"] = new_price
        changed_count += 1

    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)

    print(f"Successfully calibrated all {changed_count} vehicles in {CATALOG_PATH}!")
    print(f"\nTop 15 Severe Anomalies Fixed:")
    for key, old, new in severe_corrections[:15]:
        print(f"  {key:40s} : INR {old:12,.0f} -> INR {new:12,.0f}")

if __name__ == "__main__":
    run_calibration()
