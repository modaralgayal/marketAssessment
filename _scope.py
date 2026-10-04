import re

P = "apps/web/src/features/marketing/marketing.css"
css = open(P, encoding="utf-8").read()


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
open(P, "w", encoding="utf-8").write(scoped)
print("scoped bytes:", len(scoped), "rules:", scoped.count("}"))
