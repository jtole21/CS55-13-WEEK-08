// Load the Firebase Authentication helpers used by the sign-in flow.
import {
  GoogleAuthProvider, // Builds the Google sign-in provider for the popup.
  signInWithPopup, // Opens the Google account chooser in a popup window.
  onAuthStateChanged as _onAuthStateChanged, // Observes sign-in and sign-out.
  onIdTokenChanged as _onIdTokenChanged, // Observes ID token refreshes.
} from "firebase/auth";

// Load the client Auth instance created in clientApp.js.
import { auth } from "@/src/lib/firebase/clientApp";

// Register a callback that runs whenever the user signs in or signs out.
export function onAuthStateChanged(cb) {
  // Subscribe the callback to the client Auth instance and return the unsubscribe function.
  return _onAuthStateChanged(auth, cb);
}

// Register a callback that runs whenever the user's ID token is created or refreshed.
export function onIdTokenChanged(cb) {
  // Subscribe the callback so the session cookie can be updated with a fresh token.
  return _onIdTokenChanged(auth, cb);
}

// Start a Google sign-in and attach the resulting user to this Firebase app.
export async function signInWithGoogle() {
  // Create a provider that asks Google for the user's identity.
  const provider = new GoogleAuthProvider();

  // The popup can be closed or blocked, so guard the call.
  try {
    // Open the popup and wait until Firebase finishes signing the user in.
    await signInWithPopup(auth, provider);
  } catch (error) {
    // Keep the page usable and record why sign-in failed.
    console.error("Error signing in with Google", error);
  }
}

// End the current Firebase Authentication session.
export async function signOut() {
  // Signing out can fail if Auth is not ready, so guard the call.
  try {
    // Clear the current user on the client Auth instance.
    return auth.signOut();
  } catch (error) {
    // Record the failure so it can be diagnosed without crashing the header.
    console.error("Error signing out with Google", error);
  }
}
