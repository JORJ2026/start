// Player: run (slower up steep slopes), variable jump with coyote time and
// input buffering, crouch, push crates/boulders, grab-and-pull crates,
// pull levers, ladders, rope swinging, fall death.
(function (H) {
  'use strict';
  const { TS, PHYS } = H;
  const { sweepY, sweptArea, approach, groundMoveX, groundMoveY } = H.phys;

  const C = {
    W: 18, H: 34, CROUCH_H: 22,
    RUN: 118, AIR: 140, CROUCH_RUN: 56, PUSH: 68, PULL: 54,
    ACC_GROUND: 1200, DEC_GROUND: 2000, ACC_AIR: 1000,
    JUMP_HEIGHT: 80, JUMP_CUT: 0.45,
    COYOTE: 0.1, BUFFER: 0.12,
    CLIMB: 84, ROPE_CLIMB: 62, PUMP: 420,
    FALL_DEATH: 8 * TS,
  };
  C.JUMP_V = Math.sqrt(2 * PHYS.G * C.JUMP_HEIGHT);
  H.PLAYER = C;

  class Player {
    constructor(cx, feetY) { this.reset(cx - C.W / 2, feetY - C.H, 1); }

    reset(x, y, facing) {
      this.x = x; this.y = y; this.w = C.W; this.h = C.H;
      this.prevX = x; this.prevY = y;
      this.vx = 0; this.vy = 0;
      this.facing = facing || 1;
      this.state = 'air'; this.grounded = false;
      this.coyote = 0; this.buffer = 0; this.cutDone = true;
      this.crouch = false; this.grab = null; this.pushing = false;
      this.rope = null; this.ropeLen = 0; this.ropeCD = 0;
      this.ladderCol = -1;
      this.apexY = y;
      this.dead = false; this.deathCause = null;
      this.animT = 0;
      this.anim = null; this.leverT = 0;
      if (this.runScale === undefined) this.runScale = 1;
    }


    // ---------------- animation state (visual only; never affects physics) ----------------
    ensureAnim() {
      return this.anim || (this.anim = {
        stride: 0, climb: 0, lastClimb: 0, blink: 0, blinkLeft: 0, blinkT: 2, lookX: 0, lookTarget: 0, lookT: 1,
        landSq: 0, stretch: 0, turn: 0, lastFacing: this.facing, prevGrounded: this.grounded,
        fallV: 0, lastStep: 0, puffs: [], prevVx: 0, accLean: 0, slopeLean: 0, teeter: 0, fear: 0,
        idleT: 0, fidget: null, hard: 0, hem: 0, hemV: 0, hair: 0, hairV: 0, joy: 0,
        scarf: null, prints: [], breath: [], breathT: 2,
      });
    }

    puff(an, n, spread, up, size) {
      const fx = this.x + this.w / 2, fy = this.y + this.h;
      for (let i = 0; i < n; i++) {
        const life = 0.45 + Math.random() * 0.35;
        an.puffs.push({ x: fx + (Math.random() - 0.5) * spread, y: fy - 1, vx: (Math.random() - 0.5) * 46, vy: -Math.random() * 16 * up, life, max: life, r: (1.6 + Math.random() * 2) * size });
      }
      if (an.puffs.length > 44) an.puffs.splice(0, an.puffs.length - 44);
    }

    tickAnim(world, dt) {
      const an = this.ensureAnim();
      const speed = Math.abs(this.vx), f = this.facing >= 0 ? 1 : -1;
      const onGround = this.state === 'ground' && this.grounded;
      const cx = this.x + this.w / 2, feet = this.y + this.h;
      const emit = (t, x, y, v) => world.emit && world.emit(t, x, y, v);
      if (onGround) an.stride += speed * 0.1 * dt;
      if (this.state === 'ladder') {
        an.climb += Math.abs(this.vy) * 0.09 * dt;
        const rung = Math.floor(an.climb / Math.PI);
        if (rung !== an.lastClimb) { an.lastClimb = rung; emit('ladder', cx, feet, 1); }
      }
      // blinking and wandering eyes
      an.blinkT -= dt;
      if (an.blinkT <= 0) { an.blinkLeft = 0.15; an.blinkT = 2 + Math.random() * 3.4; }
      if (an.blinkLeft > 0) { an.blinkLeft -= dt; an.blink = Math.sin(Math.max(0, an.blinkLeft) / 0.15 * Math.PI); } else an.blink = 0;
      an.lookT -= dt;
      if (an.lookT <= 0) { an.lookT = 1.2 + Math.random() * 3; an.lookTarget = onGround && speed < 5 ? (Math.random() - 0.35) * 2.6 : 0.6; }
      an.lookX += (an.lookTarget - an.lookX) * Math.min(1, dt * 6);
      // turning
      if (this.facing !== an.lastFacing) { an.turn = 1; an.lastFacing = this.facing; }
      an.turn = Math.max(0, an.turn - dt * 7);
      // landing and take-off
      if (onGround && !an.prevGrounded && an.fallV > 120) {
        an.landSq = Math.min(1, an.fallV / 650);
        if (an.fallV > 520) an.hard = 0.35;
        this.puff(an, 3 + Math.round(an.landSq * 7), 16, 1.4, 1 + an.landSq * 0.5);
        emit('land', cx, feet, an.landSq);
        an.fallV = 0;
      }
      if (!onGround && an.prevGrounded && this.vy < -100) { an.stretch = 1; this.puff(an, 4, 12, 1, 0.9); }
      if (!onGround) an.fallV = this.vy;
      // footsteps: dust, sound, snow prints
      const step = Math.floor(an.stride / Math.PI);
      if (onGround && speed > 20 && step !== an.lastStep) {
        this.puff(an, 1, 6, 0.6, 0.7);
        emit('step', cx, feet, Math.min(1, speed / 110));
        if (world.level && world.level.world === 'peaks') { an.prints.push({ x: cx + f * 2, y: feet, t: 0 }); if (an.prints.length > 26) an.prints.shift(); }
      }
      an.lastStep = step;
      // acceleration lean (leans into starts, back when braking)
      const acc = (this.vx - an.prevVx) / Math.max(dt, 1e-4);
      an.accLean += (Math.max(-0.09, Math.min(0.09, acc / 1200 * 0.07)) * f - an.accLean) * Math.min(1, dt * 10);
      an.prevVx = this.vx;
      // slope lean
      const sl = onGround && world.slopeUnder ? world.slopeUnder(this) : null;
      const slT = sl ? (sl.down === -f ? sl.grade * 0.17 : -sl.grade * 0.1) : 0;
      an.slopeLean += (slT - an.slopeLean) * Math.min(1, dt * 8);
      // ledge teeter: nothing under the front foot
      let teeterT = 0;
      if (onGround && speed < 12 && !this.crouch && world.isFree) {
        const fx = cx + f * 7;
        if (world.isFree({ x: fx - 1, y: feet + 1, w: 2, h: 5 }) && world.slopeSurface(fx, feet - 4, feet + 10) === null) teeterT = 1;
      }
      an.teeter += (teeterT - an.teeter) * Math.min(1, dt * 8);
      // fear: spikes, saws, traps or crushers close by
      let danger = 0;
      if (world.tileAt) {
        const c0 = Math.floor(cx / 32) - 2, c1 = c0 + 4, r0 = Math.floor(feet / 32) - 1;
        for (let r = r0; r <= r0 + 2 && !danger; r++) for (let c = c0; c <= c1; c++) if (world.tileAt(c, r) === H.T.SPIKE) { danger = 1; break; }
        for (const sw of world.saws || []) if (sw.retract < 0.6 && Math.hypot(sw.cx - cx, sw.cy - (this.y + this.h / 2)) < sw.r + 70) danger = 1;
        for (const t of world.traps || []) if (t.armed && Math.abs(t.x - cx) < 60 && Math.abs(t.y - feet) < 30) danger = 1;
        for (const m of world.movers || []) if (m.kind === 'crusher' && Math.abs(m.x + m.w / 2 - cx) < m.w / 2 + 50 && m.y < feet) danger = 1;
      }
      an.fear += (danger - an.fear) * Math.min(1, dt * 8);
      // idle fidgets after standing still for a while
      const idle = onGround && speed < 5 && !this.crouch && !this.grab && an.teeter < 0.3;
      if (idle) {
        an.idleT += dt;
        if (!an.fidget && an.idleT > 4.5) { an.fidget = { k: ['stretch', 'shrug', 'peek', 'look'][Math.floor(Math.random() * 4)], t: 0 }; }
      } else { an.idleT = 0; an.fidget = null; }
      if (an.fidget) { an.fidget.t += dt; if (an.fidget.t > 1.6) { an.fidget = null; an.idleT = 1; } }
      an.hard = Math.max(0, an.hard - dt);
      an.joy = world.finished ? Math.min(1, an.joy + dt * 4) : 0;
      // spring-driven secondary motion: tunic hem and hair lag behind movement
      const hemT = -Math.max(-2.5, Math.min(2.5, this.vx * f / 60)) - (onGround ? 0 : Math.max(-1, Math.min(1, this.vy / 400)) * 0.6);
      an.hemV += ((hemT - an.hem) * 140 - an.hemV * 11) * dt; an.hem += an.hemV * dt;
      const hairT = -Math.max(-3, Math.min(3, this.vx * f / 70));
      an.hairV += ((hairT - an.hair) * 110 - an.hairV * 9) * dt; an.hair += an.hairV * dt;
      // scarf: verlet cloth trailing from the neck
      const ax = cx - f * 2.5, ay = this.y + 14;
      if (!an.scarf) an.scarf = Array.from({ length: 9 }, (_, i) => ({ x: ax - f * i * 3, y: ay, ox: ax - f * i * 3, oy: ay }));
      const sc = an.scarf; sc[0].x = sc[0].ox = ax; sc[0].y = sc[0].oy = ay;
      for (let i = 1; i < sc.length; i++) {
        const q = sc[i], vx = (q.x - q.ox) * 0.93, vy = (q.y - q.oy) * 0.93;
        q.ox = q.x; q.oy = q.y;
        q.x += vx + Math.sin(world.time * 2.3 + i * 0.9) * 0.05; q.y += vy + 0.16;
      }
      for (let it = 0; it < 3; it++) for (let i = 1; i < sc.length; i++) {
        const a = sc[i - 1], b = sc[i]; let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1, diff = (d - 3.6) / d;
        b.x -= dx * diff; b.y -= dy * diff;
      }
      // cold breath in the frozen peaks
      if (world.level && world.level.world === 'peaks') {
        an.breathT -= dt;
        if (an.breathT <= 0) { an.breathT = idle ? 2.6 : 1.5; an.breath.push({ x: cx + f * 9, y: this.y + 9, vx: f * 12, vy: -9, life: 1.2, max: 1.2 }); }
      }
      for (const b of an.breath) { b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 1 - dt * 1.5; }
      an.breath = an.breath.filter((b) => b.life > 0);
      for (const pr of an.prints) pr.t += dt;
      an.prints = an.prints.filter((pr) => pr.t < 9);
      an.landSq = Math.max(0, an.landSq - dt * 6);
      an.stretch = Math.max(0, an.stretch - dt * 6);
      an.prevGrounded = onGround;
      for (let i = an.puffs.length - 1; i >= 0; i--) {
        const q = an.puffs[i];
        q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx -= q.vx * dt * 3;
        if (q.life <= 0) an.puffs.splice(i, 1);
      }
    }

    get cx() { return this.x + this.w / 2; }

    update(world, input, dt) {
      if (this.dead) return;
      const dir = (input.isHeld('right') ? 1 : 0) - (input.isHeld('left') ? 1 : 0);
      this.ropeCD = Math.max(0, this.ropeCD - dt);
      this.animT += dt * Math.abs(this.vx) / 60;

      if (this.state === 'rope') return this.updateRope(world, input, dt, dir);
      if (this.state === 'ladder') return this.updateLadder(world, input, dt, dir);

      // ---- levers (grab key) ----
      if (this.grounded && input.pressed('grab')) {
        const l = world.leverAt(this);
        if (l) { world.toggleLever(l); this.leverT = 0.25; }
      }
      if (this.leverT > 0) this.leverT -= dt;

      // ---- ladders ----
      const lc = world.ladderColumnAt(this);
      if (!this.grab && lc >= 0 && input.isHeld('up') && this.uncrouch(world)) return this.enterLadder(lc);
      if (!this.grab && this.grounded && input.isHeld('down')) {
        const c = Math.floor(this.cx / TS), r = Math.floor((this.y + this.h + 2) / TS);
        if (world.isLadderTop(c, r) && Math.abs(this.cx - (c * TS + TS / 2)) <= 12) {
          this.uncrouch(world); this.y += 4;
          return this.enterLadder(c);
        }
      }

      // ---- jump buffer ("up" also jumps when not at a ladder) ----
      if (input.pressed('jump') || (input.pressed('up') && lc < 0)) this.buffer = C.BUFFER;
      else this.buffer = Math.max(0, this.buffer - dt);
      const jumpHeld = input.isHeld('jump') || input.isHeld('up');

      // ---- crouch ----
      const wantCrouch = input.isHeld('down') && this.grounded && !this.grab;
      if (wantCrouch && !this.crouch) { this.crouch = true; this.y += C.H - C.CROUCH_H; this.h = C.CROUCH_H; }
      else if (!wantCrouch && this.crouch) this.uncrouch(world);

      // ---- grab (crates only) ----
      if (input.isHeld('grab') && this.grounded && !this.crouch && !world.leverAt(this)) {
        if (!this.grab) this.grab = this.findGrabbable(world);
      } else this.grab = null;
      if (this.grab) {
        const k = this.grab;
        const gap = this.facing > 0 ? k.x - (this.x + this.w) : this.x - (k.x + k.w);
        if (!k.grounded || gap > 6 || gap < -2) this.grab = null;
      }

      // ---- horizontal ----
      let max = (this.grounded ? C.RUN : C.AIR) * this.runScale;
      if (this.crouch) max = world.runner ? C.RUN * this.runScale * 0.9 : C.CROUCH_RUN;
      if (this.grab) max = dir === this.facing ? C.PUSH : C.PULL;
      else if (this.pushing) max = C.PUSH;
      if (this.grounded && dir !== 0) {
        const sl = world.slopeUnder(this);
        if (sl && sl.down === -dir) max *= sl.grade >= 1 ? 0.62 : 0.85;   // uphill
      }
      const acc = this.grounded ? (dir !== 0 ? C.ACC_GROUND : C.DEC_GROUND) : C.ACC_AIR;
      if (!this.grounded && Math.abs(this.vx) > max && (dir === 0 || dir === Math.sign(this.vx))) {
        this.vx = approach(this.vx, Math.sign(this.vx) * max, 160 * dt);   // keep swing/launch momentum in the air
      } else this.vx = approach(this.vx, dir * max, acc * dt);
      if (!this.grab && dir !== 0) this.facing = dir;

      // ---- jump ----
      let jumped = false;
      if (this.buffer > 0 && (this.grounded || this.coyote > 0) && !this.grab) {
        if (!this.crouch || this.uncrouch(world)) {
          this.vy = -C.JUMP_V; this.grounded = false; this.coyote = 0; this.buffer = 0; this.cutDone = false; jumped = true;
          world.emit('jump', this.x, this.y + this.h, 1);
        }
      }
      if (!this.grounded && this.vy < 0 && !jumpHeld && !this.cutDone) { this.vy *= C.JUMP_CUT; this.cutDone = true; }

      this.vy = Math.min(this.vy + PHYS.G * dt, PHYS.MAX_FALL);
      this.moveX(world, dt, dir);
      this.moveY(world, dt, jumped);

      if (!this.grounded && !this.grab && this.ropeCD <= 0) this.tryCatchRope(world);
    }

    uncrouch(world) {
      if (!this.crouch) return true;
      const tall = { x: this.x, y: this.y - (C.H - C.CROUCH_H), w: this.w, h: C.H };
      if (!world.isFree(tall)) return false;
      this.crouch = false; this.y = tall.y; this.h = C.H;
      return true;
    }

    findGrabbable(world) {
      for (const s of [this.facing, -this.facing]) {
        for (const k of world.bodies) {
          if ((k.kind !== 'crate' && k.kind !== 'boulder') || !k.grounded || k.held || Math.abs(k.vx) > 40) continue;
          if (!(k.y < this.y + this.h - 4 && k.y + k.h > this.y + 4)) continue;
          const gap = s > 0 ? k.x - (this.x + this.w) : this.x - (k.x + k.w);
          if (gap >= -1 && gap <= 4) { this.facing = s; return k; }
        }
      }
      return null;
    }

    moveX(world, dt, dir) {
      const dx = this.vx * dt;
      this.pushing = false;
      if (dx === 0) return;
      const opts = { grounded: this.grounded };
      const r = groundMoveX(world, this, dx, opts);
      const into = Math.sign(dx);
      if (r.hit && r.hit.body && !r.hit.body.held && this.grounded && dir === into) {
        const k = r.hit.body;
        const rem = dx - r.moved;
        const moved = world.pushBody(k, rem);
        if (Math.abs(moved) > 1e-6) {
          k.pushed = true;
          k.vx = k.kind === 'boulder' ? (Math.abs(k.vx) > Math.abs(moved / dt) && Math.sign(k.vx) === into ? k.vx : moved / dt) : moved / dt;
          groundMoveX(world, this, moved, opts);
          this.pushing = true;
        } else this.vx = 0;
      } else if (r.hit) {
        this.vx = 0;
      } else if (this.grab && into === -this.facing && r.moved !== 0) {
        const k = this.grab;
        const moved = world.pushBody(k, r.moved);
        k.pushed = true; k.vx = moved / dt;
        if (Math.abs(moved - r.moved) > 1e-6) { this.x -= (r.moved - moved); this.vx = 0; }
      }
    }

    moveY(world, dt, jumped) {
      const wasGrounded = this.grounded;
      const r = groundMoveY(world, this, this.vy * dt, { oneWay: true, grounded: wasGrounded && !jumped && this.vy >= 0 });
      if (r.landed) {
        if (!wasGrounded && this.y - this.apexY > C.FALL_DEATH) world.kill('fall');
        this.vy = 0; this.grounded = true;
      } else {
        if (r.bumped) this.vy = 0;
        this.grounded = false;
      }
      if (this.grounded) { this.apexY = this.y; this.coyote = C.COYOTE; this.state = 'ground'; }
      else {
        this.apexY = Math.min(this.apexY, this.y);
        this.coyote = jumped ? 0 : Math.max(0, this.coyote - dt);
        this.state = 'air';
        if (this.crouch) this.uncrouch(world);
      }
    }

    // ---------------- ladder ----------------
    enterLadder(col) {
      this.state = 'ladder'; this.ladderCol = col; this.grounded = false;
      this.vx = 0; this.vy = 0; this.grab = null; this.crouch = false; this.h = C.H;
    }

    updateLadder(world, input, dt, dir) {
      const col = this.ladderCol;
      const up = input.isHeld('up'), down = input.isHeld('down');
      this.apexY = this.y;
      this.x = approach(this.x, col * TS + TS / 2 - this.w / 2, 240 * dt);
      if (input.pressed('jump')) {
        this.state = 'air'; this.ladderCol = -1; this.cutDone = true; this.ropeCD = 0.2;
        if (dir !== 0) { this.vx = dir * C.AIR * 0.9; this.vy = -C.JUMP_V * 0.7; this.facing = dir; }
        else { this.vx = 0; this.vy = 0; }
        return;
      }
      this.vy = ((down ? 1 : 0) - (up ? 1 : 0)) * C.CLIMB;
      const dy = this.vy * dt;
      const r = sweepY(this, dy, world.collect(sweptArea(this, 0, dy), {}));
      let ext = null;
      for (const rr of [Math.floor((this.y + this.h / 2) / TS), Math.floor((this.y + this.h - 1) / TS), Math.floor(this.y / TS)]) {
        if (world.tileAt(col, rr) === H.T.LADDER) { ext = world.ladderExtent(col, rr); break; }
      }
      if (!ext) { this.state = 'air'; this.ladderCol = -1; return; }
      if (up && this.y + this.h <= ext.top + 6) {
        this.y = ext.top - this.h; this.vy = 0;
        this.state = 'ground'; this.grounded = true; this.ladderCol = -1;
        return;
      }
      if (r.hit && dy > 0) { this.vy = 0; this.state = 'ground'; this.grounded = true; this.ladderCol = -1; return; }
      if (this.y > ext.bottom) { this.state = 'air'; this.ladderCol = -1; return; }
      if (dir !== 0 && !up && !down) {
        if (!world.isFree({ x: this.x, y: this.y + this.h, w: this.w, h: 2 })) {
          this.state = 'ground'; this.grounded = true; this.ladderCol = -1; this.facing = dir;
        }
      }
    }

    // ---------------- rope ----------------
    tryCatchRope(world) {
      const hx = this.cx, hy = this.y + 6;
      for (const r of world.ropes) {
        const vx = Math.sin(r.theta) * r.len, vy = Math.cos(r.theta) * r.len;
        let t = ((hx - r.ax) * vx + (hy - r.ay) * vy) / (r.len * r.len);
        t = Math.max(0, Math.min(1, t));
        if (Math.hypot(hx - (r.ax + vx * t), hy - (r.ay + vy * t)) < 14 && t * r.len > 28) {
          this.state = 'rope'; this.rope = r; this.ropeLen = t * r.len;
          const th = r.theta;
          r.omega = r.omega * 0.2 + 0.8 * (this.vx * Math.cos(th) - this.vy * Math.sin(th)) / this.ropeLen;
          this.vx = 0; this.vy = 0; this.grounded = false; this.grab = null;
          return true;
        }
      }
      return false;
    }

    placeOnRope(r, theta, len) {
      return { x: r.ax + Math.sin(theta) * len - this.w / 2, y: r.ay + Math.cos(theta) * len - 6, w: this.w, h: this.h };
    }

    updateRope(world, input, dt, dir) {
      const r = this.rope;
      this.apexY = this.y;
      if (input.pressed('jump')) {
        const L = this.ropeLen, th = r.theta, w = r.omega;
        this.vx = Math.max(-420, Math.min(420, L * w * Math.cos(th)));
        this.vy = -L * w * Math.sin(th) - 260;
        this.state = 'air'; this.rope = null; this.ropeCD = 0.35; this.cutDone = true;
        if (dir !== 0) this.facing = dir; else if (this.vx !== 0) this.facing = Math.sign(this.vx);
        return;
      }
      if (input.pressed('down') && this.ropeLen >= r.len - 4.5) {
        this.state = 'air'; this.rope = null; this.ropeCD = 0.4; this.vx = 0; this.vy = 0; this.cutDone = true;
        return;
      }
      let len = this.ropeLen;
      if (input.isHeld('up')) len = Math.max(28, len - C.ROPE_CLIMB * dt);
      if (input.isHeld('down')) len = Math.min(r.len - 4, len + C.ROPE_CLIMB * dt);
      if (len !== this.ropeLen && world.isFree(this.placeOnRope(r, r.theta, len))) this.ropeLen = len;
      const L = this.ropeLen;
      let a = -(PHYS.G / L) * Math.sin(r.theta);
      if (dir !== 0) a += dir * C.PUMP * (Math.sign(r.omega) === dir ? 1 : 0.35) / L;
      let w = (r.omega + a * dt) * (1 - 0.12 * dt);
      let th = r.theta + w * dt;
      if (th > 1.35) { th = 1.35; w = Math.min(0, w); }
      if (th < -1.35) { th = -1.35; w = Math.max(0, w); }
      if (!world.isFree(this.placeOnRope(r, th, L))) { w = -w * 0.25; th = r.theta; }
      r.theta = th; r.omega = w;
      const b = this.placeOnRope(r, th, L);
      this.x = b.x; this.y = b.y;
      this.vx = L * w * Math.cos(th); this.vy = -L * w * Math.sin(th);
      if (dir !== 0) this.facing = dir;
    }
  }

  H.Player = Player;
})(globalThis.Hollow = globalThis.Hollow || {});
