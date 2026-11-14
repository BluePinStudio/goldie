# Firebase setup

1. Create a Firebase project and register a Web app. Enable **Google** under Authentication → Sign-in method. Add the deployed site host (and `localhost` for local testing) to Authentication → Settings → Authorized domains.
2. Create a Realtime Database. Copy its database URL and the Web app config into `firebase-config.js`. These web config values are public; never put a service-account key in this website.
3. In Realtime Database → Rules, publish the current contents of `database.rules.json`. Republish the rules after updating this file.
4. Sign in to the site once with each staff Google account. For each account, copy its Firebase user UID from the access screen. In the Realtime Database **Data** tab, add a `members` object at the database root, with one child per UID. Example:

   ```json
   {
     "members": {
       "uid-of-editor-from-firebase-auth": {
         "active": true,
         "role": "editor"
       },
       "uid-of-viewer-from-firebase-auth": {
         "active": true,
         "role": "viewer"
       }
     }
   }
   ```

   Replace the example UID strings with the actual UIDs from Firebase Authentication → Users. Choose `editor` for job entry/deletion access or `viewer` for read-only access. Update existing member records to include a role. Only active editors can write; active editors and viewers can read. Member records and role changes are managed in the Firebase console, not by the website.
5. Serve the folder over HTTP(S) (not by opening `index.html` directly). Job bags are shared in `days/YYYY-MM-DD/bags`, with the date based on `America/Toronto`.
6. Editors can add and remove job bags. Both roles can open **Summary**, select a day, and view daily totals with a week chart (Tuesday–Saturday) or a calendar-month chart.
