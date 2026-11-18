import Link from "next/link";
import PeriodFilter from "./PeriodFilter";
import { periodHref } from "@/lib/domain/period-links";
import { studioDate } from "@/lib/domain/booking";
import "./period-controls.css";
export default function PeriodControls({
  basePath,
  selectedDate,
  view,
  trainers = null,
  trainer = "",
}) {
  const date = selectedDate.toISODate();
  const href = (target, mode = view) =>
    periodHref(basePath, target, mode, trainer);
  return (
    <div className="period-controls">
      <div className="period-control-top">
        <div
          className="period-view-switch"
          role="group"
          aria-label="Prikaz rasporeda"
        >
          <Link
            href={href(date, "day")}
            aria-current={view === "day" ? "page" : undefined}
          >
            Dan
          </Link>
          <Link
            href={href(date, "week")}
            aria-current={view === "week" ? "page" : undefined}
          >
            Nedelja
          </Link>
        </div>
        <PeriodFilter
          key={date + view + trainer}
          basePath={basePath}
          date={date}
          view={view}
          trainer={trainer}
          trainers={trainers?.map((t) => ({ id: t.id, name: t.name }))}
        />
      </div>
      <div className="period-navigation" aria-label="Izbor perioda">
        <Link
          href={href(
            selectedDate.minus({ days: view === "day" ? 1 : 7 }).toISODate(),
          )}
        >
          ← {view === "day" ? "Prethodni dan" : "Prethodna nedelja"}
        </Link>
        <Link href={href(studioDate())}>Danas</Link>
        <Link
          href={href(
            selectedDate.plus({ days: view === "day" ? 1 : 7 }).toISODate(),
          )}
        >
          {view === "day" ? "Sledeći dan" : "Sledeća nedelja"} →
        </Link>
      </div>
      <p className="period-help">
        Izbor datuma otvara dnevni prikaz. Za celu nedelju izaberite „Nedelja“.
      </p>
    </div>
  );
}
