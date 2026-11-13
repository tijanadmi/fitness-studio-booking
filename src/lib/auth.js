import "server-only";
import { redirect } from "next/navigation";
import { db } from "./supabase/server";
import { configured } from "./config";
export async function identity() {
  if (!configured()) return null;
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data: profile, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("Profil nije dostupan. Proverite migracije.");
  return { user, profile, client };
}
export async function requireIdentity(next = "/moji-termini", roles = null) {
  const session = await identity();
  if (!session) redirect(`/prijava?next=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(session.profile.role)) redirect("/moji-termini");
  return session;
}
