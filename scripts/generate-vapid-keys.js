// Run once:  node scripts/generate-vapid-keys.js
// Then add the three printed values in Vercel → Settings → Environment Variables (Production), and redeploy.
// Keep VAPID_PRIVATE_KEY secret — never paste it in chat or commit it.
const { generateKeyPairSync } = require("node:crypto");
const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });
const b = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const raw = Buffer.concat([Buffer.from([4]), b(pub.x), b(pub.y)]).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
console.log("\nAdd these in Vercel → Settings → Environment Variables (Production):\n");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + raw);
console.log("VAPID_PRIVATE_KEY=" + priv.d);
console.log("VAPID_SUBJECT=mailto:YOUR-EMAIL@example.com   (change to your real email)\n");
