"""
Keeps translated URLs consistent (run in the web container):  python locale/tools/url_check.py [--fix]

URL patterns in app/urls.py are translated (msgid = Slovak slug). E-mail texts and JS strings also contain
paths, which must match the route translation of the same language, otherwise the links are dead.
"""
import re, sys
import polib

LANGS = {"sk": "sk", "cs": "cs", "en": "en", "es": "es", "fr": "fr", "pt_BR": "pt-br", "ru": "ru", "uk": "uk", "de": "de"}
ROUTE_IDS = ["domov/", "prihlasenie/", "registracia/", "odhlasenie/", "delete-account/", "komunita/", "prispevok/<str:post_id>",
             "trening/", "moje-treningove-plany/", "profil/<str:username>", "chat/<str:username>", "pridat-clanok/",
             "obnova-hesla/", "moje-hodnotenie/", "platba-uspesna/", "platba-predplatneho-uspesna/"]
# Old / wrong slugs found in the catalogs, mapped to the route they meant
ALIASES = {"training": "trening/", "training-session": "trening/", "ausbildung": "trening/", "capacitacion": "trening/",
           "entrenamiento": "trening/", "obucheniye": "trening/", "navchannya": "trening/", "treninh": "trening/",
           "treinamento": "trening/", "entrainement": "trening/", "trenink": "trening/", "trenirovka": "trening/", "trenuvannya": "trening/", "treino": "trening/",
           "my-training-plans": "moje-treningove-plany/", "meine-trainingspläne": "moje-treningove-plany/", "meine-trainingsplane": "moje-treningove-plany/",
           "me-treninkove-plany": "moje-treningove-plany/", "mes-projets-dentrainement": "moje-treningove-plany/", "mes-projets-d'entrainement": "moje-treningove-plany/",
           "meus-planos-de-treinamento": "moje-treningove-plany/",
           "login": "prihlasenie/", "acceso": "prihlasenie/", "se-connecter": "prihlasenie/", "conecte-se": "prihlasenie/",
           "avtorizovatsya": "prihlasenie/", "lohin": "prihlasenie/", "prihlaseni": "prihlasenie/",
           "registration": "registracia/", "registro": "registracia/", "inscription": "registracia/", "anmeldung": "registracia/",
           "registrace": "registracia/", "registratsiya": "registracia/", "reyestratsiya": "registracia/", "cadastro": "registracia/",
           "posten": "prispevok/<str:post_id>", "publier": "prispevok/<str:post_id>", "opublikuvaty": "prispevok/<str:post_id>",
           "postagem": "prispevok/<str:post_id>", "contribution": "prispevok/<str:post_id>", "post": "prispevok/<str:post_id>",
           "profile": "profil/<str:username>", "profil": "profil/<str:username>",
           "password-reset": "obnova-hesla/", "recupération-de-mot-de-passe": "obnova-hesla/"}

def first_segment(route):
    return route.split("/")[0]

def main(fix):
    problems = 0
    for lang, url_code in LANGS.items():
        path = f"locale/{lang}/LC_MESSAGES/django.po"
        po = polib.pofile(path, wrapwidth = 0)
        routes = {}
        for rid in ROUTE_IDS:
            e = po.find(rid)
            value = (e.msgstr or e.msgid) if e else rid
            routes[rid] = value
            conv = re.findall(r"<[^>]+>", rid)
            if not re.fullmatch(r"[a-z0-9\-/<>:_]+", value) or re.findall(r"<[^>]+>", value) != conv or value.endswith("/") != rid.endswith("/"):
                print(f"{lang}: BAD ROUTE {rid!r} -> {value!r}"); problems += 1
        segs = [first_segment(v) for v in routes.values()]
        if len(segs) != len(set(segs)):
            print(f"{lang}: DUPLICATE ROUTE SLUGS {segs}"); problems += 1
        seg_to_route = {first_segment(v): rid for rid, v in routes.items()}
        alias = dict(ALIASES)
        for other in LANGS:  # every language's slug is a valid alias for its route
            opo = polib.pofile(f"locale/{other}/LC_MESSAGES/django.po", wrapwidth = 0)
            for rid in ROUTE_IDS:
                oe = opo.find(rid)
                if oe and oe.msgstr: alias.setdefault(first_segment(oe.msgstr), rid)
            for rid in ROUTE_IDS: alias.setdefault(first_segment(rid), rid)

        def fix_email(text):
            def repl(m):
                seg = m.group(1)
                rid = seg_to_route.get(seg) or alias.get(seg)
                if not rid:
                    return m.group(0)
                return "%(language)s/" + first_segment(routes[rid])
            return re.sub(r"%\(language\)s/([^/?\"'\s]+)", repl, text)

        changed = False
        for e in po:
            if e.obsolete or not e.msgstr or "%(language)s/" not in e.msgstr: continue
            new = fix_email(e.msgstr)
            for seg in re.findall(r"%\(language\)s/([^/?\"'\s]+)", new):
                if seg not in seg_to_route and seg != "blog":
                    print(f"{lang}: DEAD LINK segment {seg!r} in {e.msgid[:50]!r}"); problems += 1
            if new != e.msgstr:
                print(f"{lang}: link fixed in {e.msgid[:50]!r}"); changed = True
                if fix: e.msgstr = new
        if fix and changed: po.save(path)

        # JS paths
        jpath = f"locale/{lang}/LC_MESSAGES/djangojs.po"
        jpo = polib.pofile(jpath, wrapwidth = 0)
        jchanged = False
        expected = {}
        for e in jpo:
            m = re.fullmatch(r"/([a-z\-]+)", e.msgid)
            if m:
                rid = alias.get(m.group(1)) or ("blog" if m.group(1) == "blog" else None)
                if m.group(1) == "domov": rid = "domov/"
                if rid: expected[e.msgid] = "/blog" if rid == "blog" else "/" + first_segment(routes[rid])
            elif e.msgid == "/sk/profil/%s":
                expected[e.msgid] = f"/{url_code}/{first_segment(routes['profil/<str:username>'])}/%s"
            elif e.msgid == "/sk/prispevok/%s":
                expected[e.msgid] = f"/{url_code}/{first_segment(routes['prispevok/<str:post_id>'])}/%s"
        for e in jpo:
            if e.msgid in expected and e.msgstr != expected[e.msgid]:
                print(f"{lang}: JS path {e.msgid!r}: {e.msgstr!r} -> {expected[e.msgid]!r}"); jchanged = True
                if fix: e.msgstr = expected[e.msgid]
        if fix and jchanged: jpo.save(jpath)
    print("URL PROBLEMS:", problems)
    return problems

if __name__ == "__main__":
    sys.exit(1 if main("--fix" in sys.argv) else 0)
