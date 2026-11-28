/* =========================================================================
   1.4: screen filters. Black and white, film grain and a VHS look.
   All three are off by default and are switched on from the pause menu
   (or Settings > Screen filters). They are drawn over the finished frame,
   so they work in every scene, The Long Walk included.
   ========================================================================= */
const Filters = {
  grainC: null, scanC: null, frame: 0,
  any() { const s = Save.s; return !!(s.fxBW || s.fxGrain || s.fxVHS); },
  noise() {
    if (this.grainC) return this.grainC;
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); return (this.grainC = c);
  },
  scan() {
    if (this.scanC) return this.scanC;
    const c = document.createElement('canvas'); c.width = 4; c.height = 4; const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, 2, 4, 2); return (this.scanC = c);
  },
  post(ctx) {
    if (!this.any()) return;
    const s = Save.s, cv = ctx.canvas, cw = cv.width, ch = cv.height, t = Game.time, calm = !!s.reduce; this.frame++;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    if (s.fxVHS) {
      // colour bleed: a faint ghost of the frame, nudged sideways
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.16; ctx.drawImage(cv, Math.max(2, cw * 0.0025), 0); ctx.globalAlpha = 1;
      // a tracking band that rolls slowly down the screen, with the picture inside it pulled sideways
      if (!calm) {
        const bh = Math.round(ch * 0.05), by = Math.round(((t * 0.11) % 1.25) * ch - bh), off = Math.round((Math.sin(t * 23) * 0.5 + 0.5) * cw * 0.012 + 2);
        if (by > -bh && by < ch) { ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(cv, 0, Math.max(0, by), cw, bh, off, Math.max(0, by), cw, bh); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(0, by, cw, bh); }
        if (Math.random() < 0.04) { const y = Math.random() * ch; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, y, cw, Math.max(1, ch / 360)); }
      }
      // scanlines
      ctx.globalCompositeOperation = 'source-over'; const sc = ctx.createPattern(this.scan(), 'repeat'); ctx.save(); ctx.scale(Math.max(1, ch / 540), Math.max(1, ch / 540)); ctx.fillStyle = sc; ctx.fillRect(0, 0, cw, ch); ctx.restore();
      // soft dark corners, like an old set
      const vg = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.45, cw / 2, ch / 2, ch * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch);
    }
    if (s.fxBW) {
      // drop all colour, then lift the contrast a touch
      ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(128,128,128,0.35)'; ctx.fillRect(0, 0, cw, ch);
    }
    if (s.fxGrain) {
      // moving grain; Reduce Intensity only shifts it a few times a second
      const n = this.noise(), step = calm ? Math.floor(t * 3) : this.frame, ox = (step * 97) % 256, oy = (step * 61) % 256, k = Math.max(1, ch / 720);
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.16; const p = ctx.createPattern(n, 'repeat');
      ctx.save(); ctx.translate(-ox * k, -oy * k); ctx.scale(k, k); ctx.fillStyle = p; ctx.fillRect(0, 0, cw / k + 256, ch / k + 256); ctx.restore(); ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (s.fxVHS) {
      // the on-screen display, in logical coordinates
      ctx.save(); ctx.globalCompositeOperation = 'source-over';
      const blink = calm || Math.sin(t * 4) > -0.3, d = new Date(), pad = v => String(v).padStart(2, '0');
      ctx.font = 'bold 15px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(0,0,0,0.5)';
      const a = (blink ? 'PLAY ▶' : 'PLAY'), b = 'SP  ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      ctx.fillText(a, 23, H - 73); ctx.fillText(b, 23, H - 53); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(a, 21, H - 75); ctx.fillText(b, 21, H - 55);
      ctx.restore();
    }
  }
};
/* The three switches, shared by the pause menus and Settings. */
function filterItems() {
  const s = Save.s, tg = (label, key, sub) => ({ type: 'toggle', label, get: () => !!s[key], set: v => { s[key] = v; Save.write(); }, sub });
  return [
    tg('Black and white', 'fxBW', 'Drains all colour from the picture, people included.'),
    tg('Film grain', 'fxGrain', 'A fine, moving grain over everything, like old film.'),
    tg('VHS effect', 'fxVHS', 'Scanlines, colour bleed, a rolling tracking band and a PLAY counter. Reduce Intensity stops the band.')
  ];
}
