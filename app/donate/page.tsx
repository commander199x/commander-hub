import type { Metadata } from "next";
import { Radio, Heart, ArrowUpRight, Phone, Coins, Server, Trophy, Wrench, ShieldCheck, Star } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import CopyButton from "@/components/CopyButton";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support the Commander Generals Zero Hour community.",
};

// TODO: replace with your real paypal.me username (e.g. "yourname")
const PAYPAL_USERNAME = "TODO";

// paypal.me supports a pre-filled amount via URL: paypal.me/username/10
const paypalLink = (amount?: number) =>
  `https://paypal.me/${PAYPAL_USERNAME}${amount ? `/${amount}` : ""}`;

const QUICK_AMOUNTS = [5, 10, 25];

// TODO: replace with your real Whish phone number
const WHISH_NUMBER = "TODO — add Whish number";

interface CryptoWallet {
  coin: string;
  address: string;
}

// TODO: replace with your real wallet addresses. Add or remove coins as needed.
const CRYPTO_WALLETS: CryptoWallet[] = [
  { coin: "Bitcoin (BTC)", address: "TODO — add BTC address" },
  { coin: "Ethereum (ETH)", address: "TODO — add ETH address" },
  { coin: "USDT (TRC20)", address: "TODO — add USDT address" },
];

interface FundUse {
  icon: typeof Server;
  label: string;
  amount: string;
  cadence: string;
}

// TODO: replace with your real cost breakdown
const FUND_USES: FundUse[] = [
  { icon: Server, label: "Hosting & domain", amount: "$TODO", cadence: "per month" },
  { icon: Trophy, label: "Tournament prize pools", amount: "$TODO", cadence: "per event" },
  { icon: Wrench, label: "Community tools & bots", amount: "$TODO", cadence: "per month" },
];

// TODO: update these two numbers by hand as donations come in — this is a
// static display, not a live payment tracker. Wire it up to a real backend
// later if you want it to update automatically.
const GOAL_LABEL = "Summer 2026 tournament prize pool"; // TODO: replace with your real current goal
const RAISED = 0; // TODO
const GOAL = 200; // TODO
const progressPct = Math.min(100, Math.round((RAISED / GOAL) * 100));

interface Supporter {
  name: string;
}

// TODO: add supporters here as donations come in — manually maintained,
// same pattern as the TikTok video list.
const SUPPORTERS: Supporter[] = [
  { name: "TODO — first supporter" },
];

