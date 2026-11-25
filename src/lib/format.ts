export function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00+08:00`).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur",
  });
}
