# Photo ordering APIs & platforms — research notes

**Date:** 2026-08-05  
**Context for Heron / samlanctot.com:** Want a photo ordering system for albums (family-friendly). Prefer **not** holding customer money. Prefer real print preview / framing UX (PrintKit cart handoff was too bare). Website is Next.js, not a native mobile app.

**How to read this:**  
1. **Hosted MoR** = visitor pays the provider (you don’t run Stripe for prints).  
2. **You MoR** = visitor pays you; you pay the lab.  
3. **Complexity** = engineering effort on Heron specifically.

---

## Executive summary

| Fit for “family orders prints from my albums, I don’t hold money” | Options |
|-------------------------------------------------------------------|---------|
| Best *web* handoff without holding money | **Peecho** (Prodigi Group) — product picker + checkout; weaker live crop/preview |
| Best *photo-product builder* UX where they charge the customer | **Fujifilm SPA SDK** — mainly **iOS/Android**; web REST is sales-gated |
| Best preview/framing, but **you** hold money | **WHCC Editor API** |
| Best “relatives actually finish checkout” with least custom code | **Pic-Time / Pixieset** (SaaS galleries, not a thin API on Heron) |
| Avoid as primary UX | **PrintKit → Social Print Studio cart** (works, no preview/framing flow) |
| Avoid | **Prodigi Print Shop** (EOL) |

**Public reviews gap:** Fujifilm SPA / Peecho **API** integration has almost no Reddit developer threads. Most social proof is Trustpilot (Peecho/Gelato/SPS), App Store (SPS app), and photographer Reddit for Pic-Time/Pixieset/WHCC **print quality**.

---

## Decision matrix (API / platform)

| Provider | Contract / signup | Hosted checkout / editor? | Who takes payment? | Complexity on Heron | Photo UX (preview / frames) |
|----------|-------------------|---------------------------|--------------------|---------------------|-----------------------------|
| Fujifilm SPA SDK | Self-serve developer agreement | Full Fuji UI (mobile) | **Fujifilm** | Low *if* mobile app; **high** for website | Strong |
| Fujifilm SPA REST | Self-serve + sales for docs | Cart/payment Fuji; you build UI | **Fujifilm** | Medium–high | Only as good as your UI |
| Peecho | Free account | Print Button / brandable checkout | **Peecho** | Low | Product list incl. framed/canvas; weak interactive preview |
| PrintKit / Social Print Studio | No key required for basic | Cart URL only | **SPS** | Very low | Weak (cart dump) |
| Prodigi Print Shop | Free | Was deep-link shop | Prodigi | Low | Middling | **EOL** |
| Prodigi / Gelato / Printful API | Free / self-serve | No | **You** | Medium–high + Stripe | You build |
| WHCC Editor + Order APIs | **B2B** credentials / project | White-label editors | **You** | High | Excellent |
| Printbox Gallery Link | **Enterprise B2B** (SaaS + onboarding) | Editor with gallery photos | Usually your store | Sales cycle + integrate | Excellent |
| Pic-Time / Pixieset | SaaS subscription | Gallery + print store | Platform and/or you | Low–medium but **different product** | Strong |

---

## Provider notes

### Fujifilm Smart Publishing (SPA)

- **Official:** https://www.fujifilmapi.com/  
- **Portal / signup:** https://spa.fujifilmapi.com/home  
- **About SPA:** https://spa.fujifilmapi.com/home/about-the-smart-publish-api  
- **Integrate overview (mentions API captures payment, product previews):** https://www.fujifilm.com/us/en/business/photofinishing/personalized-photo-products/integrate-with-us  
- **Developer agreement (Fujifilm charges customer card; you get margin via PayPal if retail > base):** https://stage.fujifilmapi.com/sign-up/developer-agreement  
- **iOS sample:** https://github.com/fujifilmssd/iOS-Fujifilm-SPA-SDK-SampleApp  
- **Android sample:** https://github.com/fujifilmssd/Android-Fujifilm-SPA-SDK-SampleApp  
- **REST docs:** contact `spasales@fujifilm.com` (not fully public)

**User experiences online:** Almost no independent “I shipped Fuji SPA” Reddit posts found. Evidence is mostly official samples + agreement text. Consumer trust in Fujifilm/Walmart photo fulfillment is separate from API DX.

**Implication for Heron:** Money model matches (they hold funds). Website integration is the hard part unless you accept a companion mobile app.

---

### Peecho (Prodigi Group)

- **Home:** https://www.peecho.com/  
- **Checkout product:** https://www.peecho.com/solutions/checkout  
- **Print Button:** https://www.peecho.com/solutions/button  
- **Print Button tech:** https://support.peecho.com/hc/en-us/articles/360017392160-Print-Button-Technical-information  
- **Wall art / framed:** https://www.peecho.com/products/wall-art  
- **Acquisition by Prodigi:** https://www.prodigi.com/blog/prodigi-acquires-cloud-printing-platform-peecho/  

