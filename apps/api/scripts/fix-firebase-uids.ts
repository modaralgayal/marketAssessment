// Diagnose + (optionally) repair Accounts whose stored `firebaseUid` no longer
// matches the Firebase identity a user signs in with.
//
// This is the exact condition that made a real, working Google sign-in start
// returning "Account not found" / "no workspace": the Account row's firebaseUid
// points at a Firebase user that no longer resolves (auth user recreated,
// deleted, or email-changed), while the row itself stays in Postgres.
//
// Modes:
//   npx tsx scripts/fix-firebase-uids.ts            # read-only: prints dbUid vs liveUid
//   APPLY=1 npx tsx scripts/fix-firebase-uids.ts    # rebinds firebaseUid only
//
// Read-only mode never writes. APPLY mode updates firebaseUid and NOTHING else
// (it never deletes — deletion cascades to the profile/cards). If a live
// Firebase user exists for the stored email but under a different uid, the
// Account is rebound to that uid. If no Firebase user exists at all (true
// orphan), it is flagged for manual recreation and left untouched.

import "dotenv/config";
import { prisma } from "../src/prisma.js";
import { adminAuth } from "../src/lib/firebaseAdmin.js";

const APPLY = process.env.APPLY === "1";

type Status = "ok" | "MISMATCH" | "ORPHAN" | "ERROR";

async function main() {
  const accounts = await prisma.account.findMany({
    select: { id: true, email: true, firebaseUid: true, role: true, status: true },
  });

  console.log(`Found ${accounts.length} accounts. Mode: ${APPLY ? "APPLY (rebinds firebaseUid)" : "read-only"}\n`);

  let issues = 0;

  for (const acc of accounts) {
    const dbUid = acc.firebaseUid;
    let status: Status = "ok";
    let detail = "";
    let liveUid: string | null = null;

    // 1. Does the stored firebaseUid still resolve to a Firebase user?
    let providers: string[] = [];
    try {
      const u = await adminAuth().getUser(dbUid);
      liveUid = u.uid; // equals dbUid when consistent
      providers = u.providerData.map((p) => p.providerId);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "auth/user-not-found") {
        // Stored uid's user is gone — try to find the live identity by email.
        try {
          const byEmail = await adminAuth().getUserByEmail(acc.email);
          liveUid = byEmail.uid;
          status = "MISMATCH";
          detail = `stored uid ${dbUid} gone; live user for ${acc.email} is ${byEmail.uid}`;
          issues++;
        } catch (e2: unknown) {
          const code2 = (e2 as { code?: string })?.code;
          if (code2 === "auth/user-not-found") {
            status = "ORPHAN";
            detail = `no Firebase user for stored uid ${dbUid} OR email ${acc.email}`;
            issues++;
          } else {
            status = "ERROR";
            detail = String((e2 as Error)?.message ?? e2);
          }
        }
      } else {
        status = "ERROR";
        detail = String((e as Error)?.message ?? e);
      }
    }

    // 2. APPLY: rebind MISMATCH accounts whose live uid is free to take.
    if (status === "MISMATCH" && APPLY && liveUid) {
      const colliding = await prisma.account.findUnique({ where: { firebaseUid: liveUid } });
      if (colliding && colliding.id !== acc.id) {
        detail += ` → SKIP: liveUid already on account ${colliding.id} (duplicate; delete the orphan instead of rebinding)`;
      } else {
        try {
          await prisma.account.update({ where: { id: acc.id }, data: { firebaseUid: liveUid } });
          detail += " → rebound ✓";
        } catch (e: unknown) {
          detail += ` → rebound FAILED: ${String((e as Error)?.message ?? e)}`;
        }
      }
    }

    // ORPHAN in APPLY mode can't be auto-fixed (no live uid to rebind to).
    if (status === "ORPHAN" && APPLY) {
      detail += " → left untouched (recreate the Firebase user or re-sign-up via invite)";
    }

    if (status !== "ok" || APPLY) {
      console.log(`[${status}] ${acc.email} (${acc.role}/${acc.status})`);
      console.log(`   id=${acc.id} dbUid=${dbUid}${liveUid ? ` liveUid=${liveUid}` : ""} providers=[${providers.join(",") || "none"}]`);
      if (detail) console.log(`   ${detail}`);
    } else {
      console.log(`[ok] ${acc.email} (${acc.role}/${acc.status}) dbUid=${dbUid} providers=[${providers.join(",") || "none"}]`);
    }
  }

  console.log(`\n${issues} account(s) with a stale or missing firebaseUid.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
