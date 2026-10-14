"use server";

import { addReviewToRestaurant } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";

// This is a Next.js Server Action that receives the review form submission.
// https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
export async function handleReviewFormSubmission(data) {
  // Rebuild the Firebase server app from the signed-in user's session cookie.
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // Bind Firestore to that authenticated app so Security Rules see the user.
  const db = getFirestore(firebaseServerApp);

  // Store the review and update the restaurant's rating totals.
  await addReviewToRestaurant(db, data.get("restaurantId"), {
    text: data.get("text"),
    rating: data.get("rating"),

    // The signed-in user id is posted from a hidden form field.
    userId: data.get("userId"),
  });
}
