// Load the Cloud Storage helpers that upload a file and read its public URL.
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Load the client Storage bucket used by signed-in browsers.
import { storage } from "@/src/lib/firebase/clientApp";

// Load the Firestore helper that saves the new photo URL on the restaurant.
import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

// Upload a replacement photo and store its public URL on the restaurant document.
export async function updateRestaurantImage(restaurantId, image) {
  // Report upload failures instead of crashing the restaurant page.
  try {
    // Refuse to upload when the caller did not name a restaurant.
    if (!restaurantId) {
      // Surface a clear error so the caller knows which argument was missing.
      throw new Error("No restaurant ID has been provided.");
    }

    // Refuse to upload when the selected file is missing a name.
    if (!image || !image.name) {
      // Surface a clear error so the caller knows the file was invalid.
      throw new Error("A valid image has not been provided.");
    }

    // Put the file in Cloud Storage and get a URL the page can display.
    const publicImageUrl = await uploadImage(restaurantId, image);
    // Save that URL on the restaurant so the new photo survives a reload.
    await updateRestaurantImageReference(restaurantId, publicImageUrl);

    // Hand the URL back so the page can show the new photo immediately.
    return publicImageUrl;
  } catch (error) {
    // Log the upload or Firestore error and leave the existing photo in place.
    console.error("Error processing request:", error);
  }
}

// Upload one image file under images/<restaurantId>/<file name>.
async function uploadImage(restaurantId, image) {
  // Build a Storage path that groups photos by restaurant.
  const filePath = `images/${restaurantId}/${image.name}`;
  // Point at that path in the default Storage bucket.
  const newImageRef = ref(storage, filePath);
  // Upload the file bytes and wait until Cloud Storage finishes.
  await uploadBytesResumable(newImageRef, image);

  // Return a public download URL for the file that was just stored.
  return await getDownloadURL(newImageRef);
}
