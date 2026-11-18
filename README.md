# Studio — prva lokalna verzija

Next.js App Router, JavaScript, Tailwind CSS 4, Supabase PostgreSQL i Auth. Interfejs je na srpskom. Privremeni naziv i sadržaj nisu stvarni podaci studija. Nema lokalnog simuliranja rezervacija, plaćanja, paketa, grupa ili podsetnika.

## Lokalno pokretanje

Potreban je **Node.js 22.13+** (preporučena aktuelna Node 22 LTS verzija), npm i Supabase projekat ili lokalni Supabase CLI sa Docker-om.

1. `npm ci`
2. Kopirajte `.env.example` u `.env.local`.
3. Unesite `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` iz Supabase Connect/API podešavanja i `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
4. Primenite migraciju iz `supabase/migrations/202611130001_studio.sql` na sopstvenom projektu kroz SQL editor ili CLI migracije. Ovaj zadatak nije primenio ništa na udaljenom projektu.
5. Samo za razvoj pokrenite `supabase/seed.sql` nakon migracije. Dve neutralne instruktorke imaju pon–pet 08–12 i 13–17. Seed nije produkciona migracija.
6. `npm run dev`, otvorite http://localhost:3000.

Na ovom računaru sistemski Node je 20.17, a projekat zahteva 22.13+. Instaliran je i lokalni razvojni Node 22. U PowerShell-u ga možete koristiti za ovu sesiju: `$env:Path = "$PWD\node_modules\node\bin;$env:Path"`, zatim proverite `node --version` i pokrenite npm komande. Next dev i build koriste podržani Webpack builder zbog lokalne Turbopack/Tailwind ESM nekompatibilnosti.

Za potpuno lokalni Supabase: instalirajte zvanični CLI, `supabase start`, zatim `supabase db reset` (briše samo lokalnu razvojnu bazu i primenjuje migracije i seed). Prepišite lokalni URL i publishable/anon ključ u `.env.local`. Auth email poruke pregledaju se u lokalnom mail interfejsu koji CLI prikaže. Service role ključ nije potreban niti se koristi.

## Auth i email

U Authentication → URL Configuration podesite Site URL na `http://localhost:3000` i dozvoljeni redirect `http://localhost:3000/auth/callback` (za kasnije postavljanje dodajte stvarni HTTPS origin). `NEXT_PUBLIC_SITE_URL` mora odgovarati tom origin-u. Uključite Email/Password i Confirm email. Za stvarnu upotrebu podesite sopstveni SMTP i ograničenja učestalosti/CAPTCHA u Supabase-u.

Podrazumevani email template sa `{{ .ConfirmationURL }}` podržava PKCE tok: link otvorite u istom pregledaču u kome je započeta registracija/reset. Za linkove nezavisne od PKCE cookie-a možete koristiti token-hash template: potvrda `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/zakazivanje`, reset `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/nova-lozinka`. Token-hash verzija potvrde ide na početak zakazivanja; podrazumevani PKCE tok čuva izabrani termin. Callback podržava oba pristupa. Pri povratku uvek se ponovo proverava dostupnost.

## Prvi administrator i pristup instruktorki

