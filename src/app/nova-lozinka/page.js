import { requireIdentity } from "@/lib/auth";
import { authenticate } from "@/lib/actions";
import Submit from "@/components/Submit";
export default async function Password() {
  await requireIdentity("/nova-lozinka");
  return (
    <section className="section narrow">
      <h1>Postavite novu lozinku</h1>
      <form action={authenticate} className="stack">
        <input type="hidden" name="mode" value="update" />
        <label>
          Nova lozinka
          <input
            type="password"
            name="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>
        <Submit>Sačuvaj lozinku</Submit>
      </form>
    </section>
  );
}
