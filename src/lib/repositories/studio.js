import "server-only";
import { db } from "../supabase/server";
/** @returns {Promise<Array<Record<string, any>>>} */
export async function query(table, select = "*") {
  const client = await db();
  const { data, error } = await client.from(table).select(select);
  if (error)
    throw new Error("Podaci nisu dostupni. Proverite podešavanje baze.");
  return /** @type {Array<Record<string, any>>} */ (
    /** @type {unknown} */ (data)
  );
}
export async function rpc(name, args) {
  const client = await db();
  const result = await client.rpc(name, args);
  if (result.error) {
    const code = result.error.code;
    throw new Error(
      code === "23P01" || code === "23505"
        ? "Termin je upravo zauzet. Izaberite drugi termin."
        : result.error.message.includes("RULE:")
          ? result.error.message.split("RULE:")[1]
          : "Zahtev nije uspeo. Osvežite podatke i pokušajte ponovo.",
    );
  }
  return result.data;
}
export async function ownAppointments(client, userId) {
  const { data, error } = await client
    .from("appointments")
    .select("*,trainers(name)")
    .eq("client_id", userId)
    .order("starts_at");
  if (error) throw new Error("Termini nisu dostupni.");
  return data;
}
export async function schedule(client, start, end, trainer) {
  let request = client
    .from("appointments")
    .select("*,trainers(name),profiles(full_name,phone)")
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at");
  if (trainer) request = request.eq("trainer_id", trainer);
  const { data, error } = await request;
  if (error) throw new Error("Raspored nije dostupan.");
  return data;
}
export async function updateAppointmentStatus(client, id, status) {
  return client
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select("id")
    .single();
}
