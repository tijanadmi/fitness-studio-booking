// Translate only known codes; never expose the provider's raw error message.
export function authErrorMessage(error) {
  switch (error?.code) {
    case "email_not_confirmed":
      return "Prvo potvrdite email adresu preko linka iz poruke, pa se prijavite.";
    case "invalid_credentials":
      return "Email adresa ili lozinka nisu ispravni. Proverite unos ili zatražite novu lozinku.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Previše pokušaja u kratkom periodu. Sačekajte nekoliko minuta i pokušajte ponovo.";
    case "weak_password":
      return "Lozinka ne ispunjava zahteve. Koristite najmanje 8 znakova i proverite pravila lozinke studija.";
    case "signup_disabled":
      return "Registracija trenutno nije omogućena. Obratite se studiju.";
    default:
      return "Zahtev nije uspeo. Pokušajte ponovo. Ako se problem ponavlja, obratite se studiju.";
  }
}
