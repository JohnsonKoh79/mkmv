export const ORDER_STATUS: Record<string, string> = { preordered: "Ordered", paid: "Paid", sent_to_printer: "Sent to printer", handed_over: "Handed over" };
export const rm = (n: number) => `RM ${n.toFixed(2)}`;
