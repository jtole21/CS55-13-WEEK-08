"use client"; // This file runs in the browser so it can open a dialog and track form state.

// This component handles the review dialog and uses a Next.js Server Action to save the form.

// Load the hooks that hold the dialog element and open it before the browser paints.
import { useLayoutEffect, useRef } from "react";
// Load the star picker that writes the rating into the review form.
import RatingPicker from "@/src/components/RatingPicker.jsx";
// Load the Server Action that saves the submitted review in Firestore.
import { handleReviewFormSubmission } from "@/src/app/actions.js";

// Render the modal where a signed-in user writes a restaurant review.
const ReviewDialog = ({
  isOpen, // True when the parent wants the dialog visible.
  handleClose, // Called to hide the dialog and clear the draft.
  review, // The draft text and rating controlled by the parent.
  onChange, // Updates one field of the draft review.
  userId, // The signed-in user, stored with the review.
  id, // The restaurant this review belongs to.
}) => {
  // Keep a reference to the native dialog element.
  const dialog = useRef();

  // Dialogs only render their backdrop when opened with showModal.
  useLayoutEffect(() => {
    // Show the modal backdrop when the parent opens the dialog.
    if (isOpen) {
      // showModal displays the dialog on top of the page.
      dialog.current.showModal();
    } else {
      // Close the dialog when the parent sets isOpen to false.
      dialog.current.close();
    }
  }, [isOpen, dialog]); // Re-run when the open state or the dialog ref changes.

  // Close the dialog when the user clicks the backdrop outside the form.
  const handleClick = (e) => {
    // The backdrop click lands on the dialog element itself.
    if (e.target === dialog.current) {
      // Ask the parent to close and reset the draft.
      handleClose();
    }
  };

  // Render the dialog and the review form.
  return (
    // Attach the ref and listen for clicks on the backdrop.
    <dialog ref={dialog} onMouseDown={handleClick}>
      {/* Post the form through the Server Action, then close the dialog. */}
      <form
        action={handleReviewFormSubmission} // Send the form fields to the server action.
        onSubmit={() => {
          // Hide the dialog as soon as the user submits.
          handleClose();
        }}
      >
        {/* Title the dialog so the user knows they are adding a review. */}
        <header>
          {/* Display the dialog heading. */}
          <h3>Add your review</h3>
        </header>
        {/* Collect the star rating, the review text, and the hidden ids. */}
        <article>
          {/* Let the user pick a star rating. */}
          <RatingPicker />

          {/* Hold the text field the user types into. */}
          <p>
            {/* Bind the text input to the draft review. */}
            <input
              type="text" // Accept a single-line review.
              name="text" // Match the field the server action reads with data.get("text").
              id="review" // Give the input an id for the form.
              placeholder="Write your thoughts here" // Prompt the user before they type.
              required // Block submit until the review text is present.
              value={review.text} // Show the current draft text.
              onChange={(e) => onChange(e.target.value, "text")} // Save each keystroke into the draft.
            />
          </p>

          {/* Send the restaurant id with the form without showing it. */}
          <input type="hidden" name="restaurantId" value={id} />
          {/* Send the signed-in user id with the form without showing it. */}
          <input type="hidden" name="userId" value={userId} />
        </article>
        {/* Offer cancel and submit actions. */}
        <footer>
          {/* Group the two buttons. */}
          <menu>
            {/* Discard the draft and close the dialog. */}
            <button
              autoFocus // Focus cancel first so Enter does not submit by accident.
              type="reset" // Clear the form fields.
              onClick={handleClose} // Close the dialog when cancel is clicked.
              className="button--cancel" // Style this button as cancel.
            >
              Cancel
            </button>
            {/* Save the review through the form action. */}
            <button type="submit" value="confirm" className="button--confirm">
              Submit
            </button>
          </menu>
        </footer>
      </form>
    </dialog>
  );
};

// Export the dialog so the restaurant page can render it.
export default ReviewDialog;
