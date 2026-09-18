# Penguin

The site for PENGUIN, the first community token to graduate on [ICE Market](https://www.icemarket.fun).

A static page: `index.html` plus one image. No build step, no framework, no dependencies. Edit the HTML
and push.

## The numbers are hardcoded

Price, market cap, volume, liquidity, holders and the water conversion were read from the ICE Market
indexer on 18 September 2026 and written into the page. They drift. To refresh them by hand:

    curl -s https://icemarkets-indexer-prod.fly.dev/markets/79WXymKrRSVVxGZY8qBXAtySYNPGkvyKWdu9Zv27Cice

The water figure in the headline is derived, not fetched: `priceQuote` is the price in H2O, which is
acre-feet, and an acre-foot is 325,851 gallons.

    fl oz per PENGUIN = priceQuote × 325851 × 128

## Deploy

Vercel, as a static project with no framework preset. The output directory is the repository root.

## Token

    mint   79WXymKrRSVVxGZY8qBXAtySYNPGkvyKWdu9Zv27Cice
    pair   PENGUIN / H2O (California water, NQH2O index)
    pool   Gg5RDBD9Gjqfp1VbMc1dWDiqc1PHooRiaFai2CVySZqZ (Meteora DAMM v2)
