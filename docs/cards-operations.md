# Cards and jewelry operations

## Listing actual products

The shop now sells Japanese artisan-made jewelry. Legacy jewellery documents without `jewelryKind: artisan` are omitted from all public catalogue queries, including direct product URLs and checkout. They are retained rather than relabelled. Enter verified `maker`, `madeIn` and optional `craftTechnique` for real artisan products. No fictional catalogue is used.

Use Sanity Studio to create products in the Handmade Cards category. Each single-card listing and each three-card set is a separate SKU with its own EUR price, real photographs, materials, measurements, condition, and description. Stock is measured in **packs**: five three-card packs means fifteen physical cards. Allocate physical stock to one listing only; single and set inventories must not share the same cards.

Ready-to-ship listings use `stock`. Preorder listings use `preorderCapacity` and a future `dispatchBy` date. Use separate listings for ready stock and a preorder batch of the same design to make the timing unambiguous. Preorder capacity is a finite production commitment. A mixed order is dispatched together by the latest advertised date; no separate split shipment is promised.

## Inventory and payments

The existing Stripe webhook requires its signing secret and the Sanity editor token. Subscribe it to:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Checkout refuses to start without the write client and webhook secret. Prices and stock are read afresh on the server. All cart lines are reserved in a revision-guarded Sanity transaction after creating a 30-minute Stripe session, before returning its URL. Jewelry is temporarily marked unavailable; card packs decrement their stock or preorder capacity. Failed reservations expire the Stripe session. Paid reservations remain consumed. Expired sessions or failed asynchronous payments release a held reservation exactly once via revision guards. Returning from Stripe cancellation invokes a same-origin server endpoint that checks an HttpOnly session cookie against a private Stripe cancellation token, expires an open session, and releases its reservation for immediate retry. Unpaid completion does not mark a reservation paid. Webhook settlement errors return HTTP 500 for Stripe retries.

Configure and verify delivery of the expiration/failure events before selling cards. Failed webhook delivery can leave inventory held until retried. Do not delete inventoryReservation documents while a checkout is active. This stock handling covers this website only; sales elsewhere still need manual reconciliation.

## Shipping assessment

No reduced card rate has been invented. Existing rates remain EUR 9.90 tracked / EUR 24.90 express, with free standard shipping at EUR 120. Weigh and measure a finished single-card parcel, a three-card parcel, and a mixed jewelry/card parcel. Record `packedWeightGrams` and separately record package dimensions, destination, tracking and packaging cost. Compare actual carrier quotations before changing the checkout rate. The site explains that the final shipping amount appears at checkout. Preorder checkout omits transit estimates that would start before dispatch.

## Verification and assets

Run `npm test`, `npx tsc --noEmit`, and `npm run build`. All ten message files include localized card purchase methods, preorder messages, pairing and delivery guidance. The hero uses a generated 1536 × 1024 brand illustration, not stock photography or a representation of items for sale; that distinction is captioned on the page.

Hero brief: an editorial gouache/cut-paper illustration of handmade greeting cards and Japanese artisan-style jewelry on a tabletop, in ink navy, ivory and orange, with no text or logos. Created with the built-in image generation tool and stored as `public/created-curated-hero.webp`.
