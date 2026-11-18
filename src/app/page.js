import Image from "next/image";
import Link from "next/link";
import { configured } from "@/lib/config";
import { query } from "@/lib/repositories/studio";
import { studioDate } from "@/lib/domain/booking";
import Submit from "@/components/Submit";

const approach = [
  {
    icon: "movement",
    title: "Pokret u vašem ritmu",
    description:
      "Individualni termin znači da je svih 60 minuta posvećeno samo vama.",
  },
  {
    icon: "balance",
    title: "Pažnja i podrška",
    description:
      "Izaberite instruktorku uz koju želite da napravite svoj sledeći korak.",
  },
  {
    icon: "focus",
    title: "Mesto u vašem danu",
    description:
      "Pronađite slobodan termin koji se uklapa u vaš svakodnevni ritam.",
  },
];

export default async function Home() {
  const connected = configured();
  const trainers = connected
    ? (await query("trainers")).filter((t) => t.active)
    : [1, 2].map((n) => ({
        id: String(n),
        name: "Instruktorka " + n,
        bio: "Privremeni profil. Ime, biografija i predstavljanje biće dodati.",
      }));
  const today = studioDate();
  return (
    <div className="studio-home">
      <section className="home-hero">
        <Image
          src="/images/templates/yogalax-hero.jpg"
          alt="Ilustrativna fotografija mirnog trenutka i pokreta na otvorenom"
          fill
          priority
          sizes="100vw"
          className="home-hero-image"
        />
        <div className="home-hero-wash" />
        <div className="home-hero-content">
          <p className="eyebrow">DOBRO DOŠLI U VAŠ PROSTOR ZA POKRET</p>
          <h1>
            Udahnite.
            <br />
            Pokrenite se.
            <br />
            <em>Posvetite se sebi.</em>
          </h1>
          <p className="lead">
            Malo više ravnoteže. Malo više energije. Punih 60 minuta uz
            instruktorku i pažnju posvećenu vama.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/zakazivanje">
              Zakaži trening <span aria-hidden="true">↗</span>
            </Link>
            <Link className="quiet-link" href="#pristup">
              Upoznajte naš pristup ↓
            </Link>
          </div>
          <div className="hero-details">
            <span>Individualni treninzi</span>
            <span>60 minuta</span>
            <span>Vaš tempo</span>
          </div>
        </div>
        <span className="hero-photo-note">
          Ilustrativna fotografija · Yogalax
        </span>
      </section>
      <section id="pristup" className="section home-about">
        <figure className="photo-collage">
          <div className="collage-tall">
            <Image
              src="/images/templates/zogin-sunset.jpg"
              alt="Ilustracija smirenosti: istezanje ruku ka zalasku sunca"
              fill
              sizes="(max-width: 600px) 46vw, 260px"
            />
          </div>
          <div className="collage-square">
            <Image
              src="/images/templates/zogin-movement.jpg"
              alt="Ilustrativna fotografija usmerenosti na disanje i pokret"
              fill
              sizes="(max-width: 600px) 42vw, 240px"
            />
          </div>
          <div className="collage-square">
            <Image
              src="/images/templates/zogin-balance.jpg"
              alt="Ilustrativna fotografija vežbe pokretljivosti na otvorenom"
              fill
              sizes="(max-width: 600px) 42vw, 240px"
            />
          </div>
          <figcaption>
            Inspiracija za pokret · fotografije iz Zogin template-a
          </figcaption>
        </figure>
        <div className="about-copy">
          <p className="eyebrow">MALI KORACI. DOBAR OSEĆAJ.</p>
          <h2>
            Pronađite ravnotežu.
            <br />
            <em>Sačuvajte vreme za sebe.</em>
          </h2>
          <p>
            Između obaveza i svakodnevice, napravite prostor za pokret.
            Individualni trening je prilika da usporite, usmerite pažnju i
            posvetite se svom cilju.
          </p>
          <p>
            Jedna instruktorka. Jedan termin. Vaših 60 minuta, bez grupe i bez
            žurbe.
          </p>
          <ul className="approach-list">
            <li>Samostalno birate instruktorku i datum</li>
            <li>Vidite samo slobodne termine</li>
            <li>Rezervacijom upravljate iz svog naloga</li>
          </ul>
          <Link className="quiet-link" href="#prvi-korak">
            Pronađite svoj prvi termin →
          </Link>
          <small className="placeholder-note">
            Predlog predstavljanja · stvarni program i detalji studija biće
            dopunjeni.
          </small>
        </div>
      </section>
      <section className="section home-benefits">
        <div className="center-heading">
          <p className="eyebrow">JEDNOSTAVNO, LIČNO, VAŠE</p>
          <h2>
            Više prostora za <em>vas.</em>
          </h2>
          <p>Trening počinje vremenom koje odvojite za sebe.</p>
        </div>
        <div className="grid three">
          {approach.map((item) => (
            <article className="benefit-item" key={item.icon}>
              <Image
                src={"/icons/templates/" + item.icon + ".png"}
                alt=""
                width={80}
                height={72}
              />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="tim" className="section home-team">
        <div className="section-topline">
          <div>
            <p className="eyebrow">ZAJEDNO DO VAŠEG SLEDEĆEG KORAKA</p>
            <h2>
              Vaša podrška.
              <br />
              <em>Naše instruktorke.</em>
            </h2>
          </div>
          <p>
            Upoznajte instruktorke i izaberite kome želite da poverite svojih
            sat vremena.
          </p>
        </div>
        <div className="grid two">
          {trainers.map((trainer, index) => (
            <article className="team-profile" key={trainer.id}>
              {index < 2 ? (
                <figure className="team-profile-photo">
                  <div className="team-photo-frame">
                    <Image
                      src={
                        index === 0
                          ? "/images/templates/instructor-2.jpg"
                          : "/images/templates/instructor-4.jpg"
                      }
                      alt="Privremena ilustrativna fotografija instruktorke iz Zogin template-a"
                      fill
                      sizes="(max-width: 600px) 84px, (max-width: 1100px) 130px, 135px"
                    />
                  </div>
                  <figcaption>Privremena fotografija</figcaption>
                </figure>
              ) : (
                <div className="team-profile-mark" aria-hidden="true">
                  <Image
                    src="/icons/templates/balance.png"
                    alt=""
                    width={90}
                    height={82}
                  />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
              )}

              <div>
                <small>
                  {connected ? "INDIVIDUALNI TRENING" : "PRIVREMENI PROFIL"}
                </small>
                <h3>{trainer.name}</h3>
                <p>{trainer.bio}</p>
                <Link
                  className="quiet-link"
                  href={
                    connected
                      ? "/zakazivanje?trainer=" + trainer.id
                      : "/zakazivanje"
                  }
                >
                  Pogledaj dostupnost ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
        {!trainers.length && <p>Predstavljanje instruktorki je u pripremi.</p>}
      </section>
      <section className="home-pause">
        <Image
          src="/images/templates/zogin-seaside.jpg"
          alt="Ilustrativna fotografija pokreta uz more"
          fill
          sizes="100vw"
        />
        <div className="pause-wash" />
        <div className="pause-copy">
          <p className="eyebrow">UDAH. POKRET. NOVI POČETAK.</p>
          <h2>
            Ne morate da promenite ceo dan.
            <br />
            <em>Počnite jednim satom.</em>
          </h2>
          <Link className="button light-button" href="/zakazivanje">
            Odvojite vreme za sebe ↗
          </Link>
        </div>
        <small className="banner-caption">
          Ilustrativna fotografija · Zogin
        </small>
      </section>
      <section id="prvi-korak" className="section first-step">
        <div>
          <p className="eyebrow">VAŠ PRVI KORAK</p>
          <h2>
            Hajde da pronađemo
            <br />
            <em>vaš termin.</em>
          </h2>
          <p>
            Odaberite instruktorku i datum. U sledećem koraku prikazaćemo
            slobodne termine, a rezervaciju potvrđujete nakon prijave.
          </p>
          <div className="booking-path">
            <span>
              <b>01</b> Izaberite
            </span>
            <span>
              <b>02</b> Pregledajte
            </span>
            <span>
              <b>03</b> Potvrdite
            </span>
          </div>
        </div>
        <div className="first-step-form">
          <span className="form-kicker">60 MINUTA POSVEĆENIH VAMA</span>
          <h3>Pronađite slobodan termin</h3>
          {connected && trainers.length ? (
            <form
              action="/zakazivanje"
              method="get"
              className="home-booking-form"
            >
              <label>
                Instruktorka
                <select name="trainer" required defaultValue="">
                  <option value="" disabled>
                    Izaberite instruktorku
                  </option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Datum
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={today}
                  min={today}
                />
              </label>
              <Submit>Prikaži slobodne termine ↗</Submit>
              <p className="form-note">
                Pregled dostupnosti je moguć i bez naloga.
              </p>
            </form>
          ) : (
            <>
              <p>
                Zakazivanje će biti dostupno kada studio podesi instruktorke i
                raspored.
              </p>
              <Link className="button" href="/zakazivanje">
                Otvori zakazivanje ↗
              </Link>
            </>
          )}
        </div>
      </section>
      <section id="cenovnik" className="section home-pricing">
        <div>
          <p className="eyebrow">JASNO, OD PRVOG KORAKA</p>
          <h2>
            Jedan termin.
            <br />
            <em>Vaš lični prostor.</em>
          </h2>
          <p>Bez grupnih treninga. Bez deljenja pažnje.</p>
        </div>
        <article className="home-price-card">
          <div>
            <span>INDIVIDUALNI TRENING</span>
            <h3>
              60 <small>minuta</small>
            </h3>
          </div>
          <div>
            <p>
              Cenovnik je u pripremi. Cena će biti dodata kada studio dostavi
              stvarne podatke.
            </p>
            <Link className="quiet-link" href="/zakazivanje">
              Pogledaj termine ↗
            </Link>
          </div>
        </article>
      </section>
      <section id="kontakt" className="section home-contact">
        <div>
          <p className="eyebrow">RADUJEMO SE SUSRETU</p>
          <h2>
            Vidimo se <em>na treningu.</em>
          </h2>
          <p>
            Stvarna adresa i kontakt studija biće dodati.
            <br />
            Do tada, svoj sledeći korak možete započeti u kalendaru.
          </p>
          <Link className="quiet-link" href="/zakazivanje">
            Otvori kalendar ↗
          </Link>
        </div>
        <div className="contact-details">
          <div>
            <span>01 / GDE SMO</span>
            <p>Adresa je u pripremi</p>
          </div>
          <div>
            <span>02 / KADA SMO TU</span>
            <p>Po rasporedu izabrane instruktorke</p>
            <small>Svi termini su po vremenu u Beogradu.</small>
          </div>
          <div>
            <span>03 / KONTAKT</span>
            <p>Telefon i email biće dodati</p>
          </div>
        </div>
      </section>
    </div>
  );
}
