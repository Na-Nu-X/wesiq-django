# Wesiq

## 0. Installation & Setup Guide

- Follow these steps to get the development environment running on your local machine

### Windows:

#### 1. Clone the repository

- Open your terminal and clone the project using Git.
`git clone https://github.com/Na-Nu-X/wesiq-django.git`

#### 2. Setup a Virtual Environment (For IDE autocompletion)

- Type these commands to your terminal.
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r .\wesiq\requirements.txt
```
- Note for **Visual Studio Code** / **Cursor** users: Press **CTRL + SHIFT + P**, type **"Python: Select Interpreter"**, and select the newly created virtual environment to enable proper code autocompletion.

#### 3. Configure Environment Variables

- Create a custom .env file at the root level of the project. You can use the attached **.env.example file** as a template for your variables.

#### 4. Build and Start Docker Containers

- Make sure you are outside the virtual environment (use the `deactivate` command if necessary), and run Docker.
`docker compose up -d --build`

#### 5. Run Database Migrations

- Set up your database tables by running Django migrations inside the Docker container.
`docker compose exec web python manage.py migrate`

#### 6. Update the NPM Watch Script

- Open the **wesiq/package.json** file and update the **"watch"** script to the following to ensure both TypeScript instances compile correctly on Windows.
```json
"watch": "tsc -w -p app/static/app/ts/tsconfig.json | tsc -w -p static/ts/tsconfig.json"
```

#### 7. Run the Development Batch Script

- Start the asset compilation and background processes using the provided batch script.
`.\run_dev.bat`

#### 8. Database Connection Troubleshooting (Optional)

- If you want to connect to the Database using tools like **pgAdmin** and the default connection fails, you likely have a port conflict. Change the database port mapping in the **docker-compose.yml** file located in the root directory.
```yaml
ports:
  - "5433:5432"
```

### Linux:

#### 1. Clone the repository

- Open your terminal and clone the project using Git.
`git clone https://github.com/Na-Nu-X/wesiq-django.git`

#### 2. Setup a Virtual Environment (For IDE autocompletion)

- Type these commands to your terminal.
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r wesiq/requirements.txt
```
- Note for **Visual Studio Code** / **Cursor** users: Press **CTRL + SHIFT + P**, type **"Python: Select Interpreter"**, and select the newly created virtual environment to enable proper code autocompletion.

#### 3. Configure Environment Variables

- Create a custom .env file at the root level of the project. You can use the attached **.env.example file** as a template for your variables.

#### 4. Build and Start Docker Containers

- Make sure you are outside the virtual environment (use the `deactivate` command if necessary), and run Docker.
`docker compose up -d --build`

#### 5. Run Database Migrations

- Set up your database tables by running Django migrations inside the Docker container.
`docker compose exec web python manage.py migrate`

#### 6. Run the Development Shell Script

- Start the asset compilation and background processes using the provided shell script.
`./run_dev.sh`

- If you need execution permission, change the file permissions.
`chmod +x run_dev.sh`

#### 7. Database Connection Troubleshooting (Optional)

- If you want to connect to the Database using tools like **pgAdmin** and the default connection fails, you likely have a port conflict. Change the database port mapping in the **docker-compose.yml** file located in the root directory.
```yaml
ports:
  - "5433:5432"
