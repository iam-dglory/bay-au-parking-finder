# Bay on iPhone

The iOS app is the same web app as Android, wrapped by Capacitor in
`ios/App/App.xcodeproj` (bundle ID `au.com.bayparking.app`, iOS 15+).
Every change to `main` is compile-checked by `.github/workflows/ios-build.yml`
on a GitHub macOS runner (unsigned simulator build, no Apple account needed).

## Put it on your own iPhone (free, from a Mac)

You need a Mac with **full Xcode** (App Store, not just Command Line Tools)
and an Apple ID. No paid developer account is needed for this route, but the
app stops opening after **7 days** and has to be re-run from Xcode.

1. Get the code and build the web part:
   ```sh
   git pull
   npm ci
   npm run cap:ios
   ```
2. Open the project: `open ios/App/App.xcodeproj`
   (first open takes a minute while Xcode fetches the Capacitor packages).
3. Xcode -> Settings -> Accounts -> **+** -> sign in with your Apple ID.
4. Click the **App** project -> **App** target -> **Signing & Capabilities**:
   tick *Automatically manage signing* and pick your *(Personal Team)*.
   If Xcode says the bundle ID is taken, change it to something unique such
   as `au.com.bayparking.app.reddy` (only for your personal build -- don't
   commit that change).
5. Plug the iPhone in with a cable, unlock it and tap **Trust**. On the phone,
   turn on Settings -> Privacy & Security -> **Developer Mode** (it restarts).
6. Choose the iPhone at the top of Xcode and press **Run** (the play button).
7. First launch only: on the phone open Settings -> General ->
   **VPN & Device Management**, tap your Apple ID and **Trust** it.

After any code change: `npm run cap:ios`, then press Run again.

## Simulator (no phone)

`npm run cap:ios`, open the project, choose any iPhone simulator, press Run.
Use Features -> Location -> Custom Location in the Simulator to put yourself
in Melbourne (e.g. -37.8136, 144.9631).

## Testers / App Store (paid)

Sharing with other iPhones (TestFlight) or publishing needs the Apple
Developer Program (A$149/year). Then: create the app in App Store Connect,
pick that team in step 4, Product -> Archive -> Distribute App -> TestFlight.
The remaining store checklist is in `docs/ios-app-store-readiness-2026-10-11.md`.

## What to check on a real iPhone

- Location prompt appears and the map centres on you.
- "Get directions" opens Apple Maps (or Google Maps / Waze if chosen).
- Parking timer reminder arrives with the app closed (allow notifications).
- Sign-photo submission: camera and photo-library prompts.
- Header and bottom sheets clear the notch and home bar.
