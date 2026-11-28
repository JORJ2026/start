# Test suite

Playwright smoke tests that drive the built `index.html` in headless Chrome.

```
npm i -D playwright          # once
npx playwright install chromium
node test/t1.js              # or any t*.js
```

Set `CHROME=/path/to/chrome` to use an installed browser, or `PLAYWRIGHT=/path/to/playwright` to use a global install.
Screenshots are written next to the scripts and are ignored by git.

New in 1.3:

- `t12.js` checks the geometry of all 50 Long Walk levels, loads several, and lets a bot run through the levels that only need running and jumping.
- `t13.js` builds a short level from each Long Walk puzzle piece and has a bot clear it. Pass a comma-separated list to test only some pieces, for example `node test/t13.js mover,dog`.
- `t14.js` checks the new items and recipes, crafts at the workbench, starts a sortie with enemy variants and hazards, steps on a hazard and a rotten floor, and saves everything to a file and imports it back. Set `LOC=` to pick the site.

New in 1.4:

- `t15.js` checks that the three screen filters are off by default, listed in the pause menu and drain the colour, then checks the slower speed, that the sprite log has exactly 1000 different entries, opens All Unlocked, sends the Lamplighter on a sortie with a packed chest, adds an item from the pause menu, draws all 20 animations for all nine people, and starts a story chapter, a locked mode and Long Walk level 38 without changing real progress.
