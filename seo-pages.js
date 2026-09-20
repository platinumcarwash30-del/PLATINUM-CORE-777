const seoPage = document.body.dataset.seoPage;
const englishMain = document.querySelector('main')?.innerHTML || '';

const seoPageText = {
  business: {
    title: { en: 'PLATINUM CORE 777 Modular Business Software & Licensing', sr: 'PLATINUM CORE 777 Modularni poslovni softver i licence' },
    description: { en: 'PLATINUM CORE 777 is a closed modular business software system offering licensed websites, custom applications, document archiving and connected Core Review services.', sr: 'PLATINUM CORE 777 je zatvoren modularni poslovni softverski sistem koji nudi licencirane web sajtove, prilagodjene aplikacije, arhiviranje dokumenata i povezane Core Review usluge.' },
    sr: `<p class="section-kicker"><span>POSLOVNI SOFTVER</span><span class="section-kicker__rule"></span><span>PLATINUM CORE 777</span></p>
      <h1>Zatvoreno softversko jezgro za firme, preduzetnike i ljude.</h1>
      <p class="seo-page__lead">PLATINUM CORE 777 je nezavisan, modularni softverski sistem iz Beograda koji obezbedjuje licencirane digitalne usluge, web sajtove, aplikacije po meri, organizaciju dokumenata i povezano korisnicko iskustvo kroz Core Review.</p>
      <div class="seo-page__grid">
        <section><h2>Sta je PLATINUM CORE 777?</h2><p>PLATINUM CORE 777 je zatvoreno i kontrolisano softversko jezgro za kompanije, preduzetnike i pojedince kojima je potrebna uredjena digitalna osnova za njihov rad i potrebe. To nije samo jedna aplikacija, vec povezan sistem usluga zasnovan na licenciranju, organizaciji i dugorocnoj digitalnoj podrsci.</p></section>
        <section><h2>Sta obuhvata licenca?</h2><p>Licenca moze obuhvatati web sajt, aplikaciju razvijenu prema zahtevima korisnika, dostupnost sistema 24 casa, cuvanje vaznih dokumenata, uredjeno digitalno arhiviranje i povezivanje sa knjigovodstvom ili drugim potrebnim sluzbama. Tri paketa usluga bice predstavljena naknadno, nakon predstavljanja modela licenciranja.</p></section>
        <section><h2>Core Review za licencirane firme</h2><p>Core Review je korisnicka aplikacija u okviru PLATINUM CORE 777 sistema. Namenjena je iskljucivo korisnicima i klijentima firmi koje imaju licencu PLATINUM CORE 777. Korisnici mogu da ostave iskustvo nakon posete licenciranoj firmi, pronadju bazu pouzdanih firmi i povezuju se kroz zajednice, grupe i dogadjaje.</p><p><a class="button button--primary" href="core-review.html">Istrazi Core Review ↗</a></p></section>
        <section><h2>Po cemu je sistem drugaciji</h2><p>PLATINUM CORE 777 povezuje licenciranu firmu, njene digitalne usluge i korisnike unutar jednog kontrolisanog jezgra. Projekat je zamisljen da smanji nepouzdano predstavljanje poslovanja, podstakne stvaran feedback korisnika i stvori jasnije odnose izmedju ljudi, firmi i usluga.</p></section>
        <section><h2>Kontrola, poverenje i odgovornost</h2><p>Korisnici, licencirane firme, recenzije i zajednice podlezu pravilima platforme. Obmanjujuce aktivnosti, manipulacija, zloupotreba ili druga ozbiljna krsenja mogu dovesti do provere, ogranicenja, suspenzije ili uklanjanja iz sistema. Cilj je da ucesce u digitalnom okruzenju nosi odgovornost.</p></section>
        <section><h2>Ko razvija projekat?</h2><p>PLATINUM CORE 777 i Core Review trenutno samostalno razvija Marko Cuca, Author, Founder &amp; CEO. On je trenutno jedina osoba direktno odgovorna za razvoj, organizaciju, pravac i sledecu fazu projekta.</p><p><a class="button button--ghost" href="intellectual-property.html">Pogledaj obavestenje o zastiti ↗</a></p></section>
        <section><h2>Druga faza razvoja</h2><p>Projekat se trenutno nalazi u drugoj fazi razvoja. U prvoj fazi postavljeni su osnovni koncept, sistemska osnova i povezana arhitektura. Sadasnja faza usmerena je na integraciju, testiranje, javnu pripremu i izlazak testne verzije Core Review aplikacije.</p></section>
        <section><h2>Izgradjeno u Beogradu, pripremljeno za svet</h2><p>PLATINUM CORE 777 se razvija iz Beograda sa dugorocnom ambicijom da poveze licencirane firme, korisnike i digitalne usluge na sirim trzistima. Sistem se i dalje razvija, ali su njegova osnova, pravac i namena jasno postavljeni.</p><p><a class="button button--ghost" href="sponsorship.html">Podrzi sledecu fazu ↗</a></p></section>
      </div>
      <section class="seo-page__cta">
        <p class="section-kicker"><span>SLEDECI KORAK</span><span class="section-kicker__rule"></span><span>PODRZI RAZVOJ</span></p>
        <h2>Svaki oblik podrske pomaze da sistem napreduje.</h2>
        <p>PLATINUM CORE 777 se razvija samostalno i svaka vrsta podrske ima stvarnu vrednost. Finansijska podrska pomaze u pokrivanju troskova razvoja i rada. Oprema i tehnologija pomazu u programiranju, testiranju, bezbednosti i produkciji. Znanje, savet, saradnja, testiranje, vidljivost i deljenje projekta sa pravim ljudima takodje mogu napraviti veliku razliku.</p>
        <p>Svaki doprinos pomaze da nastavimo izgradnju sistema, pripremimo javnu testnu verziju Core Review aplikacije i pomerimo PLATINUM CORE 777 ka sledecoj fazi. Ako verujes u projekat, mozes podrzati razvoj, predloziti saradnju ili jednostavno pomoci da vise ljudi sazna sta se gradi.</p>
        <div class="seo-page__cta-actions"><a class="button button--primary" href="sponsorship.html">Istrazi podrsku i partnerstvo ↗</a><a class="button button--ghost" href="https://support.platinumcore777.com/">Poseti Supporters ↗</a></div>
      </section>`,
    nav: { en: ['Home', 'PLATINUM CORE 777', 'Core Review', 'Support'], sr: ['Pocetna', 'PLATINUM CORE 777', 'Core Review', 'Podrska'] },
    footer: { en: '© 2026 PLATINUM CORE 777 · Return to the main site', sr: '© 2026 PLATINUM CORE 777 · Nazad na glavni sajt' }
  },
  'core-review': {
    title: { en: 'Core Review — Verified Feedback & Business Communities', sr: 'Core Review — Proverene recenzije i poslovne zajednice' },
    description: { en: 'Core Review is a controlled review, trust and community app being developed as part of the PLATINUM CORE 777 system.', sr: 'Core Review je kontrolisana aplikacija za recenzije, poverenje i zajednice koja se razvija u okviru sistema PLATINUM CORE 777.' },
    sr: `<p class="section-kicker"><span>CORE REVIEW</span><span class="section-kicker__rule"></span><span>KORISNICI · FIRME · ZAJEDNICE</span></p>
      <h1>Aplikacija za recenzije i povezivanje zasnovana na stvarnim iskustvima.</h1>
      <p class="seo-page__lead">Core Review je korisnicka aplikacija u okviru PLATINUM CORE 777 sistema, koja se razvija da poveze korisnike, licencirane firme, pouzdane informacije i znacajne zajednice u jednom kontrolisanom digitalnom okruzenju.</p>
      <div class="seo-page__grid">
        <section><h2>Sta je Core Review?</h2><p>Core Review je aplikacija za recenzije korisnika, pronalazenje firmi i povezivanje klijenata. Namenjena je da ljudima pruzi jasniji nacin da podele iskustvo, pronadju firme koje ucestvuju u sistemu i povezu se sa drugima oko mesta i usluga koje zaista koriste.</p></section>
        <section><h2>Kome je namenjen?</h2><p>Aplikacija je namenjena korisnicima i klijentima firmi koje su licencirane od strane PLATINUM CORE 777. Ona je sastavni deo sireg sistema i povezuje stvarna iskustva korisnika sa firmama koje posluju unutar licencne i usluzne strukture.</p></section>
        <section><h2>Feedback zasnovan na stvarnom iskustvu</h2><p>Core Review se razvija oko jednostavnog principa: korisna povratna informacija treba da bude povezana sa stvarnom posetom, stvarnom uslugom ili stvarnim iskustvom korisnika. Cilj je da recenzije firmi budu jasnije, odgovornije i korisnije ljudima koji se na njih oslanjaju.</p></section>
        <section><h2>Baza pouzdanih firmi</h2><p>Korisnici ce moci da istrazuju bazu firmi, usluga i lokacija koje ucestvuju u Core Review okruzenju. Sistem je zamisljen da ponudi vise konteksta od jedne izolovane ocene i da pomogne ljudima da donesu bolje informisane odluke.</p></section>
        <section><h2>Vise od platforme za recenzije</h2><p>Core Review se razvija i za komunikaciju i zajednicu. Korisnici mogu da se povezuju sa ljudima koji posecuju slicna mesta, stvaraju zajednice i grupe, razmenjuju iskustva, otkrivaju povezane usluge i dobijaju pozive za relevantne dogadjaje.</p></section>
        <section><h2>Po cemu se PLATINUM CORE 777 i Core Review izdvajaju?</h2><p>Nasa snaga nije u jednoj izdvojenoj funkciji niti u marketinskom sloganu. Ona je u povezivanju vise vaznih elemenata unutar jednog kontrolisanog softverskog jezgra.</p><p>PLATINUM CORE 777 je zamisljen da poveze licencirane firme, digitalne usluge po meri, organizaciju dokumenata, feedback korisnika i zajednice unutar jednog uredjenog sistema.</p><p>Core Review nije zamisljen kao jos jedna stranica sa recenzijama ili obicna baza firmi. Razvija se kao korisnicki deo sireg sistema u kome:</p><ul><li>feedback proizlazi iz stvarnog iskustva korisnika;</li><li>firme ucestvuju kroz licencnu strukturu;</li><li>korisnici mogu da pronadju firme, povezu se sa drugima i stvaraju zajednice;</li><li>recenzije, profili i pristup funkcionisu prema jasnim pravilima;</li><li>firme i korisnici postaju deo povezanog digitalnog okruzenja;</li><li>sistem moze da raste kroz prilagodjene web sajtove, aplikacije i poslovne usluge.</li></ul><p>Najvaznija razlika je u tome sto se PLATINUM CORE 777 gradi kao celovit ekosistem, a ne kao skup nepovezanih alata.</p><p>Projekat trenutno samostalno razvija Marko Cuca, Author, Founder &amp; CEO, koji je direktno odgovoran za njegovu viziju, razvoj i pravac.</p><p>Core Review sada ulazi u javnu testnu fazu. Njegove funkcije i korisnicko iskustvo nastavice da se razvijaju kroz testiranje, feedback i podrsku.</p></section>
        <section><h2>Vrednost za licencirane firme</h2><p>Za licenciranu firmu, Core Review je vise od obicnog profila. On stvara uredjen nacin da firma bude vidljiva korisnicima, primi znacajan feedback i ucestvuje u povezanim zajednicama sa drugim kompanijama i korisnicima unutar PLATINUM CORE 777 sistema.</p><p><a class="button button--primary" href="business-software.html">Pogledaj modularni poslovni sistem ↗</a></p></section>
        <section><h2>Kontrolisan pristup i odgovornost</h2><p>Pristup, profili, firme, recenzije i zajednice treba da funkcionisu prema jasnim pravilima platforme. Obmanjujuce predstavljanje, manipulacija, zloupotreba ili druga ozbiljna krsenja mogu dovesti do provere, ogranicenja, suspenzije ili uklanjanja. Cilj je digitalno okruzenje u kome ucesce nosi odgovornost.</p></section>
        <section><h2>Po cemu je koncept drugaciji?</h2><p>Core Review nije zamisljen kao jos jedna otvorena stranica sa recenzijama koja je odvojena od poslovanja iza nje. Razvija se kao kontrolisani korisnicki sloj PLATINUM CORE 777 sistema koji povezuje licencirane usluge, feedback korisnika, vidljivost firmi i zajednice unutar jednog povezanog jezgra.</p></section>
        <section><h2>Ko razvija aplikaciju?</h2><p>PLATINUM CORE 777 i Core Review trenutno samostalno razvija Marko Cuca, Author, Founder &amp; CEO. On je trenutno jedina osoba direktno odgovorna za razvoj, organizaciju, pravac i sledecu fazu projekta.</p><p><a class="button button--ghost" href="intellectual-property.html">Pogledaj obavestenje o zastiti ↗</a></p></section>
        <section><h2>Druga faza razvoja</h2><p>PLATINUM CORE 777 se trenutno nalazi u drugoj fazi razvoja. U prvoj fazi postavljeni su osnovni koncept, sistemska osnova i povezana arhitektura. Sadasnja faza usmerena je na integraciju, testiranje, javnu pripremu i izlazak testne verzije Core Review aplikacije.</p></section>
        <section><h2>Javno testiranje je pocelo</h2><p>Javna testna faza Core Review aplikacije je pocela. Aplikacija i njena povezanost sa PLATINUM CORE 777 sistemom testiraju se korak po korak, ukljucujuci registraciju, profile, vidljivost firmi, recenzije, zajednice, obavestenja, komunikaciju i ukupno korisnicko iskustvo.</p></section>
        <section><h2>Planirani izlazak na Google Play</h2><p>Prva javna verzija za Google Play planirana je za priblizno 14 dana od trenutne faze testiranja, u zavisnosti od zavrsnog testiranja, tehnicke spremnosti i Google Play provere. Testni period je vazan jer omogucava da se sistem proveri i unapredi pre sireg javnog pristupa.</p></section>
        <section><h2>Podrska razvoju</h2><p>U ovoj fazi podrska je posebno vazna. Finansijska podrska, oprema, tehnologija, znanje, savet, testiranje, saradnja, vidljivost i deljenje projekta mogu pomoci da Core Review stigne do javne verzije i da PLATINUM CORE 777 nastavi da se razvija samostalno.</p><p><a class="button button--primary" href="index.html#support">Pogledaj sve nacine podrske ↗</a></p></section>
      </div>
      <section class="seo-page__cta">
        <p class="section-kicker"><span>SLEDECI KORAK</span><span class="section-kicker__rule"></span><span>PODRSKA TESTNOJ FAZI</span></p>
        <h2>Pomozite da Core Review stigne do sledece javne faze.</h2>
        <p>Core Review se gradi kao deo sire vizije: kontrolisano digitalno jezgro u kome firme, korisnici, stvarni feedback i zajednice mogu da se povezu sa vise jasnosti i odgovornosti. Projekat se razvija samostalno, a svaki znacajan oblik podrske pomaze u testiranju, opremi, hostingu, bezbednosti, sadrzaju i pripremi Google Play verzije.</p>
        <p>Ako verujes u ideju, mozes podrzati sledecu fazu preko glavnog sajta, podeliti projekat sa ljudima kojima moze biti koristan ili se ukljuciti kroz testiranje i saradnju.</p>
        <div class="seo-page__cta-actions"><a class="button button--primary" href="index.html#support">Podrzi Core Review ↗</a><a class="button button--ghost" href="https://support.platinumcore777.com/">Poseti Supporters ↗</a></div>
      </section>`,
    nav: { en: ['Home', 'PLATINUM CORE 777', 'Core Review', 'Support'], sr: ['Pocetna', 'PLATINUM CORE 777', 'Core Review', 'Podrska'] },
    footer: { en: '© 2026 PLATINUM CORE 777 · Return to the main site', sr: '© 2026 PLATINUM CORE 777 · Nazad na glavni sajt' }
  },
  information: {
    title: { en: 'Useful Information for Businesses & Entrepreneurs | PLATINUM CORE 777', sr: 'Korisne informacije za firme i preduzetnike | PLATINUM CORE 777' },
    description: { en: 'Useful information about secure business software, digital document archiving, verified business reviews, trusted directories, entrepreneur software and independent technology innovation.', sr: 'Korisne informacije o bezbednom poslovnom softveru, digitalnom arhiviranju dokumenata, proverenim recenzijama, pouzdanim bazama firmi i nezavisnoj tehnoloskoj inovaciji.' },
    sr: `<p class="section-kicker"><span>KORISNE INFORMACIJE</span><span class="section-kicker__rule"></span><span>PLATINUM CORE 777</span></p>
      <h1>Korisne informacije za firme, preduzetnike i ljude.</h1>
      <p class="seo-page__lead">Istrazi prakticne teme povezane sa bezbednim poslovnim softverom, digitalnom organizacijom, pouzdanim recenzijama, pronalazenjem firmi i nezavisnom tehnoloskom inovacijom.</p>
      <div class="seo-page__grid">
        <section id="secure-business-software"><h2>Bezbedan poslovni softver</h2><p>Bezbedan poslovni softver treba da ucini svakodnevni rad jasnijim bez stvaranja nepotrebne slozenosti. Vazne osnove obuhvataju kontrolisan pristup, jasne uloge korisnika, uredno cuvanje dokumenata, razumne rezervne kopije i strukturu koja moze da raste zajedno sa firmom.</p><p>PLATINUM CORE 777 se razvija kao zatvoreno modularno softversko jezgro za firme, preduzetnike i pojedince. Planirane usluge povezuju web sajtove, aplikacije po meri, organizaciju dokumenata i pristup korisnika u jednom uredjenom digitalnom okruzenju.</p></section>
        <section id="digital-document-archiving"><h2>Digitalno arhiviranje dokumenata</h2><p>Digitalno arhiviranje dokumenata nije samo cuvanje fajlova u jednoj fascikli. Koristan arhiv zahteva dosledne nazive, razumljive kategorije, pracenje verzija, kontrolisan pristup i praktican nacin da se vazna informacija pronadje kada je potrebna.</p><p>Cuvanje vaznih dokumenata i uredjeno digitalno arhiviranje deo su planiranog modela licenciranja PLATINUM CORE 777. Tacni paketi usluga bice predstavljeni zasebno kada se struktura licenciranja dalje pripremi.</p></section>
        <section id="verified-business-reviews"><h2>Proverene recenzije firmi</h2><p>Recenzija firme postaje korisnija kada korisnik moze da razume kontekst iza nje. Najbolji sistemi povezuju povratnu informaciju sa stvarnom posetom, stvarnom uslugom ili jasno opisanim iskustvom korisnika, umesto da svaku izdvojenu ocenu posmatraju kao jednaku.</p><p>Core Review se razvija oko ovog principa. Namenjen je povezivanju korisnika sa licenciranim firmama i stvaranju odgovornijeg prostora za feedback, pronalazenje usluga i komunikaciju.</p><p><a class="button button--primary" href="core-review.html">Istrazi Core Review ↗</a></p></section>
        <section id="trusted-business-directory"><h2>Pouzdana baza firmi</h2><p>Pouzdana baza firmi treba da pomogne ljudima da pronadju usluge sa vise informacija od samog naziva i ocene zvezdicama. Jasni profili, odgovorno ucesce, koristan kontekst i vidljiva pravila mogu da ucine digitalno pronalazenje firmi razumljivijim.</p><p>Koncept PLATINUM CORE 777 povezuje bazu firmi koje ucestvuju u sistemu sa licenciranjem, digitalnim uslugama i Core Review aplikacijom. Baza je zamisljena da raste kako joj se prikljucuju nove firme i korisnici.</p></section>
        <section id="software-for-entrepreneurs"><h2>Softver za preduzetnike</h2><p>Preduzetnicima je cesto potrebno vise od jednog generickog alata. Potrebni mogu biti jasan web sajt, aplikacija po meri, uredjeni dokumenti, dostupna podrska i digitalna osnova koja se menja zajedno sa njihovim radom.</p><p>PLATINUM CORE 777 je zamisljen da ponudi modularne usluge samostalnim profesionalcima, malim firmama i projektima u razvoju. Cilj je povezivanje prakticnih digitalnih alata sa dugorocnijom strukturom podrske.</p></section>
        <section id="business-license-website-app"><h2>Web sajt i aplikacija uz poslovnu licencu</h2><p>Poslovna licenca u okviru modela PLATINUM CORE 777 moze da obuhvati web sajt i aplikaciju razvijenu prema zahtevima firme, preduzetnika ili pojedinca. Moze da poveze i cuvanje dokumenata, dostupnost i druge digitalne usluge u skladu sa odabranim paketom.</p><p>Ovaj model se priprema kao usluzni okvir, a ne kao isti obrazac za svakoga. Planirana su tri paketa koja ce biti predstavljena zasebno kada licencna ponuda bude spremna.</p><p><a class="button button--ghost" href="business-software.html">Procitaj o poslovnom sistemu ↗</a></p></section>
        <section id="real-customer-reviews"><h2>Stvarne recenzije korisnika bez laznih ocena</h2><p>Ljudima su potrebne recenzije korisnika koje nude koristan kontekst, a ne samo broj. Odgovorno okruzenje za recenzije treba da ostavi prostor za stvarna iskustva, jasna pravila, moderaciju i reagovanje na obmanjujuce ili zloupotrebljavajuce aktivnosti.</p><p>Core Review se razvija sa ciljem da podrzi stvarna iskustva korisnika i smanji nepouzdano predstavljanje. Ne zamenjuje licnu procenu korisnika; treba da ponudi jasniju pocetnu tacku za informisanije odluke.</p></section>
        <section id="independent-technology-project"><h2>Nezavisan tehnoloski projekat i inovacija</h2><p>PLATINUM CORE 777 je nezavisan tehnoloski projekat iz Beograda koji razvija Marko Cuca, Author, Founder &amp; CEO. Projekat je nastao iz stvarnog biznisa i sada se razvija u siri modularni sistem koji povezuje firme, korisnike i digitalne usluge.</p><p>Projekat se trenutno nalazi u drugoj fazi razvoja. Core Review ulazi u javno testiranje, dok se siri sistem priprema kroz razvoj, dokumentaciju, testiranje i podrsku. Nezavisnoj inovaciji su potrebni vreme, oprema, feedback i ljudi koji zele da pomognu ozbiljnoj ideji da napreduje.</p><p><a class="button button--ghost" href="intellectual-property.html">Procitaj obavestenje o projektu ↗</a></p></section>
      </div>
      <section class="seo-page__cta">
        <p class="section-kicker"><span>SLEDECI KORAK</span><span class="section-kicker__rule"></span><span>PODRZI RAZVOJ</span></p>
        <h2>Korisne informacije treba da vode ka korisnom koraku.</h2>
        <p>PLATINUM CORE 777 se gradi korak po korak. Podrska moze da bude donacija, oprema, tehnologija, testiranje, znanje, saradnja, vidljivost ili jednostavno deljenje projekta sa osobom kojoj moze biti znacajan.</p>
        <p>Ako zelis da razumes siri sistem, nastavi na stranice o poslovnom softveru i Core Review-u. Ako zelis da pomognes sledecoj fazi, poseti stranicu za podrsku i izaberi oblik podrske koji ti najvise odgovara.</p>
        <div class="seo-page__cta-actions"><a class="button button--primary" href="sponsorship.html">Istrazi podrsku i partnerstvo ↗</a><a class="button button--ghost" href="index.html#useful-information">Nazad na korisne informacije ↗</a></div>
      </section>`,
    nav: { en: ['Home', 'PLATINUM CORE 777', 'Core Review', 'Useful Information', 'Support'], sr: ['Pocetna', 'PLATINUM CORE 777', 'Core Review', 'Korisne informacije', 'Podrska'] },
    footer: { en: '© 2026 PLATINUM CORE 777 · Return to the main site', sr: '© 2026 PLATINUM CORE 777 · Nazad na glavni sajt' }
  },
  legal: {
    title: { en: 'Intellectual Property & Legal Notice | PLATINUM CORE 777', sr: 'Zastita intelektualne svojine | PLATINUM CORE 777' },
    description: { en: 'Intellectual property and legal notice for PLATINUM CORE 777, its original software, documentation, visual identity and connected Core Review system.', sr: 'Pravno obavestenje o zastiti intelektualne svojine projekta PLATINUM CORE 777, softvera, dokumentacije, vizuelnog identiteta i Core Review sistema.' },
    sr: `<p class="section-kicker"><span>PRAVNO OBAVESTENJE</span><span class="section-kicker__rule"></span><span>PLATINUM CORE 777</span></p>
      <h1>Zastita intelektualne svojine i projekta.</h1>
      <p class="seo-page__lead">PLATINUM CORE 777 je originalan i vlasnicki softverski projekat koji razvija njegov autor i osnivac.</p>
      <div class="legal-page__content">
        <section><h2>Zasticeni elementi projekta</h2><p>Originalni softver projekta, izvorni kod, sistemska struktura, dokumentacija, pisani sadrzaji, vizuelni materijali, struktura baze, radni tokovi i drugi originalni elementi predati su i deponovani kao autorsko delo i zasticeni su u skladu sa vazecim autorskim i srodnim pravima.</p><p>Naziv i vizuelni identitet PLATINUM CORE 777 zasticeni su odobrenim zigom. Prijava patenta koja se odnosi na relevantno tehnicko resenje takodje je podneta i trenutno je u postupku pred nadleznim organom.</p></section>
        <section><h2>Nema dozvole za kopiranje</h2><p>Nijednom licu ili organizaciji nije data dozvola da kopira, umnozava, menja, distribuira, komercijalno koristi, objavljuje, predstavlja kao svoje ili na drugi nacin koristi bilo koji zasticeni element PLATINUM CORE 777 projekta bez prethodnog pisanog odobrenja.</p><p>Ovo obuhvata softver i izvorni kod, sistemsku strukturu, tehnicku realizaciju, dokumentaciju, nazive, logotipe, vizuelni identitet, strukturu baze, originalne radne tokove, Core Review komponente, snimke ekrana, prezentacije i promotivne materijale.</p></section>
        <section><h2>Neovlascena upotreba</h2><p>Neovlasceno kopiranje, umnozavanje, prilagodjavanje, komercijalna upotreba, lazno predstavljanje ili pokusaj iskoriscavanja zasticenih elemenata projekta moze predstavljati povredu prava intelektualne svojine.</p><p>PLATINUM CORE 777 zadrzava pravo da zahteva hitan prestanak ili uklanjanje neovlascene upotrebe i da koristi sva dostupna pravna sredstva, ukljucujuci naknadu stete, privremene mere i pokretanje gradjanskog, privrednog ili drugog odgovarajuceg postupka pred nadleznim organima.</p></section>
        <section><h2>Sva prava zadrzana</h2><p>Sva prava zadrzavaju autor i nosilac prava na projektu. Javno dostupne informacije o PLATINUM CORE 777 projektu ne prenose vlasnistvo, autorstvo, licencna prava niti dozvolu za umnozavanje bilo kog dela projekta.</p><p>Za odobrenu saradnju, licenciranje ili partnerske upite, obratite se projektu preko zvanicnog sajta.</p></section>
      </div>`,
    nav: { en: ['Home', 'PLATINUM CORE 777', 'Core Review', 'Support'], sr: ['Pocetna', 'PLATINUM CORE 777', 'Core Review', 'Podrska'] },
    footer: { en: '© 2026 PLATINUM CORE 777 · Return to the main site', sr: '© 2026 PLATINUM CORE 777 · Nazad na glavni sajt' }
  }
};

