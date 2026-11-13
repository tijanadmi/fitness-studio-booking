import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configured } from "../config";
export async function db() {
  if (!configured())
    throw new Error("Potrebno je podesiti Supabase. Pogledajte README.");
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          } catch {
            /* Proxy refreshes cookies during rendering. */
          }
        },
      },
    },
  );
}
