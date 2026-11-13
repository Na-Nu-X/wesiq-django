"""
Review helper for the gettext catalogs (run inside the web container).

  python locale/tools/po_tool.py dump <lang> [todo]   -> numbered lines: KEY | msgid | current msgstr
  python locale/tools/po_tool.py apply <lang> <json>  -> applies {"KEY": "new msgstr" | ["plural0", ...]} and clears fuzzy flags

KEY is "d<n>" (django domain) or "j<n>" (djangojs) in catalog order. Newlines are shown as "⏎".
Template indentation in multi-line {% blocktranslate %} strings is re-added automatically on apply.
"""
import json, re, sys
import polib

def entries(lang):
    out = []
    for prefix, domain in (("d", "django"), ("j", "djangojs")):
        path = f"locale/{lang}/LC_MESSAGES/{domain}.po"
        po = polib.pofile(path, wrapwidth = 0)
        active = [e for e in po if not e.obsolete]
        for i, e in enumerate(active):
            out.append((f"{prefix}{i}", e, po, path))
    return out

def show(text):
    return re.sub(r"\s*\n\s*", "⏎", text.strip()) if "\n" in text.strip() else text.replace("\n", "⏎")

def dump(lang, todo_only = False):
    for key, e, _po, _path in entries(lang):
        is_todo = e.fuzzy or (not e.msgstr and not any(e.msgstr_plural.values()))
        if todo_only and not is_todo:
            continue
        cur = " ‖ ".join(show(v) for _k, v in sorted(e.msgstr_plural.items())) if e.msgid_plural else show(e.msgstr)
        flag = "TODO " if is_todo else ""
        src = show(e.msgid) + (f" ‖PL‖ {show(e.msgid_plural)}" if e.msgid_plural else "")
        print(f"{key} | {flag}{src} | {'' if is_todo else cur}")

def restore_layout(msgid, text):
    """Keeps the msgid's leading/trailing whitespace (template indentation) around the new text and turns ⏎ into newlines."""
    text = text.replace("⏎", "\n")
    if "\n" in msgid.strip() or msgid != msgid.strip():
        lead = msgid[:len(msgid) - len(msgid.lstrip())]
        trail = msgid[len(msgid.rstrip()):]
        return lead + text.strip("\n") + trail if (lead or trail) else text
    return text

def apply(lang, json_path):
    fixes = json.load(open(json_path, encoding = "utf-8"))
    touched = {}
    for key, e, po, path in entries(lang):
        if key not in fixes:
            continue
        value = fixes.pop(key)
        if e.msgid_plural:
            values = value if isinstance(value, list) else [value]
            nplurals = int(re.search(r"nplurals=(\d+)", po.metadata["Plural-Forms"]).group(1))
            values = (values + [values[-1]] * nplurals)[:nplurals]
            e.msgstr_plural = {i: restore_layout(e.msgid_plural if i else e.msgid, v) for i, v in enumerate(values)}
        else:
            e.msgstr = restore_layout(e.msgid, value)
        if "fuzzy" in e.flags:
            e.flags.remove("fuzzy")
        e.previous_msgid = None
        e.previous_msgid_plural = None
        touched[path] = po
    for path, po in touched.items():
        po.save(path)
    if fixes:
        print("UNKNOWN KEYS:", list(fixes)[:20])
    print(f"{lang}: applied to {len(touched)} file(s)")

def dump_ref(lang, ref = "en"):
    """key | reference translation (English) | current translation (TODO when missing/fuzzy)"""
    ref_entries = {(key[0], e.msgid, e.msgctxt): e for key, e, _po, _path in entries(ref)}
    for key, e, _po, _path in entries(lang):
        r = ref_entries.get((key[0], e.msgid, e.msgctxt))
        rtext = (" ‖ ".join(show(v) for _k, v in sorted(r.msgstr_plural.items())) if r.msgid_plural else show(r.msgstr)) if r else "?"
        is_todo = e.fuzzy or (not e.msgstr and not any(e.msgstr_plural.values()))
        cur = " ‖ ".join(show(v) for _k, v in sorted(e.msgstr_plural.items())) if e.msgid_plural else show(e.msgstr)
        print(f"{key} | {rtext} | {'TODO' if is_todo else cur}")

if __name__ == "__main__":
    cmd, lang = sys.argv[1], sys.argv[2]
    if cmd == "dump":
        dump(lang, len(sys.argv) > 3 and sys.argv[3] == "todo")
    elif cmd == "ref":
        dump_ref(lang)
    elif cmd == "apply":
        apply(lang, sys.argv[3])
