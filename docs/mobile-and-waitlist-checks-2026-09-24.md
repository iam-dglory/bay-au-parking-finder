# Phone layout and waitlist — 24 September 2026

| ID | Issue | Change | Verification |
|---|---|---|---|
| UI-01 | Header hides map | Compact vacancy summary; expandable details and filters | 390 × 664 browser: map 372px closed, 338px inside 340px bordered minimum with filters open |
| UI-02 | Expanded content cannot scroll | Home scrolls when content exceeds viewport; map keeps minimum height | Open filters: 661px content in 590px scroll area |
| UI-03 | Add-sign form squeezed | One scrolling page, shorter fixed map | Scrolled to Notes and Save button; navigation stays visible |
| UI-04 | Welcome says Test User | Professional welcome; no tester number shown | Welcome inspected in browser |
| UI-05 | Guide accessibility | Existing independent scrolling retained; corrected 2P explanation | 991px content in 590px area; guide scrolled |
| WL-01 | Shareable signup | Dedicated waitlist.html with privacy disclosure and email-only requirement | Form submitted successfully to existing Supabase table using QA address |

QA signup: `bay-qa-20260924@example.com`, name “QA test — exclude from invitations”. Exclude this record from counts/invitations; no real personal email was used. Signup captures interest; invitation email automation has not been added.

Build and 38 existing unit tests passed. Lint retains one pre-existing cleanup-ref warning in useNearbyParking. Browser checks cover layout and signup, not physical sensor accuracy. iOS/Android device and keyboard testing remain necessary.

Reddit: r/SideProject draft saved; not published. User approval is required before posting. Community About/compose pages describe sharing projects and constructive feedback; no additional community-specific rules were shown there.
