"""Level generator for Hollow (stage 1 grey-box).

Builds levels left-to-right from hand-designed puzzle segments joined by
uneven terrain (gentle hills, steep 45-degree inclines, steps, drops).
Every segment also emits bot "solution" steps that tests/bot.js replays to
prove the level can be finished. Counts of interactive items and obstacles
are recorded in each level's `stats`.
"""
import json, random, sys, os

TS = 32


class L:
    def __init__(s, lid, name, chapter, seed, R=30, top=18):
        s.id, s.name, s.chapter, s.R, s.top, s.c = lid, name, chapter, R, top, 0
        s.g = {}
        s.rng = random.Random(seed)
        s.ent = {k: [] for k in ['crates', 'boulders', 'plates', 'levers', 'movers', 'crushers', 'planks', 'traps', 'saws', 'ropes']}
        s.sol = []
        s.inter = {}
        s.obst = {}
        s.ids = 0
        s.cps = []

    # ---------- bookkeeping ----------
    def I(s, kind, n=1): s.inter[kind] = s.inter.get(kind, 0) + n
    def O(s, kind, n=1): s.obst[kind] = s.obst.get(kind, 0) + n
    def nid(s, p): s.ids += 1; return f'{p}{s.ids}'
    def add(s, _list, **kw): s.ent[_list].append(kw); return len(s.ent[_list]) - 1
    def step(s, *a): s.sol.append(list(a))
    def X(s, c, off=0.5): return round((c + off) * TS, 2)   # px x of a column point

    # ---------- tiles ----------
    def set(s, c, r, ch): s.g[(c, r)] = ch
    def solid_col(s, c, top, bottom=None):
        for r in range(top, s.R if bottom is None else bottom + 1): s.set(c, r, '#')
    def fill(s, c0, c1, r0, r1, ch='#'):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1): s.set(c, r, ch)
    def flat(s, n):
        for _ in range(n): s.solid_col(s.c, s.top); s.c += 1

    def up(s, k, steep=True):
        for _ in range(k):
            if steep:
                s.set(s.c, s.top - 1, '/'); s.solid_col(s.c, s.top); s.c += 1
            else:
                s.set(s.c, s.top - 1, 'a'); s.solid_col(s.c, s.top); s.c += 1
                s.set(s.c, s.top - 1, 'b'); s.solid_col(s.c, s.top); s.c += 1
            s.top -= 1

    def down(s, k, steep=True):
        for _ in range(k):
            if steep:
                s.set(s.c, s.top, '\\'); s.solid_col(s.c, s.top + 1); s.c += 1
            else:
                s.set(s.c, s.top, 'c'); s.solid_col(s.c, s.top + 1); s.c += 1
                s.set(s.c, s.top, 'd'); s.solid_col(s.c, s.top + 1); s.c += 1
            s.top += 1

    def checkpoint(s):
        s.flat(2)
        s.set(s.c - 1, s.top - 1, 'K')
        s.step('walk', s.X(s.c - 1))

    # ---------- terrain connectors (uneven ground + small obstacles) ----------
    def cliff_up(s, k):
        s.step('jump', s.X(s.c, -0.4), 1)
        s.top -= k

    def connector(s, pieces=3, hazards=True, lo=11, hi=21):
        r = s.rng
        for _ in range(pieces):
            opts = ['upS', 'dnS', 'upG', 'dnG', 'step', 'drop', 'mound', 'flat']
            if hazards: opts += ['spikes', 'trap', 'pit', 'spikes', 'trap']
            p = r.choice(opts)
            if p == 'upS' and s.top - 3 >= lo:
                s.up(r.randint(2, 3), True); s.flat(r.randint(1, 3))
            elif p == 'dnS' and s.top + 3 <= hi:
                s.down(r.randint(2, 3), True); s.flat(r.randint(1, 3))
            elif p == 'upG' and s.top - 2 >= lo:
                s.up(r.randint(1, 2), False); s.flat(r.randint(1, 2))
            elif p == 'dnG' and s.top + 2 <= hi:
                s.down(r.randint(1, 2), False); s.flat(r.randint(1, 2))
            elif p == 'step' and s.top - 2 >= lo:
                s.flat(1); s.cliff_up(r.randint(1, 2)); s.flat(2)
            elif p == 'drop' and s.top + 4 <= hi:
                s.flat(1); s.top += r.randint(2, 4); s.flat(2)
            elif p == 'mound' and s.top - 2 >= lo:
                s.flat(1); s.up(1, True); s.flat(r.randint(1, 3)); s.down(1, True); s.flat(1)
            elif p == 'spikes':
                s.flat(2); w = r.randint(1, 2)
                s.step('jump', s.X(s.c, -0.3), 1)
                for i in range(w): s.set(s.c, s.top, '^'); s.solid_col(s.c, s.top + 1); s.c += 1
                s.flat(2); s.O('spikes')
            elif p == 'trap':
                s.flat(2); s.add('traps', x=s.c, y=s.top - 1)
                s.step('jump', s.X(s.c, -0.6), 1)
                s.flat(3); s.O('bear trap')
            elif p == 'pit':
                s.flat(2); s.step('jump', s.X(s.c, -0.2), 1)
                s.c += 2; s.flat(2); s.O('pit')
            else:
                s.flat(r.randint(2, 3))
        s.step('walk', s.X(s.c - 1))

    def toward(s, lo, hi):
        """Bring ground height into [lo, hi] using slopes."""
        if s.top < lo:
            s.flat(1); s.down(min(3, lo - s.top), True); s.flat(1)
        elif s.top > hi:
            s.flat(1); s.up(min(3, s.top - hi), True); s.flat(1)
        while s.top < lo or s.top > hi:
            if s.top < lo: s.down(1, False)
            else: s.up(1, False)
        s.flat(1)
        s.step('walk', s.X(s.c - 1))

    # ---------- segments ----------
    def crate_wall(s):
        s.toward(13, 22); s.checkpoint(); c = s.c
        s.flat(2); ci = s.add('crates', x=s.c, y=s.top - 1); s.flat(6)
        wall = s.c; s.top -= 3; s.flat(3)
        s.step('push', 'crate', ci, s.X(wall, -0.5))
        s.step('hop', 1); s.step('hop', 1); s.step('walk', s.X(wall + 2))
        s.I('crate')

    def plate_gate(s):
        s.toward(12, 22); s.checkpoint(); T = s.top
        s.flat(1); ci = s.add('crates', x=s.c, y=T - 1); s.flat(4)
        pid = s.nid('p'); s.add('plates', id=pid, x=s.c, y=T, w=2); pc = s.c; s.flat(2)
        s.flat(9); g = s.c; s.fill(g, g, 0, T - 5); s.add('movers', kind='gate', x=g + 6 / 32, y=T - 4, w=20 / 32, h=4, dx=0, dy=-4, needs=[pid], speed=4)
        s.flat(3)
        s.step('push', 'crate', ci, s.X(pc, 1.0))
        s.step('hop', 1)
        s.step('waitMover', len(s.ent['movers']) - 1, 0.99)
        s.step('walk', s.X(g + 2))
        s.I('crate'); s.I('pressure plate'); s.O('gate')

    def lever_lift(s, k=5):
        s.toward(12 + k, 22); s.checkpoint(); T = s.top
        lid = s.nid('l'); s.add('levers', id=lid, x=s.c, y=T - 1); lc = s.c; s.flat(3)
        s.step('jump', s.X(s.c, -0.3), 1)
        for _ in range(2): s.set(s.c, T, '^'); s.solid_col(s.c, T + 1); s.c += 1
        s.O('spikes'); s.flat(1)
        lift = s.c
        s.solid_col(lift, T + 1); s.solid_col(lift + 1, T + 1); s.c += 2
        mi = s.add('movers', kind='lift', x=lift, y=T, w=2, h=1, dx=0, dy=-k, needs=['self', lid], speed=2)
        s.top = T - k; s.flat(3)
        s.sol.insert(len(s.sol) - 1, ['lever', len(s.ent['levers']) - 1])
        s.sol.insert(len(s.sol) - 2, ['walk', s.X(lc)])
        s.step('walk', s.X(lift + 1, 0.2))
        s.step('waitMover', len(s.ent['movers']) - 1, 0.99)
        s.step('walk', s.X(lift + 3))
        s.I('lever'); s.I('lift')

    def rope_pit(s, w=6):
        s.toward(11, 21); s.checkpoint(); T = s.top
        s.flat(3); e = s.c - 1
        s.fill(e + 1, e + 3, T - 9, T - 9)
        s.add('ropes', x=e + 2, y=T - 8, len=6)
        for i in range(w): s.set(s.c, T + 1, '^'); s.solid_col(s.c, T + 2); s.c += 1
        s.flat(3)
        s.step('jump', s.X(e, 0.82), 1)
        s.step('rope', len(s.ent['ropes']) - 1, s.X(e + w + 2))
        s.step('walk', s.X(e + w + 3))
        s.I('rope'); s.O('spike pit')

    def trap_tunnel(s):
        s.toward(12, 22); s.checkpoint(); T = s.top
        s.flat(1); ci = s.add('crates', x=s.c, y=T - 1); s.flat(4)
        t0 = s.c
        s.fill(t0, t0 + 9, 0, T - 3)
        s.flat(3); s.add('traps', x=s.c, y=T - 1); s.add('traps', x=s.c + 1, y=T - 1); s.flat(7)
        s.flat(4); end = s.c
        s.step('push', 'crate', ci, s.X(end - 2))
        s.step('hop', 1); s.step('walk', s.X(end))
        s.I('crate'); s.O('bear trap', 2)

    def plank_drop(s, kind='crate'):
        s.toward(13, 22); s.checkpoint(); T = s.top
        s.flat(2); s.cliff_up(2)
        s.flat(1);
        if kind == 'crate': bi = s.add('crates', x=s.c, y=T - 3)
        else: bi = s.add('boulders', x=s.c, y=T - 3)
        s.flat(3); edge = s.c
        sh = s.c
        s.solid_col(sh, T + 4); s.solid_col(sh + 1, T + 4)
        s.add('planks', x=sh, y=T, w=2)
        s.c += 2
        for i in range(6): s.fill(s.c, s.c, 0, T + 1); s.solid_col(s.c, T + 4); s.c += 1
        lad = s.c
        s.fill(lad, lad, T, T + 3, 'H'); s.solid_col(lad, T + 4); s.c += 1
        for i in range(3): s.fill(s.c, s.c, T, T + 1); s.solid_col(s.c, T + 4); s.c += 1
        dead = s.c - 1
        s.top = T; s.flat(3)
        s.step('push', kind, bi, s.X(edge, 1.4))
        s.step('waitBody', kind, bi)
        s.step('walk', s.X(sh, 0.3))
        s.step('waitLand')
        s.step('push', kind, bi, s.X(dead, 0.45))
        s.step('climb', 'up', s.X(lad))
        s.step('walk', s.X(dead + 2))
        s.I(kind if kind == 'crate' else 'boulder'); s.I('breakable plank'); s.I('ladder (not counted)', 0)

    def saw_lever(s):
        s.toward(12, 22); s.checkpoint(); T = s.top
        lid = s.nid('l'); s.add('levers', id=lid, x=s.c, y=T - 1); lc = s.c; s.flat(3)
        for i in range(3):
            s.add('saws', x=s.c + i * 4 + 1, y=T - 1.75, dx=3, dy=0, r=27, period=1.5, phase=i * 0.33, stopOn=lid)
        s.flat(14)
        s.step('walk', s.X(lc)); s.step('lever', len(s.ent['levers']) - 1); s.step('wait', 0.6)
        s.step('walk', s.X(s.c - 1))
        s.I('lever'); s.O('saw blade', 3)

    def saw_timing(s, n=3):
        s.toward(12, 22); s.checkpoint(); T = s.top
        s.flat(2)
        for i in range(n):
            si = s.add('saws', x=s.c + 1, y=T - 0.5, dx=0, dy=-3, r=22, period=2.0, phase=s.rng.random())
            s.step('walk', s.X(s.c + 1) - 44)
            s.step('waitSaw', si, 0.62)
            s.flat(3)
            s.O('saw blade')
        s.flat(2); s.step('walk', s.X(s.c - 1))

    def crushers(s):
        s.toward(12, 22); s.checkpoint(); T = s.top
        lid = s.nid('l')
        s.flat(1); s.fill(s.c, s.c + 16, 0, T - 4)
        s.flat(1); s.add('levers', id=lid, x=s.c, y=T - 1); lc = s.c; s.flat(2)
        base = len(s.ent['movers']) + len(s.ent['crushers'])
        a = s.c + 1; s.add('crushers', x=a, y=T - 3, w=1, h=1, drop=2, period=2.4, phase=0.0); s.flat(4)
        b = s.c + 1; s.add('crushers', x=b, y=T - 3, w=1, h=1, drop=2, period=2.4, phase=0.45); s.flat(4)
        cc = s.c + 1; s.add('crushers', x=cc, y=T - 3, w=3, h=1, drop=2, period=1.6, phase=0.2, stopOn=lid); s.flat(6)
        s.step('walk', s.X(lc)); s.step('lever', len(s.ent['levers']) - 1)
        s.step('walk', s.X(a) - 44); s.step('waitCrusher', 'c', len(s.ent['crushers']) - 3)
        s.step('walk', s.X(b) - 44); s.step('waitCrusher', 'c', len(s.ent['crushers']) - 2)
        s.step('walk', s.X(cc + 4))
        s.I('lever'); s.O('crusher', 3)

    def double_plate(s):
        s.toward(12, 22); s.checkpoint(); T = s.top
        s.flat(1); b = s.add('crates', x=s.c, y=T - 1); bc = s.c
        s.flat(3); a = s.add('crates', x=s.c, y=T - 1)
        s.flat(4)
        p1 = s.nid('p'); s.add('plates', id=p1, x=s.c, y=T, w=2); p1c = s.c; s.flat(4)
        p2 = s.nid('p'); s.add('plates', id=p2, x=s.c, y=T, w=2); p2c = s.c; s.flat(2)
        s.flat(8); g = s.c; s.fill(g, g, 0, T - 5)
        s.add('movers', kind='gate', x=g + 6 / 32, y=T - 4, w=20 / 32, h=4, dx=0, dy=-4, needs=[p1, p2], speed=4)
        gi = len(s.ent['movers']) - 1
        s.flat(3)
        s.step('walk', s.X(bc) - 30); s.step('hop', 1)
        s.step('push', 'crate', a, s.X(p2c, 1.0))
        s.step('walk', s.X(bc + 1.6)); s.step('hop', -1); s.step('walk', s.X(bc) - 30)
        s.step('push', 'crate', b, s.X(p1c, 1.0))
        s.step('hop', 1); s.step('walk', s.X(p2c) - 30); s.step('hop', 1)
        s.step('waitMover', gi, 0.99); s.step('walk', s.X(g + 2))
        s.I('crate', 2); s.I('pressure plate', 2); s.O('gate')

    def bridge(s, w=5):
        s.toward(11, 21); s.checkpoint(); T = s.top
        lid = s.nid('l'); s.add('levers', id=lid, x=s.c, y=T - 1); lc = s.c
        s.flat(w); start = s.c - w
        for i in range(w): s.set(s.c, T + 1, '^'); s.solid_col(s.c, T + 2); s.c += 1
        s.add('movers', kind='bridge', x=start, y=T + 1, w=w, h=0.5, dx=w, dy=-1, needs=[lid], speed=3)
        s.flat(3)
        s.step('walk', s.X(lc)); s.step('lever', len(s.ent['levers']) - 1)
        s.step('waitMover', len(s.ent['movers']) - 1, 0.99)
        s.step('walk', s.X(s.c - 1))
        s.I('lever'); s.I('sliding bridge'); s.O('spike pit')

    def elevator_down(s, k=9):
        s.toward(11, 29 - k - 1); s.checkpoint(); T = s.top
        s.flat(2); lift = s.c
        s.add('movers', kind='lift', x=lift, y=T, w=2, h=1, dx=0, dy=k, needs=['self'], speed=2.5)
        s.c += 2; s.top = T + k; s.flat(3)
        s.step('walk', s.X(lift + 1, 0.0)); s.step('waitMover', len(s.ent['movers']) - 1, 0.99)
        s.step('walk', s.X(lift + 4))
        s.I('lift'); s.O('deep drop')

    def ambush(s):
        s.toward(14, 22); s.checkpoint(); T = s.top
        s.flat(2); s.cliff_up(2); m0 = s.c; s.flat(3)
        s.top = T; s.flat(3)
        s.up(3, True); top = s.c
        s.add('boulders', x=top, y=T - 4, hold={'zone': m0 + 2.6, 'vx': -130})
        bi = len(s.ent['boulders']) - 1
        s.flat(4)
        s.step('walk', s.X(m0 + 2.2)); s.step('wait', 0.4); s.step('waitBody', 'boulder', bi)
        s.step('walk', s.X(m0 + 3, 0.3)); s.step('hop', 1); s.step('walk', s.X(s.c - 1))
        s.O('boulder ambush')

    def boulder_valley(s):
        s.toward(12, 19); s.checkpoint(); T = s.top
        s.flat(1); bi = s.add('boulders', x=s.c + 1, y=T - 1); bc = s.c + 1; s.flat(4)
        a = s.c
        s.down(2, True); s.up(2, True)
        pid = s.nid('p'); s.add('plates', id=pid, x=a + 1.5, y=T + 2, w=1)
        s.flat(9); g = s.c; s.fill(g, g, 0, T - 5)
        s.add('movers', kind='gate', x=g + 6 / 32, y=T - 4, w=20 / 32, h=4, dx=0, dy=-4, needs=[pid], speed=4)
        gi = len(s.ent['movers']) - 1
        s.flat(3)
        s.step('walk', s.X(bc) - 30)
        s.step('push', 'boulder', bi, s.X(a, -0.1))
        s.step('wait', 1.0); s.step('waitBody', 'boulder', bi)
        s.step('walk', s.X(a, 1.0)); s.step('hop', 1)
        s.step('waitMover', gi, 0.99); s.step('walk', s.X(g + 2))
        s.I('boulder'); s.I('pressure plate'); s.O('gate')

    def crate_pit(s):
        s.toward(12, 18); s.checkpoint(); T = s.top
        s.flat(1); ci = s.add('crates', x=s.c, y=T - 1); s.flat(3)
        p0 = s.c
        for i in range(5): s.solid_col(s.c, T + 3); s.c += 1
        s.top = T; s.flat(3)
        s.step('push', 'crate', ci, s.X(p0, 0.6))
        s.step('waitBody', 'crate', ci)
        s.step('walk', s.X(p0, -0.3)); s.step('hop', 1); s.step('waitLand')
        s.step('pushTo', 'crate', ci, s.X(p0 + 4, 0.5))
        s.step('hop', 1); s.step('hop', 1); s.step('walk', s.X(p0 + 6))
        s.I('crate'); s.O('pit trap')

    # ---------- output ----------
    def finish(s):
        s.flat(3); s.set(s.c - 2, s.top - 1, 'E'); s.step('walk', s.X(s.c - 1)); s.flat(4)
        s.set(s.c, 0, '#'); W = s.c + 1
        for r in range(s.R): s.set(0, r, '#'); s.set(W - 1, r, '#')
        rows = [''.join(s.g.get((c, r), '.') for c in range(W)) for r in range(s.R)]
        inter = {k: v for k, v in s.inter.items() if v}
        lvl = {'id': s.id, 'name': s.name, 'chapter': s.chapter, 'rows': rows}
        for k, v in s.ent.items():
            if v: lvl[k] = v
        lvl['stats'] = {'interactive': inter, 'obstacles': s.obst,
                        'interactiveTotal': sum(inter.values()), 'obstacleTotal': sum(s.obst.values())}
        lvl['solution'] = s.sol
        return lvl

    def start(s):
        s.c = 1; s.flat(3); s.set(2, s.top - 1, 'P'); s.flat(2)


