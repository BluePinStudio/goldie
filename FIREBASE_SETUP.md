# Firebase setup

1. Create a Firebase project and register a Web app. Enable **Google** under Authentication → Sign-in method. Add the deployed site host (and `localhost` for local testing) to Authentication → Settings → Authorized domains.
2. Create a Realtime Database. Copy its database URL and the Web app config into `firebase-config.js`. These web config values are public; never put a service-account key in this website.
3. In Realtime Database → Rules, publish the contents of `database.rules.json`.
4. Sign in to the site once with each staff Google account. For each account, copy its Firebase user UID from the “not approved” message, then add this record in the Realtime Database Data view:

   ```json
   {
     "members": {
       "FIREBASE_USER_UID": {
         "active": true
       }
     }
   }
   ```

   Add each UID as a separate child under `members`. Only accounts with `active: true` can read or change shared job bags. Member records are managed in the Firebase console, not by the website.
5. Serve the folder over HTTP(S) (not by opening `index.html` directly). Job bags are shared in `days/YYYY-MM-DD/bags`, with the date based on `America/Toronto`.
