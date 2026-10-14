// Load the Genkit Google AI plugin used to call Gemini.
import { googleAI } from "@genkit-ai/googleai";
// Load Genkit so this server component can generate a summary.
import { genkit } from "genkit";
// Load the Firestore helper that reads every review for one restaurant.
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js";
// Load the helper that rebuilds the signed-in user's Firebase app on the server.
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
// Load the Firestore factory for that server app.
import { getFirestore } from "firebase/firestore";

// The codelab used gemini20Flash. Google shut that model down on June 1, 2026.
// Gemini 3.5 Flash-Lite is a current model new API keys can call for a short summary.
const summaryModel = "gemini-3.5-flash-lite";

// Ask Gemini for a one-sentence summary of this restaurant's reviews.
export async function GeminiSummary({ restaurantId }) {
  // Rebuild the Firebase server app from the user's session cookie.
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // Read this restaurant's reviews, newest first.
  const reviews = await getReviewsByRestaurantId(
    getFirestore(firebaseServerApp), // Query with the authenticated server app.
    restaurantId, // Limit the query to this restaurant's ratings.
  );

  // Skip the model call when this restaurant has no review text yet.
  if (!reviews || reviews.length === 0) {
    // Tell the reader that Gemini is waiting for the first review.
    return (
      <div className="restaurant__review_summary">
        {/* Explain why there is no generated sentence. */}
        <p>No reviews to summarize yet.</p>
      </div>
    );
  }

  // Separate reviews with a character that is unlikely to appear in the text.
  const reviewSeparator = "@";
  // Ask for one sentence so the summary stays short enough for the restaurant page.
  const prompt = `
    Based on the following restaurant reviews,
    where each review is separated by a '${reviewSeparator}' character,
    create a one-sentence summary of what people think of the restaurant.

    Here are the reviews: ${reviews.map((review) => review.text).join(reviewSeparator)}
  `;

  // Show a fallback message if the API key is missing or Gemini fails.
  try {
    // Genkit reads this key from the environment. App Hosting supplies it from Secret Manager.
    if (!process.env.GEMINI_API_KEY) {
      // Make sure GEMINI_API_KEY environment variable is set:
      // https://genkit.dev/docs/get-started/
      // Stop before calling Gemini when the key was never configured.
      throw new Error(
        'GEMINI_API_KEY not set. Set it with "firebase apphosting:secrets:set GEMINI_API_KEY"',
      );
    }

    // Configure a Genkit instance with the Google AI plugin and a current Gemini model.
    const ai = genkit({
      plugins: [googleAI()], // Connect Genkit to the Gemini API.
      model: googleAI.model(summaryModel), // Use a live model instead of shut-down Gemini 2.0 Flash.
    });
    // Send the reviews and keep the one-sentence summary.
    const { text } = await ai.generate(prompt);

    // Render the summary under the restaurant details.
    return (
      <div className="restaurant__review_summary">
        {/* Show the sentence Gemini wrote. */}
        <p>{text}</p>
        {/* Credit the model so readers know the sentence is generated. */}
        <p>✨ Summarized with Gemini</p>
      </div>
    );
  } catch (e) {
    // Log the failure for debugging.
    console.error(e);
    // Keep the page usable when summarization fails.
    return <p>Error summarizing reviews.</p>;
  }
}

// Show this placeholder while the summary server component is still loading.
export function GeminiSummarySkeleton() {
  // Match the summary layout so the page does not jump when the sentence arrives.
  return (
    <div className="restaurant__review_summary">
      {/* Tell the reader that Gemini is still reading the reviews. */}
      <p>✨ Summarizing reviews with Gemini...</p>
    </div>
  );
}
