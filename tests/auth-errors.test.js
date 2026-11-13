import test from "node:test";
import assert from "node:assert/strict";
import { authErrorMessage } from "../src/lib/domain/auth-errors.js";

test("unconfirmed email explains the required next step", () => {
  assert.match(
    authErrorMessage({ code: "email_not_confirmed" }),
    /Prvo potvrdite email/,
  );
});
test("invalid credentials do not disclose whether an account exists", () => {
  assert.match(
    authErrorMessage({ code: "invalid_credentials" }),
    /Email adresa ili lozinka/,
  );
});
test("unknown errors never expose provider details", () => {
  const message = authErrorMessage({
    code: "unexpected",
    message: "private provider details",
  });
  assert.equal(message.includes("private provider details"), false);
  assert.equal(message, authErrorMessage(null));
});
