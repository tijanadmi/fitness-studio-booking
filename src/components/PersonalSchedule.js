import Link from "next/link";
import { personalSchedule } from "@/lib/domain/personal-schedule";
import { periodHref } from "@/lib/domain/period-links";
import {
  displayClock,
  displayTime,
  statusLabels,
  canCancel,
  studioDate,
} from "@/lib/domain/booking";
import { changeStatus } from "@/lib/actions";
import Submit from "./Submit";
import "./personal-schedule.css";
function SessionCard({ appointment, returnTo, now }) {
  return (
    <article className={"my-session my-session-" + appointment.status}>
      <div className="my-session-time">
        <strong>{displayClock(appointment.starts_at)}</strong>
        <span>60 minuta</span>
      </div>
      <div className="my-session-info">
        <span className="my-session-label">INDIVIDUALNI TRENING</span>
        <h3>{appointment.trainers?.name || "Instruktorka"}</h3>
        <span className={"my-status my-status-" + appointment.status}>
          {statusLabels[appointment.status]}
        </span>
      </div>
      {appointment.status === "booked" &&
        canCancel(appointment.starts_at, now) && (
          <form action={changeStatus}>
            <input type="hidden" name="id" value={appointment.id} />
            <input type="hidden" name="status" value="cancelled" />
            <input type="hidden" name="return_to" value={returnTo} />
            <Submit>Otkaži termin</Submit>
          </form>
        )}
    </article>
  );
}
export default function PersonalSchedule({
  appointments,
  days,
  view,
  returnTo,
  now,
}) {
  const { grouped, cancelled, scheduled } = personalSchedule(
    appointments,
    days,
  );
  const today = studioDate();
  return (
    <section className="personal-schedule">
      <div className="my-schedule-heading">
        <div>
          <h2>
            {view === "day"
              ? days[0].setLocale("sr-Latn").toFormat("cccc, dd.MM.yyyy.")
              : "Moja nedelja"}
          </h2>
          {view === "week" && (
            <p>
              {days[0].toFormat("dd.MM.yyyy.")} –{" "}
              {days.at(-1).toFormat("dd.MM.yyyy.")}
            </p>
          )}
        </div>
        <span className="my-period-count">
          Treninzi u periodu: {scheduled.length}
        </span>
      </div>
      {!scheduled.length && (
        <p className="my-empty-period" role="status">
          Nemate treninga za izabrani {view === "day" ? "dan" : "period"}.
          Izaberite drugi datum ili zakažite novi trening.
        </p>
      )}
      {view === "week" ? (
        <div className="my-week-grid">
          {days.map((day) => {
            const entries = grouped.get(day.toISODate()) || [];
            return (
              <section
                className={
                  "my-day " + (day.toISODate() === today ? "my-day-today" : "")
                }
                key={day.toISODate()}
              >
                <Link
                  className="my-day-heading"
                  href={periodHref("/moji-termini", day.toISODate(), "day")}
                  aria-label={
                    "Prikaži termine za " + day.toFormat("dd.MM.yyyy.")
                  }
                >
                  <span>{day.setLocale("sr-Latn").toFormat("cccc")}</span>
                  <strong>{day.toFormat("dd.MM.")}</strong>
                  {day.toISODate() === today && <small>Danas</small>}
                </Link>
                <div className="my-day-sessions">
                  {entries.length ? (
                    entries.map((a) => (
                      <SessionCard
                        key={a.id}
                        appointment={a}
                        returnTo={returnTo}
                        now={now}
                      />
                    ))
                  ) : (
                    <p className="my-day-empty">Nema termina</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="my-daily-sessions">
          {scheduled.map((a) => (
            <SessionCard
              key={a.id}
              appointment={a}
              returnTo={returnTo}
              now={now}
            />
          ))}
        </div>
      )}
      <details className="my-cancelled">
        <summary>
          Otkazani termini <span>{cancelled.length}</span>
        </summary>
        {cancelled.length ? (
          <div>
            {cancelled.map((a) => (
              <article key={a.id}>
                <div>
                  <strong>{a.trainers?.name}</strong>
                  <p>{displayTime(a.starts_at)} · 60 minuta</p>
                </div>
                <span className="my-status my-status-cancelled">Otkazano</span>
              </article>
            ))}
          </div>
        ) : (
          <p>Nema otkazanih termina u izabranom periodu.</p>
        )}
      </details>
    </section>
  );
}
