import { DateTime } from "luxon";
import { requireIdentity } from "@/lib/auth";
import { configured } from "@/lib/config";
import { query, rpc, schedule } from "@/lib/repositories/studio";
import {
  displayClock,
  displayTime,
  studioDate,
  statusLabels,
} from "@/lib/domain/booking";
import { adminChange, changeStatus } from "@/lib/actions";
import Submit from "@/components/Submit";
import Setup from "@/components/Setup";
function TrainerSelect({ trainers }) {
  return (
    <label>
      Instruktorka
      <select name="trainer" required>
        {trainers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export default async function Admin({ searchParams }) {
  if (!configured())
    return (
      <section className="section">
        <Setup />
      </section>
    );
  const { client, profile } = await requireIdentity("/administracija", [
      "admin",
      "trainer",
    ]),
    p = await searchParams,
    admin = profile.role === "admin";
  const trainers = await query("trainers"),
    date = DateTime.fromISO(p.date || studioDate(), {
      zone: "Europe/Belgrade",
    }),
    start = date.isValid
      ? date.startOf("day")
      : DateTime.now().setZone("Europe/Belgrade").startOf("day"),
    end = start.plus({ days: p.view === "week" ? 7 : 1 });
  const selectedTrainer = trainers.some((t) => t.id === p.trainer)
    ? p.trainer
    : null;
  const appointments = await schedule(
    client,
    start.toISO(),
    end.toISO(),
    selectedTrainer,
  );
  const hours = admin ? await query("working_hours") : [],
    off = admin ? await query("time_off") : [],
    clients = admin ? await query("profiles") : [];
  const slots =
    admin && p.trainer
      ? await rpc("available_slots", {
          p_trainer: p.trainer,
          p_date: start.toISODate(),
        })
      : [];
  return (
    <section className="section">
      <p className="eyebrow">{admin ? "ADMINISTRACIJA" : "MOJ RASPORED"}</p>
      <h1>Pregled studija</h1>
      {p.message && (
        <div className="notice" role="status">
          {p.message}
        </div>
      )}
      <form className="filter">
        <label>
          Od datuma
          <input
            type="date"
            name="date"
            defaultValue={start.toISODate()}
            required
          />
        </label>
        <label>
          Prikaz
          <select name="view" defaultValue={p.view || "day"}>
            <option value="day">Dan</option>
            <option value="week">Sedam dana</option>
          </select>
        </label>
        <label>
          Instruktorka
          <select name="trainer" defaultValue={p.trainer || ""}>
            <option value="">Sve dostupne</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <Submit>Prikaži</Submit>
      </form>
      <div className="schedule">
        {Array.from({ length: p.view === "week" ? 7 : 1 }, (_, i) =>
          start.plus({ days: i }),
        ).map((day) => (
          <section className="day" key={day.toISODate()}>
            <h3>{day.toFormat("dd.MM.yyyy.")}</h3>
            {appointments
              .filter(
                (a) =>
                  DateTime.fromISO(a.starts_at)
                    .setZone("Europe/Belgrade")
                    .toISODate() === day.toISODate(),
              )
              .map((a) => (
                <article className="schedule-item" key={a.id}>
                  <strong>
                    {displayClock(a.starts_at)} · {a.trainers.name}
                  </strong>
                  <p>
                    {a.profiles?.full_name || a.guest_name}
                    <br />
                    {a.profiles?.phone || a.guest_contact}
                  </p>
                  <span className="badge">{statusLabels[a.status]}</span>
                  {admin && a.status === "booked" && (
                    <form action={changeStatus} className="stack">
                      <input type="hidden" name="id" value={a.id} />
                      <label>
                        Status
                        <select name="status">
                          <option value="cancelled">Otkaži</option>
                          <option value="completed">Završen</option>
                          <option value="no_show">Nije došao/la</option>
                        </select>
                      </label>
                      <Submit>Sačuvaj</Submit>
                    </form>
                  )}
                </article>
              ))}
            {!appointments.some(
              (a) =>
                DateTime.fromISO(a.starts_at)
                  .setZone("Europe/Belgrade")
                  .toISODate() === day.toISODate(),
            ) && <p>Nema rezervacija.</p>}
          </section>
        ))}
      </div>
      {admin && (
        <>
          <h2 className="admin-heading">Upravljanje</h2>
          <div className="grid two">
            <article className="card">
              <h3>Ručna / telefonska rezervacija</h3>
              <p>
                Izaberite instruktorku i datum u filteru iznad da učitate
                slobodne termine. Popunite ili nalog ili ime gosta.
              </p>
              <form action={adminChange} className="stack">
                <input type="hidden" name="operation" value="manual" />
                <input type="hidden" name="trainer" value={p.trainer || ""} />
                <label>
                  Slobodan termin
                  <select name="start" required>
                    <option value="">Izaberite termin</option>
                    {slots.map((s) => (
                      <option value={s.starts_at} key={s.starts_at}>
                        {displayTime(s.starts_at)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Korisnički nalog
                  <select name="client">
                    <option value="">Osoba bez naloga</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Ime gosta
                  <input name="guest" minLength={2} maxLength={120} />
                </label>
                <label>
                  Kontakt gosta (opciono)
                  <input name="contact" maxLength={100} />
                </label>
                <Submit>Zakaži trening</Submit>
              </form>
            </article>
            <article className="card">
              <h3>Nedeljno radno vreme</h3>
              <p>
                Pauzu koja se ponavlja unesite kao razmak između radnih
                intervala. Za izmenu uklonite interval pa dodajte novi.
                Konfliktne izmene se odbijaju.
              </p>
              <form action={adminChange} className="stack">
                <input type="hidden" name="operation" value="hours" />
                <TrainerSelect trainers={trainers} />
                <label>
                  Dan
                  <select name="weekday">
                    {[
                      "Ponedeljak",
                      "Utorak",
                      "Sreda",
                      "Četvrtak",
                      "Petak",
                      "Subota",
                      "Nedelja",
                    ].map((d, i) => (
                      <option key={d} value={i + 1}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Od
                  <input type="time" name="from" required />
                </label>
                <label>
                  Do
                  <input type="time" name="to" required />
                </label>
                <Submit>Dodaj interval</Submit>
              </form>
              <div className="records">
                {hours
                  .sort((a, b) => a.weekday - b.weekday)
                  .map((w) => (
                    <form action={adminChange} key={w.id}>
                      <span>
                        {trainers.find((t) => t.id === w.trainer_id)?.name} ·{" "}
                        {
                          ["", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"][
                            w.weekday
                          ]
                        }{" "}
                        {w.start_time.slice(0, 5)}–{w.end_time.slice(0, 5)}
                      </span>
                      <input
                        type="hidden"
                        name="operation"
                        value="delete-hours"
                      />
                      <input type="hidden" name="id" value={w.id} />
                      <button className="text-button">Ukloni</button>
                    </form>
                  ))}
              </div>
            </article>
            <article className="card">
              <h3>Pauza, odsustvo ili neradni dan</h3>
              <p>
                Vremena unesite po vremenu u Beogradu. Za ceo dan izaberite od
                ponoći do ponoći sledećeg dana.
              </p>
              <form action={adminChange} className="stack">
                <input type="hidden" name="operation" value="off" />
                <TrainerSelect trainers={trainers} />
                <label>
                  Početak
                  <input name="from" type="datetime-local" required />
                </label>
                <label>
                  Kraj
                  <input name="to" type="datetime-local" required />
                </label>
                <label>
                  Razlog
                  <input name="reason" required maxLength={120} />
                </label>
                <Submit>Sačuvaj odsustvo</Submit>
              </form>
              <div className="records">
                {off.map((o) => (
                  <form action={adminChange} key={o.id}>
                    <span>
                      {trainers.find((t) => t.id === o.trainer_id)?.name} ·{" "}
                      {o.reason}
                      <br />
                      {displayTime(o.starts_at)} – {displayTime(o.ends_at)}
                    </span>
                    <input type="hidden" name="operation" value="delete-off" />
                    <input type="hidden" name="id" value={o.id} />
                    <button className="text-button">Ukloni</button>
                  </form>
                ))}
              </div>
            </article>
            <article className="card">
              <h3>Instruktorke</h3>
              <p>
                Povežite profil koji već ima ulogu trainer. Uloge dodeljuje
                vlasnik kroz bazu, prema README-u.
              </p>
              {[...trainers, { id: "", name: "", bio: "", active: true }].map(
                (t) => (
                  <form
                    action={adminChange}
                    className="stack trainer-form"
                    key={t.id}
                  >
                    <h4>{t.id ? "Izmeni profil" : "Nova instruktorka"}</h4>
                    <input type="hidden" name="operation" value="trainer" />
                    <input type="hidden" name="id" value={t.id} />
                    <label>
                      Ime
                      <input
                        name="name"
                        defaultValue={t.name}
                        required
                        minLength={2}
                        maxLength={120}
                      />
                    </label>
                    <label>
                      Predstavljanje
                      <textarea name="bio" defaultValue={t.bio} />
                    </label>
                    <label>
                      Povezan profil
                      <select
                        name="profile_id"
                        defaultValue={t.profile_id || ""}
                      >
                        <option value="">Bez pristupa nalogom</option>
                        {clients
                          .filter(
                            (c) => c.role === "trainer" || c.role === "admin",
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.full_name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={t.active}
                      />{" "}
                      Aktivna
                    </label>
                    <Submit>Sačuvaj instruktorku</Submit>
                  </form>
                ),
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
}
