# Marketing

## `posters/`
Empty — drop poster designs, flyers, and any other visual promo material here.

## `video/`
`bay-launch-video-prompt.md` — the full scene-by-scene prompt for the launch video, ready to paste into a text-to-video tool (Sora/Veo/Runway) or hand to a video editor.

## `brand-assets/`
`bay-logo.png` — the transparent Bay glyph, for anyone building posters/social assets without digging through the app's source tree. The canonical copy the app itself uses lives at `../public/logo/bay-logo.png`.

## The one link to send anyone

**https://iam-dglory.github.io/bay-au-parking-finder/landing.html**

One page, two buttons (Try Bay / Give feedback), the honest coverage disclaimer, and the Google Play early-access waitlist. Use this instead of separate app/feedback links everywhere.

## Rollout plan (as of this pilot)

1. **Now — friends and known contacts.** Fix real bugs before anyone outside your circle sees it.
2. **Small expansion.** RMIT/Melbourne Uni student groups, Reddit r/melbourne, local Facebook groups (City of Melbourne community, Docklands/North Melbourne/Kensington residents) — once feedback stops surfacing new bugs.
3. **Play Store live + wider push** — video, more subreddits, local press angle (Time Out/Broadsheet human-interest style), only once the waitlist and survey signal real demand.

Track it with the `pilot_dashboard` SQL view (test users, actual searches, survey responses, waitlist signups, repeat users) rather than vanity impressions — see `../docs/feature-tracker.pdf` for the full v1/v2 feature plan this is tracked against.
