// Firebase web configuration is public client configuration, not a server credential.
// Fill databaseURL from Firebase Console > Realtime Database.
export const firebaseConfig = {
  apiKey: "AIzaSyBSLkLyeDSx0MBB0HPO9jZ1oIDb_xK4WfI",
  authDomain: "price2000-40be0.firebaseapp.com",
  databaseURL: "https://price2000-40be0-default-rtdb.firebaseio.com",
  projectId: "price2000-40be0",
  storageBucket: "price2000-40be0.firebasestorage.app",
  messagingSenderId: "36379241022",
  appId: "1:36379241022:web:74d43a871ec79eec833f6f",
};

const requiredConfigKeys = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
export const isFirebaseConfigured = requiredConfigKeys.every(
  (key) => typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim() !== "",
);