```

## 1. Stack Overview



### 3.3. Zásady používania súborov cookie

#### 3.3.1. Správa súhlasu

Pri prvej návšteve webovej stránky sa okamžite zobrazí ponuka na udelenie súhlasu so zásadami používania súborov cookie. Používatelia majú možnosť vybrať si medzi akceptovaním Všetkých súborov cookie (All Cookies) alebo voľbou Iba nevyhnutných súborov cookie (Only Essential Cookies). Tento výber priamo riadi budúce správanie pri ukladaní súborov cookie a ovplyvňuje externé integrácie, ako je napríklad Google Analytics.

#### 3.3.2. Zmena preferencií

Ak si používateľ želá upraviť svoje predchádzajúce voľby, môže sa k tejto ponuke jednoducho vrátiť kliknutím na tlačidlo „Zásady ochrany osobných údajov“ (Privacy Policy), ktoré sa nachádza v pätičke stránky (footer).

#### 3.3.3. Uloženie voľby

Preferencie používateľa sa ukladajú do trvalého súboru cookie (persistent cookie), čo zabezpečuje, že sa banner so súhlasom pri nasledujúcich reláciách opakovane nezobrazuje, kým platnosť daného súboru cookie nevyprší alebo kým nebude vymazaný.

### 3.4. Kontaktný formulár

#### 3.4.1. Rozhranie

Kontaktný formulár slúži ako priamy komunikačný kanál medzi používateľmi a vývojárskym tímom. Umožňuje návštevníkom informovať sa o službách, posielať návrhy alebo nahlasovať technické chyby a systémové problémy.

#### 3.4.2. Funkcionality

- **Povinné polia**: Používatelia musia poskytnúť základné kontaktné údaje, vybrať si vhodný predmet z kategorizovanej ponuky a napísať podrobnú správu.

- **Podpora súborov**: Pre poskytnutie jasnejšieho kontextu pri technických problémoch alebo špecifických požiadavkách systém umožňuje používateľom pripojiť k správe obrázok alebo iný súbor ako priamu prílohu.

  - **Podporované formáty**: Formulár akceptuje obrázky, videá a bežné typy dokumentov (napr. PDF, DOCX).

  - **Obmedzenie veľkosti**: Pre zabezpečenie spoľahlivého doručenia je stanovená maximálna veľkosť súboru na 25 MB.

- **Ochrana proti spamu**: Všetky odoslané údaje sú monitorované systémom reCAPTCHA v3, ktorý chráni systém pred aktivitou automatizovaných botov bez toho, aby to narušilo používateľský zážitok.

### 3.5. Prihlásenie

#### 3.5.1. Autentifikácia používateľa a prihlásenie

Ak už má používateľ vytvorený účet, môže sa znova prihlásiť po vypršaní relácie (session) alebo po manuálnom odhlásení. Systém automaticky overí poskytnuté prihlasovacie údaje a na základe ich platnosti buď povolí, alebo zamietne prístup.

#### 3.5.2. Prihlásenie cez sociálne siete a vizuálne efekty

- **Poskytovatelia tretích strán**: Pre rýchlejší prístup sa môžu používatelia prihlásiť prostredníctvom svojich účtov Google, Apple alebo Facebook.

- **Interaktívny dizajn**: Pre lepšiu interakciu s používateľom obsahujú tlačidlá na prihlásenie cez sociálne siete vizuálne pútavý animovaný efekt okraja.

#### 3.5.3. Zabezpečenie účtu a obnova

- **Systém obnovy hesla**: V prípade, že používateľ zabudne svoje prihlasovacie údaje, je k dispozícii jednoduchý proces obnovy hesla pre bezpečné obnovenie prístupu.

- **Bezpečnostné upozornenia**: Pri každom úspešnom prihlásení systém automaticky odošle používateľovi informačný e-mail. Tento e-mail obsahuje inštrukcie na obnovu hesla pre prípad, že by bol prístup neoprávnený alebo kompromitovaný.

#### 3.5.4. Bezpečnostné logovanie a monitorovanie

Pre udržanie vysokých bezpečnostných štandardov a monitorovanie potenciálnych útokov hrubou silou (brute-force attacks) systém zaznamenáva každý neúspešný pokus o prihlásenie do vyhradeného súboru error.log.

- **Zaznamenané metadáta a pokročilé bezpečnostné upozornenia**: Každý záznam v logu obsahuje časovú pečiatku, IP adresu žiadateľa, zadanú e-mailovú adresu a ďalšie metadáta týkajúce sa pokusu o autentifikáciu. Na zvýšenie zabezpečenia účtu a zachovanie absolútnej transparentnosti spúšťajú úspešné prihlásenia automaticky detailný notifikačný e-mail. Ten slúži ako kľúčová prvá línia obrany a obsahuje:

    - **Identifikácia zariadenia a prehliadača**: Využitím knižnice django-user-agents systém analyzuje hlavičku User-Agent z požiadavky, aby presne popísal hardvérové zariadenie, operačný systém a webový prehliadač použitý pre danú reláciu.

    - **Geolokácia v reálnom čase**: Prostredníctvom integrácie so službou ip-api systém dynamicky prekladá surovú IP adresu na čitateľnú geografickú polohu (mesto a krajina).

    - **Proaktívna ochrana**: Doručenie týchto konkrétnych dátových bodov priamo používateľovi mu umožňuje okamžite odhaliť anomálne alebo zahraničné pokusy o prihlásenie a prijať okamžité opatrenia (ako napríklad zmenu svojho hesla hashovaného pomocou algoritmu Argon2), ak deteguje nerozpoznanú reláciu.

- **Prístup pre vývojárov**: Tento log je určený výhradne na interné použitie pre vývojárov na identifikáciu systémových problémov alebo škodlivých vzorcov správania.

#### 3.5.5. Ochrana proti útokom hrubou silou (Rate Limiting)

- **Vynucovanie bezpečnosti**: Aby sa zabránilo automatizovaným útokom, pokusy o prihlásenie sú striktne obmedzené na 3 neúspešné požiadavky za minútu na jednu IP adresu pomocou knižnice django-ratelimit.

- **Dynamická spätná väzba**: Po dosiahnutí tohto limitu systém spustí automatický časový blok (cooldown period) a zobrazí informatívne upozornenie, čím chráni infraštruktúru a zároveň udržuje používateľa informovaného.

### 3.6. Registrácia

#### 3.6.1. Registrácia používateľa a vytvorenie účtu

Registračný systém umožňuje novým používateľom intuitívne si vytvoriť účet kliknutím na tlačidlo registrácie. Po vyplnení krátkeho formulára sa informácie o používateľovi bezpečne uložia do databázy, čo uľahčí budúce prihlásenia a získavanie dát.

#### 3.6.2. Kľúčové validácie a bezpečnostné funkcie

- **Overenie duplicity e-mailu**: Systém automaticky kontroluje, či zadaná e-mailová adresa už nie je zaregistrovaná, aby sa zabránilo vytváraniu duplicitných účtov.

- **Obmedzenia dĺžky hesla**: Implementuje reštrikcie proti príliš krátkym heslám pre zaistenie robustnej bezpečnosti.

- **Dvojité potvrdenie zadania**: Vyžaduje, aby používatelia zadali svoje heslo druhýkrát, čím sa predchádza chybám z preklepov.

- **Generátor bezpečných hesiel**: Obsahuje integrovanú funkciu na automatické generovanie silného a náhodného hesla priamo vo formulári.

- **Funkcionalita schránky (Clipboard)**: Podporuje rýchle akcie kopírovania a vkladania pre vygenerované heslá.

- **Kryptografické hashovanie**: Pre maximálnu bezpečnosť sú všetky heslá chránené pomocou algoritmu PBKDF2 s hashovacou funkciou SHA-256 (prostredníctvom natívneho bezpečného frameworku v Djangu). Heslá v čistom texte (plain text) sa v databáze nikdy neukladajú.

- **Ochrana proti spamu**: Registračný proces je zabezpečený systémom reCAPTCHA v3, ktorý zabraňuje automatizovaným registráciám botov.

#### 3.6.3. Proces aktivácie účtu

Po vyplnení registračného formulára musia používatelia overiť svoju identitu. Systém automaticky odošle jedinečný overovací odkaz na zadanú e-mailovú adresu.

- **Expirácia odkazu**: Z bezpečnostných dôvodov je overovací odkaz platný presne 24 hodín.

- **Aktivácia**: Plný prístup k účtu je udelený až po tom, čo používateľ klikne na tento odkaz. Ak platnosť odkazu vyprší, používateľ bude musieť proces registrácie zopakovať alebo požiadať o vygenerovanie nového odkazu.

### 3.7. Napísanie recenzie

#### 3.7.1. Odoslanie používateľskej recenzie

Systém odosielania recenzií umožňuje používateľom podeliť sa o svoje osobné názory a vyjadriť svoju celkovú spokojnosť alebo skúsenosť s poskytovanými službami.

#### 3.7.2. Kľúčové funkcionality

- **Interaktívny systém hodnotenia**: Hodnotenia sú vizuálne reprezentované pomocou interaktívnych komponentov hviezdičiek, ktoré poskytujú plynulý a intuitívny používateľský zážitok.

- **Limity odosielania**: Na zabezpečenie objektivity a predchádzanie manipulácii systém striktne presadzuje pravidlo jednej recenzie na jeden účet. Používatelia nemôžu pre tú istú službu alebo produkt odoslať viacero samostatných hodnotení.

- **Pravidlá úpravy recenzií**: S ohľadom na možné chyby pri zadávaní alebo zmenu názoru majú používatelia možnosť upraviť svoju už odoslanú recenziu jedenkrát za mesiac. Toto pravidlo zabezpečuje integritu dát a zároveň zachováva flexibilitu pre používateľa.

- **Ochrana proti spamu a botom**: Proces odosielania je integrovaný so systémom reCAPTCHA v3 na identifikáciu a blokovanie automatizovaných podaní, čím sa zabezpečuje, že všetka spätná väzba pochádza výlučne od legitímnych používateľov.

### 3.8. Úprava účtu

#### 3.8.1. Správa profilu účtu

Systém správy profilu účtu umožňuje používateľom upravovať svoje osobné údaje a profilové fotografie podľa vlastných preferencií. Na zachovanie konzistencie dát sú úpravy profilu obmedzené na jedenkrát za kalendárny mesiac. Systém navyše obsahuje vyhradené funkcionality na bezpečné aktualizovanie hesla v ľubovoľnom čase.

#### 3.8.2. Vymazanie a obnova účtu

Používatelia majú možnosť svoj účet natrvalo odstrániť. Aby sa predišlo náhodnej strate dát, systém implementuje bezpečný postup vymazania s dôrazom na ochranu údajov:

- **Okamžité odhlásenie a pozastavenie**: Po odoslaní požiadavky na vymazanie je používateľ okamžite odhlásený. Stav účtu sa zmení na „Pozastavený“ (Suspended) a začína plynúť 30-dňová ochranná lehota.

- **E-mailové upozornenie**: Používateľovi sa automaticky odošle e-mail potvrdzujúci požiadavku na vymazanie s vysvetlením, že proces je možné jednoducho zvrátiť opätovným prihlásením.

- **Obnovenie účtu**: Ak sa používateľ autentifikuje v rámci 30-dňového okna, proces vymazania sa automaticky zruší a stav účtu sa vráti na „Aktívny“.

- **Automatické trvalé vymazanie a vyčistenie**: Systém využíva Celery Beat na spúšťanie plánovaných úloh, ktoré monitorujú účty v pozastavenom stave. Po uplynutí 30-dňovej lehoty bez prihlásenia sa vykonajú nasledujúce akcie:

    - **Vyčistenie databázy**: Účet a všetky pridružené záznamy sa natrvalo a nevratne odstránia z databázy.

    - **Optimalizácia úložiska**: Všetky fyzické súbory spojené s používateľom (napr. profilové fotografie) sa vymažú zo súborového systému s cieľom optimalizovať zdroje.

    - **Auditné logovanie**: Každé trvalé vymazanie sa zaznamená do vyhradeného súboru celery_tasks.log na účely administratívneho auditu a monitorovania.

### 3.9. Obnova hesla

#### 3.9.1. Postup obnovy hesla

Na úpravu existujúceho hesla alebo obnovenie prístupu v prípade zabudnutého hesla systém poskytuje vyhradený proces obnovy navrhnutý tak, aby zaistil maximálnu bezpečnosť účtu.

#### 3.9.2. Proces overenia a presmerovania

- **Odoslanie e-mailu**: Po odoslaní žiadosti o obnovu hesla sa na registrovanú e-mailovú adresu používateľa odošle jedinečný overovací kód spolu s podrobnými inštrukciami.

- **Flexibilný prístup**: E-mail obsahuje voliteľný priamy odkaz, ktorý používateľa presmeruje na stránku obnovy s automaticky predvyplneným kódom. Kliknutie na tento odkaz však nie je povinné, keďže používatelia sú bezprostredne po odoslaní úvodnej žiadosti automaticky presmerovaní na stránku obnovy, kde môžu kód zadať aj manuálne.

#### 3.9.3. Časové obmedzenia a vizuálne indikátory

- **Desaťminútové okno**: Z bezpečnostných dôvodov systém vynucuje striktné desaťminútové odpočítavanie. V rámci tohto časového okna musí používateľ zadať overovací kód a svoje nové heslo, prípadne využiť integrovaný generátor silných hesiel.

- **Dynamické vizuálne prvky**: Pre lepšiu vizuálnu orientáciu kruhový časovač dynamicky mení farby na základe zostávajúceho času, pričom plynule prechádza zo zelenej do červenej. Okrem toho sa číselné zobrazenie odpočítavania zmení na prenikavú červenú farbu hneď, ako zostávajúci čas klesne pod desať sekúnd.

- **Vypršanie platnosti relácie a obnova**: Ak časovač klesne na nulu, zobrazí sa informačné prekrytie (overlay), ktoré používateľa upozorní, že platnosť overovacieho kódu vypršala. Pre zabezpečenie plynulého procesu obnovy je k dispozícii možnosť „Znova odoslať kód“ (Resend Code). Tá umožňuje používateľovi vyžiadať si nový overovací e-mail a reštartovať odpočítavanie bez toho, aby sa musel vracať späť na úvodnú stránku so žiadosťou.

### 3.10. Vyhľadávací panel

#### 3.10.1. Komponent vyhľadávacieho panela

Komponent vyhľadávacieho panela ponúka efektivnu metódu na vyhľadávanie konkrétnych stránok zadaním požadovaného názvu stránky. Systém spúšťa algoritmus relevantnosti, aby vrátil najvhodnejšie výsledky na základe zadaných kľúčových slov.

#### 3.10.2. Kľúčové funkcionality a vstupné ovládacie prvky

- **Filtrovanie v reálnom čase**: Výsledky sa okamžite aktualizujú počas písania používateľa, pričom sa zvýrazňujú najvhodnejšie stránky na základe zadaného dopytu.

- **Navigácia klávesnicou**: Pre lepšiu prístupnosť môžu používatelia prechádzať výsledkami vyhľadávania alebo históriou pomocou šípok nahor a nadol a vybrať požadovanú položku stlačením klávesu Enter.

- **Vymazanie dopytu**: Vstupné pole je možné okamžite vymazať kliknutím na tlačidlo „X“ alebo použitím klávesu Backspace.

- **Zatvorenie zamerania (Focus Dismissal)**: Aby sa zabezpečil nenápadný zážitok, rozhranie vyhľadávania je možné zatvoriť kliknutím kdekoľvek mimo hraníc vyhľadávacieho panela alebo rozbaľovacej ponuky výsledkov.

#### 3.10.3. História vyhľadávania

- **Úložisko s dôrazom na súkromie**: História vyhľadávania sa uloží lokálne v prehliadači používateľa pomocou rozhrania localStorage. To zaisťuje, že história sa zachováva medzi jednotlivými reláciami bez toho, aby sa osobné navigačné údaje ukladali na server.

- **Automatické zobrazenie**: Na uľahčenie rýchlej navigácie sa predchádzajúce úspešné vyhľadávania, ktoré viedli k navštíveným stránkam, ukladajú a zobrazujú, keď sa používateľ prvýkrát zameria na vyhľadávací panel.

- **Obmedzenia položiek**: Aby bola viditeľná iba najnovšia a relevantná aktivita, zobrazenie histórie je striktne obmedzené na maximálne 3 položky.

- **Správa histórie**: Používatelia majú plnú kontrolu nad svojimi údajmi a môžu kedykoľvek odstrániť konkrétne jednotlivé položky zo svojej uloženej histórie vyhľadávania.

### 3.11. Články (Articles)

#### 3.11.1. Systém správy článkov a blogu

Stránka blogu slúži ako centralizované centrum pre vzdelávací a informačný obsah. Obsahuje pokročilý systém kategorizácie, ktorý umožňuje používateľom filtrovať obsah na základe špecifických tém ich záujmu.

#### 3.11.2. Dátové metriky a metadáta

Každý jednotlivý článok zobrazuje súbor základných metadát, ktoré informujú čitateľa a sledujú mieru zapojenia (engagement):

- **Počet unikátnych návštevníkov**: Sleduje a zobrazuje celkový počet jednotlivých používateľov, ktorí si obsah prezreli.

- **Dátum publikovania**: Jasne uvádza dátum, kedy bol článok pridaný na platformu.

- **Atribúcia používateľa (Autorstvo)**: Identifikuje konkrétneho autora alebo používateľa, ktorý obsah vytvoril.

- **Systém hodnotenia**: Zobrazuje komunitné hodnotenie pre každý konkrétny text.

#### 3.11.3. Interaktívny používateľský zážitok

- **Náhľady po ukázaní myšou (Hover Introductions)**: Rozhranie využíva interaktívny dizajn, pri ktorom sa vždy, keď používateľ prejde kurzorom myši na kartu článku, nad obrázkom na pozadí zobrazí krátky úvodný text.

- **Presmerovanie na obsah**: Kliknutím na vybraný článok sa používateľ presmeruje na vyhradenú stránku, ktorá obsahuje plné znenie obsahu.

- **Diskusné fórum**: Každý článok obsahuje komplexné fórum na komentovanie umiestnené priamo pod textom, čo uľahčuje komunitnú diskusiu a spätnú väzbu.

### 3.12. Možnosti filtrovania článkov

Rozhranie blogu obsahuje intuitívne mechanizmy filtrovania, ktoré používateľom pomáhajú efektívne navigovať a objavovať relevantný obsah.

#### 3.12.1. Kľúčové schopnosti

- **Integrácia vyháňania podľa kľúčových slov**: Používatelia môžu plynule filtrovať dostupné články zadávaním konkrétnych výrazov alebo fráz do integrovaného vyhľadávacieho panela. Zoznam článkov sa dynamicky aktualizuje v reálnom čase na základe zadaného dopytu.

- **Kategorické filtrovanie**: Systém poskytuje možnosť vyčleniť a zobraziť články výhradne na základe vybraných tematických kategórií. To umožňuje získať presne zamerané výsledky vyhľadávania prispôsobené konkrétnym záujmom používateľa.

- **Pokročilé filtrovanie podľa viacerých kritérií**: Vyhľadávanie podľa kľúčových slov a kategóriové filtre fungujú vo vzájomnej súhre. To používateľom umožňuje kombinovať kritériá – napríklad vyhľadávať konkrétny výraz iba v rámci jednej vybranej kategórie – pre dosiahnutie maximálne presných výsledkov.

- **Indikátory aktívnych filtrov**: Rozhranie prehľadne zobrazuje aktuálne aplikované filtre, vďaka čomu má používateľ vždy prehľad o aktívnych parametroch vyhľadávania.

- **Funkcionalita reštartu filtrov**: Vyhradené tlačidlo Obnoviť (Refresh) umožňuje používateľom okamžite vymazať všetky aktívne filtre a zadané kľúčové slová pre danú kategóriu, čím sa zobrazenie vráti do pôvodného východiskového stavu.

### 3.13. Diskusné fórum (Komentáre)

Diskusné fórum uľahčuje komunitnú interakciu tým, že umožňuje používateľom odosielať osobné názory a zapájať sa do vláknových diskusií (threaded discussions) pod každým článkom.

#### 3.13.1. Kľúčové funkcie interakcie

- **Identifikácia používateľa**: Každý odoslaný komentár alebo odpoveď sa viditeľne zobrazuje s profilovou fotografiou a menom autora, čo podporuje transparentnú komunikáciu.

- **Interaktívne prvky**: Používatelia sa môžu aktívne zapájať zanechávaním priamych odpovedí na existujúce komentáre alebo vyjadrením súhlasu prostredníctvom integrovanej funkcie „Páči sa mi to“ (Like).

#### 3.13.2. Moderovanie a asynchrónna logika

- **Okamžité aktualizácie rozhrania**: Zmeny stavu – ako napríklad prepnutie tlačidla „Páči sa mi to“ alebo odoslanie nahlásenia – sú technicky riešené pomocou asynchrónneho JavaScriptu (Fetch API prostredníctvom POST požiadaviek). Táto architektúra zaručuje okamžitú vizuálnu spätnú väzbu a synchronizáciu dát na pozadí bez nutnosti úplného obnovenia (reloadu) stránky, čo vedie k plynulému používateľskému zážitku.

- **Komunitné moderovanie**: Na zabezpečenie bezpečného a rešpektujúceho prostredia majú používatelia možnosť nahlásiť škodlivý alebo nevhodný obsah. Aby sa predišlo zneužívaniu a zabezpečila sa relevantnosť nahlásení, systém pri každom odoslanom reporte bezpečne zaznamenáva do databázy jedinečné ID (User ID) nahlasovateľa. V dôsledku toho, akonáhle komentár dosiahne striktnú hranicu 5 jedinečných nahlásení od 5 rôznych používateľov, je automaticky skrytý pred zrakom verejnosti.

### 3.14. Sledovanie aktivity a tréningové plány

Stránka aktivít predstavuje propracované rozhranie navrhnuté na zaznamenávanie a správu fitnes dát používateľov, pričom ponúka voľné sledovanie aktivity aj štruktúrované tréningové plány.

#### 3.14.1. Základné sledovanie aktivity

- **Flexibilné možnosti spustenia**: Používatelia môžu spustiť „Čistú aktivitu“ (Pure Activity) pre všeobecné sledovanie alebo postupovať podľa konkrétneho vopred definovaného tréningového plánu.

- **Pozastavenie a obnovenie**: S ohľadom na reálne prerušenia systém umožňuje používateľom kedykoľvek pozastaviť a obnoviť reláciu aktivity bez straty dát.

- **Klávesové skratky (Keybinds)**: Pre maximálne pohodlie počas cvičenia rozhranie podporuje špecifické klávesové skratky, čo používateľom umožňuje ovládať funkcie sledovania bez výhradného spoliehania sa na myš.

- **Prístup pre hostí**: Neprihlásení používatelia majú prístup do „Testovacieho režimu“ (Testing Mode), aby si vyskúšali funkcie sledovania. Vizuálne upozornenie ich informuje, že ich pokrok a dáta sa po ukončení relácie neuložia.

#### 3.14.2. Správa tréningových plánov

- **Automatické plánovanie**: Tréningové plány sú zoradené chronologicky podľa dní. Systém automaticky navrhuje plán pre aktuálny deň, čo zjednodušuje používateľský zážitok.

- **Štruktúrovaný postup**: Každý plán je organizovaný do sekvencie slajdov, ktorá obsahuje úvod, jednotlivé cviky a záverečný súhrnný slajd.

- **Vizualizácia pokroku**: Pod cvikmi sa zobrazuje dynamický ukazovateľ pokroku (progress bar). Jeho farba prechádza zo žltej do zelenej na základe percenta dokončených cvikov.

#### 3.14.3. Logika cvičenia a intervaly odpočinku

- **Sledovanie sérií a opakovaní**: Systém sleduje série, opakovania a časovo ohraničené cviky. Počet dokončených sérií sa automaticky zvyšuje, ako používateľ zaznamenáva svoj pokrok.

- **Inteligentný časovač odpočinku**:

    - Medzi cvikmi sa automaticky spustí dvojminútová prestávka.

    - Odpočítavanie je znázornené kruhovým časovačom, ktorý sa s plynúcim časom mení zo zelenej na červenú farbu.

    - Používatelia môžu prestávku predĺžiť o 30 sekúnd pomocou vyhradeného tlačidla alebo interval odpočinku manuálne preskočiť a okamžite prejsť na ďalší cvik.

- **Náhľad nadchádzajúcej úlohy**: Pred každým novým cvikom systém zobrazí názov nadchádzajúcej úlohy, aby sa používateľ mohol pripraviť.

#### 3.14.4. Analytika po ukončení aktivity

- **Grafy výkonu**: Po dokončení sa vygeneruje vizuálny graf zobrazujúci čas strávený pri každom cviku.

- **Historické dáta**: Používatelia si môžu prezerať svoju históriu aktivít, vrátane celkového stráveného času, metrík pokroku a celkového počtu zaznamenaných aktivít.

### 3.15. Vytváranie tréningového plánu

Pre využitie štruktúrovaného sledovania si môžu používatelia zostaviť personalizované tréningové plány prostredníctvom vysoko interaktívneho a používateľsky prívetivého rozhrania nástroja na tvorbu (builder interface).

#### 3.15.1. Výber a prispôsobenie cvikov

- **Intuitívny mechanizmus pridávania**: Používatelia môžu prechádzať rozsiahlou knižnicou cvikov a pridávať ich do svojho plánu pomocou funkcie potiahni a pusť (drag-and-drop) alebo dvojitým kliknutím na požadovanú položku.

- **Tvorba vlastných cvikov**: Ak sa konkrétny cvik nenachádza v predvolenej knižnici, systém umožňuje používateľom vytvoriť si vlastné cviky, čím sa zabezpečí, že plán bude presne vyhovovať ich potrebám.

- **Dynamické škálovanie**: Každý cvik je možné prispôsobiť špecifickými parametrami na základe jeho typu:

    - **Periódy**: Organizácia cvikov do špecifických blokov alebo fáz.

    - **Série a opakovania**: Definovanie objemu práce.

    - **Trvanie a kroky**: Nastavenie času výdrže alebo počtu krokov pre izometrické alebo kardio pohyby.

- **Automatické radenie**: Novo pridané cviky sa pripájajú na koniec plánu, pričom používateľ má možnosť medzi nimi okamžite prepínať a upravovať ich.

#### 3.15.2. Pokročilá organizácia a ovládacie prvky UI

- **Manuálne preusporiadanie**: Postupnosť tréningu je možné jednoducho upraviť presunutím panelov s cvikmi na nové pozície, čo umožňuje logický tok tréningovej relácie.

- **Jednoduché odstránenie**: Pre zachovanie čistého pracovného prostredia (workflow) je možné omylom pridané cviky odstrániť jednoduchým potiahnutím mimo oblasti plánu alebo dvojitým kliknutím.

- **Inteligentné pomenovanie a plánovanie**:

    - **Automatické návrhy názvov**: Systém poskytuje návrhy krátkych názvov (napr. „Leg Day“, „Full Body“) pre rýchle nastavenie, pričom stále umožňuje plnohodnotné manuálne zadanie textu.

    - **Priradenie dňa**: Na podporu automatizovaného plánovania spomenutého v sekcii 3.14.2 môžu používatelia každému plánu priradiť konkrétne dni v týždni.

#### 3.15.3. Trvalé uchovávanie dát a správa

- **Databázová integrácia**: Po uložení sa plán zapíše do profilu používateľa a okamžite sa stáva dostupným pre sledovanie aktivity.

- **Plná CRUD funkcionalita**: Používatelia si zachovávajú úplnú autonómiu nad svojimi dátami, s možnosťou kedykoľvek čítať, upravovať, aktualizovať alebo mazať ktorýkoľvek zo svojich vytvorených tréningových plánov (Create, Read, Update, Delete).

### 3.16. Úprava tréningového plánu

Na prispôsobenie sa meniacim sa fitnes cieľom alebo na opravu počiatočných chýb pri zadávaní systém poskytuje robustnú sadu nástrojov na úpravu, ktorá používateľom umožňuje vylepšovať a upravovať ich existujúce plány.

#### 3.16.1. Konzistencia rozhrania a pracovný postup (Workflow)

- **Jednotný dizajnový jazyk**: Rozhranie na úpravu kopíruje modul „Vytvorenie tréningového plánu“, čo používateľovi zaisťuje plynulý prechod. Známe ovládacie prvky ako potiahni a pusť (drag-and-drop) a dvojité kliknutie zostávajú aktívne pre všetky úlohy úprav.

- **Mechanizmus výberu**: Používatelia môžu jednoducho prechádzať celou svojou knižnicou predtým vytvorených plánov a vybrať si ten konkrétny, ktorý chcú aktualizovať.

#### 3.16.2. Možnosti detailných (granulárnych) úprav

- **Štrukturálne úpravy**: Používatelia majú slobodu pridávať nové cviky z knižnice alebo odstraňovať tie existujúce, aby udržali svoju rutinu aktuálnu.

- **Spresnenie parametrov**: Každý detail vybraného plánu je možné upraviť, vrátane:

  - **Poradia cvikov**: Zmena poradia pohybov prostredníctvom drag-and-drop panelov.

  - **Metrík intenzity**: Aktualizácia počtu periód, sérií, opakovaní, časov výdrže alebo počtu krokov pre každý jednotlivý cvik.

- **Aktualizácií názvu a plánovania**: Systém umožňuje premenovanie plánov a zmenu priradenia tréningových dní, čím sa zabezpečí, že funkcia „Automatické plánovanie“ (sekcia 3.14.2) zostane zosynchronizovaná s aktuálnym životným rytmom používateľa.

#### 3.16.3. Synchronizácia stavu

- **Predvyplnenie dát (Pre-population)**: Po výbere plánu na úpravu sa rozhranie automaticky vyplní všetkými aktuálnymi údajmi o cvikoch, čo umožňuje rýchle lokálne korekcie bez toho, aby bolo nutné plán stavať úplne od nuly.

- **Uloženie a aktualizácia**: Po potvrdení zmien systém aktualizuje databázové záznamy, čím zaistí, že sa v ďalšej sledovanej aktivite odzrkadlia najnovšie úpravy.

### 3.17. Výber cvikov

Karta výberu cvikov poskytuje centralizované úložisko pohybov, ktoré používateľom umožňuje prechádzať a konfigurovať jednotlivé cviky pred ich integráciou do tréningového plánu.

#### 3.17.1. Mechanizmy výberu

- **Intuitívna integrácia**: Pridávanie cvikov je zjednodušené prostredníctvom intuitívneho systému potiahni a pusť (drag-and-drop) alebo jednoduchej akcie dvojitého kliknutia, čím sa minimalizuje počet krokov potrebných na zostavenie tréningu.

- **Predbežná konfigurácia**: Používatelia môžu upraviť špecifické parametre cviku (napríklad použitú váhu) priamo na karte výberu ešte pred jeho definitívnym pridaním do plánu.

#### 3.17.2. Pokročilé ovládacie prvky úpravy váhy

Na zabezpečenie maximálnej efektivity a jednoduchosti používania systém podporuje viaceré metódy zadávania pre úpravu váhy pri cvikoch:

- **Interaktívne klikanie**: Bežné kliknutia poskytujú detailnú kontrolu pre presné zvyšovanie alebo znižovanie váhy po malých krokoch.

- **Plynulé nastavovanie (Hold-to-Scale)**: Podržanie tlačidiel na pridanie alebo ubranie váhy umožňuje jej rýchlu zmenu, čím sa eliminuje potreba opakovaného klikania.

- **Synergia klávesnice a myši**:

    - **Šípky**: Používatelia môžu na rýchle úpravy využiť šípky na klávesnici.

    - **Koliesko myši**: Rozhranie je navrhnuté tak, aby reagovalo na rolovacie koliesko myši, čo poskytuje plynulý a prirodzený spôsob úpravy váhy pri umiestnení kurzora nad oblasť zadávania.

### 3.18. Preklad a internacionalizácia (i18n)

Na zaistenie globálnej dostupnosti a lokalizovaného zážitku platforma disponuje robustným frameworkom pre internacionalizáciu, ktorý podporuje viacero jazykov vo všetkých vrstvách aplikácie.

#### 3.18.1. Viacjazyčná architektúra

- **Jazykové smerovanie založené na URL**: Systém využíva štruktúry URL priateľské pre SEO, kde je jazykový kód (napr. /en/, /sk/, /es/) neoddeliteľnou súčasťou adresy. To umožňuje priame prepojenie na lokalizovaný obsah a zlepšuje indexovanie vyhľadávačmi.

- **Synchronizácia databázy**: Jazyková preferencia používateľa je trvalo uložená v jeho profile v databáze. To zabezpečuje, že zvolený jazyk zostane konzistentný naprieč rôznymi zariadeniami a reláciami.

- **Full-Stack preklad**: Lokalizácia sa neobmedzuje iba na statické šablóny. Preložený je každý textový prvok, vrátane:

    - **HTML šablón**: Obsah vykreslený na strane servera (Server-Side Rendered).

    - **JavaScript / TypeScript**: Dynamické správy na frontende.

    - **Python backend**: Systémové upozornenia, e-maily a ďalšie.

#### 3.18.2. Inteligentný výber jazyka

- **Intuitívny prepínač jazykov**: Používatelia môžu jazyk rozhrania okamžite zmeniť kliknutím na príslušné vlajky štátov v navigačnom menu.

- **Automatická detekcia (registrácia)**: Ak počas registračného procesu používateľ poskytne telefónne číslo, systém inteligentne identifikuje predvoľbu krajiny. Na základe týchto údajov sa preferovaný jazyk používateľa automaticky nastaví v databáze, čo ponúka personalizovaný zážitok hneď od prvého prihlásenia.

#### 3.18.3. Komunikácia a SEO

- **Lokalizované upozornenia**: Uložením jazykových preferencií systém zabezpečuje, že všetky automatizované e-maily (napr. obnova hesla, upozornenia o pozastavení účtu) sa odosielajú v preferovanom jazyku používateľa.

- **Optimalizácia pre vyhľadávače (SEO)**: Implementácia viacerých jazykových verzií výrazne zvyšuje viditeľnosť platformy. Poskytovaním lokalizovaných metadát a obsahu dosahuje aplikácia vyššie pozície a lepšiu viditeľnosť vo výsledkoch globálneho vyhľadávania Google.

- **Predvolený jazyk**: Systém je nakonfigurovaný s angličtinou ako primárnym náhradným a predvoleným jazykom pre všetkých neprihlásených návštevníkov.

### 3.19. Overenie telefónneho čísla a logika lokalizácie

Systém integruje štandardnú knižnicu libphonenumber-js na spracovanie formátovania a overovania medzinárodných telefónnych čísel, čím zaisťuje integritu dát a zároveň zlepšuje zážitok používateľa pri registrácii (onboarding).

#### 3.19.1. Interaktívny vstup a formátovanie

- **Dynamické automatické formátovanie**: Počas písania používateľa vstupné pole automaticky aplikuje správne pravidlá formátovania (ako sú medzery a zátvorky) špecifické pre štandardy detegovanej krajiny.

- **Vizuálne indikátory krajiny**: Pre poskytnutie okamžitej spätnej väzby systém vedľa vstupného poľa zobrazuje zodpovedajúcu vlajku krajiny, ktorá sa aktualizuje v reálnom čase na základe zadanej predvoľby.

#### 3.19.2. Automatizované overenie (validácia)

- **Kontextovo závislá validácia**: Pri strate zamerania vstupného poľa (udalosť on-blur) systém vykoná komplexnú kontrolu platnosti. Overuje kód krajiny, celkovú dĺžku číslic a špecifické vzory číslovacieho plánu.

- **Upozornenie na chybu**: Ak sa zistí, že číslo je neplatné alebo matematicky nemožné pre daný región, používateľ je okamžite upozornený prostredníctvom jasného vizuálneho prvku, aby záznam opravil.

#### 3.19.3. Lokalizácia riadená inteligentnou logikou

- **Inteligentné priradenie jazyka**: Počas registrácie systém inteligentne extrahuje informáciu o krajine z predvoľby telefónneho čísla. Tieto dáta sa použijú na automatické nastavenie preferovaného jazyka používateľa v databáze.

- **Záložný jazyk (Fallback)**: Ak webová stránka zatiaľ nepodporuje rodný jazyk detegovaného regiónu, systém predvolene nastaví preferenciu používateľa na angličtinu, čím zaistí konzistentný zážitok.

- **Konzistencia komunikácie**: Táto uložená preferencia zabezpečuje, že všetky nasledujúce interakcie so systémom, vrátane automatizovaných e-mailov a upozornení, sú doručované v jazyku, ktorému používateľ s najväčšou pravdepodobnosťou rozumie.

### 3.20. Automatizované e-mailové notifikácie

Systém obsahuje komplexný rámec pre automatizované zasielanie správ, navrhnutý tak, aby používateľov informoval o aktivite na účte, bezpečnostných udalostiach a zmenách v životnom cykle účtu.

#### 3.20.1. Bezpečnostné upozornenia a upozornenia na aktivitu

- **Upozornenia na prihlásenie**: Na ochranu používateľských účtov pred neoprávneným prístupom sa pri každom úspešnom prihlásení okamžite odošle informačný e-mail. Toto upozornenie slúži ako bezpečnostný indikátor (tzv. security heartbeat), ktorý používateľom umožňuje monitorovať aktivitu na účte v reálnom čase.

- **Správy o životnom cykle účtu**: Systém spúšťa automatizované e-maily pre kľúčové míľniky účtu, vrátane:

    - **Potvrdenia registrácie**: Privítanie nových používateľov a overenie nastavenia ich účtu.

    - **Vymazania účtu**: Potvrdenie trvalého odstránenia dát na základe žiadosti používateľa.

    - **Žiadostí o obnovu hesla**: Uľahčenie bezpečného obnovenia prístupu.

#### 3.20.2. Akčný obsah a navigácia

- **Kontextové priame odkazovanie (Deep Linking)**: Väčšina automatizovaných e-mailov obsahuje priame odkazy na relevantné stránky aplikácie pre zvýšenie pohodlia používateľa.

- **Proaktívne bezpečnostné odkazy**: Napríklad e-maily s upozornením na prihlásenie špecificky obsahujú priamy odkaz na stránku obnovy hesla. To používateľovi umožňuje okamžite konať a zabezpečiť svoj účet, ak nerozpoznáva danú aktivitu prihlásenia.

- **Integrovaná lokalizácia**: V súlade s logikou internacionalizácie (sekcia 3.18.3) sú všetky e-maily automaticky generované v preferovanom jazyku používateľa, čo zabezpečuje jasnú a efektívnu komunikáciu bez ohľadu na región.

#### 3.20.3. Infraštruktúra a doručovanie

- **Spoľahlivá integrácia SMTP**: Systém využíva infraštruktúru SMTP (Simple Mail Transfer Protocol) od spoločnosti Google na spracovanie všetkej odchádzajúcej komunikácie. To zabezpečuje vysokú mieru doručiteľnosti a priemyselne štandardizované šifrovanie (TLS) pre všetky automatizované správy, čím sa zachováva integrita a bezpečnosť korešpondencie používateľov.

### 3.21. Rozhranie pre overenie pomocou OTP

Systém obsahuje na mieru navrhnutý komponent na overenie pomocou jednorazového hesla (OTP – One-Time Password), ktorý je optimalizovaný pre vizuálnu čistotu aj plynulú funkčnú efektivitu počas bezpečnostných kontrol.

### 3.21.1. Mechanika zadávania a navigácia

- **Segmentované vstupné polia**: Na uľahčenie zadávania 6-miestneho overovacieho kódu rozhranie využíva šesť samostatných, vizuálne oddelených vstupných polí. Tento štruktúrovaný dizajn poskytuje jasné vizuálne vedenie a zabraňuje chybám vo formátovaní.

- **Sekvenčné automatické zameranie (Auto-Focus)**: Keď používateľ zadá číslicu, systém automaticky posunie zameranie kurzora na ďalšie susedné pole, čo zaisťuje plynulý, neprerušovaný zážitok z písania bez nutnosti manuálneho klikania.

- **Spätná navigácia**: Rozhranie inteligentne spracováva opravu chýb. Stlačením klávesu Backspace sa nielenže vymaže aktuálny znak, ale zameranie sa tiež automaticky presunie späť na predchádzajúce vstupné pole, čo umožňuje rýchle a intuitívne úpravy.

### 3.21.2. Integrácia schránky (Clipboard)

- **Funkcionalita inteligentného vloženia (Smart Paste)**: Komponent plne podporuje moderné udalosti schránky, čím vychádza v ústrety používateľom, ktorí uprednostňujú skopírovanie overovacieho kódu priamo zo svojho e-mailu.

- **Automatizovaná distribúcia dát**: Keď používateľ vloží kód do ktoréhokoľvek zo vstupných polí, frontendová logika systému okamžite zachytí reťazec zo schránky, overí jeho dĺžku a automaticky rozdelí jednotlivé číslice do všetkých zodpovedajúcich polí v správnom poradí.

### 3.22. Efekt načítavania (Loading Effect)

Na udržanie vysokej kvality používateľského zážitku a poskytnutie jasnej spätnej väzby počas spracovania dát aplikácia disponuje integrovaným systémom správy stavu načítavania.

#### 3.22.1. Mechanizmus vizuálnej spätnej väzby

- **Dynamický indikátor načítavania (Spinner)**: Počas inicializácie stránky alebo pri významnom sťahovaní dát sa spúšťa vysokokvalitná animácia rotácie. To poskytuje okamžitý vizuálny indikátor, že aplikácia je aktívna a spracováva požiadavku používateľa.

- **Plynulé prechody**: Po dokončení životného cyklu stránky a úplnom načítaní všetkých prostriedkov (assets) spinner využije profesionálnu animáciu plynulého zmiznutia (fade-out) na odhalenie obsahu. Tým sa predchádza rušivým vizuálnym skokom a vytvára sa uhladený dojem pripomínajúci natívnu aplikáciu (app-like feel).

#### 3.22.2. Vnímanie výkonu

- **Synchronizácia stavu**: Viditeľnosť načítavania (loaderu) je priamo previazaná s udalosťami načítavania prehliadača a asynchrónnou synchronizáciou dát, čo zaisťuje, že rozhranie sa odhalí až vtedy, keď je plne interaktívne a pripravené na vstupy používateľa.

### 3.23. Správa médií používateľa (User Media Management)

Na zaistenie organizovaného ukladania dát a ochrany súkromia platforma využíva štruktúrovaný systém správy súborov, ktorý izoluje obsah vytvorený používateľmi.

#### 3.23.1. Architektúra izolovaného úložiska

- **Mapovanie unikátnych adresárov**: Každému registrovanému používateľovi je v úložisku servera priradený vyhradený priečinok pre médiá. Tieto priečinky sú pomenované pomocou jedinečného ID používateľa (Unique ID), čo zaisťuje, že nahrávané súbory – napríklad profilové fotografie – sú striktne izolované a chránené pred konfliktmi názvov súborov (naming collisions).

- **Organizácia prostriedkov**: Táto štruktúra adresárov umožňuje systému efektívne odkazovať a načítavať médiá špecifické pre daného používateľa, pričom udržiava vysokú úroveň organizácie na backende.

#### 3.23.2. Automatizovaná optimalizácia zdrojov

- **Vyčistenie úložiska pri vymazaní**: Keď sa používateľ rozhodne natrvalo odstrániť svoj účet, systém spustí automatizovanú čistiacu rutinu. Tento proces rekurzívne vymaže celý priečinok médií používateľa vrátane všetkých obsiahnutých súborov.

- **Udržateľnosť servera**: Okamžitým odstránením nepotrebných súborov aplikácia predchádza „nafukovaniu dát“ (data bloating) a zabezpečuje, že úložisko servera sa využíva iba pre aktívnych používateľov, čím sa udržiava optimálny výkon systému.

- **Súlad s ochranou súkromia**: Táto funkcionalita zaručuje, že po ukončení účtu nezostanú na serveri žiadne osobné fotografie ani dáta, čo je v súlade s modernými štandardmi ochrany osobných údajov.

### 3.24. Bezpečné dary prostredníctvom Stripe

Na podporu údržby platformy je integrovaný bezpečný systém darovania pomocou API Stripe, ktorý obsahuje na mieru navrhnuté interaktívne platobné rozhranie.

#### 3.24.1. Interaktívne používateľské rozhranie (UI) kreditnej karty

- **Realistický dizajn karty**: Formulár pre dary je štylizovaný ako fyzická kreditná karta, čo umocňuje používateľský zážitok.

- **Logika obojstranného zadávania**:

    - **Predná strana**: Zachytáva základné údaje vrátane mena držiteľa karty, čísla karty a dátumu exspirácie.

    - **Zadná strana**: Špeciálne navrhnutá pre bezpečné zadanie kódu CVC (Card Verification Code), čím napodobňuje reálnu interakciu s fyzickou kartou.

- **Odstupňované možnosti darovania**: Používatelia si môžu vybrať z prednastavených súm daru (1 €, 2 € alebo 5 €), čo zjednodušuje proces rozhodovania.

#### 3.24.2. Integrita transakcií a Webhooky

- **Integrácia Stripe Webhookov**: Na zabezpečenie maximálnej spoľahlivosti systém využíva Stripe Webhooky. Táto komunikácia typu server-server umožňuje aplikácii monitorovať a aktualizovať stav transakcie (Čakajúca, Úspešná, Zlyhala) v reálnom čase, a to aj v prípade, že je klientov prehliadač zatvorený alebo sa počas spracovania stratí pripojenie.

- **Synchronizácia stavu**: Databáza sa automaticky aktualizuje na základe signálu prijatého z webhooku, čo zaručuje, že interné záznamy vždy odrážajú skutočný stav platby.

#### 3.24.3. Zaznamenávanie dát a spracovanie chýb

- **Komplexná história transakcií**: Každá transakcia je bezpečne zaznamenaná v databáze. Zaznamenané dáta zahŕňajú:

    - **Používateľský kontext**: Priradené ID používateľa (ak je prihlásený).

    - **Metadáta platby**: Meno držiteľa karty, presná suma, časová pečiatka (timestamp) a konečný stav transakcie.

- **Proaktívna spätná väzba pre používateľa**:

    - **Cesta úspechu (Success Path)**: Po úspešnej platbe je používateľ presmerovaný na domovskú stránku s potvrdzujúcou správou.

    - **Cesta zlyhania (Failure Path)**: V prípade nesprávnych údajov o karte alebo chýb siete je používateľ okamžite informovaný o zlyhaní a žiadna transakcia sa nedokončí, kým sa údaje neopravia.

### 3.25. Optimalizácia výkonu a vyrovnávacia pamäť (Caching)

Na dosiahnutie takmer okamžitého načítania a zníženie záťaže servera platforma využíva pokročilú vrstvu vyrovnávacej pamäte (caching layer) poháňanú technológiou Redis. To zabezpečuje špičkový používateľský zážitok minimalizáciou priamych náročných dopytov na databázu.

#### 3.25.1. Proaktívne predčítanie pamäte (Cache Warming)

- **Predhrievanie dát na pozadí**: Systém je nakonfigurovaný tak, aby vykonával proces „ohrievania vyrovnávacej pamäte“ (cache warming) v pravidelných intervaloch (napr. každých 10 minút). Tento proces proaktívne spúšťa komplexné a na zdroje náročné databázové dopyty – ako napríklad načítanie úplného zoznamu článkov alebo používateľských recenzií – a ukladá výsledky do pamäte Redis.

- **Zníženie latencie**: Poskytovaním „vopred vypočítaných“ dát priamo z operačnej pamäte (RAM) namiesto dopytovania databázy na disku doručuje aplikácia odpovede používateľovi takmer okamžite, a to aj pri vysokej návštevnosti.

#### 3.25.2. Integrita dát riadená signálmi

- **Invalidácia v reálnom čase**: Aby sa predišlo zobrazovaniu neaktuálnych dát, systém využíva signály frameworku Django (Django Signals). Akákoľvek úprava v databáze (napríklad pridanie nového článku alebo aktualizácia recenzie) okamžite spustí automatickú aktualizáciu príslušných kľúčov vo vyrovnávacej pamäti.

- **Plynulé aktualizácie**: Táto architektúra riadená udalosťami (event-driven architecture) zaručuje, že vyrovnávacia pamäť je vždy zosynchronizovaná s databázou. Používatelia tak ťažia z rýchlosti Redisu a zároveň majú vždy prístup k najaktuálnejším informáciám.

#### 3.25.3. Efektivita infraštruktúry

- **Odtiaženie databázy**: Ukladaním najčastejšie pristupovaných dát do vyrovnávacej pamäte sa výrazne znižuje počet duplicitných dopytov na primárnu databázu. To nie len zrýchľuje načítanie stránky pre jednotlivých používateľov, ale zároveň zvyšuje celkovú škálovateľnosť celej infraštruktúry.

### 3.26. Používateľské recenzie a systém spätnej väzby

Platforma obsahuje komplexný systém recenzií zobrazený na domovskej stránke, ktorý používateľom umožňuje zdieľať svoje skúsenosti, čím podporuje transparentnosť a dôveru komunity.

#### 3.26.1. Prezentácia recenzií a identita

- **Verejná viditeľnosť**: Každá odoslaná recenzia je verejne prístupná, čo potenciálnym používateľom poskytuje autentickú spätnú väzbu.

- **Identifikácia autora**: Recenzie viditeľne zobrazujú meno autora, profilovú fotografiu a vizuálne 5-hviezdičkové hodnotenie predstavujúce jeho celkovú spokojnosť.

#### 3.26.2. Uchovávanie dát a súkromie

- **Spracovanie pri vymazaní účtu (Anonymizácia)**: Na zachovanie integrity histórie spätnej väzby platformy pri súčasnom rešpektovaní súkromia používateľa zostávajú recenzie zo zmazaných účtov viditeľné. Osobné identifikátory sa však natrvalo odstránia: profilová fotografia sa skryje a meno autora sa dynamicky nahradí textom „Odstránený používateľ“ (Deleted User).

#### 3.26.3. Zásady úprav

- **Kontrolované úpravy**: Na udržanie autenticity recenzií pri súčasnom umožnení opravy prípadných chýb majú používatelia povolené upravovať svoje publikované recenzie so striktným limitom frekvencie raz za mesiac.

- **Trvalé vymazanie**: Používatelia si zachovávajú plnú kontrolu nad svojimi aktívnymi dátami a majú možnosť kedykoľvek natrvalo odstrániť svoje vlastné recenzie.

#### 3.26.4. Možnosti zoradenia a filtrovania

Na uľahčenie efektívnej navigácie v spätnej väzbe rozhranie poskytuje robustné ovládacie prvky zobrazenia:

- **Dynamické zoradenie**: Východiskovo sú recenzie zoradené chronologicky (Najnovšie). Používatelia môžu jednoducho prepínať mechanizmus zoradenia a zobraziť ako prvé Najstaršie, Najlepšie (najvyššie hodnotené) alebo Najhoršie (najnižšie hodnotené) recenzie.

- **Granulárne filtrovanie**: Pre cieľové čítanie môžu používatelia použiť striktné filtre na zoznam recenzií a zobraziť iba záznamy zodpovedajúce konkrétnemu hviezdičkovému hodnoteniu (napr. vyčlenenie iba 4-hviezdičkových recenzií).

### 3.27. Publikovanie príspevkov

Na podporu zapojenia komunity platforma obsahuje sofistikovaný systém nahrávania príspevkov. Tento modul umožňuje používateľom zdieľať svoj pokrok, poznatky a médiá prostredníctvom vysoko interaktívneho viacstupňového rozhrania.

#### 3.27.1. Metadáta obsahu a označovanie (Tagging)

Proces nahrávania je riešený prostredníctvom nenápadného kontextového (popup) formulára, v ktorom môžu používatelia obohatiť svoje príspevky o niekoľko vrstiev dát:

- **Kontextové informácie**: Používatelia môžu napísať podrobné popisy a špecifikovať lokalitu príspevku.

- **Sociálne prepojenia**: Na zvýšenie objaviteľnosti príspevkov a komunitnej interakcie je integrovaná podpora pre označovanie (tagging) ďalších používateľov a pridávanie hashtagov.

- **Ovládacie prvky interakcie**: Pre každý príspevok môžu používatelia prispôsobiť nastavenia súkromia a interakcie:

    - **Viditeľnosť**: Kontrola nad tým, kto môže obsah vidieť.

    - **Prepínače interakcií**: Možnosť vypnúť komentáre alebo skryť počet „páči sa mi to“ (likes) pred ostatnými používateľmi, čo umožňuje zamerať sa na obsah namiesto metrík.

#### 3.27.2. Pokročilý výber súborov a validácia

Logika spracovania médií je navrhnutá tak, aby bola robustná, zaisťovala stabilitu servera a integritu dát:

- **Striktná validácia**: Pred dokončením nahrávania systém overí všetky súbory voči špecifickým obmedzeniam:

    - **Limit pre obrázky**: Maximálne 10 MB na súbor.

    - **Limit pre videá**: Maximálne 100 MB na súbor.

    - **Limit počtu**: Maximálne 5 súborov na príspevok.

- **Proaktívny systém varovania**: Ak súbor prekročí limit, zobrazí sa ikona so žltým výkričníkom. Po prejdení kurzorom (pomocou systému tooltipov zo sekcie 4.1.) je používateľ informovaný o konkrétnom dôvode varovania.

- **Zabezpečenie na strane servera**: Každý súbor je uložený na serveri pod jedinečne vygenerovaným názvom, aby sa predišlo kolíziám a zabezpečilo sa bezpečné odkazovanie (ako je opísané v sekcii 3.23.).

#### 3.27.3. Intuitívne UX a správa médií

Frontend poskytuje plynulý zážitok na úrovni desktopovej aplikácie (Desktop-class) pre správu médií pred ich publikovaním:

- **Integrácia funkcie Drag-and-Drop**: Používatelia môžu súbory vybrať manuálne alebo použiť zónu na presunutie (Drag-and-Drop), ktorá sa automaticky zvýrazní, keď sa nad ňu presunú súbory.

- **Živé náhľady**: Vybrané médiá sa zobrazujú v galérii náhľadov, čo používateľom umožňuje overiť si svoj výber pred samotným nahratím.

- **Interaktívne preusporiadanie**: Výraznou črtou používateľského rozhrania je schopnosť zmeniť poradie obrázkov ich potiahnutím v rámci galérie náhľadov. To zahŕňa plynulé animácie, vďaka ktorým je manuálne radenie intuitívne a uspokojujúce.

- **Jednoduché odstránenie**: Jednotlivé súbory je možné odstrániť zo zoznamu výberu jediným kliknutím na ikonu odstránenia, čo umožňuje rýchle korekcie.

#### 3.27.4. Hĺbková inšpekcia obsahu (Validácia MIME-Type)

- **Nad rámec prípon súborov**: Aby sa predišlo obchádzaniu zabezpečenia škodlivými aktérmi jednoduchým premenovaním prípon súborov (napr. premenovanie skriptu na .jpg), systém využíva knižnicu python-magic.

- **Analýza „Magic Bytes“**: Každý nahraný súbor je skontrolovaný na binárnej úrovni. Systém načíta tzv. magic bytes (počiatočné bajty dát súboru), aby určil jeho skutočný MIME typ.

- **Vynucovanie integrity**: Ak sa súbor tvári ako obrázok, ale jeho vnútorná dátová štruktúra odhalí, že ide o spustiteľný binárny súbor alebo textový skript, systém nahrávanie automaticky odmietne. Poskytuje to robustnú obranu proti útokom typu „file spoofing“ a zabezpečuje, že server spracúva iba skutočné mediálne súbory.

#### 3.27.5. Automatizovaná ochrana odosielania

- **Neviditeľná obrana proti botom**: Proces odosielania príspevkov je zabezpečený integrovanou vrstvou reCAPTCHA v3. Zabezpečuje to bezproblémový používateľský zážitok pre legitímnych používateľov (frictionless experience), zatiaľ čo ticho blokuje automatizované skripty a spamové boty pred zaplavením platformy falošným obsahom.

### 3.28. Lokalita príspevku a geopriestorová integrácia

Na poskytnutie geografického kontextu zdieľanému obsahu platforma obsahuje sofistikovaný systém označovania lokalít, poháňaný profesionálnymi mapovými nástrojmi a rámcami pre priestorové databázy.

#### 3.28.1. Dynamické vyhľadávanie lokalít

- **Integrácia OpenStreetMap**: Systém využíva API Nominatim, vyhľadávací nástroj pre OpenStreetMap, čím poskytuje globálnu databázu overených lokalít bez potreby komerčných, platených mapových služieb.

- **Vyhľadávanie v reálnom čase (Type-ahead)**: Počas toho, ako používateľ píše lokalitu, systém vykonáva asynchrónne volania API na získanie najrelevantnejších geografických výsledkov. Tieto výsledky sa zobrazujú v zozname výberu pre okamžitú spätnú väzbu.

- **Mechanizmus spätnej väzby**: Na zachovanie plynulého zážitku počas komunikácie s API sa zobrazuje indikátor načítavania (Loading Spinner, ako je opísaný v sekcii 3.22.), ktorý používateľa informuje, že systém aktívne načítava dáta.

#### 3.28.2. Overenie a vlastné záznamy

- **Indikátor overenia**: Rozhranie obsahuje vizuálny prvok, ktorý používateľa informuje, či sa ním zadaná lokalita zhoduje s overeným miestom v globálnej databáze.

- **Flexibilita**: Hoci systém podporuje overené lokality, umožňuje aj zadanie vlastného textu. To zaisťuje, že používatelia môžu opísať svoju lokalitu aj vtedy, ak nie je indexovaná v mapovom API (napr. „Súkromná garážová posilňovňa“).

#### 3.28.3. Pokročilý geopriestorový backend (GeoDjango)

- **Ukladanie priestorových dát**: Pri overených lokalitách systém neukladá len textový reťazec, ale zachytáva a ukladá presné GPS súradnice (zemepisnú šírku a dĺžku).

- **Framework GeoDjango**: Platforma využíva framework GeoDjango, rozšírenie pre Django, ktoré poskytuje profesionálnu podporu pre geografické dáta. To databáze umožňuje vykonávať priestorové dopyty (spatial queries), ako je výpočet vzdialeností alebo vyhľadávanie príspevkov v rámci konkrétnej geografickej hranice.

- **Konzistencia dát**: Geografické informácie sú prepojené s metadátami príspevku, čo zabezpečuje, že dáta o lokalite sú dokonale zosynchronizované s obrázkami, popismi a označeniami používateľov.

#### 3.28.4. Priestorový referenčný systém (WGS84)

- **Globálny geodetický štandard**: Všetky zachytené súradnice sú uložené pomocou štandardu WGS84 (World Geodetic System 1984). Ide o priemyselný štandard súradnicového systému používaný v GPS po celom svete, čo zaručuje, že dáta o polohe sú presné a univerzálne kompatibilné.

- **Presnosť databázy (SRID 4326)**: Na backende sú tieto priestorové body indexované pomocou SRID 4326. Tento špecifický identifikátor priestorového odkazu umožňuje aplikácii bezproblémovo komunikovať s inými mapovými API a zaisťuje, že geografické metadáta zostanú konzistentné aj počas migrácie dát alebo integrácie.

- **Matematická presnosť**: Použitím štandardizovaného geodetického systému môže platforma vykonávať presné priestorové výpočty (ako sú merania vzdialeností alebo vyhľadávanie podľa blízkosti), ktoré zohľadňujú zakrivenie Zeme, čo poskytuje spoľahlivejšie dáta než jednoduché kartézske (ploché) súradnice.

### 3.29. Systém označovania používateľov a zmienok (Tagging)

Na uľahčenie komunitnej interakcie obsahuje platforma vysoko sofistikovaný systém zmienok (mentions), ktorý používateľom umožňuje označovať (tagovať) ostatných priamo v popisoch príspevkov. Hoci sa táto funkcionalita môže na prvý pohľad zdať jednoduchá, je poháňaná komplexnou architektúrou na pozadí, ktorá spravuje formátovaný text (rich text) a synchronizáciu dát v reálnom čase.

#### 3.29.1. Inteligentné spúšťanie a vyhľadávanie v reálnom čase

- **Inteligentná mechanika zadávania**: Používatelia môžu spustiť označovanie zadaním symbolu @ alebo kliknutím na vyhradenú ikonu @. Systém inteligentne kontroluje predchádzajúce medzery a automaticky ich doplní, ak chýbajú, čím zabezpečí správne formátovanie.

- **Asynchrónne živé vyhľadávanie**: Po zadaní symbolu @ nasledovaného znakmi sa spustí asynchrónna požiadavka JS Fetch. Táto požiadavka dynamicky dopytuje databázu a v reálnom čase napĺňa rozbaľovacie menu (dropdown) relevantnými používateľmi.

- **Sanitizácia dát**: Výsledky vyhľadávania sú prísne filtrované, aby sa zobrazovali iba aktívne, overené účty, s explicitným vylúčením pozastavených používateľov.

- **Prístupnosť cez klávesnicu**: Dynamické rozbaľovacie menu plne podporuje navigáciu pomocou klávesnice, čo používateľom umožňuje prechádzať výsledky pomocou šípok a potvrdiť označenie klávesom Enter.

#### 3.29.2. Vykresľovanie formátovaného textu (Rich Text) a UX

- **Vlastný kontajner obsahu**: Keďže štandardné HTML prvky <textarea> nepodporujú interné formátovanie, systém využíva vlastný kontajner s atribútom contenteditable. To umožňuje, aby sa úspešne označení používatelia vykreslili vo vnútri textu ako vysoko viditeľné, nastylované „pilulky“ (pills).

- **Sekundárne zobrazenie značiek**: Pre lepšiu prehľadnosť sa všetky úspešne rozpoznané označenia súčasne zobrazujú ako zoznam pod oblasťou zadávania, ktorý obsahuje aj možnosti rýchleho odstránenia.

- **Prevencia duplikátov**: Systém vynucuje prísne pravidlo „jedno označenie na používateľa“. Pokus o označenie už spomenutého používateľa spustí namiesto rušivej chybovej hlášky krátku, intuitívnu varovnú animáciu.

- **Záložný text (Text Fallback)**: Ak je zadaný symbol @, ale nenájde sa ani nevyberie žiadny platný používateľ, systém elegantne prejde do záložného režimu a zaobchádza so zadaným vstupom ako s bežným textovým slovom.

#### 3.29.3. Správa stavu a logika odstraňovania

- **Limity označovania**: Aby sa predišlo spamu, systém presadzuje maximálny limit 10 označení na príspevok.

- **Intuitívne odstránenie**: Používatelia môžu značku odstrániť dvoma spôsobmi:

    - Kliknutím na „X“ (znak vymazania) vedľa mena používateľa v zozname pod textovým poľom.

    - Použitím klávesu Backspace priamo v textovom editore. Systém inteligentne deteguje, keď kurzor koliduje s nastylovanou „pilulkou“ značky, a plynulo odstráni celú entitu označenia.

#### 3.29.4. Podkladová technická architektúra

- **Sledovanie kurzora a pozície**: Kód na frontende úzkostlivo sleduje každú akciu používateľa – písanie, mazanie a zmenu polohy kurzora – aby neustále prepočítaval a udržiaval správne indexové pozície všetkých značiek v rámci surového textového reťazca (raw text string).

- **Integrácia backendu**: Po odoslaní sa parsovaný zoznam označených používateľov bezpečne prenesie a uloží do relačnej databázy spolu so základnými metadátami príspevku, čo umožňuje následné notifikácie a relačné dopyty.

### 3.30. Integrácia a formátovanie hashtagov

Na kategorizáciu obsahu a zlepšenie globálnej objaviteľnosti platforma obsahuje dynamický systém rozpoznávania hashtagov. Táto funkcionalita je postavená na rovnakej robustnej architektúre analyzovania textu v reálnom čase (text-parsing), aká sa používa pre zmienky o používateľoch.

#### 3.30.1. Spúšťacie mechanizmy a validácia

- **Inteligentné možnosti zadávania**: Používatelia môžu hashtag spustiť manuálne zadaním symbolu # alebo interakciou s vyhradenou ikonou rozhrania. Po kliknutí na ikonu systém inteligentne vloží symbol # a automaticky pridá potrebné medzery, aby sa zabezpečil čistý tok textu.

- **Potvrdenie medzerníkom**: Hashtagy sa dynamicky vyhodnocujú počas písania. Keď používateľ zadá kľúčové slovo za znakom mriežky a stlačí kláves Medzerník, systém okamžite spracuje zadaný vstup.

- **Vynucovanie pomocou Regex vzorov**: Na zachovanie integrity databázy a zabránenie vytváraniu nesprávne formátovaných alebo „nezmyselných“ značiek sa každý vstup overuje voči prísnym vzorom regulárnych výrazov (Regex). Ak vstup nespĺňa tieto špecifikácie, je elegantne ignorovaný ako značka a zaobchádza sa s ním čisto ako s bežným textom.

#### 3.30.2. Vizuálna spätná väzba a jedinečnosť

- **Dynamické štýlovanie piluliek**: Úspešne overené hashtagy sa v textovej oblasti okamžite vykreslia ako zvýraznené, farebné „pilulky“, čo používateľovi poskytuje okamžitú vizuálnu preukázateľnosť aktívnej značky.

- **Prevencia duplikátov**: Systém presadzuje prísny protokol jedinečnosti. Každý konkrétny hashtag môže byť v rámci jedného príspevku aktívny iba raz. Ak sa používateľ pokúsi znova zadať identický hashtag, systém spracuje túto druhú inštanciu jednoducho ako obyčajný text.

- **Obsahové limity**: Aby sa predišlo spamu v značkách a zachovalo sa optimálne vizuálne rozloženie, systém obmedzuje maximálne množstvo na 5 hashtagov na príspevok.

#### 3.30.3. Parsovanie textu v reálnom čase a správa kolízií

- **Dynamické prehodnocovanie**: Frontend neustále monitoruje stlačenia klávesov a pozície kurzora. Ak používateľ vymaže text a kurzor koliduje s existujúcim nastylovaným hashtagom, systém dynamicky aktualizuje jeho uložený index pozície.

- **Aktualizácie stavu**: Počas odstraňovania alebo úpravy systém prehodnocuje reťazec, s ktorým došlo ku kolízii. Ak úprava naruší Regex vzor alebo vytvorí duplikát, nastylovaná pilulka sa okamžite vráti do podoby štandardného textu, čím sa zabezpečí, že podkladová dátová štruktúra zostane dokonale synchronizovaná s vizuálnym výstupom.

### 3.31. Komunitné vyhľadávanie a asynchrónny systém sledovania

Komunitná stránka slúži ako centrálny uzol pre objavovanie používateľov a vytváranie sietí (networking). Obsahuje vysoko optimalizovaný vyhľadávací nástroj a funkcie interakcie v reálnom čase, ktoré sú navrhnuté tak, aby poskytovali plynulý sociálny zážitok pri minimalizácii záťaže servera.

#### 3.31.1. Optimalizovaná architektúra vyhľadávania

- **Hybridný systém filtrovania**: Na zaistenie rýchlych časov odozvy a zníženie záťaže databázy využíva funkcia vyhľadávania kombinovaný prístup server-klient. Po zadaní prvého znaku do panela vyhľadávania sa spustí jedna požiadavka na databázu, ktorá načíta dávku relevantných používateľov. Všetko následné filtrovanie, ako používateľ pokračuje v písaní, sa spracováva čisto na strane klienta (JavaScript), čím sa eliminujú zbytočné (redundantné) dopyty na backend.

- **Parametre dopytu a sanitizácia**: Používateľov je možné vyhľadávať pomocou ich zobrazovaného mena (Display Name) alebo ich jedinečného kódu priateľa (Friend Code). Na zachovanie integrity komunity vyhľadávací dopyt striktne filtruje pozastavené alebo neoverené účty a zobrazuje iba používateľov so stavom účtu „Schválený“ (Approved).

- **Obmedzenie UI**: Pre optimálnu vizuálnu čistotu a zabránenie posunom rozloženia (layout shifts) je rozbaľovacia ponuka výsledkov vyhľadávania obmedzená na zobrazenie maximálne 3 najrelevantnejších používateľov súčasne.

#### 3.31.2. Interaktívne UX a správa stavu

- **Okamžitý reset stavu**: Panel vyhľadávania obsahuje vyhradené tlačidlo „Vymazať“ (Delete/Clear). Kliknutím na toto tlačidlo alebo manuálnym vymazaním vstupu sa okamžite zmaže stav vyhľadávania a bez akéhokoľvek oneskorenia sa automaticky obnoví používateľské rozhranie s výsledkami.

- **Vizuálna spätná väzba spracovania**: Počas krátkeho času čakania, keď sa z databázy načítava úvodná požiadavka, sa na oblasť vyhľadávania aplikuje sofistikovaný efekt rozostrenia (blur effect) sprevádzaný textom „Načítava sa“ (Loading). Poskytuje to jasnú kontextovú spätnú väzbu, ktorá používateľa uisťuje, že systém jeho požiadavku aktívne spracováva.

#### 3.31.3. Sociálne interakcie v reálnom čase

- **Asynchrónne sledovanie**: Schopnosť sledovať ostatných používateľov je navrhnutá pre maximálnu plynulosť. Namiesto spoliehania sa na tradičné odosielanie formulárov je akcia „Sledovať“ (Follow) poháňaná pomocou JavaScript Fetch API (požiadavky typu POST).

- **Plynulé aktualizácie stavu**: To umožňuje aktualizáciu stavu vzťahu v databáze a jeho premietnutie do používateľského rozhrania v reálnom čase, čím sa úplne obchádza potreba rušivého obnovovania stránky (page reloads).

### 3.32. Notifikácie v reálnom čase a informačné správy

Na zabezpečenie transparentného a responzívneho používateľského zážitku platforma disponuje centralizovaným systémom správ. Tento modul poskytuje okamžité vizuálne potvrdenie akcií používateľa a kritických systémových udalostí, čím zaisťuje, že používateľ je vždy informovaný o stave aplikácie.

#### 3.32.1. Transakčná spätná väzba (CRUD operácie)

Systém automaticky spúšťa informačné správy po významných interakciách používateľa, najmä pokiaľ ide o tréningové dáta:

- **Vytváranie a aktualizácie**: Po úspešnom vytvorení alebo úprave tréningového plánu používateľ dostane potvrdzujúcu správu, ktorá overuje, že jeho dáta boli úspešne uložené do databázy.

- **Upozornenia na odstránenie**: Keď používateľ odstráni plán alebo cvik, systém poskytne konečné potvrdenie o vymazaní, čím sa predíde akejkoľvek nejednoznačnosti týkajúcej sa úspešnosti akcie.

#### 3.32.2. Kategorizované systémové správy

Pre poskytnutie kontextovo špecifickej spätnej väzby sú správy kategorizované do odlišných typov, pričom sa často využíva štandardné farebné kódovanie pre ich rýchle rozpoznanie:

- **Správy o úspechu (Success)**: Zvýraznené pre pozitívne výsledky, ako sú aktualizácie profilu alebo úspešné dary.

- **Chybové a varovné upozornenia (Error & Warning)**: Informujú používateľa, ak určitú akciu nebolo možné dokončiť (napr. neplatné dáta vo formulári).

- **Všeobecné informácie**: Používajú sa na nekritické aktualizácie alebo zmeny stavu, ktoré zlepšujú celkové povedomie o fungovaní platformy.

#### 3.32.3. Vizuálna prezentácia a UX

- **Nenápadné doručovanie**: Tieto správy sú navrhnuté tak, aby sa zobrazovali ako elegantné prekrytia alebo bannery (tzv. toasts), ktoré nenarúšajú primárny pracovný postup.

- **Dočasná (efemérna) existencia**: Väčšina informačných správ je naprogramovaná ako dočasná; zobrazia sa na dostatočne dlhý čas potrebný na prečítanie a potom sa automaticky skryjú, aby sa zachovalo čisté a nepreplnené rozhranie.

### 3.33. Dynamický kanál príspevkov a interaktívne komunitné zapojenie

Kanál príspevkov (Post Feed) slúži ako centrálny uzol komunitnej aktivity, kde môžu používatelia bezproblémovo objavovať, prezerať a interagovať s obsahom. Kombinuje sofistikovaný systém prezentácie médií s robustnými asynchrónnymi sociálnymi funkciami.

#### 3.33.1. Inteligentná prezentácia médií (Karusel)

- **Dynamické generovanie galérie**: Príspevky obsahujúce viacero mediálnych súborov (obrázky alebo videá) sa zobrazujú v interaktívnom karuseli. Východiskovo je viditeľná iba prvá položka.

- **Kontextová navigácia**: Používateľské rozhranie sa inteligentne prispôsobuje obsahu. Ak príspevok obsahuje viacero súborov, systém automaticky vykreslí navigačné šípky a lištu stránkovania (indikátory vo forme bodiek) pod ním. Ak príspevok obsahuje iba jeden súbor, tieto UI prvky sa elegantne vynechajú, aby sa predišlo vizuálnemu preplneniu.

#### 3.33.2. Kontext autora a nadväzovanie kontaktov

- **Integrované profily**: Hlavička každého príspevku viditeľne zobrazuje profilovú fotografiu autora, používateľské meno a aktuálny počet sledovateľov.

- **Inteligentný systém sledovania**: Tlačidlo „Sledovať / Nesledovať“ (Follow / Unfollow) je priamo integrované do hlavičky príspevku a odráža vzťah aktuálneho používateľa k autorovi. Systém inteligentne rozpozná, či si používateľ prezerá svoj vlastný príspevok, a toto tlačidlo automaticky skryje, aby sa predišlo nelogickému sledovaniu samého seba.

#### 3.33.3. Gamifikované mikrointerakcie („Páči sa mi to“ / Likes)

- **Metriky rešpektujúce súkromie**: Používatelia môžu príspevkom dávať „páči sa mi to“, no celkové počítadlo lajkov dynamicky rešpektuje nastavenia súkromia pôvodného autora (nakonfigurované v procese nahrávania príspevku).

- **Vylepšené UX animácie**: Pre poskytnutie pútavej spätnej väzby kliknutie na tlačidlo „páči sa mi to“ spustí vlastnú časticovú animáciu (particle animation). Náhodný počet srdiečok (medzi 1 a 5) sa vygeneruje a letí náhodnými smermi rôznou rýchlosťou pred tým, než plynule zmizne. Táto gamifikovaná mikrointerakcia výrazne zvyšuje celkový používateľský zážitok.

#### 3.33.4. Hierarchická architektúra komentárov

- **Pútavé diskusie**: Používatelia môžu zdieľať názory, reagovať na príspevky a označovať ostatných vo vyhradenej sekcii komentárov. Pre zvýraznenie najlepšieho obsahu sa komentáre automaticky zoradia podľa obľúbenosti (najprv najviac lajkované).

- **Systém zanorených odpovedí**: Platforma podporuje odpovedanie na konkrétne komentáre, čím vytvára diskusné vlákna. Na zachovanie čistého rozloženia UI a zabránenie rozpadu rozhrania na menších obrazovkách je hlboké zanorenie striktne obmedzené na maximálnu úroveň 5 vrstvector.

- **Dynamické prepínanie odpovedí**: Pre zachovanie nepreplneného rozhrania sú zanorené odpovede východiskovo skryté. Frontend inteligentne vykresľuje ikonu prepínača „Zobraziť odpovede“ výhradne pre komentáre, ktoré obsahujú aktívne podvlákna. Ak komentár nemá žiadne odpovede, UI zostáva úplne čisté bez generovania zbytočných tlačidiel, čo používateľom umožňuje plynulo rozbaľovať alebo zbaľovať diskusie na požiadanie.

- **Vizuálne prepojenie diskusií (Threading)**: Na zvýšenie čitateľnosti v rámci zanorených konverzácií rozhranie implementuje vlastné vodiace čiary (threading paths), ktoré vizuálne ukotvujú odpovede k ich nadradeným komponentom. Tieto indikačné čiary sledujú hĺbku diskusie a elegantne sa zakrivujú smerom ku konkrétnej odpovedi, čím poskytujú jasnú a intuitívnu mapu štruktúry konverzácie.

#### 3.33.5. Plne asynchrónny engine

- **Interakcie bez obnovovania stránky**: Každá kľúčová sociálna akcia – lajkovanie príspevku, pridanie komentára, odpoveď na vlákno alebo lajkovanie konkrétneho komentára/odpovede – je plne asynchrónna.

- **Integrácia Fetch API**: Tieto funkcionality sú poháňané bezpečnými požiadavkami JavaScript Fetch POST (Sekcia 4.8.), čo zaručuje, že pozícia používateľa v kanáli príspevkov nie je nikdy narušená obnovením stránky, čím sa dosahuje plynulý zážitok porovnateľný s natívnymi mobilnými aplikáciami.

### 3.34. Gamifikovaný systém aktivít a denné výzvy

Na zvýšenie zapojenia používateľov a podporu vytrvalých tréningových návykov platforma obsahuje dynamický systém denných výziev. Tento modul zavádza základné herné mechaniky (gamifikáciu), ktoré prekladajú fyzickú konzistentnosť do virtuálneho pokroku.

#### 3.34.1. Automatizované generovanie a rotácia úloh

- **Personalizované denné obnovenie**: Každý kalendárny deň backend automaticky vygeneruje prispôsobenú sadu náhodných výziev šitých na mieru pre každý individuálny profil používateľa. Tieto úlohy sú viditeľne zobrazené na osobnej stránke aktivity používateľa.

- **Algoritmická pestrosť**: Systém náhodne čerpá z rozmanitej databázy šablón cieľov, čo zaručuje, že používateľ denne čelí unikátnym variáciám. Príklady výziev zahŕňajú:

    - **Ciele trvania**: „Dokončite dnes celkovo 1 hodinu aktivity.“

    - **Kompletizačné míľniky**: „Splňte všetky oficiálne úlohy na dnešný deň.“

    - **Výkonnostné ciele**: „Prekonajte svoj aktuálny týždenný priemer času aktivity.“

#### 3.34.2. Overovanie splnenia v reálnom čase a odmeny

- **Integrácia so sledovaním aktivity**: Platforma aktívne monitoruje zaznamenané metriky používateľa počas celého dňa. Keď udalosť na pozadí spustí zmenu v tréningových dátach, systém okamžite prepočíta stav všetkých aktívnych denných úloh.

- **Ekonomika skúsenostných bodov (XP)**: Po dosiahnutí 100 % splnenia akejkoľvek určenej úlohy backend bezpečne zaznamená zmenu stavu a automaticky odmení používateľa vopred určeným množstvom skúsenostných bodov (XP), čo prispieva k celkovému pokroku jeho účtu.

#### 3.34.3. Plynulé vizuálne indikátory pokroku

- **Dynamická výplň pozadia prechodom (Gradient Fill)**: Na strane klienta funguje karta každej úlohy ako vizuálny ukazovateľ pokroku (progress bar). S rastúcim pokrokom sa pozadie karty dynamicky napĺňa pomocou CSS prechodového efektu, ktorý plynulo prechádza z teplej žltej do žiarivo zelenej.

- **UI potvrdzujúce dokončenie**: V momente, keď vektor pokroku dosiahne presne 100 %, rozhranie okamžite aktualizuje visualný stav úlohy – začiarkne prispôsobené, na mieru nastylované políčko (checkbox) a ukotví animáciu, čím používateľovi poskytne okamžité a uspokojujúce vizuálne potvrdenie.

### 3.35. Vlastné používateľské úlohy a interaktívna architektúra zoznamu úloh (To-Do)

Na doplnenie systémom generovaných denných výziev platforma poskytuje decentralizovaný modul pre nastavovanie osobných cieľov. Táto funkcia umožňuje používateľom spravovať vlastné pracovné postupy, upravovať priority za chodu a udržiavať plne prispôsobený zoznam úloh priamo na svojom ovládacom paneli aktivity.

#### 3.35.1. Asynchrónne vytváranie a živé vykresľovanie

- **Okamžité vloženie úlohy**: Používatelia môžu bezproblémovo definovať a pridávať personalizované úlohy prostredníctvom vyhradeného vstupného kontajnera.

- **Neblokujúce Fetch kanály**: Proces vytvárania využíva asynchrónnu požiadavku JavaScript Fetch POST na komunikáciu s backendom. Po úspešnom zápise do databázy sa nová úloha okamžite vykreslí v používateľskom rozhraní bez nutnosti úplného obnovenia stránky.

Reaktívne počítadlá agregácie: Aplikácia automaticky sleduje rozsah pracovného zaťaženia používateľa a okamžite zvýši globálny indikátor „Celkový počet úloh“ hneď po inicializácii nového cieľa.

#### 3.35.2. UI so správou stavu a zmena poradia pomocou Drag-and-Drop

- **Manuálne dokončenie a vizuálne stavy**: Používatelia si zachovávajú plnú kontrolu nad plnením svojich úloh a môžu ľubovoľne prepínať stav ich dokončenia. Rozhranie sa spolieha na výrazné, vysokokontrastné visualné prvky na oddelenie nevyriešených cieľov od splnených:

    - **Aktívne úlohy**: Vykreslené so štandardným štýlovaním priority.

    - **Dokončené úlohy**: Plynule prechádzajú do polopriehľadného zeleného pozadia, doplneného o automaticky začiarknuté prispôsobené políčko (checkbox).

- **Plynulé rozloženie typu Drag-and-Drop**: Na maximálne zvýšenie efektivity organizácie môžu používatelia dynamicky meniť hierarchiu rozloženia. Presúvaním kariet úloh pomocou funkcie Drag-and-Drop sledovací skript na strane klienta prepočíta indexy nových pozícií a v reálnom čase aktualizuje používateľom preferované poradie.

#### 3.35.3. Dynamické metriky a hygiena úložiska

- **Živá spätná väzba o pokroku**: Rozhranie neustále vykresľuje presné počítadlo zobrazujúce pomer dokončených úloh voči absolútnemu celku (napr. „3 / 8 úloh dokončených“).

- **Hromadná čistiaca akcia**: Aby sa predišlo preplneniu rozloženia a vizuálnej únave, k dispozícii je automatizovaný čistiaci nástroj. Jediným kliknutím môžu používatelia vymazať všetky dokončené úlohy zo svojho aktívneho zoznamu. Táto interakcia spustí okamžitý, synchronizovaný prepočet indikátorov dokončených aj celkových úloh v celom zobrazení (viewport).

### 3.36. Časové zosilnenie skúseností (XP Boost Engine)

Na optimalizáciu udržania používateľov a vytvorenie cyklu vysokej angažovanosti zahŕňa platforma denný systém časových modifikátorov. Táto funkcia využíva motiváciu poháňanú časovou tiesňou a odmeňuje používateľov, ktorí si udržiavajú každodenné tréningové tempo.

#### 3.36.1 Prideľovanie multiplikátora a denný reset

- **Denná zásoba zosilnenia (Daily Boost Pool)**: Každému používateľovi je pridelené nekumulatívne 30-minútové okno s dvojitými skúsenosťami (2x XP), ktoré sa resetuje na začiatku každého kalendárneho dňa.

- **Dynamické spúšťanie**: Pri inicializácii novej relácie fyzického tréningu prostredníctvom stránky aktivít systém automaticky overí dostupnosť zásoby zosilnenia. Ak je k dispozícii, backend aplikuje striktný multiplikátor na všetky body skúseností (XP) nazbierané počas tohto aktívneho okna.

#### 3.36.2 Reaktívne odpočítavanie a mikroanimácie

- **Sledovanie lineárneho postupu**: Na strane klienta je trvanie aktívneho zosilňovača vizualizované pomocou vysoko precíznej, stenčujúcej sa čiary postupu. Tento komponent využíva plynulé animácie riadené pomocou CSS alebo JavaScriptu na to, aby sa pomaly zmenšoval, čím v reálnom čase odráža presnú zostávajúcu životnosť aktívneho multiplikátora.

- **Kontextové štítky stavu**: Priamo nad zmenšujúcou sa časovou osou je ukotvený dynamický textový štítok. Počas aktivity explicitne komunikuje aktuálny stav multiplikátora (napr. „2x XP Boost Active“).

#### 3.36.3 Plynulé spracovanie vypršania platnosti

- **Asynchrónny prechod stavu**: V presnom okamihu prekročenia 30-minútovej hranice spustí časovač na klientskej strane čisté ustálenie stavu.

- **Ústup v používateľskom rozhraní (UI Deprecation)**: Zmenšujúca sa indikačná čiara úplne vybledne z viditeľnej oblasti a stavový štítok sa okamžite aktualizuje, aby indikoval, že momentálne nie je aktívny žiadny multiplikátor. Následné aktivity sa vrátia k základným sadzbám získavania XP bez toho, aby si vyžadovali opätovné načítanie aplikácie.

### 3.37. Komplexná architektúra používateľského profilu

Aby platforma poskytla centrálny uzol identity pre každého používateľa, obsahuje vysoko dynamickú a kontextovo orientovanú stránku profilu. Systém inteligentne mení zobrazené používateľské rozhranie (UI) a dostupné dáta na základe stavu overenia (autentifikácie) a špecifického sociálneho vzťahu medzi prezerajúcim používateľom a vlastníkom profilu.

#### 3.37.1. Plynulá navigácia a zobrazenie identity

- **Univerzálne smerovanie (Routing)**: Používatelia môžu bez námahy prejsť na akýkoľvek profil kliknutím na príslušného avatara používateľa, ktorý je strategicky zakomponovaný naprieč platformou (napr. v príspevkoch v kanáli, aktívnych vláknach komentárov a výsledkoch vyhľadávania).

- **Verejné metriky a gamifikácia**: Hlavička profilu zhromažďuje a zobrazuje základné identifikátory, vrátane zobrazovaného mena používateľa, prispôsobeného životopisu (biografie), dynamicky získaných odznakov za úspechy a jeho aktuálnej, živej série aktivít (activity streak).

#### 3.37.2. Kontextová mriežka obsahu a ovládacie prvky súkromia

- **Interaktívna mriežka médií**: Nahraný obsah je systematicky organizovaný do čistého, vizuálne príťažlivého rozloženia mriežky (grid layout). Kliknutím na ktorúkoľvek konkrétnu miniatúru sa dynamicky otvorí zobrazenie celého príspevku pre detailnú interakciu.

- **Striktné maskovanie súkromia**: Backend presadzuje prísne kontroly oprávnení pred doručením dát do mriežky. Ak je konkrétny príspevok označený ako „Iba pre sledovateľov“ (Followers Only) a prezerajúcemu používateľovi chýba požadovaný stav vzťahu, obsah sa bezpečne zadrží. Namiesto rozbitia rozloženia UI frontend elegantne vykreslí zástupný prvok (placeholder) „prázdneho príspevku“, čím zachováva vizuálnu symetriu mriežky a zároveň striktne chráni súkromie autora.

#### 3.37.3. Exkluzívny panel vlastníka a konfigurácie

Keď prihlásený (authenticated) používateľ prejde na svoj vlastný osobný profil, systém rozpozná jeho vlastníctvo a dynamicky odomkne špecializované panely správy:

- **Súkromné zbierky (Uložené príspevky)**: Vlastníkovi sa stane jedinečne viditeľná vyhradená, súkromná sekcia, ktorá mu umožňuje pohodlne prechádzať svojou osobnou zbierkou záložiek a uložených príspevkov z celej siete.

- **Portál nastavení účtu**: Výhradne pre vlastníka sa vykreslí ikona bezpečného prepínača nastavení. Tá slúži ako brána do hlavného konfiguračného menu, kde môžu používatelia vykonávať kľúčové aktualizácie účtu, ako je úprava zobrazovaného mena, aktualizácia prepojených telefónnych čísel alebo bezpečné obnovenie hesla.

- **Prepínač globálnej viditeľnosti**: Priamo v menu nastavení je zakomponovaný hlavný prepínač súkromia, ktorý používateľovi poskytuje absolútnu kontrolu nad plynulým prechodom stavu celého profilu medzi režimami Verejnej a Súkromnej viditeľnosti.

## 4. Funkcie

### 4.1. Kontextový systém tooltipov

Na udržanie čistej a minimalistickej estetiky bez obetovania prehľadnosti platforma využíva integrovaný systém tooltipov (nástrojových tipov). Táto funkcia poskytuje vysvetlenia rôznych prvkov používateľského rozhrania na požiadanie, čím zabezpečuje rýchlu adaptáciu (plytkú krivku učenia) pre nových používateľov.

#### 4.1.1. Čistota používateľského rozhrania

- **Nenápadné usmerňovanie**: Tooltipy fungujú ako sekundárna vrstva informácií, ktorá zostáva východiskovo skrytá. Zobrazia sa až vtedy, keď používateľ prejaví zámer prejdením kurzorom nad špecifické interaktívne prvky, ako sú abstraktné ikony, akčné tlačidlá alebo zložité dátové body vo výkonnostných grafoch.

- **Stručné kontextové štítky**: Každý tooltip poskytuje stručné vysvetlenie alebo štítok, čo zabezpečuje okamžitú jasnosť o funkcii prvku bez toho, aby sa primárne vizuálne rozloženie preplnilo zbytočným textom.

#### 4.1.2. Inteligentný dizajn interakcií

- **Časovaná aktivácia**: Aby sa predišlo náhodnému spusteniu a vizuálnemu blikaniu, tooltipy sú naprogramované s krátkym oneskorením aktivácie. Zobrazia sa až po tom, čo kurzor zostane nehybne stáť nad prvkom niekoľko sekúnd, čo zaručuje, že sa informácia prezentuje iba vtedy, keď ju používateľ pravdepodobne skutočne potrebuje.

- **Umiestnenie**: Tieto prekrytia sú navrhnuté ako responzívne a zobrazujú sa v neprekážajúcej polohe relatívne ku kurzoru, čo zabezpečuje, že podkladový obsah zostáva čiastočne viditeľný pre zachovanie kontextu.

### 4.2. Automatizované týždenné reporty výkonnosti

Na zvýšenie zapojenia používateľov a poskytnutie využiteľných poznatkov (actionable insights) platforma každý týždeň generuje komplexný súhrn aktivít. Tento report umožňuje používateľom zhodnotiť svoj pokrok a porovnať svoju aktuálnu výkonnosť s predchádzajúcimi dátami.

#### 4.2.1. Výkonnostné metriky a analytika

Report agreguje dáta za posledných sedem dní, aby poskytol jasný obraz o tréningových návykoch používateľa:

- **Časová analytika**: Zahŕňa celkový čas aktivity a priemerný denný čas aktivity, čo poskytuje celkový pohľad na odhodlanie používateľa.

- **Maximálny výkon (Peak Performance)**: Identifikuje najaktívnejší deň v týždni, čo používateľom pomáha rozpoznať ich najproduktívnejšie časové okná.

- **Identifikácia zamerania**: Zvýrazňuje obľúbený cvik, ktorý sa dynamicky určuje na základe celkového času stráveného vykonávaním konkrétnych pohybov.

- **Sledovanie pokroku (Delta)**: Systém vypočíta percentuálne zlepšenie alebo zhoršenie v porovnaní s predchádzajúcim týždňom, čím používateľom poskytne jasný indikátor ich aktuálneho tempa.

#### 4.2.2. Vizuálna reprezentácia dát (Integrácia e-mailov)

Keďže vizuálne dáta sú pre používateľa ľahšie stráviteľné, report obsahuje vysokokvalitné grafy. Pretože štandardné e-mailové klienty nepodporujú dynamické vykresľovanie JavaScriptu, systém využíva špecializovaný prístup na backende:

- **Generovanie grafov na strane servera**: Platforma využíva knižnicu QuickChart.io pre Python na spracovanie konfigurácií rámca Chart.js.

- **Konverzia na obrázky**: Komplexné vizualizácie dát (Týždenný súhrn aktivity a Týždenný súhrn cvikov) sú na serveri skonvertované do statických obrázkových súborov.

- **Plynulé doručenie**: Tieto obrázky sú vložené priamo do reportu, čo zaručuje, že používateľ uvidí konzistentné grafy s vysokou presnosťou zobrazenia bez ohľadu na zariadenie alebo poskytovateľa e-mailu, ktorého používa.

### 4.3. Pokročilé zabezpečenie hesiel a hashovanie Argon2

Na zabezpečenie najvyššej úrovne ochrany dát a súkromia používateľov platforma implementuje špičkové kryptografické štandardy pre ukladanie hesiel, čím presahuje predvolené konfigurácie webových frameworkov.

#### 4.3.1. Implementácia algoritmu Argon2

- **Najmodernejšie hashovanie**: Systém využíva Argon2, víťaza súťaže Password Hashing Competition, ako primárny hashovací algoritmus. Na rozdiel od tradičných algoritmov je Argon2 špecificky navrhnutý tak, aby odolával útokom hrubou silou (brute-force attacks) poháňaným špecializovaným hardvérom (GPU a ASIC).

- **Funkcionalita náročná na pamäť (Memory-Hard)**: Tým, že Argon2 vyžaduje na výpočet hashu značné množstvo pamäte, robí z rozsiahlych paralelných pokusov o prelomenie ekonomicky a technicky neuskutočniteľnú úlohu pre útočníkov, čím poskytuje nadštandardnú vrstvu obrany pre prihlasovacie údaje používateľov.

#### 4.3.2. Redundancia a záložné mechanizmy

- **Dynamický výber hashovača**: Zatiaľ čo Argon2 je primárnym štandardom, bezpečnostná architektúra aplikácie obsahuje prioritizovaný zoznam záložných hashovačov (ako napríklad PBKDF2).

- **Bezproblémová kompatibilita**: Tieto zálohy zabezpečujú, že systém zostane funkčný a bezpečný aj v prípade nedostupnosti knižnice alebo počas prechodu na nové štandardy zo starších prihlasovacích údajov (legacy credentials).

- **Automatická aktualizácia**: Systém je navrhnutý tak, aby po ďalšom úspešnom prihlásení automaticky prehashoval heslá používateľov pomocou Argon2, ak boli predtým uložené pomocou staršieho a slabšieho algoritmu.

#### 4.3.3. Integrita databázy

- **Nevratné šifrovanie**: Heslá sa nikdy neukladajú v čistom texte (plain text). Ukladajú sa iba výsledné kryptografické hashe s vysokou entropiou, čo zaručuje, že aj v nepravdepodobnom prípade úniku dát z databázy zostane získanie skutočných hesiel používateľov výpočtovo nemožné.

### 4.4. Lokálna simulácia produkčného prostredia (Ngrok)

Na zabezpečenie toho, aby bola aplikácia pred jej konečným nasadením plne „pripravená na produkciu“ (production-ready), bolo vývojové prostredie rozšírené o nástroj Ngrok, čím sa vytvoril bezpečný, verejne prístupný tunel na lokálny server.

#### 4.4.1. Bezpečné tunelovanie a testovanie HTTPS

- **Emulácia reálneho prostredia**: Ngrok poskytuje dočasnú, zabezpečenú HTTPS doménu, ktorá zrkadlí bezpečnostné podmienky živého produkčného servera. To umožňuje testovanie funkcií, ktoré si striktne vyžadujú šifrované pripojenia (SSL/TLS).

- **Testovanie naprieč zariadeniami (Cross-Device Testing)**: Sprístupnením lokálneho vývojového prostredia do internetu je možné aplikáciu v reálnom čase testovať na skutočných mobilných zariadeniach a rôznych operačných systémoch, čo zaručuje konzistentný používateľský zážitok na všetkých platformách.

#### 4.4.2. Integrácia a ladenie webhookov

- **Validácia Stripe webhookov**: Jedným z najkritickejších využití tohto nastavenia je overenie platobného systému Stripe. Keďže servery Stripe musia odosielať asynchrónne notifikácie (webhooky) na dosiahnuteľnú, bezpečnú URL adresu, štandardné prostredia localhost (127.0.0.1) sú nepostačujúce.

- **Inšpekcia asynchrónneho toku**: Ngrok umožňuje vývojárovi zachytávať, kontrolovať a opakovane spúšťať (replay) udalosti webhookov, čím sa zaistí, že logika backendu (Sekcia 3.24.) správne spracováva aktualizácie transakcií, a to aj v komplexných scenároch zlyhania.

#### 4.4.3. Zabezpečenie kvality pred nasadením

- **Komplexné overenie (End-to-End Verification)**: Toto prostredie podobné stagingu slúži ako konečný kontrolný bod. Zabezpečuje, že všetky integrácie API tretích strán, URL adresy spätných volaní (callback URLs) a bezpečnostné hlavičky sú správne nakonfigurované a plne funkčné predtým, ako sa kód nasadí na skutočnú produkčnú infraštruktúru.

### 4.5. Modulárna architektúra šablón (Base HTML)

Na zabezpečenie konzistentnej vizuálnej identity a udržateľnej kódovej základne (codebase) aplikácia využíva modulárny systém šablón založený na dedičnosti šablón (Template Inheritance). Tento architektonický vzor sa riadi princípom „DRY“ (Don't Repeat Yourself – Neopakuj sa), čím sa výrazne znižuje redundancia kódu.

#### 4.5.1. Štrukturálny návrh (Blueprint)

- **Základná dedičnosť (Core Inheritance)**: Každá jednotlivá stránka (šablóna) v rámci aplikácie dedí z jedného, centralizovaného základného HTML súboru (Base HTML). Tento súbor funguje ako hlavný návrh (master blueprint), ktorý definuje základnú štruktúru dokumentu, vrátane metadát v hlavičke <head>, odkazov na CSS a kľúčových závislostí JavaScriptu.

- **Bloky typu Plug-and-Play**: Základný súbor využíva „bloky“ (dynamické zástupné symboly / placeholders), ktoré podradené šablóny (child templates) vypĺňajú špecifickým obsahom. To umožňuje systému vymeniť iba jedinečné časti stránky, zatiaľ čo okolitá štruktúra zostáva nedotknutá.

#### 4.5.2. Správa globálnych komponentov

- **Pretrvávajúce prvky rozloženia**: Spoločné komponenty používateľského rozhrania, ktoré zostávajú konštantné počas celej cesty používateľa (user journey) – ako je hlavička (navigačný panel) a pätička – sú definované výhradne v základnom HTML súbore.

- **Efektivita pri aktualizáciách**: Keďže sú tieto globálne prvky centralizované, akákoľvek zmena dizajnu alebo aktualizácia navigačnej logiky sa vykonáva na jedinom mieste a okamžite sa propaguje naprieč všetkými podstránkami platformy.

#### 4.5.3. Optimalizovaná kódová základňa

- **Zmenšená veľkosť súborov**: Jednotlivé šablóny zostávajú odľahčené a zamerané iba na svoju špecifickú funkcionalitu (napr. prihlasovacia stránka alebo stránka tréningovej relácie), keďže nepotrebujú opakovať štandardný (boilerplate) HTML kód.

- **Udržateľnosť**: Táto štruktúra zjednodušuje proces ladenia (debugging) a výrazne uľahčuje škálovanie aplikácie, pretože vývojár môže spravovať globálne rozloženie nezávisle od logiky špecifickej pre danú stránku.

### 4.6. Dvojvrstvová validácia a vynucovanie Regex vzorov

Na zabezpečenie maximálnej integrity dát a ochranu systému pred nesprávne naformátovanými alebo škodlivými vstupmi využíva platforma synchronizovanú stratégiu dvojvrstvovej validácie. Tento prístup vyvažuje okamžitú spätnú väzbu pre používateľa s prísnou bezpečnosťou na strane servera.

#### 4.6.1. Front-end: Vynucovanie vzorov v reálnom čase

- **Okamžitá spätná väzba UX**: Na strane klienta sú vstupy formulárov chránené pomocou atribútov vzorov (pattern) HTML5 a poslucháčov udalostí (listeners) založených na JavaScripte. To v reálnom čase bráni používateľom zadávať zakázané znaky alebo neplatné formáty (napr. v používateľských menách alebo iných informáciách o používateľovi).

- **Proaktívna prevencia chýb**: Obmedzením vstupu priamo pri zdroji systém znižuje počet zbytočných požiadaviek na server a poskytuje používateľovi plynulejší a intuitívnejší zážitok.

#### 4.6.2. Backend: Nemenná (Immutable) Regex bezpečnosť

- **Robustná logika na strane servera**: Keďže ochranu na front-ende môžu pokročilí používatelia obísť (napr. prostredníctvom vývojárskych nástrojov prehliadača alebo zachytených požiadaviek), backend slúži ako konečná autorita. Každý prichádzajúci dátový bod je opätovne spracovaný pomocou regulárnych výrazov (Regex) v Pythone.

- **Synchronizácia algoritmov**: Backendové Regex vzory sú dôsledne zrkadlené z front-endovej logiky, čo zaručuje, že pravidlá pre prijímanie dát sú konzistentné naprieč celým technologickým zásobníkom (application stack) aplikácie.

- **Neobíditeľná obrana**: Táto vrstva zabezpečuje, že aj keď je požiadavka manuálne vytvorená alebo zmanipulovaná, server ju odmietne, ak striktne nedodržiava definované vzory. Tým sa predchádza pokusom o SQL injection alebo poškodeniu dát.

#### 4.6.3. Praktické aplikácie

- **Hashtagy a zmienky**: Používa sa na zabezpečenie toho, aby boli povolené iba platné znaky.

- **Prihlasovacie údaje (Credentials)**: Zabezpečuje, že citlivé dáta dodržiavajú predvídateľný a bezpečný formát ešte predtým, ako sa vôbec dostanú do databázy.

### 4.7. Vlastné rozbaľovacie ponuky (Dropdown) a ponuky výberu (Select)

Na udržanie súdržnej, prémiovej vizuálnej identity aplikácia úplne nahrádza predvolené, natívne prvky <select> prehliadača vlastnoručne navrhnutými rozbaľovacími ponukami.

#### 4.7.1. Jednotný vizuálny jazyk

- **Estetická konzistentnosť**: Štandardné webové ponuky výberu je notoricky ťažké prispôsobovať (stylovať) a často sa bijú s moderným dizajnom používateľského rozhrania. Vlastná implementácia zaručuje, že každá rozbaľovacia ponuka dokonale ladí so zavedeným dizajnovým systémom platformy, pričom integruje plynulú typografiu, konzistentné palety farieb a primerané zaoblenie rohov (border radii).

- **Jednotnosť naprieč prehliadačmi (Cross-Browser Uniformity)**: Obídením predvoleného vykresľovacieho jadra prehliadača pre tieto prvky zaručujú vlastné ponuky výberu na pixel presný, identický vzhľad na všetkých zariadeniach a webových prehliadačoch (Chrome, Safari, Firefox), čím sa eliminuje vizuálna fragmentácia.

#### 4.7.2. Vylepšený dizajn interakcií

- **Vyladený používateľský zážitok (Polished UX)**: Vlastná architektúra rozbaľovacích ponúk umožňuje sofistikované stavy interakcie, ktoré natívnym HTML prvkom chýbajú. To zahŕňa plynulé animácie otvárania a zatvárania, zreteľné efekty po prejdení kurzorom (hover effects) na jednotlivých možnostiach ponuky a vlastné posúvače (scrollbars).

- **Architektonická kontrola**: Vytvorenie týchto ponúk od nuly pomocou štruktúrneho HTML (ako sú prvky <div> a <ul>) v kombinácii s JavaScriptom poskytuje úplnú kontrolu nad modelom DOM. Umožňuje to pokročilé funkcionality, ako je napríklad integrácia dynamických filtrov vyhľadávania.

### 4.8. Bezpečné spracovanie asynchrónnych dát (Fetch API)

Na poskytnutie plynulého zážitku bez potreby obnovovania stránky a bez ohrozenia stability aplikácie platforma implementuje vysoko bezpečný end-to-end tok asynchrónnej komunikácie pomocou požiadaviek JavaScript Fetch POST. Táto architektúra uprednostňuje robustné spracovanie chýb a štruktúrovanú výmenu dát.

#### 4.8.1. Spracovanie výnimiek na strane servera (Python/Django)

- **Robustné spracovanie**: Každá asynchrónna požiadavka, ktorá dorazí na backend, je prísne validovaná a spracovaná v rámci striktných blokov try a except.

- **Riadené odpovede JSON**: Namiesto toho, aby sa pripustil pád servera alebo sa vrátila nespracovaná chyba „500 Internal Server Error“, backend inteligentne vyhodnocuje dáta. Ak zlyhá validácia alebo sa vyskytne neočakávaná chyba, systém bezpečne zachytí výnimku. Následne vráti štruktúrovanú dátovú sadu (JSON payload) obsahujúcu príznak success: false, spolu so všetkými relevantnými kontextovými dátami alebo chybovými správami.

#### 4.8.2. Odolnosť na strane klienta (JavaScript)

- **Dynamické vyhodnocovanie**: Po prijatí odpovede využíva front-end riadiace štruktúry if / else na vyhodnotenie vráteného stavu úspešnosti. Ak je stav true, JavaScript plynulo a v reálnom čase aktualizuje DOM s novými dátami.

- **Elegantné zachytávanie chýb**: Všetky operácie Fetch sú zabalené v blokoch JavaScriptu try a catch. Či už backend explicitne vráti stav false, alebo dôjde k narušeniu na úrovni siete (výpadok spojenia), klientska logika toto zlyhanie zachytí.

- **Spätná väzba pre používateľa**: Namiesto tichého zlyhania (tzv. failing silently) alebo rozbitia používateľského rozhrania systém pretaví tieto zachytené chyby do používateľsky prívetivých notifikácií (ako je podrobne opísané v sekcii 3.32.), čím používateľa plne informuje o tom, prečo nebolo možné jeho akciu dokončiť.

### 4.9. Asynchrónna kompresia a optimalizácia médií

Na optimalizáciu kapacity úložiska servera a zachovanie vysoko responzívneho používateľského zážitku prechádzajú všetky nahrávané mediálne súbory prísnym, automatizovaným procesom kompresie. Vzhľadom na výpočtovo náročnú povahu kódovania médií sú tieto úlohy úplne presunuté na procesy na pozadí (background workers).

#### 4.9.1. Architektúra asynchrónneho spracovania

- **Rada úloh Celery (Celery Task Queue)**: Všetky kompresie obrázkov a videí sa zaraďujú do rady a vykonávajú asynchrónne prostredníctvom Celery. To zaručuje, že hlavné vlákno aplikácie Django zostáva neblokované, čo platforme umožňuje plynulo spracovávať súbežné nahrávania bez chýb časového limitu (timeout errors).

- **Správa stavu (State Management)**: Každý mediálny objekt si v databáze udržiava striktný stav spracovania. Nespracované príspevky sú dočasne skryté z verejného kanála príspevkov, no zostávajú viditeľné výhradne pre autora na vrchu jeho osobného kanála. Po úspešnom dokončení úlohy Celery sa príspevok označí ako spracovaný a nasadí sa na verejnú časovú os.

#### 4.9.2. Inteligentný spracovateľský kanál (Processing Pipeline)

- **Validácia a detekcia**: Prichádzajúce súbory sú prísne overované pomocou knižnice Magic Bytes na potvrdenie ich skutočných typov MIME, spolu s kontrolami hraničných hodnôt pre počiatočné veľkosti súborov a dĺžky videí.

- **Optimalizácia obrázkov (Pillow)**: Obrázkové súbory smerujú cez knižnicu Pillow (PIL), kde sa inteligentne zmenšuje ich veľkosť, komprimujú sa a štandardizujú do farebného priestoru RGB.

- **Transkódovanie videa (FFmpeg)**: Spracovanie videa riadi FFmpeg spustený cez modul subprocess v Pythone. Systém skomprimuje video stopu a automaticky vygeneruje vysokokvalitnú miniatúru (thumbnail) pre vykreslenie v UI.

Inteligetný záložný mechanizmus veľkosti (Smart Size Fallback): Kompresný engine inteligentne porovnáva konečnú veľkosť spracovaného súboru s pôvodným súborom. Ak kompresia neúmyselne vedie k väčšiemu súboru (čo je bežné pri už predtým silne skomprimovaných médiách), systém automaticky zahodí zväčšený výstup a ponechá si pôvodný súbor s cieľom maximálne zefektívniť úložisko.

#### 4.9.3. Sledovanie pokroku na strane klienta v reálnom čase

- **Dopytovanie v TypeScript-e (TypeScript Polling)**: Kým Celery spracováva súbory na pozadí, priebežne vysiela aktualizácie stavu a percentá pokroku. Architektúra na strane klienta (TypeScript) sa každé 3 sekundy dopytuje (polls) na backendový koncový bod (endpoint), aby získala tieto živé metriky.

- **Dynamická vizuálna spätná väzba**: Autori môžu monitorovať presný pokrok spracovania svojich médií. UI vykresľuje tieto dáta prostredníctvom dynamického ukazovateľa pokroku (progress bar), ktorý ponúka plynulý farebný prechod – mení sa zo žltej na oranžovú, keď sa úloha blíži k 100 % dokončeniu.

#### 4.9.4. Automatizovaná hygiena úložiska

- **Vymazávanie dočasných súborov**: Kompresný kanál generuje počas procesu transkódovania dočasné súbory. Aby sa predišlo preplneniu úložiska, využíva sa knižnica django-cleanup, ktorá automaticky zacieli a vymaže všetky dočasné dáta okamžite po dokončení alebo zrušení úlohy.

### 4.10. Vysokovýkonná architektúra nekonečného posúvania (Infinite Scroll)

Na poskytnutie plynulého a nerušeného zážitku z prehliadania implementuje kanál príspevkov vysoko optimalizovaný mechanizmus nekonečného posúvania (infinite scroll). Táto architektúra kombinuje ľahké monitorovanie na strane front-endu s efektívnym delením dát na backende.

#### 4.10.1. Intersection Observer na strane klienta

- **Optimalizované spúšťanie**: Namiesto spoliehania sa na tradičné poslucháče udalostí posúvania (scroll event listeners), ktoré sú náročné na výpočtový výkon, využije front-end moderné API Intersection Observer. To efektívne deteguje, keď sa používateľ posunie blízko k spodnej hranici kanála, čo spustí ďalšie načítanie dát s prakticky nulovou záťažou na výkon prehliadača klienta.

- **Dynamická konštrukcia DOM (CSR)**: Po prijatí dátovej sady (payload) zo servera preberá riadenie TypeScript, ktorý dynamicky zostavuje komplexnú HTML štruktúru pre každý nový príspevok. Prvky ako mediálne karusely, kontext autora, popisy príspevkov a značky (tags) sa vytvárajú a plynulo pripájajú k existujúcemu kanálu v reálnom čase.

#### 4.10.2. Stránkovanie na strane servera a JSON API

- **Efektívne delenie databázy (Chunking)**: Na minimalizáciu záťaže databázy a optimalizáciu rýchlosti prenosu sieťou využije logika na strane servera prísne stránkovanie (Pagination), čím rozdeľuje globálny dopyt po príspevkoch do zvládneľných častí po 5 príspevkov na jednu požiadavku.

- **Ľahká výmena dát**: Keď Intersection Observer spustí požiadavku na načítanie, server rýchlo odpovie neopracovanými JSON dátami obsahujúcimi komplexné metadáta príspevku namiesto ťažkých, predpripravených HTML šablón. To zaručuje bleskovú, asynchrónnu komunikáciu medzi klientom a serverom.

#### 4.10.3. Dynamické hlásenie stavu kanála (UX)

- **Kontextová spätná väzba pre používateľa**: Vyhradený prvok UI „Feed Report“ je ukotvený na spodku kanála, aby neustále komunikoval aktuálny stav systému používateľovi.

- **Inteligentné variácie stavu**: Textový obsah tohto komponentu sa dynamicky prispôsobuje:

- **Stav načítavania (Loading State)**: Zobrazuje indikátor „načítava sa...“, kým sa načítava a zostavuje ďalšia dávka 5 príspevkov.

- **Spracovanie chýb (Error Handling)**: Zobrazuje informačné chybové správy, ak časový limit siete alebo problém so serverom preruší proces načítavania.

- **Vyčerpaný kanál (Exhausted Feed)**: Elegantne informuje používateľa špecifickou správou, akonáhle dosiahne absolútny koniec databázy a prezrie si všetky dostupné príspevky.

### 4.11. Vlastný prehrávač videí a interaktívne ovládacie prvky

Na zabezpečenie prémiového, vizuálne súdržného a naprieč prehliadačmi konzistentného zážitku z médií platforma úplne nahrádza natívne ovládacie prvky videa v prehliadači zákazkovo navrhnutým rozhraním prehrávača videí, vybudovaným pomocou JavaScriptu/TypeScriptu.

#### 4.11.1. Prehrávanie a správa času

- **Dynamický prepínač prehrávania/pozastavenia (Play/Pause)**: Používatelia môžu ovládať prehrávanie pomocou vyhradeného tlačidla, ktoré plynulo prepína medzi ikonami prehrávania a pozastavenia na základe aktuálneho stavu videa.

- **Časomiera v reálnom čase**: Rozhranie obsahuje presný digitálny časovač zobrazujúci uplynutý čas aj celkovú dĺžku videa. Tento časovač sa spolu s hlavnou časovou osou (scrubber line) neustále aktualizuje v reálnom čase počas prehrávania média.

#### 4.11.2. Pokročilá časová os (Scrubber) a systém vyrovnávacej pamäte (Buffering)

- **Interaktívny ukazovateľ pokroku**: Vlastnoručne navrhnutá časová os (scrubber) vizuálne reprezentuje priebeh videa. Používatelia môžu intuitívne presakovať dozadu alebo dopredu (seek) kliknutím kdekoľvek na časovú os alebo pretiahnutím posúvača.

- **Náhľad pri prejdení kurzorom (Hover Preview)**: Pri pohybe kurzora po časovej osi sa časovač dynamicky aktualizuje, aby zobrazil presnú časovú pečiatku na danej pozícii, čo umožňuje presnú navigáciu ešte pred kliknutím.

- **Indikátor načítavania do vyrovnávacej pamäte (Buffering)**: Aby bol používateľ informovaný o výkone siete, časová os obsahuje sekundárnu vrstvu pozadia, ktorá vizualizuje stav načítania videa do vyrovnávacej pamäte (buffer) a priebeh predbežného načítania (preload).

#### 4.11.3. Úprava zvuku a zobrazenia

- **Jemné ovládanie hlasitosti**: Používatelia môžu plynulo upravovať hlasitosť zvuku pomocou posuvníka. Systém inteligentne aktualizuje vizuálny stav ikony hlasitosti tak, aby odrážal aktuálnu úroveň zvuku (napr. vysoká, nízka, stlmená).

- **Rýchle stlmenie/zapnutie zvuku (Mute/Unmute)**: Kliknutím priamo na ikonu hlasitosti sa okamžite prepne stav zvuku, čo poskytuje rýchlu kontrolu bez nutnosti ťahať posuvník.

- **Celoobrazovkový režim (Fullscreen)**: Vyhradené tlačidlo pre prepnutie do celoobrazovkového režimu využíva Fullscreen API prehliadača, čo používateľom umožňuje plynulo rozbaliť video na celú obrazovku pre pohlcujúci zážitok zo sledovania.

### 4.12. Multidimenzionálne vyhľadávanie a objavovanie príspevkov

Kanál príspevkov obsahuje sofistikovaný vyhľadávací engine umiestnený v hornej časti rozhrania, ktorý používateľom umožňuje rýchlo filtrovať a objavovať obsah naprieč viacerými dátovými vrstvami.

#### 4.12.1. Globálne pokrytie dopytov

- **Viacvrstvové filtrovanie**: Vyhľadávací algoritmus je navrhnutý tak, aby súčasne skenoval rôzne atribúty príspevku. Používatelia môžu nájsť relevantný obsah vyhľadávaním v:

- **Obsahu**: Text v popisoch príspevkov a hashtagy.

- **Metadátach**: Konkrétne miesta alebo geolokačné štítky.

- **Sociálnom kontexte**: Označení používatelia alebo používateľské meno pôvodného autora.

- **Asynchrónne aktualizácie**: Využitím požiadaviek JavaScript Fetch POST sa kanál aktualizuje v reálnom čase počas toho, ako používateľ interaguje s vyhľadávacím panelom. To zaručuje rýchly a responzívny zážitok bez úplného obnovovania stránky.

#### 4.12.2. História vyhľadávania a správa stavu

- **Inteligentné sledovanie histórie**: Pre zvýšenie pohodlia používateľa systém udržiava lokálnu históriu vyhľadávania. Keď používateľ klikne na vyhľadávací panel, automaticky sa zobrazí rozbaľovacia ponuka nedávnych dopytov.

- **Obmedzenia histórie**: História je obmedzená na maximálne 5 záznamov. Aby sa zoznam udržal relevantný a neprehustený, systém sa riadi logikou First-In-First-Out (FIFO – prvý dnu, prvý von), pri ktorej sa najstaršie vyhľadávania automaticky odstraňujú pri pridávaní nových.

- **Manuálne ovládanie**: Používatelia si zachovávajú plnú kontrolu nad svojimi dátami s možnosťou manuálne vymazať jednotlivé záznamy v histórii alebo okamžite vyčistiť celý vyhľadávací panel pomocou vyhradeného tlačidla „Vymazať“ (Delete).

#### 4.12.3. Spätná väzba v reálnom čase

Tento modul poskytuje okamžitú vizuálnu spätnú väzbu, čím zaisťuje, že prechod medzi globálnym kanálom príspevkov a filtrovanými výsledkami vyhľadávania je plynulý a transparentný.

### 4.13. Sledovanie viditeľnosti a algoritmická optimalizácia kanála príspevkov

Na zabezpečenie toho, že používateľom sa neustále doručuje čerstvý obsah, a na generovanie presných metrík zapojenia, kanál príspevkov obsahuje vysoko precízny mechanizmus sledovania zobrazení. Tento systém rozlišuje medzi rýchlym prebehnutím (scroll-by) a skutočným zobrazením obsahu.

#### 4.13.1. Detekcia viditeľnosti na strane klienta

- **Hranica viditeľnej oblasti (Viewport Threshold)**: S využitím API Intersection Observer na strane klienta systém neustále monitoruje pozíciu každého príspevku v zornom poli používateľa. Sekvencia zobrazenia sa spustí len vtedy, keď sa splní prísna podmienka: na obrazovke musí byť viditeľných minimálne 80 % celkovej výšky príspevku.

- **Časové overenie**: Po dosiahnutí 80 % hranice viditeľnosti sa spustí časovač na pozadí. Ak používateľ pozastaví posúvanie a príspevok zostane v tomto vysoko viditeľnom stave po dobu 1 neprerušenej sekundy, systém to potvrdí ako zámerné zobrazenie.

#### 4.13.2. Asynchrónna správa stavu

- **Spúšťač v reálnom čase**: Po úspešnom absolvovaní 1-sekundového overenia odošle klientsky JavaScript bezpečnú požiadavku Fetch POST na backend. To v databáze potichu označí konkrétny príspevok ako „videný“ prihláseným používateľom bez toho, aby to akokoľvek narušilo jeho zážitok z prehliadania.

#### 4.13.3. Algoritmický vplyv a analytika

- **Stratégia posúvania v kanáli (Feed Demotion Strategy)**: Tieto overené dáta o zobrazeniach priamo ovplyvňujú algoritmus platformy na generovanie kanála príspevkov. Príspevky označené ako „videné“ sú systematicky odsunuté na nižšie pozície v následných požiadavkách na načítanie feedu. To zaručuje, že pre vracajúcich sa používateľov má vždy prioritu nový, neobjavený obsah na samom vrchu ich kanála.

- **Overené metriky zapojenia**: Odfiltrovaním náhodných posúvaní agreguje backend tieto potvrdené videnia, aby vypočítal vysoko presné počty unikátnych zobrazení (Unique View counts). To poskytuje robustnú a dôveryhodnú analytiku týkajúcu sa skutočného dosahu a výkonnosti každého nahraného príspevku.

### 4.14. Optimalizácia relačnej databázy (Architektúra Many-to-Many)

Na zabezpečenie vysokého výkonu, integrity dát a efektívneho dopytovania backendová databáza na zložité dátové asociácie striktne využíva relačné polia Many-to-Many (M2M) frameworku Django namiesto plochých polí typu Array (Array fields).

#### 4.14.1. Štrukturálna integrita prostredníctvom spojovacích tabuliek (Junction Tables)

- **Relačné mapovanie**: Pri definovaní vzťahov, ako sú „Sledovatelia“ (kde môže viacero používateľov sledovať viacero iných používateľov), sa systém vyhýba ukladaniu neopracovaných ID používateľov do základného poľa ArrayField. Namiesto toho implementácia M2M v Djangu automaticky vygeneruje v databáze vyhradenú, skrytú spojovaciu tabuľku (join table).

- **Referenčná integrita**: Táto architektúra zabezpečuje striktnú normalizáciu databázy. Keďže vzťahy sa vytvárajú pomocou cudzích kľúčov (Foreign Keys) v rámci spojovacej tabuľky, systém vo svojej podstate zabraňuje vzniku „osirelých“ dát (napr. ak je používateľ vymazaný, jeho prepojenia sa automaticky vyriešia, čo by sa pri statických ID v poli nestalo).

#### 4.14.2. Výkon dopytov a efektivita ORM

- **Optimalizované vyhľadávanie (Lookups)**: Využitím vyhradených spojovacích tabuliek môže podkladová SQL databáza (napr. PostgreSQL) ťažiť z indexovania na relačnom mapovaní. To drasticky urýchľuje zložité vyhľadávacie dopyty v porovnaní so skenovaním a parsovaním plochých štruktúr polí.

- **Obojsmerné prechádzanie (Bidirectional Traversal)**: Architektúra M2M umožňuje objektovo-relačnému mapovaču (ORM) Djanga vykonávať vysoko efektívne reverzné dopyty. Systém napríklad dokáže okamžite načítať všetkých používateľov, ktorých konkrétny používateľ sleduje, alebo naopak, načítať všetkých sledovateľov tohto používateľa pomocou jednoduchých a rýchlych metód .filter() alebo .prefetch_related() bez náročného algoritmického spracovania.

### 4.15. Adaptívna architektúra HTTP Live Streaming (HLS)

Na poskytnutie mediálneho zážitku podnikovej triedy (enterprise-grade) bez sekania platforma úplne opúšťa štandardné doručovanie súborov .mp4 a implementuje robustnú architektúru HTTP Live Streaming (HLS). To umožňuje prehrávaču videí dynamicky sa prispôsobovať špecifickým sieťovým podmienkam používateľa v reálnom čase.

#### 4.15.1. Asynchrónne transkódovanie s viacerými dátovými tokmi (Multi-Bitrate)

- **Segmentačný kanál FFmpeg**: Po nahratí sú videosúbory smerované cez intenzívny asynchrónny proces na pozadí (worker) v Celery. Využitím nástroja FFmpeg sa systém vyhýba doručovaniu monolitických súborov .mp4.

- **Viacúrovňové rozlíšenie**: Pôvodný súbor je transkódovaný do viacerých profilov kvality (konkrétne 480p, 720p a 1080p).

- **Mikro-segmentácia (Micro-Chunking)**: Každá stopa rozlíšenia je rozkrájaná na ľahko spravovateľné, 4-sekundové video segmenty (súbory .ts). Systém automaticky generuje hlavný indexový zoznam skladieb (súbor .m3u8), ktorý mapuje tieto segmenty dohromady a presne riadi, ako si má prehrávač vyžadovať jednotlivé časti.

#### 4.15.2. Inteligentné prispôsobenie šírke pásma

- **Automatická zmena kvality**: Protokol HLS neustále monitoruje rýchlosť siete klienta. Ak šírka pásma používateľa klesne, prehrávač si plynule vyžiada ďalší 4-sekundový segment zo sady s nižším rozlíšením (napr. prechod z 1080p na 480p), čím sa úplne predíde prerušeniam prehrávania alebo rotujúcim indikátorom načítavania (buffering wheels).

- **Manuálne prepísanie používateľom**: Používatelia si zachovávajú plnú kontrolu nad svojím zážitkom zo sledovania. Zabudovaný prepínač kvality im umožňuje manuálne uzamknúť prehrávač na konkrétne rozlíšenie, čo je mimoriadne prospešné pre používateľov, ktorí chcú striktne riadiť a minimalizovať spotrebu svojich mobilných dát.

#### 4.15.3. Zrýchlené doručenie a nákladová efektivita

- **Okamžité prehrávanie**: Keďže systému stačí načítať iba počiatočný manifest .m3u8 a úplne prvý 4-sekundový .ts segment, čas do zobrazenia prvej snímky (TTFF – Time-to-First-Frame) je bleskurýchly. Používatelia už nemusia čakať, kým server spracuje veľké, súvislé odpovede súborov.

Optimalizácia zdrojov: Server streamuje výhradne tie presné segmenty, ktoré používateľ aktívne sleduje. Ak používateľ v polovici prestane pozerať, systém neplytval šírkou pásma servera na doručenie nezobrazenej zostávajúcej časti videa.

### 4.16. Pokročilé vyskakovacie ponuky (Popover) a kontextové akcie

Na poskytnutie čistého, neprehusteného používateľského rozhrania pri zachovaní rozsiahlych možností ovládania na úrovni objektov využije platforma sofistikovaný systém kontextovo závislých vyskakovacích ponúk (popover menus). Tieto ponuky sú univerzálne dostupné prostredníctvom štandardných trojbodkových ikon akcie (meatball icons) strategicky umiestnených naprieč celým UI.

#### 4.16.1. Moderné ukotvenie pomocou CSS (CSS Anchor Positioning)

<!-- Natívne ukotvenie: Namiesto spoliehania sa na ťažkopádne výpočtové knižnice v JavaScripte platforma využije najmodernejšie ukotvenie pomocou CSS (CSS Anchor Positioning). To zaručuje, že hlavný popover dialóg je dokonale pripnutý k svojmu spúšťaciemu tlačidlu.

Stabilita pri vnorovaní (Nested Stability): Pri prechode do podponúk sa nové dialógové okná dynamicky ukotvujú k svojim nadradeným popoverom. To zaručuje štrukturálnu stabilitu a zabraňuje vykresľovaniu ponúk mimo obrazovky, bez ohľadu na zorné pole (viewport) zariadenia. -->

<!-- 4.16. Pokročilé vyskakovacie ponuky (Popover) a kontextové akcieNa poskytnutie čistého, neprehusteného používateľského rozhrania pri zachovaní rozsiahlych možností ovládania na úrovni objektov využije platforma sofistikovaný systém kontextovo závislých vyskakovacích ponúk (popover menus). Tieto ponuky sú univerzálne dostupné prostredníctvom štandardných trojbodkových ikon akcie (meatball icons) strategicky umiestnených naprieč celým UI.4.16.1. Moderné ukotvenie pomocou CSS (CSS Anchor Positioning)Natívne ukotvenie: Namiesto spoliehania sa na ťažkopádne výpočtové knižnice v JavaScripte platforma využije najmodernejšie ukotvenie pomocou CSS (CSS Anchor Positioning). To zaručuje, že hlavný popover dialóg je dokonale pripnutý k svojmu spúšťaciemu tlačidlu.Stabilita pri vnorovaní (Nested Stability): Pri prechode do podponúk sa nové dialógové okná dynamicky ukotvujú k svojim nadradeným popoverom. To zaručuje štrukturálnu stabilitu a zabraňuje vykresľovaniu ponúk mimo obrazovky, bez ohľadu na zorné pole (viewport) zariadenia.4.16.2. Viacúrovňová architektúra navigáciePodpora hlbokého vnorovania: Ponuky podporujú intuitívne viacúrovňové vnorovanie pre komplexné, viacskokové akcie (napr. iniciovanie vymazania $\rightarrow$ potvrdenie vymazania).Bezpečný prechod (Safe Traversal): Na zabránenie náhodnému zatvoreniu ponuky a zlepšenie UX obsahuje každá vnorovaná vrstva vyhradenú možnosť „Späť“, čo používateľom umožňuje bez námahy prechádzať späť nahor v hierarchii ponuky bez straty kontextu.4.16.3. Kontextovo závislá funkcionalitaMožnosti zobrazené v rámci popover ponúk sa dynamicky prispôsobujú na základe konkrétneho objektu, s ktorým sa interaguje, a úrovne oprávnení používateľa:Správa recenzií:Autori môžu upravovať svoje recenzie (čo spustí presmerovanie do vyhradeného editora) alebo ich vymazať (čo otvorí vnorovanú, bezpečnostnú varovnú ponuku).Bežní používatelia vidia iba možnosť nahlásiť recenziu, čím sa otvorí vnorovaná ponuka na špecifikovanie presného dôvodu nahlásenia.Nastavenia príspevku a vlastné prepínače:Autori majú detailnú kontrolu nad svojím obsahom. Môžu v reálnom čase upravovať nastavenia, ako je prepínanie verejnej viditeľnosti, povolenie/zakázanie komentárov alebo skrytie počtu páči sa mi to. Tieto nastavenia sú elegantne reprezentované vlastnoručne navrhnutými tlačidlami prepínačov (vytvorenými pomocou skrytých HTML checkboxov a štylizovaných štítkov).Bežní používatelia sú obmedzení len na nahlásenie príspevku.Zachytávanie aktívneho nahrávania (Active Upload Interception): Pozoruhodné je, že tieto kontextové ponuky zostávajú aktívne aj vtedy, keď sa príspevok asynchrónne spracováva na pozadí. Autori môžu proaktívne nakonfigurovať nastavenia príspevku alebo úplne zrušiť a vymazať nahrávanie ešte predtým, ako sa kompresia dokončí a príspevok sa zverejní. -->

#### 4.17. Dynamické stránkovanie a engine na filtrovanie recenzií

Na udržanie optimálnej rýchlosti načítavania stránok a zabránenie preťaženiu modelu DOM na hlavnej stránke aplikácia implementuje interaktívny systém stránkovania recenzií. Táto architektúra zaručuje, že veľké objemy používateľskej spätnej väzby sa doručujú v ľahkých, riadených dávkach bez obmedzenia pokročilých možností vyhľadávania.

4.17.1. Delenie dát na strane servera
Integrácia systému Django Paginator: Backend využíva natívny systém Paginator vo frameworku Django na rozdelenie celkovej dátovej sady recenzií. Pri počiatočnom načítaní stránky sú recenzie striktne obmedzené na maximálne 5 položiek na jednu dávku.

Zachovanie stavu (State Preservation): Logika stránkovania je plne integrovaná so systémom filtrovania recenzií platformy. Keď používatelia zoradia recenzie podľa špecifických kritérií (najlepšie, najhoršie, najnovšie, najstaršie) alebo ich vyfiltrujú podľa zvoleného hviezdičkového hodnotenia, tento stav sa zachováva naprieč všetkými následnými načítaniami dát.

4.17.2. Stavové ovládacie prvky na front-ende (UX)
Dynamické generovanie tlačidla „Zobraziť viac“: Ak systém deteguje ďalšie recenzie nad rámec aktuálne zobrazenej dávky, dynamicky vygeneruje tlačidlo „Zobraziť viac“. Kliknutie na toto tlačidlo spustí asynchrónnu požiadavku na načítanie a plynulé pripojenie ďalších 5 recenzií do zobrazenia.

Skladací reset (Tlačidlo „Skryť“): Akonáhle používateľ rozšíri zoznam nad rámec počiatočného základu, automaticky sa vygeneruje dodatočné tlačidlo „Skryť“. To používateľovi umožňuje okamžite zbaliť rozšírený kanál a vrátiť sa k čistému rozloženiu pôvodných 5 recenzií, čo poskytuje vynikajúcu kontrolu nad zorným poľom (viewport).

4.18. Integrácia kontextového výberu emoji (Emoji Picker)
Na obohatenie prejavu používateľov a zvýšenie zapojenia v komunikačných poliach (ako sú popisy príspevkov a komentáre) platforma integruje moderné a vysoko responzívne rozhranie na výber emoji.

4.18.1. Odľahčený UI komponent
Natívny webový komponent: Rozhranie obsahuje vyhradenú ikonu emoji vloženú priamo do určených textových vstupov a textových polí (textarea). Kliknutím na túto ikonu sa otvorí elegantná ponuka poháňaná JavaScriptovou knižnicou emoji-picker-element, ktorá využíva vysokovýkonnú architektúru webových komponentov.

Inteligentné zatváranie kliknutím mimo (Smart Click-Outside Dismissal): Na zachovanie čistého a nerušivého rozloženia je výber vybavený poslucháčom udalostí pre kliknutie mimo (click-outside event listener). Ak používateľ interaguje s akoukoľvek inou časťou obrazovky počas toho, ako je ponuka otvorená, výber emoji sa automaticky zruší a zatvorí.

4.18.2. Logika vkladania na pozíciu kurzora
Dynamické sledovanie kurzora (Caret Tracking): Namiesto jednoduchého pridania vybraných symbolov na úplný koniec textového bloku, vlastný klientsky skript (TypeScript) dynamicky sleduje presnú polohu kurzora (caret position) používateľa v rámci vstupného poľa.

Plynulé vkladanie textu: Keď sa vyberie emoji, systém rozdelí existujúci reťazec a vloží znak presne tam, kde používateľ aktívne píše, čím okamžite obnoví zameranie poľa (focus) a zachová plynulý pracovný postup používateľa.

4.19. Dynamický algoritmus kanála príspevkov a zoraďovanie obsahu
Na maximalizáciu zapojenia používateľov a zabezpečenie relevantnosti obsahu platforma úplne upúšťa od jednoduchých chronologických časových osí alebo náhodného načítavania dát. Namiesto toho je kanál príspevkov poháňaný sofistikovaným algoritmom zoraďovania (ranking algorithm), ktorý je navrhnutý tak, aby dynamicky vynášal na povrch ten najhodnotnejší obsah pre každého jednotlivého používateľa.

4.19.1. Prioritizácia na základe sociálneho grafu
Afinita k tvorcovi (Creator Affinity): Algoritmus prirodzene rešpektuje vytvorené sociálne väzby používateľa. Obsah pochádzajúci z účtov, ktoré používateľ aktívne sleduje, získava významný násobiteľ relevantnosti, čo zaručuje, že tieto príspevky sú systematicky umiestňované na samý vrchol hierarchie kanála.

4.19.2. Relevantnosť riadená zapojením (Engagement-Driven Relevancy)
Dynamické časové pečiatky interakcií: Kanál je vysoko reaktívny na prebiehajúce zapojenie komunity. Každá nová interakcia – konkrétne označenie „páči sa mi to“ (like) alebo novo uverejnený komentár – aktualizuje internú časovú pečiatku interakcie príspevku v databáze.

Organické podporenie obsahu (Organic Content Boosting): Príspevky s najnovšími časmi interakcií sú dynamicky posúvané späť na vrchol kanála. Tým sa vytvára systém založený na zásluhách (merit-based system), v ktorom sa vysoko pútavý obsah, bez ohľadu na dátum jeho pôvodného nahratia, neustále vynára a dosahuje tak širšie publikum.

4.19.3. Životný cyklus zobrazenia a čerstvosť obsahu
Zníženie priority na základe zobrazenia (View-Based Demotion): V priamom prepojení so systémom sledovania viditeľnosti (Sekcia 3.48) je akýkoľvek príspevok, ktorý je potvrdený ako „videný“ používateľom, systematicky odsunutý na nižšiu úroveň priority pri ďalšom načítaní kanála, čím sa efektívne predchádza vizuálnej únave a opakovaniu.

30-dňový filter čerstvosti: Na udržanie prehľadného zážitku a optimalizáciu výkonu databázových dopytov algoritmus uplatňuje prísne pravidlo exspirácie. Akýkoľvek predtým zobrazený príspevok, ktorý je starší ako 30 dní, je úplne vyfiltrovaný a už sa v kanáli daného používateľa nevykresľuje.

4.20. Gamifikovaný systém úspechov a dynamické odznaky
Na odmeňovanie dlhodobého odhodlania používateľov a zvýraznenie míľnikových úspechov platforma obsahuje robustný, viacúrovňový systém odznakov a úspechov (achievements). Tieto digitálne ocenenia sa zobrazujú ako výrazné vizuálne prvky na stránke profilu používateľa.

4.20.1. Viacúrovňový rámec zriedkavosti (Rarity Framework)
Vizuálna stupnica zriedkavosti: Úspechy sú usporiadané do prísnej hierarchie progresu zloženej zo 6 odlišných farebne rozlíšených úrovní, ktoré reprezentujú zriedkavosť a náročnosť daného úspechu:

Modrá (Bežná / Základná)

Zelená (Neobvyklá)

Žltá (Zriedkavá)

Oranžová (Epická)

Červená (Legendárna)

Fialová (Mytická / Vrcholový úspech)

Vylepšovateľné archetypy: Štandardné odznaky nie sú statické; sú navrhnuté tak, aby zhromažďovali dáta a automaticky postúpili („level up“) na ďalšiu farebnú úroveň, keď používateľ prekročí vyššie štatistické hranice.

4.20.2. Klasifikácia míľnikov a časových udalostí
Engine na generovanie odznakov dynamicky monitoruje dve odlišné kategórie správania používateľov:

Výkonnostné míľniky: Sleduje kľúčové metriky zapojenia na platforme, ako je celkový objem nahromadených skúsenostných bodov (XP) alebo globálna úroveň účtu používateľa.

Časové a špeciálne udalosti: Odmeňuje účasť počas unikátnych kalendárnych udalostí alebo komunitných míľnikov. Zahŕňajú ukazovatele vernosti (napr. oslavu presného počtu rokov od dátumu registrácie používateľa) a časovo obmedzené sviatočné výzvy (napr. úspešné dokončenie fyzickej aktivity na Štedrý deň).

4.20.3. Zapuzdrená logika modelu a výpočet v reálnom čase (On-The-Fly)
Integrácia na úrovni modelu: Na zabezpečenie prísnej konzistentnosti dát je hlavná vyhodnocovacia logika pre všetky stavy odznakov, kontrolu kritérií a hranice úrovní zapuzdrená priamo v architektúre backendového modelu používateľa (User Model) – napríklad využitím metód modelu Django alebo dekorátorov vlastností (@property).

Výpočet na požiadanie v reálnom čase: Namiesto spoliehania sa na ťažkopádne, neustále bežiace databázové poslucháče (listeners), ktoré by aktualizovali stavy pri každej drobnej akcii, systém využíva stratégiu generovania na požiadanie (on-demand). Presné úrovne odznakov a rozdelenie zriedkavostí sa dynamicky prepočítavajú a načítavajú v reálnom čase v presnom momente, keď sa inicializuje alebo obnoví stránka profilu používateľa, čo zaručuje absolútnu efektivitu výkonu.

4.21. Automatizovaný engine pre sériu aktivít (Streak)
Na podporu dlhodobého udržania používateľov (retention) a povzbudenie k dennej fyzickej konzistentnosti aplikácia obsahuje robustný systém na sledovanie série aktivít (Activity Streak). Tento systém odmeňuje používateľov za udržiavanie neprerušenej reťaze po sebe nasledujúcich aktívnych dní, čo funguje ako silný psychologický motivátor.

4.21.1. Podmienená logika progresu
Protokoly denného prírastku: Počítadlo prebiehajúcej série používateľa je prirodzene prepojené s jeho denným zaznamenávaním aktivít. Systém automaticky zvýši počítadlo série presne o jeden bod po úspešnom dokončení a uložení aktivity.

Validačné pravidlá: Aby sa predišlo umelému navyšovaniu, backend pred povolením prírastku prísne overuje dve podmienky: používateľ musel zaznamenať aktivitu v bezprostredne predchádzajúcom dni a séria už nesmela byť navýšená počas aktuálneho kalendárneho dňa.

4.21.2. Asynchrónne spracovanie exspirácie
Automatizované uplatňovanie sankcií: Integrita systému sérií sa udržiava pomocou plánovanej, asynchrónnej úlohy Celery bežiacej na pozadí.

48-hodinová hranica neaktivity: Tento worker na pozadí nepretržite monitoruje časové pečiatky aktivít používateľa. Ak worker zistí, že používateľ nezaznamenal žiadnu platnú aktivitu počas dvoch po sebe nasledujúcich dní (48-hodinový výpadok), automaticky spustí reset stavu, čím vráti aktuálne počítadlo série používateľa späť na nulu.

4.21.3. Dynamická vizuálna reprezentácia
Farebne rozlíšené stavové UI: Aktuálny počet dní v sérii používateľa sa výrazne zobrazuje na jeho verejnej stránke profilu pomocou intuitívnej ikony ohňa riadenej stavom.

Indikátor dennej akcie: Logika front-endu vizuálne komunikuje denný stav používateľa. Ak si používateľ už zabezpečil svoju sériu pre aktuálny deň, ikona sa rozsvieti ako žiarivý oranžový oheň. Naopak, ak denná aktivita stále čaká na dokončenie, ikona zostáva v tlmenom sivom stave, čo slúži ako jemná vizuálna výzva na dokončenie tréningu.

4.22. Prístupnosť pomocou klávesnice (A11y) a správa zamerania (Focus Management)
Na poskytnutie inkluzívneho a vysoko efektívneho používateľského zážitku platforma obsahuje robustnú podporu navigácie pomocou klávesnice, ktorá je plne v súlade s modernými pokynmi pre prístupnosť (A11y). Používatelia môžu plynulo prechádzať, kontrolovať a spúšťať všetky interaktívne moduly bez použitia polohovacieho zariadenia.

4.22.1. Vysokokontrastná vizualizácia zamerania (Focus)
Deterministická navigácia: Používatelia môžu sekvenčne prechádzať cez všetky zamerateľné prvky UI – vrátane tlačidiel, odkazov, vstupných polí a vlastných ovládacích prvkov – pomocou štandardných klávesových skratiek TAB a SHIFT + TAB.

Vylepšené indikátory zamerania (Focus Rings): Na pomoc používateľom so zrakovým postihnutím alebo tým, ktorí pracujú výhradne cez klávesnicu, je predvolený indikátor zamerania prehliadača nahradený. Aktuálne zamerané prvky sú dynamicky zvýraznené hrubým, vysokokontrastným červeným obrysom, čo zaručuje jasné vizuálne potvrdenie stavu na prvý pohľad.

4.22.2. Emulácia natívneho ovládania pre vlastné komponenty
Injekcia atribútu Tab Index: Prvkom navrhnutým ako interaktívne komponenty, ktorým chýba natívna schopnosť zamerania v prehliadači (ako sú vlastné karty založené na prvku div alebo ikony), je priamo v HTML explicitne pridaný atribút tabindex="0". To ich bezpečne zaradí do sekvenčného toku navigácie klávesnice v dokumente.

Zachytávanie stlačení klávesov (Keystroke Interception): Na zaručenie parity s natívnymi tlačidlami sú tieto vlastné prvky podporované reaktívnymi poslucháčmi udalostí v TypeScript-e. Systém monitoruje tok udalostí keydown; ak používateľ zvýrazní vlastný komponent a stlačí kláves Enter, obslužný program (handler) zachytí udalosť a programovo spustí podkladovú metódu .click().

4.22.3. Prevencia úniku zamerania pomocou maskovania HTML atribútom inert
Dynamická izolácia zorného poľa: Pri práci so zbaliteľnými alebo prepínateľnými rozvrhnutiami (ako sú vysúvacie ponuky, rozbaľovacie zoznamy alebo modálne okná) môže skrytý obsah mimo obrazovky náhodne zachytiť zameranie, čo spôsobuje nevyspytateľné skákanie zorného poľa (viewport).

Automatizované riadenie atribútu inert: Platforma cez kód v TypeScript-e dynamicky aplikuje natívny HTML atribút inert na neaktívne alebo skryté podstromy modelu DOM. Keď je kontajner zatvorený, inert úplne zbaví všetky obsiahnuté prvky možnosti zamerania a skryje ich pred asistenčnými technológiami. Po aktivácii skript atribút odstráni, čím okamžite obnoví prístupnosť a predíde chybám pri neštandardnej interakcii.

4.23. Prístupnosť pre čítačky obrazovky a integrácia ARIA
Na zabezpečenie toho, že platforma je plne inkluzívna, v súlade s modernými štandardmi prístupnosti webu (WCAG) a navigovateľná pre zrakovo postihnutých používateľov využívajúcich asistenčné technológie, rozhranie UI obsahuje rozsiahle implementácie ARIA (Accessible Rich Internet Applications).

4.23.1. Popisné označovanie pomocou ARIA (ARIA Labeling)
Kontextualizácia ikonografie: Interaktívne prvky, ktorým chýba explicitný textový obsah – najmä tlačidlá alebo odkazy obsahujúce iba grafické ikony (ako je symbol „X“ pre tlačidlo zavrieť alebo lupa pre vyhľadávanie) – sú systematicky rozšírené o atribúty aria-label. To zaručuje, že čítačky obrazovky presne vyslovia presnú funkciu prvku namiesto čítania nejednoznačných HTML značiek.

Vylepšená čitateľnosť: Tieto popisné značky fungujú ako neviditeľná vrstva metadát, ktorá plynulo premosťuje medzeru medzi vizuálnym dizajnom UI a sluchovou navigáciou, čo zaručuje, že zrakovo postihnutí používatelia získajú presne tie isté kontextové informácie ako vidiaci používatelia.

4.23.2. Reaktívna správa prístupnosti
Statické a dynamické vkladanie: Kým základné ARIA atribúty sú pevne zapísané priamo v statických HTML šablónach, architektúra prístupnosti zasahuje hlboko do logiky klientskych skriptov.

Mutačnosť DOM v TypeScript-e (JS): Keď sa interaktívny obsah generuje, upravuje alebo odstraňuje asynchrónne (napr. vykresľovanie nových komponentov úloh alebo dynamické generovanie popover ponúk), riadiace funkcie v TypeScript-e aktívne a v reálnom čase (on the fly) aplikujú a aktualizujú potrebné atribúty aria-label. To zaručuje, že strom prístupnosti (accessibility tree) zostáva za každých okolností dokonale synchronizovaný s dynamickým vizuálnym stavom aplikácie.

4.24. Súkromie používateľa a detailné riadenie viditeľnosti
Na zabezpečenie prísnej ochrany dát a poskytnutie plnej kontroly používateľom nad ich digitálnou stopou platforma implementuje robustnú, viacvrstvovú architektúru súkromia. Používatelia môžu spravovať svoju viditeľnosť tak na globálnej úrovni účtu, ako aj na úrovni jednotlivých objektov (príspevkov).

4.24.1. Globálny stav súkromia účtu
Hlavný prepínač: Používatelia môžu priamo v ponuke nastavení profilu dynamicky prepínať globálny stav svojho účtu medzi štandardným (verejným) a súkromným režimom.

Zdedené obmedzenia: Keď sa účet prepne do súkromného režimu, backend uplatní prísne prepísanie (override) pre všetok obsah spojený s daným používateľom. Systém automaticky obmedzí viditeľnosť všetkých nahraných príspevkov výhradne pre schválených sledovateľov používateľa, čím trvalo zakáže distribúciu do verejného kanála pre tento konkrétny účet.

4.24.2. Prísne maskovanie obsahu a ochrana smerovania
Zachytávanie v kanáli a URL: Protokoly súkromia zasahujú hlboko do logiky smerovania (routing) aplikácie. Ak sa nesledovateľ pokúsi o priamy prístup k URL adrese konkrétneho príspevku patriaceho k súkromnému účtu, backend požiadavku aktívne zachytí.

Elegantná degradácia (UI): Namiesto zobrazenia strohej chybovej správy servera alebo rozbitého rozvrhnutia aplikácia elegantne zníži úroveň zobrazenia (graceful degradation). Vykreslí vyhradený zástupný prvok („prázdny príspevok“) s upozornením, ktoré neoprávnenému divákovi jasne oznámi, že autorov účet je súkromný a obsah je obmedzený.

4.24.3. Detailná viditeľnosť na úrovni objektov
Flexibilita verejného účtu: Pre používateľov so štandardným (verejným) účtom systém poskytuje detailnú kontrolu na úrovni jednotlivých objektov.

Prepínače pre jednotlivé príspevky: Autori môžu manuálne určovať publikum pre každé jednotlivé nahranie. Prostredníctvom vlastnej ponuky nastavení príspevku v popover okne (Sekcia 3.52) môžu používatelia plynulo zapínať alebo vypínať viditeľnosť konkrétneho príspevku pre širokú verejnosť. To umožňuje kombinovaný kanál verejného obsahu a obsahu určeného len pre sledovateľov v rámci jedného verejného profilu.

4.25. Vstavaný moderačný engine a administrátorské ovládacie prvky na úrovni objektov
Na udržanie integrity platformy, zaistenie bezpečnosti komunity a zabránenie šíreniu neoprávneného alebo explicitného obsahu integruje aplikácia pokročilý vstavaný (inline) moderačný rámec. Tento systém vkladá administrátorské akcie s vysokými oprávneniami priamo do štandardných kontextových popover ponúk na základe roly používateľa.

4.25.1. Rozšírenie ponuky na základe rolí
Úprava zorného poľa s oprávneniami (Privileged Viewport Modification): Systém automaticky vyhodnocuje autentifikačný token a príznaky rolí (napr. is_staff alebo is_superuser) prihlásenej relácie. Ak je používateľ identifikovaný ako administrátor alebo vývojár, front-end dynamicky vloží špecializované nástroje na správu do štandardných trojbodkových popover ponúk.

Priama správa obsahu: Bez nutnosti presmerovania na samostatný backendový riadiaci panel (dashboard) môže administrátor v reálnom čase okamžite vykonať deštruktívne alebo nápravné akcie – napríklad vymazať príspevok ktoréhokoľvek používateľa, odstrániť nevyhovujúce recenzie alebo okamžite pozastaviť účet priamo z aktuálneho zobrazenia.

4.25.2. Dvojkrokový proces overovania recenzií (Pipeline)
Brána pre manuálnu moderáciu: Na zaručenie kontroly kvality a zabránenie spamu alebo škodlivému textu platforma uplatňuje prísny pracovný postup vyhodnocovania spätnej väzby od používateľov. Novovytvorené recenzie prechádzajú do stavu čakania (pending state) a sú skryté pred širokou verejnosťou.

Akcie schválenia / zamietnutia: Administrátori majú k dispozícii vyhradené tlačidlá rozhrania na schválenie recenzie (čím sa stane okamžite viditeľnou naprieč platformou a aktualizuje sa celkové agregované hodnotenie produktu) alebo jej zamietnutie, čo spustí bezpečné vymazanie z databázy.

4.25.3. Architektúra nahlasovania riadená používateľmi
Distribuovaná asistenčná moderácia: Funkcie, ktoré umožňujú bežným používateľom nahlásiť nevyhovujúce objekty (profily, príspevky a recenzie), fungujú ako nepretržitý telemetrický tok pre administrátorský tím.

Automatizované vs. manuálne riešenie: Backend je navrhnutý tak, aby sledoval hraničné hodnoty počtu nahlásení (report thresholds), čím otvára budúce cesty pre automatizované označovanie obsahu alebo algoritmy dočasného pozastavenia na základe kumulatívnych hlásení používateľov. Systém však zásadne uprednostňuje okamžitý ľudský dohľad, čo zaručuje, že administrátor dokáže obísť automatizované rady a manuálne vymazať obsah alebo pozastaviť problematické profily jediným kliknutím.

4.26. Optimalizácia siete a engine na šetrenie dát
Na prispôsobenie sa používateľom fungujúcim s obmedzenými dátovými balíkmi mobilných sietí alebo v oblastiach s nízkou priepustnosťou siete platforma zahŕňa celosystémový režim šetrenia dát (Data Saving Mode). Tento modul systematicky znižuje kvalitu médií a obmedzuje (throttles) agresívne procesy načítavania dát, aby sa minimalizoval objem prenášaných dát v sieti.

4.26.1. Globálna aktivácia a správa stavu
Prepínač ovládaný používateľom: Funkcia je prístupná ako trvalý prepínač v nastaveniach používateľského účtu na stránke profilu. Po zmene sa stav preferencie synchronizuje s backendovou reláciou (session) alebo modelom používateľského profilu, aby sa vynútilo podmienené vykresľovanie rozvrhnutia.

Optimalizácia kanála: Keď je optimalizačný engine aktívny, zasahuje predovšetkým do životného cyklu hlavného kanála príspevkov počas udalostí posúvania (scrolling), kde je spotreba dát prirodzene na vrchole kvôli agregácii bohatých médií.

4.26.2. Adaptívne streamovanie videa a obmedzenia predbežného načítavania
Potlačené predbežné načítavanie (Preloading): Platforma potláča akékoľvek automatické načítavanie videí do vyrovnávacej pamäte na pozadí. Videá zostávajú v pozastavenom stave so statickou miniatúrou a neprenášajú žiadne dátové toky, kým používateľ nevykoná explicitné manuálne kliknutie na rozhraní prehrávania.

Základ s nízkym rozlíšením: Po aktivácii sa prehrávanie videa predvolene obmedzí striktne na 480p rozlíšenie s nízkymi nárokmi na šírku pásma. Pre zachovanie autonómie používateľa je možné toto základné obmedzenie manuálne prepísať pomocou rozhrania výberu kvality vo video prehrávači pre každé video samostatne.

4.26.3. Dynamické obmedzovanie stránkovania
Zmenšené dávky dát: Systém priamo manipuluje s veľkosťami dávok, ktoré využíva backendový systém stránkovania v Djangu (Sekcia 3.53).

Adaptívne limity objektov: Keď je zaznamenaná aktivita režimu šetrenia dát, objem databázových objektov serializovaných a odoslaných na jednu asynchrónnu požiadavku Fetch sa zníži (napr. zmenšenie základnej dávky príspevkov v kanáli z 5 položiek na prísnejšiu hranicu). To efektívne obmedzuje zbytočnú záťaž modelu DOM a výrazne šetrí sťahované mobilné dáta.

4.27. Odstránenie zvuku z videa a deaktivácia ovládacích prvkov

Aby mali tvorcovia obsahu presnú kontrolu nad svojimi nahranými súbormi, platforma obsahuje možnosť úplne odstrániť zvukové stopy z video súborov počas procesu ich tvorby. To zaručuje, že videá, ktoré majú byť bez zvuku, nespracúvajú ani neprenášajú prázdne zvukové toky.

4.27.1 Deaktivácia zvuku pred nahratím

Kontrola tvorcu: V sprievodcovi tvorbou príspevku majú používatelia k dispozícii vyhradený konfiguračný prepínač, ktorý im umožňuje individuálne vypnúť zvukovú stopu pre každý nahrávaný video súbor.

Asynchrónny proces spracovania: Po odoslaní sa mediálne dáta presunú do architektúry na pozadí. Asynchrónny proces (Celery worker) zachytí súbor a použije nástroj FFmpeg na trvalé odstránenie kontajnera zvukového toku z video súboru. Táto štrukturálna kompresia trvalo upraví súbor na úrovni servera ešte predtým, ako je finalizovaný a zverejnený.

4.27.2 Reaktívne ovládacie prvky médií na strane klienta

Dynamické odstránenie ovládania zvuku: Pri príspevkoch, pri ktorých sa autor rozhodol vypnúť zvuk, sa frontendový prehrávač médií dynamicky prispôsobí.

Deaktivované rozhrania hlasitosti: Vo vlastných ovládacích prvkoch prehrávania videa v informačnom kanáli (feed) sú všetky posuvníky hlasitosti, tlačidlá na stlmenie a konfigurácie zvuku úplne deaktivované alebo skryté. To poskytuje sledujúcemu používateľovi okamžité vizuálne potvrdenie, že daný mediálny súbor neobsahuje žiadnu natívnu zvukovú stopu, čím sa predchádza zbytočnému "riešeniu problémov" stláčaním tlačidiel hlasitosti na zariadení.

4.28. Dynamické ambientné pozadia pomocou HTML5 Canvas

Na pozdvihnutie vizuálnej identity a estetickej príťažlivosti platformy bez ohrozenia výkonu rozhrania za behu aplikácia implementuje sofistikovaný systém ambientného pozadia poháňaný natívnou technológiou HTML5.

4.28.1 Vysokovýkonné vykresľovanie grafiky

Izolácia bitmáp: Namiesto využívania ťažkých, komplexných konfigurácií rozloženia CSS alebo ukotvovania obrovského množstva jednotlivých prvkov DOM na dosiahnutie pohybu – čo by vyvolalo neustále a výpočtovo náročné prepočítavanie rozloženia stránky (reflows) – je efekt pozadia úplne izolovaný v jedinom HTML5 prvku <canvas>.

Animačné slučky s nízkou réžiou: Canvas sa spolieha na optimalizované animačné rutiny na strane klienta (ako sú vysoko efektívne slučky requestAnimationFrame cez TypeScript). To zaručuje, že jemné, ambientné vizuálne prvky (napr. plynulé siete častíc alebo mäkké posuny farebných prechodov) plynú hladko a pri konzistentnej snímkovej frekvencii naprieč rôznymi konfiguráciami zariadení.

4.28.2 Neinvazívne vrstvenie rozloženia

Vrstvenie pomocou Z-Indexu a nepriehľadnosť: Komponent canvas je explicitne navrstvený priamo za aktívnym zorným poľom používateľského rozhrania pomocou vypočítaného CSS polohovania (position: fixed; z-index: -1;).

Zachovanie vizuálnej hierarchie: Animačné sekvencie sú vyladené na jemnú prahovú hodnotu nepriehľadnosti s nízkym kontrastom. Táto dizajnová záruka zabezpečuje, že dynamické pozadie zostáva striktne dekoratívne a nikdy nekonkuruje ani neodvádza pozornosť od čitateľnosti textu v popredí či interaktívnych komponentov.

4.29. Architektúra vlastných miniatúr videa

Na poskytnutie úplnej vizuálnej kontroly tvorcom obsahu nad ich mediálnou prezentáciou platforma obsahuje flexibilný nástroj na výber miniatúr, ktorý je integrovaný priamo do procesu nahrávania videa.

4.29.1 Používateľom definovaný výber miniatúry

Integrácia do sprievodcu nahrávaním: Počas procesu vytvárania príspevku majú používatelia k dispozícii vyhradené rozhranie na manuálne nahranie a priradenie vlastného obrázka miniatúry pre každý jednotlivý video súbor.

Trvalé úložisko a mapovanie: Po odoslaní vlastnej miniatúry sa obrazový súbor automaticky spracuje a bezpečne zapíše do súborového systému platformy. Backendová architektúra zároveň zaregistruje presné relačné metadáta v databáze, čím trvalo prepojí súbor vlastného obrázka s jeho nadradeným video objektom.

4.29.2 Automatická extrakcia záložného obrázka (Fallback)

Predvolené nastavenie s nulovou konfiguráciou: Na zabezpečenie bezproblémového používateľského zážitku pre tvorcov, ktorí vynechajú manuálne prispôsobenie, backend implementuje vysoko spoľahlivý záložný mechanizmus (fallback).

Generovanie prvej snímky: Ak sú video dáta odoslané bez určenej vlastnej miniatúry, proces spracovania médií na serveri (s využitím nástroja FFmpeg) automaticky extrahuje snímku z úplne prvej sekundy klipu. Táto extrahovaná snímka sa okamžite nakonfiguruje ako predvolený vizuálny zástupný prvok (placeholder) pre video naprieč celou platformou.

4.30. Metriky času sledovania videa a analytika pre tvorcov

Na poskytnutie využiteľných dát tvorcom obsahu ohľadom zapojenia publika platforma obsahuje integrovaný analytický modul špecifický pre video súbory.

4.30.1 Exkluzívne rozhranie pre tvorcu

Prístup len pre autora: Analytické metriky sú prísne chránené. Štrukturálne dáta a príslušné prepínacie tlačidlá používateľského rozhrania sú dynamicky generované a vykresľované výlučne vtedy, keď je autentifikovaný divák overeným autorom príspevku.

Viditeľnosť na požiadanie: Na udržanie čistej a neprehustenej vizuálnej hierarchie v informačnom kanáli (feed) je analytická vrstva predvolene skrytá. Tvorcovia môžu plynulo zobraziť alebo zbaliť štatistický panel prostredníctvom vyhradeného prepínacieho tlačidla integrovaného do ich administratívneho UI.

4.30.2 Telemetria a integrita metrík

Komplexné sledovanie zapojenia: Backend dôkladne zaznamenáva agregované štatistiky času sledovania a poskytuje priamu porovnávaciu vizualizáciu voči absolútnej dĺžke videa. Okrem toho sleduje presný počet unikátnych zhliadnutí používateľmi.

Protokoly proti umelému navyšovaniu: Na zaručenie absolútnej presnosti dát a zabránenie umelému navyšovaniu metrík uplatňuje engine na sledovanie prísne validačné pravidlo. Čas sledovania a udalosti zhliadnutia sa registrujú a zapisujú do databázy výlučne vtedy, keď je konzumentom iný používateľ než samotný tvorca príspevku.

4.31. Optimalizácia pre vyhľadávače (SEO) a automatizovaná infraštruktúra indexovania
Na maximalizáciu organickej objaviteľnosti, zabezpečenie vysokej viditeľnosti v globálnych vyhľadávačoch a zefektívnenie indexovania platformy architektúra zahŕňa vyhradený nástroj na optimalizáciu pre vyhľadávače (SEO).

4.31.1. Navádzanie prehľadávačov a optimalizácia rozpočtu na prehľadávanie (Crawl Budget)
Deterministické smerovanie botov: V koreňovom adresári aplikácie je nasadený štruktúrovaný konfiguračný súbor robots.txt. Tento súbor slúži ako primárne rozhranie pre smernice prehľadávačov vyhľadávacích nástrojov (ako je Googlebot), pričom definuje explicitné hranice medzi prístupným verejným obsahom a obmedzenými administratívnymi koncovými bodmi (endpoints) alebo tými, ktoré sú špecifické pre reláciu.

Ochrana rozpočtu na prehľadávanie: Tým, že systém explicitne bráni botom v plytvaní zdrojmi na náročné backendové procesy, optimalizuje svoj rozpočet na prehľadávanie (crawl budget). To núti vyhľadávače zamerať sa výlučne na hodnotné, na obsah bohaté verejné podstránky.

4.31.2. Automatizované generovanie viacúrovňovej mapy stránok (Sitemap)
Aplikácia využíva natívny systém Django Sitemap Framework na dynamické generovanie a údržbu komplexnej štruktúry webového adresára. Infraštruktúra mapy stránok je rozdelená do dvoch škálovateľných vrstiev:

Statické mapovanie stránok: Automaticky katalogizuje kľúčové štrukturálne marketingové stránky, ktoré majú pevné cesty, vrátane domovskej stránky, repozitára blogu a verejných komunitných uzlov.

Dynamické mapovanie na úrovni objektov: Na zabezpečenie rýchleho indexovania novovytvoreného používateľského obsahu sa framework dynamicky prepája s databázou. Programovo generuje uzly mapy stránok v reálnom čase pre každú novopublikovanú verejnú stránku príspevku a každú verejnú stránku používateľského profilu, pričom automaticky sleduje časové pečiatky vytvorenia a úprav.

4.31.3. Internacionalizácia (i18n) a viditeľnosť vo viacerých krajinách
Lokalizované alternatívne smerovanie: Na podporu globálnej adopcie používateľmi je engine na generovanie mapy stránok úzko prepojený s prekladovými vrstvami platformy.

Medzijazykové indexovanie: Systém vkladá presné definície mapovania pre lokalizované alternatívy identických koncových bodov (napríklad mapovanie /en/homepage ako priameho anglického ekvivalentu slovenskej verzie /sk/domov). Táto štruktúra slúži ako natívna implementácia signalizácie hreflang, čo umožňuje vyhľadávačom kontextovo doručiť správnu jazykovú verziu na základe geolokácie a jazykových preferencií hľadajúceho koncového používateľa, čím sa drasticky znižujú penalizácie za duplicitný obsah.

4.32. Pokročilé náhľady na časovej osi videa (Scrubbar) a mapovanie VTT miniatúr
Na replikovanie štandardných interakcií streamovania videa v odvetví a maximalizáciu efektivity navigácie platforma obsahuje pokročilý engine náhľadov na časovej osi. Tento podsystém umožňuje používateľom vizuálne kontrolovať chronologické kontrolné body videa v reálnom čase ešte predtým, ako preskočia na konkrétnu časovú pečiatku.

4.32.1. Automatizovaný proces spracovania VTT (Pipeline)
Asynchrónne spracovanie snímok: Počas počiatočného životného cyklu nahrávania a spracovania videa sa spustí automatizovaný backendový proces (pipeline). Server spracuje video súbor pomocou FFmpeg na extrahovanie vysoko komprimovaných záberov snímok v nízkom rozlíšení v deterministických intervaloch (napríklad jedna snímka za sekundu).

Mapovanie schémy WebVTT: Tieto serializované obrazové súbory sú zmapované do štandardizovaného konfiguračného súboru WebVTT (.vtt). Tento manifest čisto prepája špecifické časové vektory videa (časové pečiatky) so zodpovedajúcimi názvami obrazových súborov alebo priestorovými súradnicami v rámci kombinovaného rozloženia (image sprite), čím sa minimalizujú nadbytočné požiadavky na HTTP server.

4.32.2. Interaktívne zachytávanie prechodu myšou na časovej osi
Výpočet polohy s vysokou presnosťou: Na strane klienta sú vlastné ukazovatele priebehu videa vybavené reaktívnymi poslucháčmi udalostí ukazovateľa (pointer event listeners). Keď používateľ prejde myšou (hover) po časovej osi, klientsky skript v TypeScript-e nepretržite zachytáva presnú horizontálnu X-ovú súradnicu kurzora.

Prepočet časového pomeru: Skript vypočíta presné percento polohy kurzora vzhľadom na celkovú šírku ohraničujúceho boxu (bounding box) ukazovateľa priebehu. Tento pomer sa následne okamžite vynásobí absolútnou dĺžkou aktívneho mediálneho prvku, aby sa určila presná časová pozícia, nad ktorou sa kurzor nachádza.

4.32.3. Dynamická správa vykresľovania kontextových nápovedí (Tooltip)
Vkladanie uzlov v reálnom čase (Node Injection): Klientsky engine, vyzbrojený vypočítanou časovou pečiatkou, odošle dopyt do vopred načítanej mapy WebVTT, aby izoloval presne zodpovedajúcu obrazovú snímku.

Kontextové ukotvené prekrytia (Anchor Overlays): Aplikácia vykreslí plávajúci kontajner s náhľadom priamo nad indikátorom časovej osi. Tento tooltip dynamicky sleduje horizontálnu dráhu kurzora používateľa, okamžite obnovuje vloženú miniatúru snímky v nízkej kvalite a poskytuje tak okamžité, bezproblémové vizuálne potvrdenie toho, čo sa nachádza v danej presnej milisekunde klipu.

4.33. Architektúra komunikácie a posielania správ v reálnom čase
Na podporu komunitnej interakcie a umožnenie okamžitého prepojovania používateľov platforma obsahuje plne duplexný rámec živého chatu (Live Chat framework). Tento modul obchádza tradičné cykly požiadaviek a odpovedí HTTP a využíva trvalé pripojenia na dosiahnutie distribúcie správ a synchronizácie stavu s nulovou latenciou.

4.33.1. Asynchrónny WebSocket proces (Pipeline) a vrstva Pub/Sub
Trvalá vrstva riadená udalosťami (Event-Driven Layer): Obojsmerný tok dát v reálnom čase je riadený prostredníctvom asynchrónnych WebSocketov, ktoré sú natívne spravované na backende prostredníctvom Django Channels.

Pamäťový sprostredkovateľ Redis (Memory Broker): Na uľahčenie smerovania správ naprieč viacerými serverovými procesmi (worker processes) systém integruje Redis ako vysokovýkonnú vrstvu kanálov v pamäti (in-memory Channel Layer).

Atómový proces spracovania (Atomic Processing Pipeline): Každá transakčná správa odoslaná používateľom sleduje prísnu architektonickú sekvenciu:

Dátové užitočné zaťaženie (payload) je zachytené aktívnym klientskym pripojením WebSocket.

Backend asynchrónne spracuje a overí obal udalosti (event wrapper).

Stav správy sa trvalo zapíše do perzistentnej databázy.

Overený payload sa okamžite vysiela (broadcast) prostredníctvom rámca Redis Pub/Sub do všetkých prepojených uzlov vo vnútri cieľovej aktívnej četovacej miestnosti (pričom súčasne zasiahne relácie odosielateľa aj prijímateľa).

4.33.2. Dynamické generovanie UI a živé reakcie
Reaktívne vkladanie na front-ende: Po prijatí úspešne smerovanej udalosti správy z backendového kanála zachytia klientske slučky udalostí (event loops) v TypeScript-e odoslané dáta. Model DOM sa programovo zmení tak, aby sa bublina so správou okamžite vykreslila v zornom poli bez potreby opätovného načítania (re-hydration) celej stránky.

Živá telemetria emoji: Používatelia môžu vydávať okamžitú metadátovú spätnú väzbu vo forme emoji reakcií. Tieto mikrointerakcie sú odosielané ako štruktúrované rámce WebSocketu, spracované správcami stavu na backende a okamžite vysielané na synchronizáciu počtu reakcií naprieč všetkými otvorenými zornými poľami v četovacej miestnosti.

#### 4.33.3 Temporal Message Mutation Guardrails

Na zachovanie integrity konverzácie, zabránenie prepisovaniu histórie a zmiernenie zneužívania databázy uplatňuje aplikácia prísne časové hranice na úpravu dát. Autori majú exkluzívne oprávnenia upravovať alebo redigovať svoje vlastné správy, a to v rámci prísnych časových okien overovaných serverom:

| Akcia na úrovni vrstvy | Povolený časový rámec | Prevádzkový ochranný mantinel |
| - | - | - |
| Úprava obsahu správy | Do 15 minút od absolútneho vytvorenia. | Umožňuje okamžité opravy preklepov, pričom zabraňuje spätnej manipulácii s kontextom konverzácie. |
| Úplné vymazanie správy  | Do 24 hodín od absolútneho vytvorenia. | Posilňuje súkromie používateľa a kontrolu nad obsahom, po uplynutí ktorých sa stav databázy uzamkne pre stabilitu archívu. |

4.34. Protokoly prichádzajúcich žiadostí o sledovanie a triedenie súkromia (Privacy Triage)
Na doplnenie globálnych stavov súkromných účtov platforma zahŕňa štruktúrovaný proces relačného overovania (relational verification pipeline). Keď je profil obmedzený, štandardný mechanizmus okamžitého sledovania (instant-follow) sa zachytí a zmení na čakajúcu žiadosť o autorizáciu.

4.34.1. Zachytávanie a smerovanie čakajúceho stavu
Podmienené prevzatie akcie (Action Hijacking): Keď používateľ iniciuje akciu sledovania zameranú na účet označený ako Súkromný, backend zablokuje okamžitú zmenu stavu (state mutation) v databázovej matici sledovateľov.

Asynchrónna registrácia žiadosti: Namiesto vytvorenia aktívneho vzťahu systém vytvorí dočasný záznam v tabuľke čakajúcich žiadostí o sledovanie. Stav žiadajúceho používateľa sa nastaví na „Čakajúci“ (Pending) a cieľový používateľ je upozornený bez toho, aby sa žiadateľovi odhalil akýkoľvek obmedzený obsah profilu alebo dáta z informačného kanála.

4.34.2. Centralizované centrum správy
Riadiaci panel vložený do profilu: Do zobrazenia profilovej stránky vlastníka účtu sa exkluzívne vkladá vyhradené a bezpečné rozhranie upozornení. Tento panel agreguje všetky prichádzajúce čakajúce žiadosti do čistého, ľahko prehľadávateľného zoznamu.

Kontextualizácia identity: Každá položka v toku žiadostí zobrazuje základné identifikátory žiadateľa (avatar, meno a používateľské meno), čo umožňuje vlastníkovi účtu rýchlo overiť profil žiadateľa pred prijatím rozhodnutia.

4.34.3. Možnosti triedenia a vysporiadanie vzťahu
Vlastník účtu má k dispozícii tri explicitné operačné cesty na správu prichádzajúcej dátovej prevádzky:

Schváliť (Approve): Kliknutím na potvrdzovací prvok sa prostredníctvom asynchrónnej požiadavky aktualizuje databázový záznam. Čakajúci stav sa zruší, žiadateľ je oficiálne presunutý do zoznamu aktívnych sledovateľov a získa okamžitý prístup k informačnému kanálu, mriežkam príspevkov (grids) a súkromným metrikám autora.

Zamietnuť (Reject): Výber prvku zamietnutia úplne odstráni čakajúci riadok z databázy. Žiadateľ zostáva neoverený a má zablokovaný prístup k súkromným dátam, zatiaľ čo používateľské rozhranie pomocou plynulého CSS prechodu položku okamžite vymaže zo zorného poľa vlastníka.

Ignorovať (Ignore): Používateľ sa môže rozhodnúť ponechať žiadosť v nevysporiadanom stave. Aplikácia uchováva čakajúci riadok v databáze, čím sa zabezpečí, že žiadateľ nemôže posielať duplicitné žiadosti, zatiaľ čo vlastníkovi profilu to umožňuje vyčistiť si zoznam aktívnych upozornení bez vydania explicitného zamietnutia.

4.35. Architektúra viacúrovňového predplatného a integrácia Stripe
Na zabezpečenie dlhodobej udržateľnosti platformy a odmenenie oddaných používateľov obsahuje aplikácia dobrovoľný, viacúrovňový model predplatného. Finančná infraštruktúra je bezpečne poháňaná cez API služby Stripe, ktoré spravuje zámery platieb (payment intents), životné cykly opakovaného fakturovania a bezpečné relácie pokladne (checkout sessions).

4.35.1. Úrovne predplatného a kozmetické vylepšenia
Rozvrstvenie plánov: Používatelia sa môžu rozhodnúť podporiť projekt prechodom zo svojho štandardného bezplatného účtu na predplatné kategórie Basic alebo Premium.

Mechanika vizuálnej prestíže: Po úspešnom overení platby backend automaticky odomkne exkluzívne kozmetické vylepšenia pre identifikátory používateľa. Zahŕňa to jedinečný odznak úspechu špecifický pre danú úroveň a zvýraznený, dynamicky štylizovaný rámik avatara, ktorý sa globálne a trvalo zobrazuje v informačnom kanáli, v komentároch a na stránke profilu, aby vizuálne signalizoval status podporovateľa.

4.35.2. Spracovanie médií závislé od úrovne (Alokácia FFmpeg)
Dynamické limity médií: Úroveň predplatného je priamo prepojená so zásadami spracovania médií na platforme, čo umožňuje prémiovým používateľom obísť štandardné obmedzenia a nahrávať podstatne dlhšie video súbory.

Podmienené kompresné algoritmy: Počas asynchrónneho procesu nahrávania médií procesy na pozadí (Celery workers) dynamicky overujú aktuálny stav predplatného autora. Na základe aktívnej úrovne vydá server pokyn pre FFmpeg, aby aplikoval rôzne úrovne intenzity kompresie súborov. Prémiovým používateľom je pridelená vyššia réžia výpočtového výkonu servera, čo vedie k minimalizácii kompresných artefaktov a výrazne vyššej vizuálnej kvalite pre obrázky aj videá.

4.35.3. Správa životného cyklu a UI aktívneho stavu
Riadiaci panel stavu v reálnom čase: V rámci nastavení účtu majú používatelia k dispozícii transparentné rozhranie na správu fakturácie a predplatného.

Časové sledovanie: Front-end využíva údaje z časových pečiatok z backendu na nepretržité sledovanie a zobrazovanie presného času zostávajúceho do konca aktívneho cyklu predplatného. Tým informuje používateľa o jeho aktuálnom statuse a blížiacich sa dátumoch exspirácie alebo automatického predĺženia.

## 5. Security

5.1. Protokolovanie auditu autentifikácie (login.log)
Na zaistenie vysokej zodpovednosti a umožnenie forenznej analýzy používateľských relácií (sessions) aplikácia udržiava vyhradenú auditnú stopu na strane servera pre všetky udalosti autentifikácie.

5.1.1. Trvalé zachytávanie udalostí (Persistent Event Capture)
Každá inštancia prihlásenia alebo odhlásenia používateľa sa prísne zachytáva a pridáva do centralizovaného súboru login.log. To poskytuje trvalý záznam, ktorý existuje nezávisle od stavu primárnej databázy.

5.1.2. Štruktúrované metadáta
Na uľahčenie rýchleho vyšetrovania podozrivých aktivít obsahuje každý záznam v protokole podrobný snímok (snapshot) udalosti:

Kontext udalosti: Špecifický dôvod záznamu (napr. úspešné prihlásenie, ukončenie relácie / odhlásenie).

Sledovanie identity: Unikátne ID používateľa (User ID), ktoré umožňuje administrátorom korelovať relácie s konkrétnymi účtami.

Sieťový pôvod: IP adresa klienta, kľúčová pre identifikáciu neoprávneného prístupu z neočakávaných geografických lokalít.

Presné časové pečiatky: Každý záznam má časovú pečiatku s presnosťou na sekundu, čo umožňuje presné chronologické radenie udalostí.

5.1.3. Užitočnosť pre bezpečnosť
Tento protokol slúži ako primárny diagnostický nástroj na identifikáciu vzorov, ako je napĺňanie ukradnutých prihlasovacích údajov (credential stuffing) alebo podozrivé prepínanie relácií (session-hopping), čo zaručuje, že administrátori môžu reagovať na hrozby s podloženými dôkazmi.

5.2. Protokolovanie chýb aplikácie (error.log)
Na uľahčenie rýchleho ladenia (debuggingu) a udržanie absolútnej stability platformy sa všetky výnimky na strane servera a ošetrené chyby v blokoch catch dôkladne zaznamenávajú do vyhradeného súboru protokolu chýb.

5.2.1. Diagnostické metadáta
Keď používateľ narazí na neočakávaný problém, systém automaticky zachytí presnú časovú pečiatku udalosti, údaje autentifikovaného používateľa a zdrojovú IP adresu klienta.

5.2.2. Zachytávanie spätnej stopy (Traceback Capture)
Ak sa problém zachytí v konkrétnom bloku na spracovanie výnimiek, do protokolu sa pripojí vlastné chybové hlásenie a príslušná stopa zásobníka (stack trace). To poskytuje vývojárom presný kontext potrebný na efektívnu reprodukciu a vyriešenie chyby bez toho, aby sa museli spoliehať na hlásenia chýb od používateľov.

5.3. Plánované úlohy a protokolovanie úloh Cron (Cron Job Logging)
Na monitorovanie bezchybného chodu (health) a úspešného vykonávania automatizovaných backendových procesov systém udržiava samostatný, vyhradený protokol pre všetky plánované úlohy na pozadí.

5.3.1. Overenie vykonania
Tento protokol poskytuje overiteľné potvrdenie o dokončených asynchrónnych operáciách. Zaznamenáva časy začiatku a konca úloh bežnej údržby, ktoré spúšťa server.

5.3.2. Prevádzkové metriky
Záznamy obsahujú podrobné metriky týkajúce sa výsledku úlohy. Zaznamenáva napríklad presný počet trvalo pozastavených účtov, ktoré boli úspešne vymazané z databázy počas plánovaného cyklu čistenia databázy, čím zaručuje úplnú transparentnosť automatizovanej správy dát.

## 6. Replaced Features

6.1. Optimalizovaná architektúra streamovania videa (HTTP 206)
Na zabezpečenie plynulého prehrávania videa bez sekania (bufferovania) naprieč platformou backend implementuje špecializovanú architektúru streamovania, namiesto spoliehania sa na štandardné metódy poskytovania statických súborov.

6.1.1. Vyhradené koncové body pre streamovanie (Endpoints)
Vlastné smerovanie (Custom Routing): Namiesto toho, aby sa front-endu priamo odhaľovali surové cesty k súborom na serveri, video médiá sa bezpečne doručujú prostredníctvom vyhradených, vlastných URL koncových bodov. To poskytuje dodatočnú vrstvu abstrakcie a kontroly nad tým, ako sa médiá konzumujú.

6.1.2. Implementácia odpovedí v rozsahoch (Ranged Response)
Prenos dát po častiach (Chunked Data Transfer): Server využíva obslužný program pre odpovede v rozsahoch (napríklad knižnicu django-ranged-response) na spracovanie prichádzajúcich požiadaviek na video. To umožňuje serveru interpretovať a odpovedať na špecifické požiadavky na rozsah bajtov (byte-range requests), ktoré generuje prehrávač videa HTML5.

Vynucovanie HTTP 206 (Čiastočný obsah): Štandardné poskytovanie súborov často vedie k odpovediam HTTP 200 (OK), čo núti klienta stiahnuť celý súbor sekvenčne. Striktným vynucovaním stavových kódov HTTP 206 (Partial Content) backend umožňuje prehliadaču streamovať video v dynamických častiach (chunks).

Stabilita prehrávania: Táto architektúra drasticky zlepšuje stabilitu videa, minimalizuje počiatočné časy načítania a – čo je kritické – umožňuje správne fungovanie vlastného ovládača časovej osi videa (Sekcia 3.46). Používatelia môžu plynulo preskakovať dopredu (seek) na nenačítané úseky videa bez toho, aby museli čakať na stiahnutie predchádzajúcich dát.