# Bay iOS App Store readiness

Last reviewed: 11 October 2026 (Australia/Melbourne)

## Prepared in source

| Item | Status | Evidence |
| --- | --- | --- |
| Native iOS target | Ready for Xcode archive | `ios/App/App.xcodeproj` |
| Bundle identifier | Set | `au.com.bayparking.app` |
| Version | 1.0 (build 1) | `ios/App/App.xcodeproj/project.pbxproj` |
| Minimum iOS version | iOS 15 | project settings and Capacitor packages |
| Location disclosure | Added | `NSLocationWhenInUseUsageDescription` in `ios/App/App/Info.plist` |
| Camera and photo-library disclosures | Added for the optional sign-photo submission feature | `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` |
| Native plugins | Camera and geolocation included | `ios/App/CapApp-SPM/Package.swift` |
| Current web UI bundled for iOS | Synced | `ios/App/App/public/` created by Capacitor sync |
| Web verification | Passed | 82 unit tests, lint, production web build |

## UI included in the next native build

- Map-first experience after a location is chosen, rather than a long landing screen.
- Saved Home and Work locations, with the last selected place restored at launch.
- Smaller map header and collapsed filters, preserving map space on phones.
- Country-aware nearby parking catalogues with price only where a source provides it.
- Bay does not claim a live space is free unless a reliable fresh source exists.

## Required before TestFlight or App Store review

1. Sign in to App Store Connect using an Apple Developer Program account with App Manager or Admin permission. The current browser session is not authenticated.
2. Create the **Bay** app record for bundle ID `au.com.bayparking.app`, then configure automatic signing with the Apple Developer team in Xcode.
3. Install full Xcode on this Mac. Only Apple Command Line Tools are currently active, so an iOS archive cannot be built or signed here yet.
4. Build and upload an archive, then complete App Store Connect metadata: category, support URL, privacy-policy URL, age rating, pricing/availability, screenshots and review contact details.
5. Complete App Privacy labels from the actual implementation. Bay uses precise location while in use; optional sign submissions may include a photo and typed rule/address data. Reconcile the final disclosure with the published privacy policy and Supabase data flows before submission.
6. Provide TestFlight beta description, feedback email and beta review notes. Apple reviews the first external TestFlight build before a public TestFlight link can be shared.
7. Test on physical iPhone hardware: location permission, saved Home/Work restoration, maps, directions, sign-photo camera/gallery selection, network failure states and accessibility.

## Current blockers

- App Store Connect returned an unauthenticated sign-in result in the current browser session.
- Full Xcode is not installed/selected, so archive, code signing and device tests cannot be completed yet.

