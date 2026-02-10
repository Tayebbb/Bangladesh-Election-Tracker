/**
 * Reset all declared results and summary in Firestore.
 * 
 * Prerequisites:
 * 1. Create a .env file in the root directory with Firebase credentials
 * 2. Or set environment variables: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, etc.
 * 
 * Run with: node scripts/reset-results.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Load Firebase config from environment variables
// Create a .env file in the root directory with your Firebase credentials
// Or set these as environment variables before running this script
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Error: Firebase configuration is missing!');
  console.error('Please set environment variables: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, etc.');
  console.error('You can create a .env file in the root directory or set them directly.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetResults() {
  console.log('Resetting all declared results...');

  // 1. Delete all documents in 'results' collection
  const resultsSnap = await getDocs(collection(db, 'results'));
  let deleted = 0;
  for (const d of resultsSnap.docs) {
    await deleteDoc(doc(db, 'results', d.id));
    deleted++;
  }
  console.log(`Deleted ${deleted} result documents.`);

  // 2. Reset the summary document
  const emptySummary = {
    totalSeats: 300,
    declaredSeats: 0,
    requiredMajority: 151,
    partySeatCounts: [],
    totalVotesCast: 0,
    totalRegisteredVoters: 127711414,
    nationalTurnout: 0,
    lastUpdated: serverTimestamp(),
  };
  await setDoc(doc(db, 'summary', 'current'), emptySummary);
  console.log('Summary document reset.');

  console.log('Done! All results have been cleared.');
  process.exit(0);
}

resetResults().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
