import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
import { safeNext } from "@/lib/domain/booking";
export async function GET(request) {
  const url = new URL(request.url),
    client = await db();
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  let result;
  if (code) result = await client.auth.exchangeCodeForSession(code);
  else if (token_hash && ["signup", "recovery", "email"].includes(type))
    result = await client.auth.verifyOtp({ token_hash, type });
  return NextResponse.redirect(
    new URL(
      result && !result.error
        ? safeNext(url.searchParams.get("next"))
        : "/prijava?message=Link%20nije%20važeći.%20Pokušajte%20ponovo.",
      process.env.NEXT_PUBLIC_SITE_URL || url.origin,
    ),
  );
}
