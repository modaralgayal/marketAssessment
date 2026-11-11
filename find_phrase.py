import os, glob

TARGET = "GCC Distributor Intelligence"
ROOT = "/home/algayalm/Työpöytä/Market-Entry"

files = []
files.append(os.path.join(ROOT, "Integrate Us/MarketEntryAssessment/apps/web/public/tradelomacy-content.json"))
files.append(os.path.join(ROOT, "newContent/Tradelomacy-Website (5).html"))

for f in files:
    if not os.path.exists(f):
        print("MISSING:", f)
        continue
    try:
        data = open(f, "r", encoding="utf-8", errors="replace").read()
    except Exception as e:
        print("ERR", f, e)
        continue
    print("=" * 60)
    print("FILE:", f, "size:", len(data))
    idx = 0
    count = 0
    while True:
        i = data.find(TARGET, idx)
        if i == -1:
            break
        count += 1
        start = max(0, i - 120)
        end = min(len(data), i + len(TARGET) + 120)
        print(f"\n--- occurrence {count} at char {i} ---")
        print(data[start:end].replace("\n", " "))
        idx = i + 1
    print(f"\nTOTAL exact occurrences in {os.path.basename(f)}: {count}")
