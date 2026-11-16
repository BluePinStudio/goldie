# Firebase setup

1. Create a Firebase project and register a Web app. Enable **Google** and **Email/Password** under Authentication → Sign-in method. Add the deployed site host (and `localhost` for local testing) to Authentication → Settings → Authorized domains.
2. Create a Realtime Database. Copy its database URL and the Web app config into `firebase-config.js`. These web config values are public; never put a service-account key in this website.
3. In Realtime Database → Rules, publish the current contents of `database.rules.json`. Republish the rules after updating this file.
4. Have each staff member sign in or sign up with Google or email. Copy their Firebase user UID from the access screen; new accounts need administrator approval before they can use the app. In the Realtime Database **Data** tab, add a `members` object at the database root, with one child per UID. Example:

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

   Replace the example UID strings with the actual UIDs from Firebase Authentication → Users. Choose `editor` for job entry/deletion and **Journal** access, or `viewer` for read-only **Summary** and **Lookup** access. Update existing member records to include a role. Only active editors can write; active editors and viewers can read all logged job bags. Member records and role changes are managed in the Firebase console, not by the website. **Remember me** uses persistent sign-in; when unchecked, the session ends when the browser session closes.
5. Serve the folder over HTTP(S) (not by opening `index.html` directly). Job bags are shared in `days/YYYY-MM-DD/bags`, with the date based on `America/Toronto`. Lookup fetches the `days` data when opened and searches references in the browser. The database rules allow active editors and viewers to read all job bags for this feature.
6. Editors can add job bags. Removing an entry marks its `deleted` field `true`; deleted bags are excluded from the Journal, Lookup, and summary calculations, but remain in the database. To restore one, an editor can set `deleted` to `false` (or remove that field) in Realtime Database. Both roles can open **Summary**, select a day, and view daily totals with a calendar-week chart (Sunday–Saturday) or a calendar-month chart. Weekly and monthly averages use the number of dates with logged bags as workdays.
7. Activity is stored at `activity/<uid>` and `activityDetails/<uid>` in Realtime Database. The activity record includes `lastUsedAt` (Unix milliseconds), `loginsLast7Days`, `loginsLast31Days`, recent `loginEvents`, and the cumulative `jobBagsInspected` count. A login is counted once per Firebase sign-in, and a bag inspection is counted each time its details are opened in **Lookup**. The details record lists inspected bags under `inspectedJobBags/<job-date>/<job-id>`, with each entry's reference and most recent inspection time; it lists selected calendar dates under `calendarDaysViewed/<date>`, with the most recent click time. Repeat inspections update the bag's timestamp while still incrementing the count. Activity writes are throttled to once per minute except for sign-ins, bag inspections, and calendar-day clicks. Rolling login counts refresh on the user's next activity, so they may be stale while that user is inactive. On first use, Firebase's latest sign-in timestamp may be counted if it is within 31 days; earlier sign-in history cannot be reconstructed.
