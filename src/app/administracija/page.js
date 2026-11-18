import { requireIdentity } from "@/lib/auth";
import { configured } from "@/lib/config";
import { query, rpc, schedule } from "@/lib/repositories/studio";
import { displayTime } from "@/lib/domain/booking";
import { adminChange } from "@/lib/actions";
import Submit from "@/components/Submit";
import Setup from "@/components/Setup";
import PeriodControls from "@/components/PeriodControls";
import { periodHref } from "@/lib/domain/period-links";
import AdminSchedule from "@/components/AdminSchedule";
import { schedulePeriod } from "@/lib/domain/timetable";
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
      <section className="section admin-page">
        <Setup />
      </section>
    );
  const { client, profile } = await requireIdentity("/administracija", [
      "admin",
      "trainer",
    ]),
    p = await searchParams,
    admin = profile.role === "admin";
  const trainers = await query("trainers");
  const { selectedDate, view, start, end, days } = schedulePeriod(
    p.date,
    p.view,
  );

  const selectedTrainer = trainers.some((t) => t.id === p.trainer)
    ? p.trainer
    : null;
  const appointments = await schedule(
    client,
    start.toISO(),
    end.toISO(),
    selectedTrainer,
  );
  const hours = await query("working_hours"),
    off = admin ? await query("time_off") : [],
    clients = admin ? await query("profiles") : [];
  const slots =
    admin && selectedTrainer
      ? await rpc("available_slots", {
          p_trainer: selectedTrainer,
          p_date: selectedDate.toISODate(),
        })
      : [];
  const returnTo = periodHref(
    "/administracija",
    selectedDate.toISODate(),
    view,
    selectedTrainer,
  );
  return (
    <section className="section admin-page">
      <p className="eyebrow">{admin ? "ADMINISTRACIJA" : "MOJ RASPORED"}</p>
      <h1>Pregled studija</h1>
      {p.message && (
        <div className="notice" role="status">
          {p.message}
        </div>
      )}
      <PeriodControls
        basePath="/administracija"
        selectedDate={selectedDate}
        view={view}
        trainers={trainers}
        trainer={selectedTrainer || ""}
      />
      <AdminSchedule
        appointments={appointments}
        hours={hours.filter(
          (w) => !selectedTrainer || w.trainer_id === selectedTrainer,
        )}
        days={days}
        trainers={trainers}
        admin={admin}
        returnTo={returnTo}
        now={new Date()}
        trainerId={selectedTrainer || ""}
      />

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
                <input
                  type="hidden"
                  name="trainer"
                  value={selectedTrainer || ""}
                />
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