const content = seoPageText[seoPage];
let currentLanguage = 'en';
try {
  const stored = window.localStorage.getItem('pc777-language');
  if (stored === 'en' || stored === 'sr') currentLanguage = stored;
} catch { /* no-op */ }

function applySeoLanguage(language) {
  currentLanguage = language === 'sr' ? 'sr' : 'en';
  document.documentElement.lang = currentLanguage;
  document.title = content.title[currentLanguage];
  document.querySelector('meta[name="description"]')?.setAttribute('content', content.description[currentLanguage]);
  const nav = document.querySelectorAll('.seo-page__nav a');
  content.nav[currentLanguage].forEach((label, index) => { if (nav[index]) nav[index].textContent = label; });
  const footer = document.querySelector('.site-footer p');
  if (footer) footer.textContent = content.footer[currentLanguage];
  const main = document.querySelector('main');
  if (main) main.innerHTML = currentLanguage === 'sr' ? content.sr : englishMain;
  document.querySelectorAll('[data-seo-language]').forEach((button) => {
    const active = button.dataset.seoLanguage === currentLanguage;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  try { window.localStorage.setItem('pc777-language', currentLanguage); } catch { /* no-op */ }
}

document.querySelectorAll('[data-seo-language]').forEach((button) => {
  button.addEventListener('click', () => applySeoLanguage(button.dataset.seoLanguage));
});

applySeoLanguage(currentLanguage);