**User experiences (social / review sites):**

- Trustpilot (AU mirror, same reviews): https://au.trustpilot.com/review/peecho.com  
- Aggregated ratings: https://ratingfacts.com/reviews/peecho.com  
- Supplier overview: https://printsgram.com/print-on-demand/suppliers/peecho/  

**Sentiment:** Polarized — praise for quality/speed; complaints about layout/white space, slow delivery, weak support. Not much Reddit API chatter.

---

### PrintKit / Social Print Studio

- **API:** https://printkit.dev/  
- **LLM docs:** https://printkit.dev/llms-full.txt  
- **Storefront (where cart redirects):** https://socialprintstudio.com/  
- **Metal prints product page reviews:** https://socialprintstudio.com/products/metal-prints  
- **Trustpilot:** https://www.trustpilot.com/review/www.socialprintstudio.com  
- **App Store reviews:** https://apps.apple.com/us/app/social-print-studio/id601882801  

**Live test (2026-08-05):** Brazil 2024 album original  
`https://d3e48mf5idein8.cloudfront.net/uploads/11-original.jpg`  
→ PrintKit `add-to-cart` → Social Print Studio cart with no product-browser / framing / crop preview in that handoff path.

**Sentiment:** App and SPS brand often praised; Trustpilot has quality complaints (e.g. registration/tone). API cart UX is the weak link for “photo ordering system.”

---

### Prodigi (Print API / Print Shop)

- **Print API:** https://www.prodigi.com/print-api/  
- **API docs:** https://www.prodigi.com/print-api/docs/reference/  
- **Print Shop (EOL warning on page):** https://www.prodigi.com/print-shop/  
- **Payments & pricing FAQ:** https://www.prodigi.com/faq/payments-and-pricing/  
- **Taxation / MoR FAQ:** https://www.prodigi.com/faq/taxation/  
- **Photo books:** https://www.prodigi.com/start/photo-books/  
- **Trustpilot (CA):** https://ca.trustpilot.com/review/prodigi.com  

**Note:** Print Shop ≠ Peecho. Peecho is the surviving hosted-checkout sibling under Prodigi Group; Print Shop is marked nearing end-of-life.

---

### Gelato / Printful / Printify (POD — usually you are MoR)

Useful for comparison; not ideal if you refuse to hold money.

**Reddit / community (direct + cited):**

- r/printondemand “Top POD companies 2026” (cited Scoop/AI support issues):  
  https://reddit.com/r/printondemand/comments/1szxxq0/top_print_on_demand_companies_in_2026_updated/  
- r/printondemand subreddit hub: https://www.reddit.com/r/printondemand/  
- Reddit-sentiment roundup (Printful vs Printify):  
  https://podvector.ai/articles/printful/comparison/printful-vs-printify-reddit-which-is-best-for-pod-sellers  
- Printful vs Gelato with Reddit citations:  
  https://branvas.com/blogs/news/printful-vs-gelato  
- Ecom AI Insights citing r/printondemand Gelato Scoop quotes:  
  https://ecomaidaily.com/blog/printful-vs-printify-vs-gelato-small-pod-sellers-2026/  
- Older Reddit quote roundup: https://inkydollar.com/printful-vs-printify-reddit/  

**Trustpilot / reviews:**

- Gelato (UK Trustpilot): https://uk.trustpilot.com/review/gelato.com  
- Gelato review writeup: https://hackceleration.com/labs/review/gelato  

**Official:**

- Gelato: https://www.gelato.com/  
- Printful: https://www.printful.com/  
- Printify Pop-Up Store (Printify holds payment): https://printify.com/pop-up-store/  
- Printify Pop-Up help: https://help.printify.com/hc/en-us/articles/12051129488417-What-is-Printify-Pop-Up-Store  

---

### WHCC (pro lab — excellent editors; you usually hold money)

- **Developer hub:** https://www.whcc.com/developer/  
- **Docs index:** https://www.whcc.com/developer/docs/  
- **Editor API:** https://www.whcc.com/developer/docs/editor-api/  
- **Order Submit API:** https://www.whcc.com/developer/docs/order-submit-api/  
- **LLM docs index:** https://www.whcc.com/developer/llms.txt  

**User experiences:** Platforms that use WHCC (Pixieset, Pic-Time, SmugMug, ShootProof) — photographer communities discuss **lab quality**, not DIY API glue. Example overview of lab APIs in photography workflows:  
https://ustechautomations.com/resources/blog/automate-print-order-fulfillment-photography-2026  

Northrup print lab comparison (WHCC / Mpix quality tests):  
https://northrup.photo/our-favorite-print-making-service-in-the-usa/  

---

### Printbox (enterprise gallery → editor)

