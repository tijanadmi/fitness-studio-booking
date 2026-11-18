"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "./site-header.css";

export default function SiteHeader({ children, userName = "" }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState({ path: pathname, open: false });
  const expanded = menu.path === pathname && menu.open;
  const headerRef = useRef(null);
  const toggleRef = useRef(null);
  function close() {
    setMenu({ path: pathname, open: false });
  }
  useEffect(() => {
    if (!expanded) return;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setMenu({ path: pathname, open: false });
        toggleRef.current?.focus();
      }
    }
    function onPointerDown(event) {
      if (!headerRef.current?.contains(event.target))
        setMenu({ path: pathname, open: false });
    }
    const desktop = window.matchMedia("(min-width: 901px)");
    function onResize(event) {
      if (event.matches) setMenu({ path: pathname, open: false });
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onResize);
    };
  }, [expanded, pathname]);
  return (
    <header className="site-header" ref={headerRef}>
      <div className="site-header-inner">
        <Link className="brand" href="/" onClick={close}>
          studio<span>✳</span>
          <small>PROSTOR ZA VAŠ POKRET</small>
        </Link>
        {userName && <span className="header-user-name">{userName}</span>}
        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={expanded}
          aria-controls="site-navigation"
          aria-label={expanded ? "Zatvori meni" : "Otvori meni"}
          onClick={() => setMenu({ path: pathname, open: !expanded })}
        >
          <span className="menu-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <nav
          id="site-navigation"
          className={"site-navigation" + (expanded ? " is-open" : "")}
          aria-label="Glavna navigacija"
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a"))
              close();
          }}
          onSubmit={close}
        >
          {children}
        </nav>
      </div>
    </header>
  );
}
