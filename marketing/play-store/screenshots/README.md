# Google Play screenshot set

Captured from the current BAY web application at a 390 × 844 CSS-pixel Android-sized viewport on 5 November 2026. Device scale produced 780 × 1688 PNG files. All screens use actual application data and UI; no booking, price, review or usage statistic was fabricated.

| Order | File | Suggested listing headline | Verified content |
|---:|---|---|---|
| 1 | `01-melbourne-map.png` | Find parking around your destination | Real Melbourne map, parking areas and mapped bays |
| 2 | `02-parking-list.png` | Compare nearby parking information | Actual list results, source availability and a published tariff example |
| 3 | `03-parking-details.png` | Check details before directions | Real parking-area detail sheet and source disclaimer |
| 4 | `04-report-information.png` | Help improve parking information | Structured incorrect-information report flow |
| 5 | `05-filters.png` | Refine the map to suit your trip | Real radius, type and availability filters |
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
file marketing/play-store/screenshots/*.png
```

Expected result for every asset: `PNG image data, 780 x 1688`.