def build(lid, name, chapter, seed, plan):
    lv = L(lid, name, chapter, seed)
    lv.start()
    for seg in plan:
        lv.connector(lv.rng.randint(2, 4))
        getattr(lv, seg)()
    lv.connector(2)
    return lv.finish()



WORLDS = [
    ('forest', 'The Forest',  (13, 21), ['crate_wall', 'plate_gate', 'rope_pit', 'trap_tunnel', 'bridge', 'crate_pit', 'ambush', 'double_plate']),
    ('caves',  'The Caves',   (12, 20), ['saw_timing', 'lever_lift', 'plank_drop', 'elevator_down', 'crate_wall', 'trap_tunnel', 'plate_gate', 'rope_pit']),
    ('ruins',  'The Ruins',   (11, 21), ['boulder_valley', 'plank_drop:boulder', 'ambush', 'double_plate', 'bridge', 'rope_pit', 'crate_pit', 'lever_lift']),
    ('factory','The Factory', (12, 20), ['crushers', 'saw_lever', 'lever_lift', 'bridge', 'double_plate', 'plate_gate', 'saw_timing', 'elevator_down']),
    ('peaks',  'The Frozen Peaks', (11, 21), ['rope_pit', 'boulder_valley', 'ambush', 'crushers', 'plank_drop', 'saw_timing', 'double_plate', 'crate_wall']),
]

