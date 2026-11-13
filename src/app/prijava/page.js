import Link from "next/link";
import { authenticate } from "@/lib/actions";
import { configured } from "@/lib/config";
import { safeNext } from "@/lib/domain/booking";
import Setup from "@/components/Setup";
import Submit from "@/components/Submit";
export default async function Login({ searchParams }) {
  const p = await searchParams,
    mode = ["register", "reset"].includes(p.mode) ? p.mode : "login",
    next = safeNext(p.next);
  return (
    <section className="section narrow">
      <p className="eyebrow">VAŠ PROSTOR</p>
      <h1>
        {mode === "register"
          ? "Dobro došli."
          : mode === "reset"
            ? "Nova lozinka."
            : "Drago nam je da ste tu."}
      </h1>
      {!configured() ? (
        <Setup />
      ) : (
        <>
          <p>
            {mode === "register"
              ? "Napravite nalog za zakazivanje."
              : mode === "reset"
                ? "Poslaćemo vam link za promenu lozinke."
                : "Prijavite se da potvrdite svoj termin."}
          </p>
          {p.message && (
            <div className="notice" role="status">
              {p.message}
            </div>
          )}
          <form action={authenticate} className="stack">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="next" value={next} />
            {mode === "register" && (
              <>
                <label>
                  Ime i prezime
                  <input
                    name="full_name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </label>
                <label>
                  Telefon (opciono)
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={50}
                  />
                </label>
              </>
            )}
            <label>
              Email adresa
              <input name="email" type="email" autoComplete="email" required />
            </label>
            {mode !== "reset" && (
              <label>
                Lozinka
                <input
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  minLength={8}
                  required
                />
              </label>
            )}
            <Submit>
              {mode === "register"
                ? "Napravi nalog"
                : mode === "reset"
                  ? "Pošalji link"
                  : "Prijavi se"}
            </Submit>
          </form>
          <div className="link-row">
            <Link
              href={`/prijava?mode=${mode === "register" ? "login" : "register"}&next=${encodeURIComponent(next)}`}
            >
              {mode === "register"
                ? "Već imate nalog? Prijava"
                : "Novi ste? Registracija"}
            </Link>
            <Link href={`/prijava?mode=reset&next=${encodeURIComponent(next)}`}>
              Zaboravljena lozinka
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
