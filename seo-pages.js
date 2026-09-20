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
