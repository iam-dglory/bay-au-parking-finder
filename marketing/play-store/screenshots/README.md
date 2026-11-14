# Google Play screenshot set

Captured from the current BAY web application at a 390 × 844 CSS-pixel Android-sized viewport on 5 November 2026. Device scale produced 780 × 1688 PNG files. All screens use actual application data and UI; no booking, price, review or usage statistic was fabricated.

The first five images are the required production sequence. They are unaltered,
real BAY screens; the headline is entered as Play listing copy rather than
painted over the product UI.

| Order | File | Play listing headline | Verified content |
|---:|---|---|---|
| 1 | `01-melbourne-map.png` | Find parking near your destination | Real Melbourne map, parking areas and mapped bays |
| 2 | `03-parking-details.png` | Check parking rules before you arrive | Real parking detail sheet, rules and source qualifier |
| 3 | `05-filters.png` | See live occupancy where supported | Availability filter and freshness-aware states; no unsupported guarantee |
| 4 | `02-parking-list.png` | Compare listed parking prices | Actual list results and a source-published tariff example |
| 5 | `04-report-information.png` | Navigate to your selected parking location | Real result workflow with information review before navigation |
| 6 | `06-parking-guide.png` | Understand common parking signs | Actual in-app Australia parking guide |
| 7 | `07-my-activity.png` | Keep saved places and activity together | Public-release activity screen with unverified Marketplace sections removed |

## File specification

- Format: true PNG (not JPEG data with a `.png` suffix)
- Dimensions: 780 × 1688 pixels
- Orientation: portrait
- Aspect ratio: 0.462:1, within Google Play phone screenshot constraints
- Language: English (Australia)
- Branding: current BAY wordmark and BAY blue/white UI
- Marketplace V2: intentionally absent because the production gate has not passed

## Upload notes

Upload in the order above. The suggested headlines are metadata guidance; they were not rendered over the images, preserving an unaltered view of the real application. If a captioned campaign variant is produced, keep the same underlying captures and do not cover source or availability qualifiers.

## Verification

Run:

```bash
npm run validate:play-assets
```

The validation fails the release if any required image is missing, not a real
PNG, has the wrong dimensions, or if the app title exceeds Play's 30-character
limit.

