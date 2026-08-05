// One-off admin script: wipes gardens, honoree, and butterflies collections
// from production Firestore. Leaves `payments` untouched.
//
// Auth: uses Application Default Credentials, resolved from a service
// account key file via GOOGLE_APPLICATION_CREDENTIALS. Generate a key at
// https://console.firebase.google.com/project/butterfly-memorial/settings/serviceaccounts/adminsdk
// and keep it OUTSIDE the repo.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=~/butterfly-memorial-admin-key.json node scripts/clear-gardens.mjs           # dry run
//   GOOGLE_APPLICATION_CREDENTIALS=~/butterfly-memorial-admin-key.json node scripts/clear-gardens.mjs --confirm # actually deletes

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "butterfly-memorial";
const COLLECTIONS = ["gardens", "honoree", "butterflies"];
const DRY_RUN = !process.argv.includes("--confirm");

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

async function deleteCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) {
    console.log(`${name}: 0 documents`);
    return 0;
  }

  console.log(`${name}: ${snap.size} documents${DRY_RUN ? " (dry run, not deleted)" : ""}`);

  if (!DRY_RUN) {
    const batchSize = 400;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      docs.slice(i, i + batchSize).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  return snap.size;
}

async function main() {
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no deletes)" : "LIVE DELETE"}`);
  console.log("Collections:", COLLECTIONS.join(", "));
  console.log("---");

  let total = 0;
  for (const name of COLLECTIONS) {
    total += await deleteCollection(name);
  }

  console.log("---");
  console.log(`Total: ${total} documents${DRY_RUN ? " would be deleted" : " deleted"}`);
  if (DRY_RUN) {
    console.log("\nRe-run with --confirm to actually delete.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
