"""Mechanical checks for the gettext catalogs. Run inside the web container: python locale/tools/lint_po.py"""
import glob, re, sys, collections
import polib

LANGS = ["en", "sk", "cs", "de", "es", "fr", "pt_BR", "ru", "uk"]
PH = re.compile(r"%\(\w+\)[sd]|%[sd]|\{\w*\}")
TAG = re.compile(r"</?([a-zA-Z]+)[^>]*>")
SK_ONLY = re.compile(r"[ľĽĺĹŕŔ]|\b(alebo|nie je|príspevok|príspevky|používateľ\w*|užívateľ\w*|došlo k chybe|úspešne|sa nenašiel|zadajte)\b", re.I)

def check(entry, msgstr, lang):
    problems = []
    src = entry.msgid
    if sorted(PH.findall(src)) != sorted(PH.findall(msgstr)):
        problems.append(f"placeholders {sorted(PH.findall(src))} vs {sorted(PH.findall(msgstr))}")
    if collections.Counter(TAG.findall(src)) != collections.Counter(TAG.findall(msgstr)):
        problems.append("html tags differ")
    # Multi-line {% blocktranslate %} Text: Indentation And Line Breaks Collapse In HTML, So Only Single-Line Strings Are Checked
    if "\n" not in src.strip():
        if src.strip().count("\n") != msgstr.strip().count("\n"):
            problems.append(f"newlines {src.count(chr(10))} vs {msgstr.count(chr(10))}")
        if (src[:1] == " ") != (msgstr[:1] == " ") or (src[-1:] == " ") != (msgstr[-1:] == " "):
            problems.append("leading/trailing space differs (words get glued together)")
    elif src.strip().count("\n") != msgstr.strip().count("\n"):
        problems.append(f"inner line breaks {src.strip().count(chr(10))} vs {msgstr.strip().count(chr(10))}")
    if lang not in ("sk", "cs") and SK_ONLY.search(msgstr):
        problems.append("looks like untranslated Slovak")
    if lang in ("ru", "uk") and re.search(r"[A-Za-z][А-Яа-яЁёІіЇїЄєҐґ]|[А-Яа-яЁёІіЇїЄєҐґ][A-Za-z]", msgstr):
        problems.append("mixed Latin/Cyrillic letters in one word")
    if "  " in msgstr.strip() and "  " not in src.strip():
        problems.append("double space")
    return problems

total = 0
for lang in LANGS:
    for domain in ("django", "djangojs"):
        po = polib.pofile(f"locale/{lang}/LC_MESSAGES/{domain}.po")
        for e in po:
            if e.obsolete:
                continue
            if e.fuzzy or (not e.msgstr and not e.msgstr_plural):
                print(f"{lang}/{domain}: NOT TRANSLATED/FUZZY: {e.msgid[:70]!r}")
                total += 1
                continue
            strings = [e.msgstr] if not e.msgid_plural else list(e.msgstr_plural.values())
            for s in strings:
                for p in check(e, s, lang):
                    print(f"{lang}/{domain}: {p}: {e.msgid[:60]!r} -> {s[:60]!r}")
                    total += 1
print(f"TOTAL PROBLEMS: {total}")
sys.exit(1 if total else 0)