- **Gallery Link:** https://www.getprintbox.com/gallerylink  
- **EC Sync / ecommerce:** https://www.getprintbox.com/key-features/ecommerce  
- **Review (overpowered for small shops):** https://coruzant.com/software/printbox-review-the-all-in-one-solution-for-online-photo-product-sales/  
- **Example pricing (Masterpiece AI tier, onboarding fee):** https://www.getprintbox.com/masterpiece-ai/pricing  

**Contract:** B2B / SaaS with onboarding — not a free personal-site API.

---

### Pic-Time / Pixieset (gallery SaaS with print stores)

These are the products photographers actually praise for **client print ordering UX**. They are not drop-in APIs for Heron; they’d replace or sit beside album delivery.

**Official:**

- Pic-Time print store: https://www.pic-time.com/features/print-store  
- Pic-Time payments (platform-collected vs photographer-collected):  
  https://help.pic-time.com/en/articles/7901454-what-are-the-commission-rates-for-various-subscription-plans  
- Pixieset: https://pixieset.com/  

**User experiences / comparisons (blogs citing photographer practice; Reddit-heavy discourse exists in photography subs):**

- Pic-Time vs Pixieset print sales: https://findme.photo/blog/pic-time-vs-pixieset-print-sales-2026  
- Cloudspot vs Pic-Time vs Pixieset 2026: https://findme.photo/blog/cloudspot-vs-pic-time-vs-pixieset-2026  
- Aftershoot comparison: https://aftershoot.com/blog/pictime-vs-pixieset/  
- Framekit 2026: https://framekit.ai/blog/pic-time-vs-pixieset-2026  
- Fotostudio summary of photographer feedback: https://www.fotostudio.io/en/blog/pixieset-vs-pictime  
- Shoot & Thrive Pic-Time review (print sales experience): https://shootandthrive.com/pic-time-review/  

**Photography Reddit hubs (search inside for Pictime / Pixieset / WHCC):**

- https://www.reddit.com/r/WeddingPhotography/  
- https://www.reddit.com/r/photography/  
- https://www.reddit.com/r/AskPhotography/  

---

## Criteria checklist (for evaluating any new vendor)

1. **Do I hold money?** Hosted MoR vs Stripe-on-Heron.  
2. **Can I preload my album image URLs?** Deep link / SDK images[] / Print Button `data-src`.  
3. **Is there a real product UI?** Crop, size, frame, book layout — not just a cart line.  
4. **Web vs mobile?** Fuji SDK ≠ Next.js drop-in.  
5. **Contract?** Self-serve vs B2B sales / monthly SaaS.  
6. **Sample order.** Always order a physical sample before committing.  
7. **Support.** Trustpilot + recent Reddit > marketing pages.

---

## Recommended next actions (Heron)

**Implemented:** Heron-side size/frame/wall configurator + Peecho Print Button handoff — see [`docs/PRINT_ORDERING.md`](PRINT_ORDERING.md).

Earlier research notes below remain for vendor comparison.

1. ~~If keep Heron + no Stripe: spike Peecho Print Button~~ → done via Print Button + Heron configurator.
2. **If insist on Fuji-class builder + no money hold:** email `spasales@fujifilm.com` asking explicitly for **web SPA**, retail = base cost, personal/family use.
3. **If preview/framing > “no Stripe”:** evaluate WHCC Editor API + Stripe-at-cost.
4. **If UX for relatives > custom CMS:** trial Pic-Time or Pixieset with one album of test photos.
5. Do **not** build on Prodigi Print Shop (EOL) or PrintKit cart as the primary UX.

---

## Sources index (quick copy)

| Topic | Link |
|-------|------|
| Fuji API home | https://www.fujifilmapi.com/ |
| Fuji developer agreement | https://stage.fujifilmapi.com/sign-up/developer-agreement |
| Peecho Trustpilot | https://au.trustpilot.com/review/peecho.com |
| SPS Trustpilot | https://www.trustpilot.com/review/www.socialprintstudio.com |
| SPS App Store | https://apps.apple.com/us/app/social-print-studio/id601882801 |
| PrintKit | https://printkit.dev/ |
| Prodigi Print Shop EOL page | https://www.prodigi.com/print-shop/ |
| r/printondemand 2026 rankings | https://reddit.com/r/printondemand/comments/1szxxq0/top_print_on_demand_companies_in_2026_updated/ |
| r/printondemand | https://www.reddit.com/r/printondemand/ |
| Gelato Trustpilot UK | https://uk.trustpilot.com/review/gelato.com |
| WHCC developer | https://www.whcc.com/developer/ |
| Printbox Gallery Link | https://www.getprintbox.com/gallerylink |
| Pic-Time vs Pixieset (print sales) | https://findme.photo/blog/pic-time-vs-pixieset-print-sales-2026 |
| Northrup lab print test | https://northrup.photo/our-favorite-print-making-service-in-the-usa/ |

---

*This document is research only — not an implementation plan. Update links if threads move; Reddit IDs can change visibility.*
