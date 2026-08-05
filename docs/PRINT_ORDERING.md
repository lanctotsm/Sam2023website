# Album print ordering (Peecho)

Family visitors can order a print of an album photo. **Heron** shows size, frame preview, and a wall mockup; **Peecho** takes payment and fulfills.

## Enable

In env (see `heron/.env.local.example`):

```bash
NEXT_PUBLIC_PRINT_ORDERING=peecho
NEXT_PUBLIC_PEECHO_BUTTON_SCRIPT_ID=your_button_key_here
```

1. Sign up at [https://www.peecho.com/signup](https://www.peecho.com/signup)
2. In the Peecho dashboard, open **Sell print** (or Settings) and copy the **Button Key** — the id in  
   `https://d3aln0nj58oevo.cloudfront.net/button/script/{id}.js`
3. Put that id in `NEXT_PUBLIC_PEECHO_BUTTON_SCRIPT_ID`

**Button Key ≠ Api Key.** The WordPress plugin stores both; Heron only needs the Button Key for the Print Button path. No Peecho API key and no Stripe on Heron.

## How it works

1. Open an album photo → **Order print** (lightbox control; only when `NEXT_PUBLIC_PRINT_ORDERING=peecho`).
2. Pick size (filtered by original pixel DPI) and frame (preview only).
3. **Checkout with Peecho** loads Peecho’s Print Button with `data-src` = CloudFront original URL and `data-width` / `data-height` in mm for the chosen size.

Patterns match [peecho/peecho-wordpress-plugin](https://github.com/peecho/peecho-wordpress-plugin) (script once + `.peecho-print-button`) and the [Print Button docs](https://support.peecho.com/hc/en-us/articles/360017392160-Print-Button-Technical-information) (`data-src` for hosted files).

## Quality / DPI

Stored originals are JPEG/PNG, not RAW. Sizes use `images.width` / `images.height`:

- Soft warning below **150 DPI**
- Blocked below **100 DPI**

Helpers: `heron/lib/print/quality.ts`. Catalog: `heron/lib/print/catalog.ts`.

## Pricing tip

In the Peecho dashboard, set sell price ≈ wholesale if you want near zero markup. Frame choices in Heron are a preview; Peecho checkout may still show its own product list — narrow products in the Peecho account settings if needed.

## Code map

| Piece | Path |
|-------|------|
| Wall preview | `heron/components/print/WallPreview.tsx` |
| Configurator | `heron/components/print/PrintConfigurator.tsx` |
| Peecho button | `heron/components/print/PeechoPrintButton.tsx` |
| Album entry | `heron/components/AlbumViewer.tsx` + lightbox |
| Wall asset | `heron/public/print/wall.jpg` |
