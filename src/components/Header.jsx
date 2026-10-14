"use client"; // This file uses hooks and browser APIs, so it must run in the browser.
// Load React and the effect hook used to watch the Firebase auth token.
import React, { useEffect } from "react";
// Load the Next.js link component for client-side navigation back to the home page.
import Link from "next/link";
// Load the Google sign-in, sign-out, and ID-token listener wrappers.
import {
  signInWithGoogle, // Starts the Google popup sign-in flow.
  signOut, // Signs the current user out of Firebase Authentication.
  onIdTokenChanged, // Runs a callback whenever the user's ID token changes.
} from "@/src/lib/firebase/auth.js";
// Load the helper that writes sample restaurants and reviews into Firestore.
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
// Load cookie helpers so the ID token can be stored for the server.
import { setCookie, deleteCookie } from "cookies-next";

// Keep the server-rendered user in sync with later client-side auth changes.
function useUserSession(initialUser) {
  // Subscribe once, and again if the user passed from the server changes.
  useEffect(() => {
    // Listen for ID token changes and return the unsubscribe function for cleanup.
    return onIdTokenChanged(async (user) => {
      // A signed-in user has a fresh ID token that the server can read.
      if (user) {
        // Ask Firebase for the current ID token string.
        const idToken = await user.getIdToken();
        // Store that token in the __session cookie that the server reads.
        await setCookie("__session", idToken);
      } else {
        // A signed-out browser should not keep a stale session cookie.
        await deleteCookie("__session");
      }
      // Skip the reload when the server already rendered this same user.
      if (initialUser?.uid === user?.uid) {
        // The displayed user already matches Firebase, so leave the page as it is.
        return;
      }
      // Reload so server components re-render with the new authentication state.
      window.location.reload();
    });
  }, [initialUser]); // Re-run the effect when the server-provided user changes.

  // The header renders the user that the server already resolved.
  return initialUser;
}

// Render the top bar with the logo, profile, and sign-in or sign-out actions.
export default function Header({ initialUser }) {
  // Resolve which user to show from the server-rendered session.
  const user = useUserSession(initialUser);

  // Sign out without following the placeholder link.
  const handleSignOut = (event) => {
    // Stop the anchor from navigating to "#".
    event.preventDefault();
    // End the Firebase Authentication session.
    signOut();
  };

  // Sign in with Google without following the placeholder link.
  const handleSignIn = (event) => {
    // Stop the anchor from navigating to "#".
    event.preventDefault();
    // Open the Google sign-in popup.
    signInWithGoogle();
  };

  // Draw the header contents.
  return (
    <header>
      {/* Link the logo back to the restaurant list. */}
      <Link href="/" className="logo">
        {/* Show the Friendly Eats logo image. */}
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        {/* Show the product name next to the logo. */}
        Friendly Eats
      </Link>
      {/* Signed-in users see their profile menu; everyone else sees Sign In. */}
      {user ? (
        <>
          {/* Group the avatar, name, and dropdown together. */}
          <div className="profile">
            <p>
              {/* Show the Google profile photo, or a placeholder if none exists. */}
              <img
                className="profileImage" // Style hook for the circular avatar.
                src={user.photoURL || "/profile.svg"} // Prefer the account photo.
                alt={user.email} // Describe the image with the account email.
              />
              {/* Show the name returned by the Google account. */}
              {user.displayName}
            </p>

            {/* The dropdown opens from this menu container. */}
            <div className="menu">
              {/* Visual cue that more actions are available. */}
              ...
              <ul>
                {/* Repeat the display name at the top of the menu. */}
                <li>{user.displayName}</li>

                <li>
                  {/* Write sample restaurant documents into Firestore. */}
                  <a href="#" onClick={addFakeRestaurantsAndReviews}>
                    Add sample restaurants
                  </a>
                </li>

                <li>
                  {/* End the current Google session. */}
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        // Signed-out visitors only see the Google sign-in control.
        <div className="profile">
          {/* Start Google sign-in when this control is clicked. */}
          <a href="#" onClick={handleSignIn}>
            {/* Placeholder avatar shown before anyone is signed in. */}
            <img src="/profile.svg" alt="A placeholder user image" />
            {/* Label for the Google authentication action. */}
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
}
