export type Cut = "m" | "w";
type Piece = { product: string; ink: "black" | "oxblood"; hasCut: boolean };

/** Artwork in public/kit: <piece>-<core|reserved>[-m|-w].png */
export const kitImage = (s: Piece, cut: Cut) =>
  `/kit/${s.product.toLowerCase()}-${s.ink === "oxblood" ? "reserved" : "core"}${s.hasCut ? `-${cut}` : ""}.png`;
export const rewardName = (s: Pick<Piece, "product" | "ink">) => `${s.product} · ${s.ink === "oxblood" ? "Reserved" : "Core black"}`;
