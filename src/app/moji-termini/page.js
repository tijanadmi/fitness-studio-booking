import { ownAppointments } from "@/lib/repositories/studio";
import { requireIdentity } from "@/lib/auth";
import { configured } from "@/lib/config";
import { displayTime, canCancel, statusLabels } from "@/lib/domain/booking";
import { changeStatus } from "@/lib/actions";
import Submit from "@/components/Submit";
import Setup from "@/components/Setup";
import Link from "next/link";
export default async function Appointments({ searchParams }) {
  if (!configured())
    return (
      <section className="section">
        <Setup />
      </section>
    );
  const { user, client } = await requireIdentity();
  const data = await ownAppointments(client, user.id);
  const p = await searchParams;
  return (
    <section className="section">
      <p className="eyebrow">VAŠ RASPORED</p>
      <h1>Moji termini</h1>
      <Link className="button" href="/zakazivanje">
        Zakaži novi trening ↗
      </Link>
      {p.message && (
        <p className="notice" role="status">
          {p.message}
        </p>
      )}
      {["Budući", "Prethodni"].map((title, i) => {
        const rows = data.filter(
          (a) => new Date(a.starts_at) > new Date() === (i === 0),
        );
        return (
          <section className="appointment-group" key={title}>
            <h2>{title} termini</h2>
            {!rows.length ? (
              <p>Ovde još nema termina.</p>
            ) : (
              rows.map((a) => (
                <article className="appointment" key={a.id}>
                  <div>
                    <h3>{a.trainers.name}</h3>
                    <p>{displayTime(a.starts_at)} · 60 min</p>
                    <span className="badge">{statusLabels[a.status]}</span>
                  </div>
                  {a.status === "booked" && canCancel(a.starts_at) && (
                    <form action={changeStatus}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="status" value="cancelled" />
                      <Submit>Otkaži termin</Submit>
                    </form>
                  )}
                </article>
              ))
            )}
          </section>
        );
      })}
    </section>
  );
}
