export const rm = (n: number) => `RM ${n.toFixed(2)}`;

type O = { status: string; price: number; proof: boolean };
export const needsPayment = (o: O) => o.status === "preordered" && o.price > 0 && !o.proof;
export function orderStatus(o: O): string {
  if (o.status === "paid") return "Paid";
  if (o.status === "sent_to_printer") return "With the printer";
  if (o.status === "handed_over") return "Handed over";
  if (o.price === 0) return "Waiting for confirmation";
  return o.proof ? "Pending for approval" : "Payment pending";
}
