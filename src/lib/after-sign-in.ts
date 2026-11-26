/** Only same-site paths may be followed after sign-in. */
export const safeNext = (v: string | undefined | null) => (v && /^\/(?!\/)[\w\-./]*$/.test(v) ? v : null);
