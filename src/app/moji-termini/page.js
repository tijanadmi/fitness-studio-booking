import { ownAppointments } from "@/lib/repositories/studio";
import { requireIdentity } from "@/lib/auth";
import { configured } from "@/lib/config";
import { schedulePeriod } from "@/lib/domain/timetable";
import { periodHref } from "@/lib/domain/period-links";
import PeriodControls from "@/components/PeriodControls";
import PersonalSchedule from "@/components/PersonalSchedule";
import Setup from "@/components/Setup";
import Link from "next/link";
export default async function Appointments({ searchParams }) {
  if (!configured())
    return (
      <section className="section">
        <Setup />
      </section>
    );
  const p = await searchParams;
  const { selectedDate, view, start, end, days } = schedulePeriod(
    p.date,
    p.view,
  );
  const returnTo = periodHref("/moji-termini", selectedDate.toISODate(), view);
  const { user, client } = await requireIdentity(returnTo);
  const data = await ownAppointments(
    client,
    user.id,
    start.toISO(),
    end.toISO(),
  );
  return (
    <section className="section my-appointments-page">
      <div className="my-page-heading">
        <div>
          <p className="eyebrow">VREME KOJE ČUVATE ZA SEBE</p>
          <h1>Moji termini</h1>
        </div>
        <Link className="button" href="/zakazivanje">
          Zakaži novi trening ↗
        </Link>
      </div>
      {p.message && (
        <p className="notice" role="status">
          {p.message}
        </p>
      )}
      <PeriodControls
        basePath="/moji-termini"
        selectedDate={selectedDate}
        view={view}
      />
      <PersonalSchedule
        appointments={data}
        days={days}
        view={view}
        returnTo={returnTo}
        now={new Date()}
      />
    </section>
  );
}
