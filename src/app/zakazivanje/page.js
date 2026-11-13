import Link from "next/link";
import { configured } from "@/lib/config";
import { query, rpc } from "@/lib/repositories/studio";
import { identity } from "@/lib/auth";
import { studioDate, displayTime, displayClock } from "@/lib/domain/booking";
import { book } from "@/lib/actions";
import Submit from "@/components/Submit";
import Setup from "@/components/Setup";
export default async function Booking({ searchParams }) {
  const p = await searchParams;
  if (!configured())
    return (
      <section className="section">
        <h1>Zakažite vreme za sebe.</h1>
        <Setup />
      </section>
    );
  const trainers = (await query("trainers")).filter((t) => t.active),
    selected = trainers.find((t) => t.id === p.trainer),
    date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || "") ? p.date : studioDate();
  const slots = selected
    ? await rpc("available_slots", { p_trainer: selected.id, p_date: date })
    : [];
  const chosen = slots.find((s) => s.starts_at === p.start),
    session = await identity();
  const base = `/zakazivanje?trainer=${selected?.id || ""}&date=${date}`,
    next = `${base}${chosen ? `&start=${encodeURIComponent(chosen.starts_at)}` : ""}`;
  return (
    <section className="section booking">
      <p className="eyebrow">MALI KORAK ZA SEBE</p>
      <h1>Zakažite svoj trening.</h1>
      <p>60 minuta · Individualno · Vremenska zona Beograd</p>
      <ol className="steps">
        <li>01 Instruktorka</li>
        <li>02 Datum i termin</li>
        <li>03 Potvrda</li>
      </ol>
      {p.message && (
        <div className="notice" role="status">
          {p.message}
        </div>
      )}
      <div className="grid two">
        <div className="card">
          <form className="stack">
            <label>
              Vaša instruktorka
              <select name="trainer" defaultValue={selected?.id || ""} required>
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
                defaultValue={date}
                min={studioDate()}
                required
              />
            </label>
            <Submit>Prikaži slobodne termine</Submit>
          </form>
          {selected && (
            <div className="availability">
              <h3>Slobodni termini</h3>
              {slots.length ? (
                <div className="slots">
                  {slots.map((s) => (
                    <Link
                      className={`slot ${chosen?.starts_at === s.starts_at ? "selected" : ""}`}
                      key={s.starts_at}
                      href={`${base}&start=${encodeURIComponent(s.starts_at)}`}
                    >
                      {displayClock(s.starts_at)}
                    </Link>
                  ))}
                </div>
              ) : (
                <p role="status">
                  Nema slobodnih termina za izabrani datum. Pokušajte drugi
                  datum ili instruktorku.
                </p>
              )}
            </div>
          )}
          {!trainers.length && (
            <p>Nema aktivnih instruktorki. Studio treba da podesi raspored.</p>
          )}
        </div>
        <aside className="card summary">
          <p className="eyebrow">VAŠ TRENING</p>
          <h2>Vreme samo za vas.</h2>
          {chosen ? (
            <>
              <h3>{selected.name}</h3>
              <p>
                {displayTime(chosen.starts_at)}
                <br />
                Trajanje: 60 minuta
              </p>
              <p>Dostupnost se ponovo proverava pri potvrdi.</p>
              {session ? (
                <form action={book}>
                  <input type="hidden" name="trainer" value={selected.id} />
                  <input type="hidden" name="start" value={chosen.starts_at} />
                  <input type="hidden" name="next" value={next} />
                  <Submit>Potvrdi rezervaciju</Submit>
                </form>
              ) : (
                <Link
                  className="button"
                  href={`/prijava?next=${encodeURIComponent(next)}`}
                >
                  Prijavi se i nastavi ↗
                </Link>
              )}
            </>
          ) : (
            <p>
              Izaberite instruktorku i slobodan termin da pregledate
              rezervaciju.
            </p>
          )}
          <small>Budući termin možete otkazati do njegovog početka.</small>
        </aside>
      </div>
    </section>
  );
}
