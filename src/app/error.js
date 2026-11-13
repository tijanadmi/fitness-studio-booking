"use client";
export default function ErrorPage({ reset }) {
  return (
    <section className="section">
      <h1>Podaci trenutno nisu dostupni.</h1>
      <p>Proverite vezu i podešavanje Supabase-a, pa pokušajte ponovo.</p>
      <button onClick={reset}>Pokušaj ponovo</button>
    </section>
  );
}
