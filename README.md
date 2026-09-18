# Penguin

The site for PENGUIN, the first community token to graduate on [ICE Market](https://www.icemarket.fun).

A static page: `index.html` plus one image. No build step, no framework, no dependencies. Edit the HTML
and push.

## The numbers refresh themselves

Price, market cap, volume, liquidity, holders and the water conversion come from the ICE Market indexer
on page load. The endpoint is public and needs no key:

    GET https://icemarkets-indexer-prod.fly.dev/markets/79WXymKrRSVVxGZY8qBXAtySYNPGkvyKWdu9Zv27Cice
    GET https://icemarkets-indexer-prod.fly.dev/commodities/H2O

The same figures are also written into the HTML. That is deliberate: the page reads correctly on first
paint before the fetch lands, and if the indexer is unreachable it keeps the last known numbers with the
date they were read rather than showing blanks. Refresh those baked values occasionally so a failed
fetch does not leave something a month old on screen.

The water line is derived, not fetched. `priceQuote` is the price in H2O, H2O is an acre-foot, and an
acre-foot is 325,851 gallons:

    fl oz per PENGUIN = priceQuote × 325851 × 128

## Deploy

Vercel, as a static project with no framework preset. The output directory is the repository root.

## Token

    mint   79WXymKrRSVVxGZY8qBXAtySYNPGkvyKWdu9Zv27Cice
    pair   PENGUIN / H2O (California water, NQH2O index)
    pool   Gg5RDBD9Gjqfp1VbMc1dWDiqc1PHooRiaFai2CVySZqZ (Meteora DAMM v2)
