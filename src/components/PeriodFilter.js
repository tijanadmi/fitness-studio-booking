"use client";
import { useRef, useState } from "react";
export default function PeriodFilter({
  basePath,
  date,
  view,
  trainers,
  trainer,
}) {
  const modeInput = useRef(null);
  const [pending, setPending] = useState(false);
  function submit(event, daily = false) {
    if (!event.currentTarget.validity.valid) return;
    if (daily && modeInput.current) modeInput.current.value = "day";
    event.currentTarget.form?.requestSubmit();
  }
  return (
    <form
      action={basePath}
      method="get"
      className="period-filter"
      aria-busy={pending}
      onSubmit={() => setPending(true)}
    >
      <input ref={modeInput} type="hidden" name="view" defaultValue={view} />
      <label>
        Izaberite dan
        <input
          name="date"
          type="date"
          required
          defaultValue={date}
          onChange={(event) => submit(event, true)}
        />
      </label>
      {trainers && (
        <label>
          Instruktorka
          <select name="trainer" defaultValue={trainer || ""} onChange={submit}>
            <option value="">Sve instruktorke</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Učitavanje…" : "Prikaži"}
      </button>
    </form>
  );
}
