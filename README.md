### Friendly Eats with Next.js + Firebase

Restaurant review app from the Firebase codelab [Integrate Firebase with a Next.js app](https://firebase.google.com/codelabs/firebase-nextjs).

The app uses:

- Google sign-in through Firebase Authentication
- Cloud Firestore for restaurants and reviews
- Cloud Storage for restaurant photos
- Firebase App Hosting for deployment

`initializeApp()` is called with no arguments. App Hosting injects the Firebase config when the app is deployed. Locally, set `FIREBASE_WEBAPP_CONFIG` to the web app config JSON from the Firebase console before running `npm run dev`.

#### Finish setup in the Firebase console

1. Create a Firebase project and upgrade it to the Blaze plan.
2. Register a web app. Leave Firebase Hosting unchecked.
3. Enable Google as an Authentication sign-in provider.
4. Create a Firestore database in test mode, then deploy the rules in this repo.
5. Create a Cloud Storage bucket in test mode, then deploy the storage rules in this repo.
6. In App Hosting, create a backend named `friendlyeats-codelab` that watches the `main` branch of this GitHub repository, with the root directory `/` and automatic rollouts enabled.
7. Add the App Hosting domain to Authentication > Settings > Authorized domains.

Deploy the security rules after `firebase login` and `firebase use --add`:

```sh
firebase deploy --only firestore,storage
```

#### Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000`, sign in with Google, then choose **Add sample restaurants**.