export default function DonatePage() {
  return (
    <main className="min-h-screen w-full cz-grid-bg">
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: C.radar }}>
          <Radio size={13} className="cz-live" />
          <span>Field comms &middot; Generals Zero Hour</span>
        </div>

        <h1
          className="cz-display uppercase mt-4 leading-[0.95]"
          style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}
        >
          Support
          <br />
          <span style={{ color: C.amber }}>The Clan</span>
        </h1>

        <p className="text-sm mt-6 max-w-lg" style={{ color: C.muted }}>
          Every donation goes straight back into running the community — no middleman,
          no hidden cut.
        </p>

        {/* ---------------------------------------------------------- */}
        {/* CURRENT GOAL + PROGRESS                                     */}
        {/* ---------------------------------------------------------- */}
        <div className="mt-10 p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between text-xs uppercase tracking-widest">
            <span style={{ color: C.muted }}>Current goal</span>
            <span style={{ color: C.paper }}>
              ${RAISED} <span style={{ color: C.muted }}>/ ${GOAL}</span>
            </span>
          </div>

          <h2 className="text-[15px] mt-2" style={{ color: C.paper, fontWeight: 500 }}>
            {GOAL_LABEL}
          </h2>

          <div className="mt-4 h-2 w-full" style={{ background: C.void, border: `1px solid ${C.lineStrong}` }}>
            <div
              className="h-full transition-all"
              style={{ width: `${progressPct}%`, background: C.amber }}
            />
          </div>

          <p className="text-[11px] uppercase tracking-widest mt-2" style={{ color: C.muted }}>
            {progressPct}% funded
          </p>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* WHERE THE MONEY GOES                                        */}
        {/* ---------------------------------------------------------- */}
        <div className="flex items-center gap-2 mt-12 mb-4">
          <h2 className="cz-display uppercase text-xl" style={{ fontWeight: 600 }}>
            Where it goes
          </h2>
        </div>

        <section className="grid sm:grid-cols-3 gap-4">
          {FUND_USES.map((use) => {
            const Icon = use.icon;
            return (
              <div key={use.label} className="p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <Icon size={18} style={{ color: C.amber }} />
                <p className="text-xs mt-3" style={{ color: C.paper, fontWeight: 500 }}>
                  {use.label}
                </p>
                <p className="text-[11px] uppercase tracking-widest mt-1" style={{ color: C.muted }}>
                  {use.amount} {use.cadence}
                </p>
              </div>
            );
          })}
        </section>

        {/* ---------------------------------------------------------- */}
        {/* PAYPAL                                                      */}
        {/* ---------------------------------------------------------- */}
        <div className="mt-12" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heart size={20} style={{ color: C.amber }} />
              <span
                className="text-[10px] uppercase tracking-widest px-2 py-1"
                style={{ border: `1px solid ${C.lineStrong}`, color: C.radar }}
              >
                Instant
              </span>
            </div>

            <h2 className="text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
              PayPal
            </h2>
            <p className="text-xs mt-2" style={{ color: C.muted }}>
              Fastest option — one click, no account needed on your end.
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              {QUICK_AMOUNTS.map((amount) => (
                <a
                  key={amount}
                  href={paypalLink(amount)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-widest px-5 py-2.5"
                  style={{ border: `1px solid ${C.lineStrong}`, color: C.paper }}
                >
                  ${amount}
                </a>
              ))}
              <a
                href={paypalLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-5 py-2.5"
                style={{ background: C.amber, color: C.void, fontWeight: 600 }}
              >
                Custom amount
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* WHISH                                                       */}
        {/* ---------------------------------------------------------- */}
        <div className="mt-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Phone size={20} style={{ color: C.amber }} />
              <span
                className="text-[10px] uppercase tracking-widest px-2 py-1"
                style={{ border: `1px solid ${C.lineStrong}`, color: C.radar }}
              >
                Local
              </span>
            </div>

            <h2 className="text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
              Whish
            </h2>
            <p className="text-xs mt-2" style={{ color: C.muted }}>
              Send directly to this number through the Whish app.
            </p>

            <div
              className="flex items-center justify-between mt-5 px-4 py-3"
              style={{ background: C.void, border: `1px solid ${C.lineStrong}` }}
            >
              <span className="text-sm" style={{ color: C.paper, fontFamily: "var(--font-mono), monospace" }}>
                {WHISH_NUMBER}
              </span>
              <CopyButton value={WHISH_NUMBER} />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* CRYPTO                                                      */}
        {/* ---------------------------------------------------------- */}
        <div className="mt-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Coins size={20} style={{ color: C.amber }} />
              <span
                className="text-[10px] uppercase tracking-widest px-2 py-1"
                style={{ border: `1px solid ${C.lineStrong}`, color: C.radar }}
              >
                Crypto
              </span>
            </div>

            <h2 className="text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
              Cryptocurrency
            </h2>
            <p className="text-xs mt-2" style={{ color: C.muted }}>
              Send to any of the addresses below. Double-check the network before sending.
            </p>

            <div className="mt-5 space-y-3">
              {CRYPTO_WALLETS.map((wallet) => (
                <div key={wallet.coin}>
                  <span className="text-[11px] uppercase tracking-widest" style={{ color: C.muted }}>
                    {wallet.coin}
                  </span>
                  <div
                    className="flex items-center justify-between mt-1.5 px-4 py-3"
                    style={{ background: C.void, border: `1px solid ${C.lineStrong}` }}
                  >
                    <span
                      className="text-xs break-all pr-3"
                      style={{ color: C.paper, fontFamily: "var(--font-mono), monospace" }}
                    >
                      {wallet.address}
                    </span>
                    <CopyButton value={wallet.address} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* TRUST NOTE                                                  */}
        {/* ---------------------------------------------------------- */}
        <div className="flex items-start gap-3 mt-8 p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <ShieldCheck size={16} style={{ color: C.radar, marginTop: 2 }} />
          <p className="text-xs" style={{ color: C.muted }}>
            Funds go directly to the clan treasury. If you're unsure this page is legitimate,
            verify with us first on{" "}
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.amber }}>
              Discord
            </a>{" "}
            before sending anything.
          </p>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* SUPPORTERS                                                  */}
        {/* ---------------------------------------------------------- */}
        <div className="flex items-center gap-2 mt-12 mb-4">
          <Star size={16} style={{ color: C.amber }} />
          <h2 className="cz-display uppercase text-xl" style={{ fontWeight: 600 }}>
            Roll of honor
          </h2>
        </div>

        <p className="text-xs mb-4" style={{ color: C.muted }}>
          Message us on Discord after donating and we&apos;ll add your name here.
        </p>

        <div className="flex flex-wrap gap-2 mb-14">
          {SUPPORTERS.map((supporter) => (
            <span
              key={supporter.name}
              className="text-xs px-3 py-2"
              style={{ border: `1px solid ${C.lineStrong}`, color: C.paper }}
            >
              {supporter.name}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
