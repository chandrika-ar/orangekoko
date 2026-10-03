# Cards and jewelry operations

## Listing actual products

The shop now sells Japanese artisan-made jewelry. Legacy jewellery documents without `jewelryKind: artisan` are omitted from all public catalogue queries, including direct product URLs and checkout. They are retained rather than relabelled. Enter verified `maker`, `madeIn` and optional `craftTechnique` for real artisan products. No fictional catalogue is used.

Use Sanity Studio to create individual card designs in the Handmade Cards category with `packSize: 1`, real photographs, a single-card EUR price, materials, measurements and description. Set optional `threeCardPriceEur` below three times the single price to offer three of the same design for less. Complete groups of three are discounted automatically in the cart and Stripe checkout; remainder cards use the single price. All quantities consume the same single-card stock. Do not create separate three-card set listings for the public card catalogue.

Card-only orders must contain at least two physical cards in total, including mixed designs. Orders containing jewelry may add one card. This is enforced in the cart and again using freshly fetched products before Stripe checkout. On each jewelry listing, select up to three `recommendedCards` in the Studio; shared collection tags are a fallback. Only those matching available single-card listings are recommended. Card pages never recommend jewelry.

Ready-to-ship listings use `stock`. Preorder listings use `preorderCapacity` and a future `dispatchBy` date. Use separate listings for ready stock and a preorder batch of the same design to make the timing unambiguous. Preorder capacity is a finite production commitment. A mixed order is dispatched together by the latest advertised date; no separate split shipment is promised.

## Inventory and payments

The existing Stripe webhook requires its signing secret and the Sanity editor token. Subscribe it to:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Checkout refuses to start without the write client and webhook secret. Prices and stock are read afresh on the server. All cart lines are reserved in a revision-guarded Sanity transaction after creating a 30-minute Stripe session, before returning its URL. Jewelry is temporarily marked unavailable; cards decrement their stock or preorder capacity. Failed reservations expire the Stripe session. Paid reservations remain consumed. Expired sessions or failed asynchronous payments release a held reservation exactly once via revision guards. Returning from Stripe cancellation invokes a same-origin server endpoint that checks an HttpOnly session cookie against a private Stripe cancellation token, expires an open session, and releases its reservation for immediate retry. Unpaid completion does not mark a reservation paid. Webhook settlement errors return HTTP 500 for Stripe retries.

Configure and verify delivery of the expiration/failure events before selling cards. Failed webhook delivery can leave inventory held until retried. Do not delete inventoryReservation documents while a checkout is active. This stock handling covers this website only; sales elsewhere still need manual reconciliation.

## Shipping assessment

No reduced card rate has been invented. Existing rates remain EUR 9.90 tracked / EUR 24.90 express, with free standard shipping at EUR 120. Weigh and measure a finished single-card parcel, a three-card parcel, and a mixed jewelry/card parcel. Record `packedWeightGrams` and separately record package dimensions, destination, tracking and packaging cost. Compare actual carrier quotations before changing the checkout rate. The site explains that the final shipping amount appears at checkout. Preorder checkout omits transit estimates that would start before dispatch.

## Verification and assets

Run `npm test`, `npx tsc --noEmit`, and `npm run build`. All ten message files include the minimum card quantity, three-card saving, preorder messages, jewelry-to-card pairing, and delivery guidance. The homepage gives the two product families equal collection panels and equal new-arrival columns. Jewelry subcategories live under Handmade Jewelry in the main navigation.

The built-in image generation tool created three editorial assets: `public/created-curated-hero.webp` (handmade paper cards and Japanese artisan-style jewelry, with at least half the composition devoted to cards), `public/handmade-cards-editorial.webp` (cards and envelopes), and `public/handmade-jewelry-editorial.webp` (ear clips, pierced earrings and a necklace). Each uses warm ivory, navy and orange, natural light, and crisp craft textures with no logos or text. They are brand imagery; product listings still require real product photographs. Per the owner's request, no illustration caption is displayed.
