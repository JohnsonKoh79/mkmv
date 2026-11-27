/** Only same-site paths may be followed after sign-in. */
export const safeNext = (v: string | undefined | null) => (v && /^\/(?!\/)[\w\-./]*(\?code=[a-f0-9]{32})?$/.test(v) ? v : null);
