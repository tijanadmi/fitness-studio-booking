import Link from "next/link";
export default function NotFound() {
  return (
    <section className="section">
      <h1>Stranica nije pronađena.</h1>
      <Link href="/">Povratak na početnu</Link>
    </section>
  );
}
