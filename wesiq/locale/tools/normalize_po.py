"""Normalizes whitespace of translations to match their msgid (run in the web container): python locale/tools/normalize_po.py"""
import glob, re
import polib

def normalize(msgid, msgstr):
    if not msgstr:
        return msgstr
    lead = msgid[:len(msgid) - len(msgid.lstrip())]
    trail = msgid[len(msgid.rstrip()):]
    core_id = msgid.strip()
    core_str = msgstr.strip()
    # Same paragraph structure as the source: reuse the source's line-break separators when the segment counts match
    id_seps = re.findall(r"\s*\n\s*", core_id)
    str_parts = re.split(r"\s*\n\s*", core_str)
    if id_seps and len(str_parts) == len(id_seps) + 1:
        id_seps = ["\n\n" if sep.count("\n") >= 2 else "\n" for sep in id_seps]
        core_str = "".join(part + (id_seps[i] if i < len(id_seps) else "") for i, part in enumerate(str_parts))
    return lead + core_str + trail

changed = 0
for path in sorted(glob.glob("locale/*/LC_MESSAGES/*.po")):
    if "zh_Hans" in path:
        continue
    po = polib.pofile(path, wrapwidth = 0)
    dirty = False
    for e in po:
        if e.obsolete:
            continue
        if e.msgid_plural:
            for k, v in list(e.msgstr_plural.items()):
                src = e.msgid if k == 0 else e.msgid_plural
                new = normalize(src, v)
                if new != v:
                    e.msgstr_plural[k] = new; dirty = True; changed += 1
        else:
            new = normalize(e.msgid, e.msgstr)
            if new != e.msgstr:
                e.msgstr = new; dirty = True; changed += 1
    if dirty:
        po.save(path)
print("normalized:", changed)
