// Keep this module on the server so the session cookie is never bundled for the browser.
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

// Load the Next.js cookie store, which holds the Firebase ID token.
import { cookies } from "next/headers";
// Load the Firebase app factories used to mirror the client session on the server.
import { initializeServerApp, initializeApp } from "firebase/app";

// Load the Auth factory that reads the user from a server app.
import { getAuth } from "firebase/auth";
// Load the local web app config. It is empty when App Hosting supplies the config.
import { getFirebaseConfig } from "@/src/lib/firebase/config";

// Build a Firebase app for server rendering that uses the same user as the browser.
export async function getAuthenticatedAppForUser() {
  // Read the ID token that the header stored in the __session cookie.
  const authIdToken = (await cookies()).get("__session")?.value;

  // FirebaseServerApp lets server code use credentials that originated in the browser.
  // The token is optional, so signed-out requests still get a usable server app.
  // Create that server app from the Firebase app for this project.
  const firebaseServerApp = initializeServerApp(
    // Use .env.local locally. With no config, App Hosting fills in the project.
    // https://github.com/firebase/firebase-js-sdk/issues/8863#issuecomment-2751401913
    initializeApp(getFirebaseConfig()),
    {
      // Pass the cookie token so server Security Rules see the signed-in user.
      authIdToken,
    },
  );

  // Get the Auth instance that belongs to this server app.
  const auth = getAuth(firebaseServerApp);
  // Wait until Auth has applied the token before reading currentUser.
  await auth.authStateReady();

  // Hand back the app for Firestore and the user for the header.
  return { firebaseServerApp, currentUser: auth.currentUser };
}
