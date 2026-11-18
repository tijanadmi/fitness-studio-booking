import Link from "next/link";
import { periodHref } from "@/lib/domain/period-links";
import {
  displayTime,
  statusLabels,
  canCancel,
  studioDate,
} from "@/lib/domain/booking";
import { buildTimetable } from "@/lib/domain/timetable";
import { changeStatus } from "@/lib/actions";
import Submit from "./Submit";
import "./admin-schedule.css";

function AppointmentDetails({ appointment, admin, returnTo, now }) {
  const cancellable = canCancel(appointment.starts_at, now);
  const ended = new Date(appointment.ends_at).getTime() <= now.getTime();
  return (
    <details className="timetable-event-details">
      <summary>Detalji{admin ? " i status" : ""}</summary>
      <p>{displayTime(appointment.starts_at)} · 60 min</p>
      {(appointment.profiles?.phone || appointment.guest_contact) && (
        <p>{appointment.profiles?.phone || appointment.guest_contact}</p>
      )}
      {admin && (cancellable || ended) && (
        <form action={changeStatus} className="stack">
          <input type="hidden" name="id" value={appointment.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <label>
            Status
            <select name="status">
              {cancellable && <option value="cancelled">Otkaži termin</option>}
              {ended && (
                <>
                  <option value="completed">Trening je završen</option>
                  <option value="no_show">Klijent nije došao/la</option>
                </>
              )}
            </select>
          </label>
          <Submit>Sačuvaj status</Submit>
        </form>
      )}
    </details>
  );
}
function History({ title, appointments, empty }) {
  return (
    <details className="schedule-history">
      <summary>
        {title}
        <span>{appointments.length}</span>
      </summary>
      {appointments.length ? (
        <div className="schedule-history-list">
          {appointments.map((a) => (
            <article key={a.id}>
              <div>
                <strong>
                  {a.profiles?.full_name || a.guest_name || "Klijent"}
                </strong>
                <p>
                  {displayTime(a.starts_at)} · {a.trainers?.name}
                </p>
              </div>
              <span className="badge">{statusLabels[a.status]}</span>
            </article>
          ))}
        </div>
      ) : (
        <p>{empty}</p>
      )}
    </details>
  );
}
export default function AdminSchedule({
  appointments,
  hours,
  days,
  trainers,
  trainerId = "",
  admin,
  returnTo,
  now,
}) {
  const { times, cells, booked, cancelled, finished } = buildTimetable(
    appointments,
    hours,
    days,
  );
  const activeTrainers = trainers.filter((t) =>
    booked.some((a) => a.trainer_id === t.id),
  );
  const today = studioDate();
  const tone = (id) =>
    Math.max(
      0,
      trainers.findIndex((t) => t.id === id),
    ) % 4;
  return (
    <div className="studio-schedule">
      <div className="timetable-toolbar">
        <div>
          <h2>{days.length === 1 ? "Dnevni raspored" : "Nedeljni raspored"}</h2>
          <p>
            {days[0].toFormat("dd.MM.yyyy.")}
            {days.length > 1 && " – " + days.at(-1).toFormat("dd.MM.yyyy.")} ·
            Beogradsko vreme
          </p>
        </div>
        <span className="timetable-count">
          Zakazani termini: {booked.length}
        </span>
      </div>
      {!!activeTrainers.length && (
        <ul className="timetable-legend" aria-label="Instruktorke u rasporedu">
          {activeTrainers.map((t) => (
            <li key={t.id}>
              <span className={"trainer-dot trainer-tone-" + tone(t.id)} />
              {t.name}
            </li>
          ))}
        </ul>
      )}
      {!booked.length && (
        <div className="timetable-empty" role="status">
          Nema zakazanih termina za izabrani period i filter.
        </div>
      )}
      <div
        className="timetable-scroll"
        tabIndex={0}
        role="region"
        aria-label="Raspored zakazanih treninga; na manjim ekranima pomerajte tabelu vodoravno"
      >
        <table
          className={
            "timetable " +
            (days.length > 1 ? "timetable-week" : "timetable-day")
          }
        >
          <caption className="sr-only">
            Dani u kolonama, vremena početka u redovima. Prikazani su samo
            zakazani termini.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="time-heading">
                Vreme
              </th>
              {days.map((day) => (
                <th
                  scope="col"
                  key={day.toISODate()}
                  className={
                    day.toISODate() === today
                      ? "is-today"
                      : day.weekday > 5
                        ? "is-weekend"
                        : ""
                  }
                >
                  <Link
                    className="timetable-day-link"
                    href={periodHref(
                      "/administracija",
                      day.toISODate(),
                      "day",
                      trainerId,
                    )}
                    aria-label={
                      "Prikaži raspored za " + day.toFormat("dd.MM.yyyy.")
                    }
                  >
                    <span className="timetable-weekday">
                      {day.setLocale("sr-Latn").toFormat("cccc")}
                    </span>
                    <span className="timetable-date">
                      {day.toFormat("dd.MM.")}
                      {day.toISODate() === today ? " · Danas" : ""}
                    </span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((time) => (
              <tr key={time}>
                <th scope="row" className="timetable-time">
                  {time}
                </th>
                {days.map((day) => {
                  const entries = cells.get(day.toISODate() + "|" + time) || [];
                  return (
                    <td
                      key={day.toISODate()}
                      className={day.weekday > 5 ? "is-weekend" : ""}
                    >
                      {entries.length ? (
                        <div className="timetable-events">
                          {entries.map((a) => (
                            <article
                              key={a.id}
                              className={
                                "timetable-event trainer-tone-" +
                                tone(a.trainer_id)
                              }
                            >
                              <strong className="timetable-client">
                                {a.profiles?.full_name ||
                                  a.guest_name ||
                                  "Klijent"}
                              </strong>
                              <span className="timetable-trainer">
                                {a.trainers?.name}
                              </span>
                              <AppointmentDetails
                                appointment={a}
                                admin={admin}
                                returnTo={returnTo}
                                now={now}
                              />
                            </article>
                          ))}
                        </div>
                      ) : (
                        <span
                          className="empty-cell"
                          aria-label="Nema zakazanih termina"
                        >
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="timetable-hint">
        Tabela prikazuje rezervacije. Slobodne termine proverite u toku
        zakazivanja.
      </p>
      <History
        title="Otkazani termini"
        appointments={cancelled}
        empty="Nema otkazanih termina u izabranom periodu."
      />
      <History
        title="Završeni treninzi i nedolasci"
        appointments={finished}
        empty="Nema završenih treninga ili nedolazaka u izabranom periodu."
      />
    </div>
  );
}
