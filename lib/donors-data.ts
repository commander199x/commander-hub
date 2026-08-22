// TODO (future): automate this via a PayPal webhook once you have a PayPal
// Business account. A webhook + a small API route could record real
// donations and update TOP_DONATOR automatically. For now, everything below
// is set by hand.

export interface TopDonator {
  name: string;
  amount?: string; // e.g. "$50" — optional, shown if provided
  message?: string; // optional shoutout line
}

// Set this to an object whenever there's a current top supporter you want to
// feature (e.g. during a stream). Set to `null` to hide the section entirely.
export const TOP_DONATOR: TopDonator | null = {
  name: "Omar",
  message: "مشكور على الدعم من القلب ",
};

export interface Supporter {
  name: string;
}

// General shoutout list — add a name here any time someone donates,
// regardless of amount.
export const SUPPORTERS: Supporter[] = [{ name: "Abou Joud العريس" },{ name: "Omar الريس واقطع خبر" } ];
