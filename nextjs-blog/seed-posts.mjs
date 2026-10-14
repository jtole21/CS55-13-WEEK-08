import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, doc, getFirestore, setDoc } from 'firebase/firestore';

const posts = [
  {
    id: 'ada-lovelace',
    name: 'Ada Lovelace',
    title: 'The Notes That Imagined Software',
    date: '2026-09-24',
    topic: 'Mathematics',
    contentHtml:
      '<p>Ada Lovelace studied mathematics in the nineteenth century and worked with Charles Babbage on the Analytical Engine. In her notes on that machine, she described how a general-purpose engine could follow a sequence of operations, not only for numbers but for symbols.</p><p>That idea is why this page treats her as an early author of what we now call a program. Her name, title, date, topic, and this HTML live together as fields on one document in the Firestore <code>posts</code> collection.</p>',
  },
  {
    id: 'grace-hopper',
    name: 'Grace Hopper',
    title: 'Compilers People Could Read',
    date: '2026-09-26',
    topic: 'Computing',
    contentHtml:
      '<p>Grace Hopper pushed computing toward languages people could read. She helped popularize the idea that a compiler could translate human-readable instructions into machine code, and she spent decades explaining those systems to programmers and to the Navy.</p><p>Next.js does not read a local JSON file for this entry. When the site is built, <code>getPostData</code> asks Firestore for the document whose id is <code>grace-hopper</code>.</p>',
  },
  {
    id: 'katherine-johnson',
    name: 'Katherine Johnson',
    title: 'Trajectories Checked by Hand',
    date: '2026-09-28',
    topic: 'Spaceflight',
    contentHtml:
      '<p>Katherine Johnson calculated trajectories for NASA by hand and with early computers, checking the numbers that carried astronauts into orbit and back. Her work is a reminder that software is only as trustworthy as the people who test it.</p><p>This is the third document in the collection. The homepage pre-renders a list of these three names from that database.</p>',
  },
];

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error(
      'Missing .env.local. Copy .env.example to .env.local and add your Firebase web app config.',
    );
  }
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function seedPosts() {
  loadEnvFile();
  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  const db = getFirestore(app);
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (emulatorHost) {
    const separator = emulatorHost.lastIndexOf(':');
    connectFirestoreEmulator(
      db,
      emulatorHost.slice(0, separator),
      Number(emulatorHost.slice(separator + 1)),
    );
  }
  for (const post of posts) {
    const { id, ...fields } = post;
    await setDoc(doc(db, 'posts', id), fields);
    console.log(`Wrote posts/${id}`);
  }
}

seedPosts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
