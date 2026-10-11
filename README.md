# Pinspired

Pinspired turns a saved-home aesthetic into a coordinated, made-to-order textile collection. It is a local hackathon demo built with Vinext/React, the Arcade API, and Google's Gemini API.

## Start the demo

1. Add `ARCADE_API_KEY` and `GEMINI_API_KEY` to `.env.local`. Keep this file local; it is ignored by Git.
2. Run `npm run dev -- --host 127.0.0.1` from this directory.
3. Open the local URL printed by the server (currently `http://127.0.0.1:5173`).
4. Open **Moss & Morning** from the launch feed.
5. Click **Generate with Arcade**. Pinspired creates one original pattern, then makes every eligible home textile product from Arcade's live catalog with current product images and prices.
6. Use the room builder to add the board's recommended pieces, or click **Buy** on a ready Arcade product for a live checkout.

The app uses sample taste and product categories only when the corresponding API key is missing. The interface labels this as a sample preview. Product photos and guaranteed prices come only from `products/get` after Arcade has created a product.

## Pinterest status

Pinterest OAuth is implemented with `boards:read` and `pins:read` scopes and a board picker. When a Pinterest developer app is approved, add `PINTEREST_CLIENT_ID` and `PINTEREST_CLIENT_SECRET` to `.env.local` and register `http://127.0.0.1:5173/api/pinterest/callback` as the exact redirect URI. Set `NEXT_PUBLIC_APP_URL` to the matching origin.

Pinterest may require separate approval to read a person's saved Pins. The app currently does **not** send Pinterest API data to Gemini or Arcade. Pinterest's developer guidelines restrict sharing API data with third parties and making distributable new content from Pins. The live creation demo uses the user's own uploaded inspiration instead. This boundary needs Pinterest approval and a reviewed production design before automated board-to-product generation.

## Architecture

- `/api/taste`: Gemini visual and text style analysis; returns palette, direction and original pattern prompt.
- `/api/scene`: Gemini room visualization or collection moodboard.
- `/api/arcade`: server-side, allowlisted Arcade API proxy; key never goes to browser.
- `/api/pinterest/*`: OAuth and board/section listing, activated only when credentials are present.
- The browser polls Arcade jobs and creates products across every live print category whose name or parent category describes a home textile, with three concurrent workers.

## Demo pitch

“People already define their dream home in saved images, but the products often don't exist in an affordable or cohesive way. Pinspired translates a home aesthetic into an original, manufacturable collection across the live Arcade textile catalog. Arcade turns one vibe into real product images, guaranteed prices and made-to-order checkout.”
