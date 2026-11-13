import Link from "next/link";
import { configured } from "@/lib/config";
import { query } from "@/lib/repositories/studio";
export default async function Home() {
  const connected = configured();
  const trainers = connected
    ? (await query("trainers")).filter((t) => t.active)
    : [1, 2].map((n) => ({
        id: String(n),
        name: `Instruktorka ${n}`,
        bio: "Ime, fotografija i predstavljanje biće dodati. Kvalifikacije i biografija još nisu dostavljene.",
      }));
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">INDIVIDUALNI TRENING · 60 MINUTA ZA VAS</p>
          <h1>
            Vaš tempo.
            <br />
            Vaš pokret.
            <br />
            <em>Vaše vreme.</em>
          </h1>
          <p className="lead">
            Prostor u kom je trening posvećen vama. Jedna instruktorka, pažljivo
            vođenje i punih sat vremena za vaš sledeći korak.
          </p>
          <Link className="button" href="/zakazivanje">
            Pronađi svoj termin <span>↗</span>
          </Link>
          <p className="micro">Bez žurbe. Bez grupe. Uz podršku.</p>
        </div>
        <div
          className="hero-art"
          role="img"
          aria-label="Apstraktna ilustracija ravnoteže i pokreta"
        >
          <span className="orbit one" />
          <span className="orbit two" />
          <span className="art-dot" />
          <span className="art-label">
            MALI KORACI.
            <br />
            DOBAR OSEĆAJ.
          </span>
          <div className="art-card">
            <span>✳</span> Samo vi i vaš napredak
            <small>Individualni pristup · 60 min</small>
          </div>
        </div>
      </section>
      <div className="ribbon">
        <span>Pokret koji vam prija</span>
        <b>✳</b>
        <span>Pažnja koja pravi razliku</span>
        <b>✳</b>
        <span>Vreme samo za vas</span>
      </div>
      <section id="pristup" className="section">
        <div className="section-heading">
          <p className="eyebrow">NAŠ PRISTUP</p>
          <h2>
            Dobar trening počinje
            <br />
            pažnjom prema vama.
          </h2>
          <p>
            Ovo je početni predlog predstavljanja studija. Stvarni program,
            pristup i detalji biće dodati pre otvaranja zakazivanja.
          </p>
        </div>
        <div className="grid three">
          {[
            [
              "01",
              "Jedan na jedan",
              "Individualni trening sa odabranom instruktorkom.",
            ],
            [
              "02",
              "Sat za vaš cilj",
              "Svaki termin traje 60 minuta, bez preklapanja.",
            ],
            [
              "03",
              "Jednostavan dogovor",
              "Izaberite instruktorku, datum i slobodan termin.",
            ],
          ].map(([n, t, p]) => (
            <article className="card" key={n}>
              <span className="number">{n} ↗</span>
              <h3>{t}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="tim" className="section tinted">
        <p className="eyebrow">VAŠA PODRŠKA</p>
        <h2>Upoznajte instruktorke.</h2>
        <div className="grid two">
          {trainers.map((trainer, index) => (
            <article className="trainer-card" key={trainer.id}>
              <div
                className={`portrait portrait-${(index % 2) + 1}`}
                aria-hidden="true"
              >
                ✳
              </div>
              <div>
                <small>
                  {connected ? "INSTRUKTORKA" : "PRIVREMENI PROFIL"}
                </small>
                <h3>{trainer.name}</h3>
                <p>{trainer.bio}</p>
                <Link
                  href={
                    connected
                      ? `/zakazivanje?trainer=${trainer.id}`
                      : "/zakazivanje"
                  }
                >
                  Pogledaj dostupnost ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section id="cenovnik" className="section grid two">
        <div>
          <p className="eyebrow">JASNO, OD PRVOG KORAKA</p>
          <h2>
            Individualni trening.
            <br />
            Lični prostor za napredak.
          </h2>
        </div>
        <article className="card price">
          <span>INDIVIDUALNI TRENING</span>
          <h3>60 minuta</h3>
          <p>
            Cenovnik je u pripremi. Cena će biti objavljena kada studio dostavi
            stvarne podatke.
          </p>
          <Link className="button" href="/zakazivanje">
            Pogledaj termine ↗
          </Link>
        </article>
      </section>
      <section id="kontakt" className="section tinted grid two">
        <div>
          <p className="eyebrow">TU SMO ZA VAŠ SLEDEĆI KORAK</p>
          <h2>Vidimo se na treningu.</h2>
          <p>
            Kontakt i adresa biće dodati.
            <br />
            Podaci o lokaciji još nisu dostavljeni.
          </p>
        </div>
        <div>
          <h3>Radno vreme</h3>
          <p>
            Radno vreme studija biće potvrđeno.
            <br />
            Dostupnost svake instruktorke proverite u kalendaru.
          </p>
          <small>Svi termini su po vremenu u Beogradu.</small>
        </div>
      </section>
    </>
  );
}
