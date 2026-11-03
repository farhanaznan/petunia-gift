/** Customer-facing (and admin table) order status labels. */
export function formatOrderStatus(status: string): string {
  switch (status) {
    case "pending_payment_review":
      return "Pending review";
    case "draft_hold":
      return "Draft hold";
    case "confirmed":
      return "Confirmed";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "expired_hold":
      return "Expired hold";
    case "done":
      return "Done";
    default:
      return status.replaceAll("_", " ");
  }
}
