import { initializeApp, getApps } from 'firebase/app'; // Load the Firebase app helpers used to start the client SDK once.
import { collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore } from 'firebase/firestore'; // Load the Firestore helpers that read the posts collection and one post document.
const firebaseConfig = { // Hold the web app settings Next.js reads from the local environment.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // Read the Firebase web API key from the environment.
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // Read the Firebase auth domain from the environment.
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Read the Firebase project id, which selects the Firestore database.
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Read the storage bucket name from the environment.
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // Read the messaging sender id from the environment.
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // Read the Firebase web app id from the environment.
}; // End the firebaseConfig object.
const postsCollectionName = 'posts'; // Name the single Firestore collection that stores every post document.
function assertFirebaseConfig() { // Stop early when a required Firebase setting was not provided.
  const missingKeys = Object.keys(firebaseConfig).filter((key) => { // List config keys whose values are empty.
    return !firebaseConfig[key]; // Keep a key when its environment value is missing.
  }); // End the filter callback.
  if (missingKeys.length > 0) { // Check whether any required setting is missing.
    throw new Error(`Missing Firebase environment values: ${missingKeys.join(', ')}. Add them to .env.local.`); // Explain which values still need to be added.
  } // End the missing-config guard.
} // End the assertFirebaseConfig function.
function getDb() { // Return a Firestore client, creating the Firebase app on the first call.
  const existingApps = getApps(); // Look up Firebase apps that were already started in this process.
  let app = existingApps[0]; // Reuse the first app when one already exists.
  if (!app) { // Start a new app only when this process has not started one yet.
    assertFirebaseConfig(); // Confirm the environment contains every Firebase setting before connecting.
    app = initializeApp(firebaseConfig); // Start the Firebase app with those settings.
  } // End the first-time app setup.
  const db = getFirestore(app); // Open the Firestore database attached to that app.
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST; // Read an optional host:port for the local Firestore emulator.
  if (emulatorHost && !globalThis.__postsFirebaseEmulator) { // Attach the emulator once when that variable is set.
    const separator = emulatorHost.lastIndexOf(':'); // Find the colon that separates the host from the port.
    const host = emulatorHost.slice(0, separator); // Keep the emulator hostname.
    const port = Number(emulatorHost.slice(separator + 1)); // Keep the emulator port as a number.
    connectFirestoreEmulator(db, host, port); // Send later reads to the emulator instead of Cloud Firestore.
    globalThis.__postsFirebaseEmulator = true; // Remember the attachment so a hot reload does not connect twice.
  } // End the emulator branch.
  return db; // Return the Firestore client the callers will read from.
} // End the getDb function.
function toDateString(value) { // Normalize a post date to a plain string Next.js can serialize.
  if (value && typeof value.toDate === 'function') { // Detect a Firestore Timestamp by its toDate method.
    return value.toDate().toISOString().slice(0, 10); // Convert the timestamp to a YYYY-MM-DD string.
  } // End the Timestamp branch.
  return value; // Keep a date that is already stored as a string.
} // End the toDateString function.
function toPost(document) { // Shape one Firestore document into the plain object each page expects.
  const data = document.data(); // Read the document fields.
  return { // Return only the fields the pages render.
    id: document.id, // Use the document id as the post id and route slug.
    name: data.name, // Keep the person's name for the homepage list.
    title: data.title, // Keep the post title.
    date: toDateString(data.date), // Keep the publish date as a plain string.
    topic: data.topic, // Keep the short topic label.
    contentHtml: data.contentHtml, // Keep the HTML body stored in the document.
  }; // End the plain post object.
} // End the toPost function.
async function getPostsFromFirestore() { // Load every post document from the posts collection.
  const db = getDb(); // Connect to the Firestore database.
  const postsCollection = collection(db, postsCollectionName); // Point at the posts collection.
  const snapshot = await getDocs(postsCollection); // Read every document in that collection.
  return snapshot.docs.map((document) => { // Turn each document snapshot into a plain post object.
    return toPost(document); // Convert this document.
  }); // End the map callback and return the post list.
} // End the getPostsFromFirestore function.
export async function getSortedPostsData() { // Return every post with the newest date first for the homepage.
  const allPostsData = await getPostsFromFirestore(); // Load the full post list from Firestore.
  const sortedPosts = allPostsData.slice(); // Copy the list before sorting it.
  return sortedPosts.sort((a, b) => { // Sort so a later date comes before an earlier date.
    if (a.date < b.date) { // Check whether the first post is older than the second post.
      return 1; // Place the older post after the newer post.
    } else { // Handle a newer first post, or two posts that share the same date.
      return -1; // Keep the first post ahead of the second post.
    } // End the date comparison.
  }); // End the sort callback and return the sorted array.
} // End the getSortedPostsData function.
export async function getAllPostIds() { // Build the dynamic route params Next.js needs for each post page.
  const allPostsData = await getPostsFromFirestore(); // Load every post so each id can become a path.
  return allPostsData.map((post) => { // Turn each post into the params object getStaticPaths expects.
    return { // Return one path entry for this post.
      params: { // Nest the route parameters inside params for Next.js.
        id: post.id, // Use the post id as the value of the [id] route segment.
      }, // End the params object.
    }; // End the path entry.
  }); // End the map callback and return the path list.
} // End the getAllPostIds function.
export async function getPostData(id) { // Return one post for the requested id.
  const db = getDb(); // Connect to the Firestore database.
  const postRef = doc(db, postsCollectionName, id); // Point at the document whose id matches the route.
  const snapshot = await getDoc(postRef); // Read that single document.
  if (!snapshot.exists()) { // Guard against an id that is not in the collection.
    throw new Error(`Post not found: ${id}`); // Stop the build with an error that names the missing id.
  } // End the missing-post guard.
  return toPost(snapshot); // Return the matching post as a plain object.
} // End the getPostData function.
