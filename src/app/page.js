// Load the client component that draws the filterable restaurant grid.
import RestaurantListings from "@/src/components/RestaurantListings.jsx";
// Load the helper that reads the restaurants collection from Cloud Firestore.
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
// Load the helper that builds a Firebase app from the signed-in user's session cookie.
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
// Load the Firestore factory so this server component can query with that app.
import { getFirestore } from "firebase/firestore";

// Tell Next.js to render this route on the server for every request.
// Without this, the build would freeze an empty restaurant list into static HTML.
export const dynamic = "force-dynamic";

// Setting revalidate to 0 is another way to force a fresh server render.
// export const revalidate = 0;

// Home is an async Server Component, so Next.js waits for its data before sending HTML.
export default async function Home(props) {
  // Next.js passes the URL query string as a promise; await it before reading filters.
  const searchParams = await props.searchParams;
  // A URL such as ?city=London&category=Indian&sort=Review becomes the Firestore filter.
  // Those values are applied on the server so the first HTML already matches the filters.
  // Build a server Firebase app that carries the user's ID token when they are signed in.
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // Query Firestore for the restaurants that match the current filters.
  const restaurants = await getRestaurants(
    getFirestore(firebaseServerApp), // Attach Firestore to the authenticated server app.
    searchParams, // Pass category, city, price, and sort from the query string.
  );
  // Send the home page, with the server-fetched restaurants as the initial list.
  return (
    <main className="main__home">
      {/* Render the listings component inside the home page container. */}
      <RestaurantListings
        initialRestaurants={restaurants} // Seed the grid with data loaded on the server.
        searchParams={searchParams} // Keep the same filters for the live snapshot listener.
      />
    </main>
  );
}
