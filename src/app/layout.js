import Link from "next/link";
import "./globals.css";
import { identity } from "@/lib/auth";
import { signOut } from "@/lib/actions";
export const metadata = {
  title: { default: "Studio · Individualni treninzi", template: "%s | Studio" },
  description: "Vreme za vas. Individualni treninzi i jednostavno zakazivanje.",
};
export default async function RootLayout({ children }) {
  const session = await identity();
  return (
    <html lang="sr-Latn" data-scroll-behavior="smooth">
      {/* Browser extensions may add attributes such as cz-shortcut-listen before hydration. */}
      <body suppressHydrationWarning>
        <a className="skip" href="#main">
          Pređi na sadržaj
        </a>
        <header>
          <Link className="brand" href="/">
            studio<span>✳</span>
            <small>PROSTOR ZA VAŠ POKRET</small>
          </Link>
          <nav aria-label="Glavna navigacija">
            <Link href="/#pristup">Naš pristup</Link>
            <Link href="/#tim">Instruktorke</Link>
            <Link href="/moji-termini">Moji termini</Link>
            {session?.profile.role !== "client" && session && (
              <Link href="/administracija">Raspored</Link>
            )}
            <Link className="button small" href="/zakazivanje">
              Zakaži trening ↗
            </Link>
            {session ? (
              <div className="user-menu">
                <span className="user-name">{session.profile.full_name}</span>
                <form action={signOut}>
                  <button className="text-button">Odjava</button>
                </form>
              </div>
            ) : (
              <Link href="/prijava">Prijava</Link>
            )}
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer>
          <Link className="brand" href="/">
            studio ✳
          </Link>
          <p>Manje žurbe. Više pokreta. Više vas.</p>
          <small>Privremeni naziv i sadržaj · Europe/Belgrade</small>
        </footer>
      </body>
    </html>
  );
}
