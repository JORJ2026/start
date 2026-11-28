// Physics primitives: exact axis-separated swept AABB movement, slope tiles,
// step-up and ground-sticking for anything that walks or slides on terrain.
(function (H) {
  'use strict';

  const TS = 32;
  const EPS = 1e-4;
  const STEP = 12;          // max ledge height a grounded body steps up onto
  H.TS = TS;
  H.PHYS = { G: 1800, MAX_FALL: 900, STEP: 1 / 60, STEP_UP: STEP };

  // Tile codes
  const T = { EMPTY: 0, SOLID: 1, LADDER: 2, SPIKE: 3, UP45: 4, DN45: 5, UPLO: 6, UPHI: 7, DNHI: 8, DNLO: 9 };
  H.T = T;
  // Slope surface height inside a tile (0 = tile top, TS = tile bottom) at local x.
  function slopeY(t, lx) {
    switch (t) {
      case T.UP45: return TS - lx;
      case T.DN45: return lx;
      case T.UPLO: return TS - lx / 2;
      case T.UPHI: return TS / 2 - lx / 2;
      case T.DNHI: return lx / 2;
      case T.DNLO: return TS / 2 + lx / 2;
      default: return null;
    }
  }
  const isSlope = (t) => t >= 4 && t <= 9;
  // Downhill direction (+1 right, -1 left) and steepness for a slope tile.
  function slopeInfo(t) {
    if (t === T.UP45) return { down: -1, grade: 1 };
    if (t === T.DN45) return { down: 1, grade: 1 };
    if (t === T.UPLO || t === T.UPHI) return { down: -1, grade: 0.5 };
    if (t === T.DNHI || t === T.DNLO) return { down: 1, grade: 0.5 };
    return null;
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w - EPS && a.x + a.w > b.x + EPS &&
           a.y < b.y + b.h - EPS && a.y + a.h > b.y + EPS;
  }

  function sweepX(body, dx, solids) {
    if (dx === 0) return { moved: 0, hit: null };
    let target = body.x + dx, hit = null;
    for (const s of solids) {
      if (s.oneWay) continue;
      if (!(body.y < s.y + s.h - EPS && body.y + body.h > s.y + EPS)) continue;
      if (dx > 0) {
        if (s.x >= body.x + body.w - EPS && s.x < target + body.w) { target = s.x - body.w; hit = s; }
      } else if (s.x + s.w <= body.x + EPS && s.x + s.w > target) { target = s.x + s.w; hit = s; }
    }
    const moved = target - body.x;
    body.x = target;
    return { moved, hit };
  }

  function sweepY(body, dy, solids) {
    if (dy === 0) return { moved: 0, hit: null };
    let target = body.y + dy, hit = null;
    for (const s of solids) {
      if (!(body.x < s.x + s.w - EPS && body.x + body.w > s.x + EPS)) continue;
      if (dy > 0) {
        if (s.y >= body.y + body.h - EPS && s.y < target + body.h) { target = s.y - body.h; hit = s; }
      } else {
        if (s.oneWay) continue;
        if (s.y + s.h <= body.y + EPS && s.y + s.h > target) { target = s.y + s.h; hit = s; }
      }
    }
    const moved = target - body.y;
    body.y = target;
    return { moved, hit };
  }

  function sweptArea(b, dx, dy) {
    const x0 = Math.min(b.x, b.x + dx), y0 = Math.min(b.y, b.y + dy);
    return { x: x0 - 1, y: y0 - 1, w: b.w + Math.abs(dx) + 2, h: b.h + Math.abs(dy) + 2 };
  }

  function approach(v, target, step) {
    if (v < target) return Math.min(v + step, target);
    if (v > target) return Math.max(v - step, target);
    return v;
  }

  // ---- terrain-aware movement (used by the player and by crates/boulders) ----
  // opts: { exclude, player (collide with player), oneWay, grounded }

  function groundMoveX(world, b, dx, opts) {
    if (dx === 0) return { moved: 0, hit: null };
    const all = world.collect(sweptArea(b, dx, -STEP), opts);
    const feet = b.y + b.h;
    const list = opts.grounded ? all.filter((s) => !(s.y >= feet - STEP - EPS)) : all;
    const x0 = b.x;
    const r = sweepX(b, dx, list);
    if (opts.grounded) {
      let top = Infinity, stepHit = null;
      for (const s of all) {
        if (s.oneWay || !overlaps(b, s)) continue;
        if (s.y >= feet - STEP - EPS && s.y < top) { top = s.y; stepHit = s; }
      }
      if (top < Infinity) {
        const up = { x: b.x, y: top - b.h, w: b.w, h: b.h };
        if (world.isFree(up, opts.exclude, opts.player)) b.y = up.y;
        else { b.x = x0; return { moved: 0, hit: stepHit }; }
      }
    }
    return r;
  }

  // Returns { landed, bumped, hit }
  function groundMoveY(world, b, dy, opts) {
    const feet0 = b.y + b.h;
    const r = sweepY(b, dy, world.collect(sweptArea(b, 0, dy), opts));
    let landed = !!(r.hit && dy > 0), hit = r.hit;
    if (dy >= 0) {
      const s = world.slopeSurface(b.x + b.w / 2, feet0 - STEP, b.y + b.h + EPS);
      if (s !== null && s <= b.y + b.h + EPS) { b.y = s - b.h; landed = true; hit = { slope: true }; }
      if (!landed && opts.grounded) {
        const sup = world.supportBelow(b, 14, opts);
        if (sup !== null) { b.y = sup - b.h; landed = true; hit = { stick: true }; }
      }
    }
    return { landed, bumped: !!(r.hit && dy < 0), hit };
  }

  H.phys = { overlaps, sweepX, sweepY, sweptArea, approach, groundMoveX, groundMoveY, slopeY, isSlope, slopeInfo, EPS, STEP };
})(globalThis.Hollow = globalThis.Hollow || {});
