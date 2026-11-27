/**
 * Emails the site sends itself, through Resend. Sign-in links are sent by Supabase, not from here.
 * Server only: RESEND_API_KEY must never get a NEXT_PUBLIC_ prefix.
 */
const SITE = "https://www.mkmv.club";
const FROM = "MKMV <noreply@mkmv.club>";

export type Approval = { name: string | null; project: string; batch: number | null; starts: string | null };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function approvalEmail({ name, project, batch, starts }: Approval) {
  const hello = name ? `${name}, your seat is saved.` : "Your seat is saved.";
  const where = batch ? `${project} · Batch ${batch}` : project;
  const first = starts ? `First Wednesday: ${starts}, 5am.` : "Date to be confirmed.";
  const link = `${SITE}/move`;
  const next = "Add your nickname and photo under Me. Then show up.";

  const subject = "You're in.";
  const text = `${hello}\n\n${where}\n${first}\n\n${next}\n\nSee My Move: ${link}\n\nMake your move.`;
  const font = "font-family:Arial,Helvetica,sans-serif;";
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>MKMV</title>
</head>
<body style="margin:0;padding:0;background-color:#EAE4DE;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(first)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EAE4DE">
  <tr><td align="center" style="padding:24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;border:1px solid #10100F;">
      <tr><td bgcolor="#10100F" style="padding:28px 28px 24px;">
        <img src="${SITE}/email/mkmv-offwhite.png" width="140" height="34" alt="MKMV" style="display:block;border:0;color:#EAE4DE;${font}font-size:24px;font-weight:bold;">
      </td></tr>
      <tr><td bgcolor="#10100F" style="padding:8px 28px 36px;">
        <div style="font-family:'Arial Black',Arial,Helvetica,sans-serif;font-weight:900;font-style:italic;font-size:40px;line-height:44px;color:#EAE4DE;text-transform:uppercase;">You're in.</div>
      </td></tr>
      <tr><td bgcolor="#EAE4DE" style="padding:28px;${font}color:#10100F;">
        <p style="margin:0 0 16px;font-size:16px;line-height:24px;">${esc(hello)}</p>
        <p style="margin:0 0 16px;font-size:16px;line-height:24px;"><strong style="letter-spacing:1px;text-transform:uppercase;">${esc(where)}</strong><br>${esc(first)}</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:24px;">${esc(next)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" bgcolor="#10100F">
            <a href="${link}" style="display:block;padding:18px 24px;${font}font-size:15px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#EAE4DE;text-decoration:none;">See My Move</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td bgcolor="#EAE4DE" style="padding:20px 28px;border-top:1px solid #10100F;${font}color:#10100F;font-size:12px;line-height:18px;">
        <strong style="letter-spacing:2px;text-transform:uppercase;">Make your move.</strong>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  return { subject, text, html };
}

/** Never throws: a failed email must not undo or break an approval. */
export async function sendApprovalEmail(to: string, approval: Approval): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("approval email not sent: RESEND_API_KEY is missing");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, ...approvalEmail(approval) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("approval email not sent:", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("approval email not sent:", e);
    return false;
  }
}
