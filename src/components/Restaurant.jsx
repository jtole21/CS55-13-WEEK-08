"use client"; // This file runs in the browser so it can listen for live restaurant updates.

// This component shows one individual restaurant.
// It receives data from src/app/restaurant/[id]/page.jsx

// Load React helpers for state, effects, and the Suspense boundary around the dialog.
import { useState, useEffect, Suspense } from "react";
// Load Next.js dynamic import so the dialog code loads only when this page needs it.
import dynamic from "next/dynamic";
// Load the Firestore listener that keeps this restaurant in sync.
import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js";
// Load the hook that reads the signed-in user from Firebase Auth.
import { useUser } from "@/src/lib/getUser";
// Load the component that draws the photo, rating, and action buttons.
import RestaurantDetails from "@/src/components/RestaurantDetails.jsx";
// Load the helper that uploads a new photo to Cloud Storage.
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

// Load the review dialog in a separate client bundle.
const ReviewDialog = dynamic(() => import("@/src/components/ReviewDialog.jsx"));

// Render one restaurant, its photo upload control, and the review dialog.
export default function Restaurant({
  id, // The Firestore id of this restaurant.
  initialRestaurant, // The restaurant document rendered on the server.
  initialUserId, // The user id known during server rendering.
  children, // The review summary nested inside the restaurant details.
}) {
  // Start with the server-rendered restaurant, then replace it when Firestore changes.
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant);
  // Track whether the review dialog is open.
  const [isOpen, setIsOpen] = useState(false);

  // The user id links a new review to the signed-in user and decides whether to show the dialog.
  const userId = useUser()?.uid || initialUserId;
  // Hold the draft rating and review text until the user submits or cancels.
  const [review, setReview] = useState({
    rating: 0, // Start with no stars selected.
    text: "", // Start with an empty review.
  });

  // Update one field of the draft review.
  const onChange = (value, name) => {
    // Copy the current draft and replace the named field.
    setReview({ ...review, [name]: value });
  };

  // Upload a chosen photo and show it on the restaurant immediately.
  async function handleRestaurantImage(target) {
    // Read the first file from the file input, if the user selected one.
    const image = target.files ? target.files[0] : null;
    // Do nothing when the file picker was canceled.
    if (!image) {
      // Leave the current photo in place.
      return;
    }

    // Upload the file and get back its public URL.
    const imageURL = await updateRestaurantImage(id, image);
    // Replace the photo on the current restaurant details.
    setRestaurantDetails({ ...restaurantDetails, photo: imageURL });
  }

  // Close the dialog and clear the draft review.
  const handleClose = () => {
    // Hide the dialog.
    setIsOpen(false);
    // Reset the stars and the text for the next review.
    setReview({ rating: 0, text: "" });
  };

  // Subscribe to live changes for this restaurant document.
  useEffect(() => {
    // Replace the details whenever Firestore reports a change, and unsubscribe on cleanup.
    return getRestaurantSnapshotById(id, (data) => {
      // Store the latest restaurant fields in component state.
      setRestaurantDetails(data);
    });
  }, [id]); // Resubscribe only when the restaurant id changes.

  // Draw the restaurant details and, for a signed-in user, the review dialog.
  return (
    <>
      {/* Show the photo, facts, and the summary passed in as children. */}
      <RestaurantDetails
        restaurant={restaurantDetails} // The restaurant currently on screen.
        userId={userId} // Show review and upload actions only when signed in.
        handleRestaurantImage={handleRestaurantImage} // Called when a new photo is chosen.
        setIsOpen={setIsOpen} // Lets the review button open the dialog.
        isOpen={isOpen} // Tells the review button whether the dialog is open.
      >
        {/* Render the Gemini summary inside the details block. */}
        {children}
      </RestaurantDetails>
      {/* Offer the review dialog only after the user signs in. */}
      {userId && (
        <Suspense fallback={<p>Loading...</p>}> {/* Show a short fallback while the dialog bundle loads. */}
          {/* Mount the dialog with the current draft and restaurant id. */}
          <ReviewDialog
            isOpen={isOpen} // Open or close the native dialog.
            handleClose={handleClose} // Close and clear the draft.
            review={review} // The draft text and rating.
            onChange={onChange} // Update the draft as the user types or picks stars.
            userId={userId} // Store this user on the submitted review.
            id={id} // Store this restaurant on the submitted review.
          />
        </Suspense>
      )}
    </>
  );
}
