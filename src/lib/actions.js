"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase/server";
import { requireIdentity } from "./auth";
import { rpc, updateAppointmentStatus } from "./repositories/studio";
import { safeNext } from "./domain/booking";
import { authErrorMessage } from "./domain/auth-errors";
function value(form, key) {
  return String(form.get(key) || "").trim();
}
function back(path, message) {
  redirect(
    `${path}${path.includes("?") ? "&" : "?"}message=${encodeURIComponent(message)}`,
  );
}
export async function authenticate(form) {
  const mode = value(form, "mode"),
    next = safeNext(value(form, "next")),
    client = await db();
  const email = value(form, "email"),
    password = String(form.get("password") || "");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let result;
  if (mode === "register") {
    const full_name = value(form, "full_name");
    if (full_name.length < 2)
      back("/prijava?mode=register", "Unesite ime i prezime.");
    result = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone: value(form, "phone") },
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  } else if (mode === "reset")
    result = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/nova-lozinka`,
    });
  else if (mode === "update") {
    await requireIdentity("/nova-lozinka");
    result = await client.auth.updateUser({ password });
  } else result = await client.auth.signInWithPassword({ email, password });
  if (result.error)
    back(
      `/prijava?mode=${mode}&next=${encodeURIComponent(next)}`,
      authErrorMessage(result.error),
    );
  if (mode === "register" || mode === "reset")
    back(
      `/prijava?next=${encodeURIComponent(next)}`,
      "Proverite email za dalja uputstva. Ako nalog postoji, dobićete odgovarajuću poruku.",
    );
  redirect(mode === "update" ? "/moji-termini" : next);
}
export async function signOut() {
  const client = await db();
  await client.auth.signOut();
  redirect("/");
}
export async function book(form) {
  const next = safeNext(value(form, "next"));
  await requireIdentity(next);
  let message;
  try {
    await rpc("book_appointment", {
      p_trainer: value(form, "trainer"),
      p_start: value(form, "start"),
    });
  } catch (e) {
    message = e.message;
  }
  if (message) back(next, message);
  revalidatePath("/moji-termini");
  redirect("/moji-termini?message=Trening%20je%20zakazan.");
}
export async function changeStatus(form) {
  const session = await requireIdentity(),
    path =
      session.profile.role === "admin" ? "/administracija" : "/moji-termini";
  const status = value(form, "status");
  if (status !== "cancelled" && session.profile.role !== "admin")
    back(path, "Nemate dozvolu.");
  const { error } = await updateAppointmentStatus(
    session.client,
    value(form, "id"),
    status,
  );
  if (error)
    back(
      path,
      error.message.includes("RULE:")
        ? error.message.split("RULE:")[1]
        : "Izmena nije uspela.",
    );
  revalidatePath(path);
  back(path, "Status je ažuriran.");
}
export async function adminChange(form) {
  const { client } = await requireIdentity("/administracija", ["admin"]);
  const operation = value(form, "operation");
  let error;
  if (operation === "hours")
    ({ error } = await client.from("working_hours").insert({
      trainer_id: value(form, "trainer"),
      weekday: Number(value(form, "weekday")),
      start_time: value(form, "from"),
      end_time: value(form, "to"),
    }));
  else if (operation === "off") {
    const { DateTime } = await import("luxon");
    const parse = (k) => {
      const raw = value(form, k),
        time = DateTime.fromISO(raw, { zone: "Europe/Belgrade" });
      if (
        !time.isValid ||
        time.toFormat("yyyy-MM-dd'T'HH:mm") !== raw ||
        time.getPossibleOffsets().length > 1
      )
        return null;
      return time.toISO();
    };
    const from = parse("from"),
      to = parse("to");
    if (!from || !to)
      back(
        "/administracija",
        "Vreme ne postoji ili je dvosmisleno zbog promene računanja vremena. Izaberite jasnu granicu odsustva.",
      );
    ({ error } = await client.from("time_off").insert({
      trainer_id: value(form, "trainer"),
      starts_at: from,
      ends_at: to,
      reason: value(form, "reason"),
    }));
  } else if (operation === "delete-hours" || operation === "delete-off")
    ({ error } = await client
      .from(operation === "delete-hours" ? "working_hours" : "time_off")
      .delete()
      .eq("id", value(form, "id")));
  else if (operation === "trainer")
    ({ error } = await client.from("trainers").upsert({
      ...(value(form, "id") ? { id: value(form, "id") } : {}),
      name: value(form, "name"),
      bio: value(form, "bio"),
      profile_id: value(form, "profile_id") || null,
      active: form.get("active") === "on",
    }));
  else if (operation === "manual") {
    try {
      await rpc("book_appointment", {
        p_trainer: value(form, "trainer"),
        p_start: value(form, "start"),
        p_client: value(form, "client") || null,
        p_guest: value(form, "guest") || null,
        p_contact: value(form, "contact") || null,
      });
    } catch (e) {
      error = { message: e.message };
    }
  } else back("/administracija", "Neispravan zahtev.");
  revalidatePath("/administracija");
  back(
    "/administracija",
    error
      ? error.message.includes("RULE:")
        ? error.message.split("RULE:")[1]
        : `Izmena nije uspela. Proverite preklapanja i podatke. ${operation === "manual" ? error.message : ""}`
      : "Promene su sačuvane.",
  );
}