if __name__ == '__main__':
    out = sys.argv[1]
    for f in os.listdir(out):
        if f.endswith('.js'): os.remove(os.path.join(out, f))
    total_i = total_o = 0
    order = []
    for wi, (wid, wname, (lo, hi), pool) in enumerate(WORLDS):
        for li in range(10):
            lid = f'{wid}{li + 1}'
            rng = random.Random(1000 * wi + li)
            n = 4 + li // 3                     # levels get longer through a world
            plan = [pool[(li + k * 3) % len(pool)] for k in range(n)]
            rng.shuffle(plan)
            lv = L(lid, f'{wname} {li + 1}', wi + 1, 7919 * (wi + 1) + li)
            lv.world = wid
            lv.start()
            for seg in plan:
                lv.connector(lv.rng.randint(2, 3 + li // 4), lo=lo, hi=hi)
                fn, _, arg = seg.partition(':')
                getattr(lv, fn)(arg) if arg else getattr(lv, fn)()
            lv.connector(2, lo=lo, hi=hi)
            lvl = lv.finish(); lvl['world'] = wid; lvl['index'] = li
            js = ("(function (H) {\n  H.levels = H.levels || {};\n  H.levels." + lid + " = " + json.dumps(lvl, separators=(',', ':')) + ";\n"
                  "})(globalThis.Hollow = globalThis.Hollow || {});\n")
            open(os.path.join(out, lid + '.js'), 'w').write(js)
            order.append(lid)
            st = lvl['stats']; total_i += st['interactiveTotal']; total_o += st['obstacleTotal']
    open(os.path.join(out, '_index.json'), 'w').write(json.dumps({'order': order, 'worlds': [[w[0], w[1]] for w in WORLDS]}))
    print(f"levels={len(order)} TOTAL interactive={total_i} obstacles={total_o}")