Registrujte i potvrdite nalog. U SQL editoru kao vlasnik baze pokrenite (zamenite email):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'vas-email@example.com');
```

Za instruktorku takođe registrujte i potvrdite nalog, pa istim postupkom postavite `role = 'trainer'`. Administrator zatim na `/administracija` povezuje taj profil sa instruktorkom. Nikada ne dodeljujte uloge kroz metadata ili klijentski profil. Novi nalozi uvek dobijaju `client`, bez obzira na metadata. Admin ne može menjati uloge kroz aplikaciju. Trenerka vidi svoj raspored i osnovni kontakt rezervisanih klijenata, bez ovlašćenja da menja rezervacije.

## Organizacija i pravila

- `src/app`: stranice i Auth callback; `src/components`: zajednički UI.
- `src/lib/auth.js`, `supabase/`: proverena serverska autentifikacija i SSR cookies/Proxy.
- `src/lib/repositories`: jedini adapter za podatke i RPC, pogodan za zamenu drugim PostgreSQL adapterom.
- `src/lib/actions.js`: serverski ulazi, autorizacija i mutacije; `src/lib/domain`: pravila i formatiranje bez UI zavisnosti.
- `supabase/migrations`: verzionisana šema i DB pravila; `seed.sql`: odvojeni razvojni podaci.

Konkretni termini koriste timestamptz i intervale `[start,end)`, trajanje 60 stvarnih minuta. Nedeljno radno vreme je lokalno Europe/Belgrade; PostgreSQL generiše konkretne trenutke u toj zoni. Na prolećnom prelazu nepostojeći sat se preskače, na jesenjem ponovljeni sat predstavlja dva različita trenutka. Datumi/časovi se prikazuju u Beogradu. Administrativni unos datetime-local se tumači u istoj zoni (za odsustvo koje prelazi prelaz računanja vremena izaberite granice izvan ponovljenog/nepostojećeg sata). Javni pregled je ograničen na narednih 365 dana.

Aktivne i završene rezervacije blokiraju preklapanja; otkazane ne blokiraju. GiST exclusion ograničenja štite instruktorku i registrovanog klijenta pri paralelnim zahtevima. Gost bez naloga nema pouzdan jedinstveni identitet i ne može biti automatski spojen sa drugim telefonskim rezervacijama. Sve mutacije raspoloživosti i rezervacija dele transakcioni advisory lock (namerno jedan za mali studio). Triggeri odbijaju nedostupne termine i promene raspoloživosti koje ugrožavaju buduće rezervacije. Nema tihog otkazivanja. Za promenu radnog intervala prvo razrešite konfliktne rezervacije, uklonite interval, pa dodajte novi. Pauza koja se ponavlja je razmak između radnih intervala; jednokratna pauza/odsustvo/neradni dan je time_off.

RLS i column grants štite podatke i uloge. Javni RPC vraća samo početke slobodnih termina. Kontrola rezervacije i otkazivanja radi i u bazi. Minimalni rok otkazivanja je sada 0 (`CANCELLATION_NOTICE_MINUTES` u domenu i odgovarajući uslov u DB triggeru); promenu pravila kasnije uradite novom migracijom i uskladite domen. Status završen/nije došao dozvoljen je tek po završetku treninga. Izmenu termina uradite otkazivanjem i novom rezervacijom.

## Provere

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Provera tipova koristi TypeScript compiler sa `allowJs` i `checkJs`, bez emitovanja; aplikacija ima isključivo JavaScript izvorne fajlove. Adapter za dinamičke Supabase upite ima JSDoc povratni tip.

Za izolovanu lokalnu PostgreSQL 17 instancu bez Docker-a pokrenite `npm run test:db:local`. Razvojni paket embedded-postgres pokreće stvarni PostgreSQL na localhost portu 55439, pravi novu test bazu, izvršava SQL testove i zaustavlja proces. Direktorijumi `.local-postgres-*` su ignorisani. Ovi testovi koriste minimalnu lokalnu zamenu za Auth identitet, a ne kompletan Supabase Auth servis.

`npm run test:db` zahteva `TEST_DATABASE_URL` ka **praznoj, jednokratnoj lokalnoj PostgreSQL bazi**, sa vlasničkim pristupom i dostupnim btree_gist. Skripta pravi minimalne Auth objekte i primenjuje stvarnu migraciju. Ne koristite postojeću Supabase bazu: test kreira uloge i tabele. Bez promenljive test je eksplicitno preskočen. Testira paralelno zakazivanje, preklapanje korisnika i trenerke, susedne termine, otkazivanje, anonimnu privatnost, RLS, uloge, odsustva i promene rasporeda, te trku odsustva sa rezervacijom. DB testove i kompletan email tok treba proveriti pre produkcione upotrebe. `npm test` zasebno proverava vremensku zonu, otkazivanje i bezbedan nastavak prijave.

Pre objave dostavite stvarni naziv, kontakt, lokaciju, cene, fotografije i biografije, podesite rasporede i povezane naloge instruktorki. Aplikacija nije objavljena.

## Izvršene provere

- JavaScript `checkJs` provera tipova i ESLint: prošli.
- Dvadeset testova domenskih pravila, rasporeda i Auth poruka: prošlo.
- Stvarna lokalna PostgreSQL 17.11 baza: migracija i prošireni testovi konkurentnosti, RLS pristupa, otkazivanja, konfliktnih izmena i DST prelaza prošli. Udaljena baza nije menjana.
- Produkcioni Webpack build: prošao.
- HTTP provera početne, prijave, zakazivanja, administracije i mojih termina bez konfiguracije: sve vraćaju 200 i odgovarajući sadržaj/poruku za podešavanje.
- `npm audit --omit=dev`: bez prijavljenih ranjivosti. Puni audit prijavljuje 8 umerenih upozorenja u razvojnim ESLint/TypeScript-ESLint zavisnostima, vezanih za njihov minimatch; nije korišćen prisilni downgrade Next-a koji audit predlaže.
- Kompletna registracija/prijava, dostava email poruka i rezervacije kroz Supabase HTTP API nisu proverene bez konfigurisanog Supabase projekta. SQL pristup je proveren uz lokalne Auth identitete; vizuelni pregled u stvarnom mobilnom pregledaču ostaje za proveru.

## Vizuelni stil

Paleta i naslovna fotografija su iz Yogalax-a; kolaž, foto-sekcija, ikonice i stil formi prilagođeni su iz Zogin-a. Poreklo materijala i atribucija autora navedeni su u [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md). Sve fotografije služe kao ilustracija. Forma na početnoj vodi na stvarni pregled dostupnosti; registracija i prijava koriste postojeće Supabase akcije.

Za izolovani produkcioni build dok radi dev server može se postaviti NEXT_OUTPUT_DIR=.next-design-check. Podrazumevani izlaz ostaje .next.

## Tabelarni admin raspored

Administracija podrazumevano prikazuje kalendarsku nedelju od ponedeljka do nedelje. Dani su u kolonama, lokalna vremena početka u redovima, a kartice sadrže ime i prezime klijenta ili ime telefonskog gosta i instruktorku. Istovremene rezervacije različitih instruktorki prikazuju se zajedno u istoj ćeliji i razlikuju bojom i nazivom instruktorke. Rad vikendom ostaje podržan. Na telefonu je dostupno horizontalno pomeranje uz fiksiranu kolonu sa satnicom.

U glavnoj tabeli su samo rezervacije sa statusom booked. Otkazani termini i završeni treninzi/nedolasci imaju zasebne, podrazumevano sklopljene evidencije za izabrani period i filter. Podaci se ne brišu. Kontakt i statusne akcije otvaraju se u kartici kroz „Detalji i status“. Posle promene statusa zadržavaju se datum, prikaz i izabrana instruktorka.

Svi prikazi vremena koriste Europe/Belgrade bez tekstualnog UTC pomeraja. Timestamptz čuvanje i obrada DST prelaza nisu menjani. Testovi rasporeda pokrivaju i oba različita trenutka u ponovljenom jesenjem satu. Promene SQL šeme nisu potrebne.

## Dnevni i nedeljni prikaz ličnih termina

Administracija i „Moji termini“ dele jasne linkove Dan/Nedelja i navigaciju prethodni period / danas / sledeći period. Izbor datuma automatski otvara taj pojedinačni dan; klik na zaglavlje dana u nedeljnom prikazu takođe vodi na dnevni prikaz, uz očuvanje filtera instruktorke.

„Moji termini“ prikazuju nedelju kroz kartice po danima, a pojedinačni dan kao listu sa satnicom. Zakazani, završeni treninzi i nedolasci imaju vidljiv status. Otkazani su u sklopljenoj evidenciji izabranog perioda. Upit u bazu ograničen je na autentifikovanog korisnika i izabrani period. Nova rezervacija otvara odgovarajuću nedelju; posle otkazivanja ostaje izabrani datum i prikaz.
