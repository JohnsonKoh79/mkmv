// Member site and admin keep completely separate logins: different cookies, same database.
export type Area = "member" | "admin";

/** Member keeps the library default so existing members stay signed in. */
export const cookieOptionsFor = (area: Area) => (area === "admin" ? { name: "mkmv-admin-auth" } : undefined);
