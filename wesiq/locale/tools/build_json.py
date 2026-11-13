"""
Regenerates locale/<lang>/<lang>.json (msgid -> translation, used by the mobile app) from django.po,
in the same format i18next-conv produced: plural keys "<msgid>_plural" (2 forms) or "<msgid>_<n>" (more forms).
Run in the web container: python locale/tools/build_json.py
"""
import json, re
import polib

LANGS = ["sk", "cs", "en", "es", "fr", "pt_BR", "ru", "uk", "de"]

for lang in LANGS:
    po = polib.pofile(f"locale/{lang}/LC_MESSAGES/django.po")
    nplurals = int(re.search(r"nplurals=(\d+)", po.metadata["Plural-Forms"]).group(1))
    data = {}
    for e in po:
        if e.obsolete or "fuzzy" in e.flags:
            continue
        if e.msgid_plural:
            forms = [e.msgstr_plural.get(i, "") for i in range(nplurals)]
            if not any(forms):
                continue
            if nplurals == 2:
                data[e.msgid], data[e.msgid + "_plural"] = forms
            else:
                for i, form in enumerate(forms):
                    data[f"{e.msgid}_{i}"] = form
        elif e.msgstr:
            data[e.msgid] = e.msgstr
    with open(f"locale/{lang}/{lang}.json", "w", encoding = "utf-8") as file:
        file.write(json.dumps(data, ensure_ascii = False, indent = 4))
    print(lang, len(data))
