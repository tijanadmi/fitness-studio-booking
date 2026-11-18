export function periodHref(basePath, date, view, trainer = "") {
  const params = new URLSearchParams({
    date,
    view: view === "day" ? "day" : "week",
  });
  if (trainer) params.set("trainer", trainer);
  return basePath + "?" + params.toString();
}
