import re, json, pathlib

SRC = pathlib.Path("/home/algayalm/Työpöytä/Market-Entry/newContent/Tradelomacy-Website (5).html")
OUT_CSS = pathlib.Path("apps/web/src/features/marketing/marketing.css")
JSON_SRC = pathlib.Path("/home/algayalm/Työpöytä/Market-Entry/newContent/Tradelomacy-Website-Content.json")
OUT_JSON = pathlib.Path("apps/web/public/tradelomacy-content.json")

html = SRC.read_text(encoding="utf-8")
css = re.search(r"<style>(.*?)</style>", html, re.S).group(1)


def scope_selectors(sel):
    parts = [p.strip() for p in sel.split(",")]
    res = []
    for p in parts:
        if not p:
            continue
        if p in (":root", "html", "body"):
            res.append(p)
            continue
        comps = re.split(r"(\s*[>+~]\s*|\s+)", p)
        new = []
        for tok in comps:
            if tok.strip() == "" or re.match(r"^[>+~]?\s*$", tok):
                new.append(tok)
            else:
                new.append(".tl " + tok)
        res.append("".join(new))
    return ", ".join(res)


def parse(s):
    out = []
    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c == "@":
            j = s.find("{", i)
            at = s[i:j].strip()
            depth = 0
            k = j
            while k < n:
                if s[k] == "{":
                    depth += 1
                elif s[k] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                k += 1
            body = s[j + 1:k]
            if at.startswith(("@media", "@supports")):
                out.append(at + " {\n" + parse(body) + "}\n")
            else:
                out.append(at + " {\n" + body + "}\n")
            i = k + 1
        elif c == "}":
            i += 1
        else:
            j = s.find("{", i)
            if j == -1:
                break
            sel = s[i:j].strip()
            depth = 0
            k = j
            while k < n:
                if s[k] == "{":
                    depth += 1
                elif s[k] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                k += 1
            body = s[j + 1:k]
            out.append(scope_selectors(sel) + " { " + body.strip() + " }\n")
            i = k + 1
    return "".join(out)


scoped = parse(css)
OUT_CSS.write_text(scoped, encoding="utf-8")

data = json.loads(JSON_SRC.read_text(encoding="utf-8"))
OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
OUT_JSON.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

print("CSS bytes:", OUT_CSS.stat().st_size, "scoped rules:", scoped.count("}"))
print("JSON bytes:", OUT_JSON.stat().st_size)

f = data["forms"]
print("\nSTART fields:")
for x in f["start"]["fields"]:
    print("  ", {k: x.get(k) for k in ("name", "label", "kind", "required", "placeholder")})
print("\nORG types:", f["organization"]["types"])
print("ORG support:", f["organization"]["support"])
print("\nPAGES:")
for pk, pv in data["pages"].items():
    print("  ", pk, "label=", pv.get("label"), "secs=", [s.get("type") for s in pv.get("sections", [])])
print("\nNAV:", json.dumps([{"label": n["label"], "href": n["href"], "children": [c["href"] for c in (n.get("children") or [])]} for n in data["global"]["nav"]], ensure_ascii=False))
