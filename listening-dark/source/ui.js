// ---------- ui: menus, settings and story screens; one navigation model for pad, keys, mouse and touch ----------
const ROWDEF = {}; SETTINGS.forEach(t => t.rows.forEach(r => { ROWDEF[r.k] = r; }));
function applySettings(k) {
  const S = Store.data.settings;
  AE.applyVolumes();
  document.documentElement.style.setProperty('--ui', S.uiScale);
  Input.syncTouch(); Store.save();
  if (k === 'sfx') AE.chirp();
  if (k === 'prompts') UI.onDevice();
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ICONS = {
  shard: '<svg viewBox="0 0 24 24"><path d="M12 2 6 12l6 10z" fill="#e1d2ff"/><path d="M12 2l6 10-6 10z" fill="#bea4ff"/></svg>',
  gate: '<svg viewBox="0 0 24 24" fill="none" stroke="#dee9e4" stroke-width="1.6" stroke-dasharray="1.6 2.4"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/></svg>',
  moth: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ffcc70" opacity=".18"/><path d="M12 9v6M11 11 5 7l1 8zM13 11l6-4-1 8z" fill="#ffcc70" stroke="#ffcc70"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="#70e8d6">' + [0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${12 + Math.cos(i * 1.047) * 6}" cy="${12 + Math.sin(i * 1.047) * 6}" rx="3.2" ry="1.8" transform="rotate(${i * 60} ${12 + Math.cos(i * 1.047) * 6} ${12 + Math.sin(i * 1.047) * 6})"/>`).join('') + '</svg>',
  verse: '<svg viewBox="0 0 24 24" fill="none" stroke="#ffe4f0" stroke-width="1.4"><path d="M12 12m0 0a1 1 0 0 1 1 1 2 2 0 0 1-2 2 3 3 0 0 1-3-3 4 4 0 0 1 4-4 5 5 0 0 1 5 5 6 6 0 0 1-6 6"/></svg>',
  stalker: '<svg viewBox="0 0 24 24"><path d="' + Array.from({ length: 22 }, (_, j) => { const a = j / 22 * 6.283, r = j % 2 ? 4.5 : 10; return (j ? 'L' : 'M') + (12 + Math.cos(a) * r).toFixed(1) + ' ' + (12 + Math.sin(a) * r).toFixed(1); }).join('') + 'z" fill="#460c0a" stroke="#ff5840"/></svg>',
  lurker: '<svg viewBox="0 0 24 24" fill="none" stroke="#ff5840" stroke-width="1.4"><path d="M3 10a9 9 0 0 1 18 0M3 14a9 9 0 0 0 18 0M7 6v3M10 4.5v3M14 4.5v3M17 6v3M7 18v-3M10 19.5v-3M14 19.5v-3M17 18v-3"/></svg>',
  kin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#ffc4aa" opacity=".16"/><path d="M12 14c-1.5-3-4.5-4-8.5-3 2-2 5-3 7.5-2l1-2 1 2c2.5-1 5.5 0 7.5 2-4-1-7 0-8.5 3z" fill="#ffc4aa"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="#aa2830" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="3"/></svg>'
};
const UI = {
  screen: null, back: null, redo: null, tab: 0,
  init() {
    this.el = document.getElementById('ui');
    this.el.addEventListener('click', e => this.onClick(e));
    this.el.addEventListener('pointerover', e => {
      const b = e.target.closest('.mi,.tab'); if (!b || b.disabled || b === document.activeElement || e.pointerType === 'touch') return;
      b.focus({ preventScroll: true }); AE.uiMove();
    });
    this.el.addEventListener('pointerdown', e => {
      const tr = e.target.closest('.track'); if (!tr) return;
      const row = tr.closest('.row'); e.preventDefault(); row.focus({ preventScroll: true });
      const set = ev => { const r = tr.getBoundingClientRect(); this.setSlider(row, clamp((ev.clientX - r.left) / r.width, 0, 1)); };
      set(e); tr.setPointerCapture(e.pointerId);
      const mv = ev => set(ev), up = () => { tr.removeEventListener('pointermove', mv); tr.removeEventListener('pointerup', up); };
      tr.addEventListener('pointermove', mv); tr.addEventListener('pointerup', up);
    });
  },
  open() { return this.el.style.display !== 'none' && !!this.screen; },
  items() { return [...this.el.querySelectorAll('.mi:not([disabled])')]; },
  move(d) {
    const it = this.items(); if (!it.length) return;
    const i = it.indexOf(document.activeElement);
    const n = it[i < 0 ? 0 : (i + d + it.length) % it.length];
    n.focus({ preventScroll: false }); AE.uiMove(); R.titleWave();
  },
  goBack() { if (this.back) { AE.uiBack(); this.back(); } },
  nav(a) {
    if (!this.open()) return;
    const f = document.activeElement, inUI = f && this.el.contains(f);
    if (a === 'up') this.move(-1);
    else if (a === 'down') this.move(1);
    else if (a === 'left' || a === 'right') { if (inUI && f.dataset.type) this.adjust(f, a === 'left' ? -1 : 1); }
    else if (a === 'confirm') { if (inUI && f.click) f.click(); else this.move(0); }
    else if (a === 'back') this.goBack();
    else if (a === 'tabPrev' || a === 'tabNext') { if (this.screen === 'settings') { AE.uiTab(); this.settings(this.from, (this.tab + (a === 'tabNext' ? 1 : -1) + SETTINGS.length) % SETTINGS.length); } }
    else if (a.startsWith('digit') && this.screen === 'roost') { const b = this.el.querySelectorAll('[data-act=boon]')[+a.slice(5) - 1]; if (b) b.click(); }
  },
  kbd(a) { const set = Input.glyphSet(), g = GLYPHS[set][a] || a; return `<kbd class="k k-${set}${g.length <= 1 ? ' round' : ''}">${esc(g)}</kbd>`; },
  footer(list) { return `<div class="prompts" aria-hidden="true">${list.map(([a, l]) => `<span>${this.kbd(a)}${l}</span>`).join('')}</div>`; },
  show(name, html, o = {}) {
    const keep = o.keepFocus ? this.items().indexOf(document.activeElement) : -1;
    this.screen = name; this.back = o.back || null; this.redo = o.redo || null; this.busy = false;
    this.el.innerHTML = `<div class="screen s-${name}${o.fade === false ? ' nofade' : ''}${G.state === 'paused' ? ' over-game' : ''}">${html}${o.footer ? this.footer(o.footer) : ''}</div>`;
    this.el.style.display = 'block';
    const it = this.items();
    const f = keep >= 0 && it[keep] ? it[keep] : (this.el.querySelector('[autofocus]:not([disabled])') || it[0]);
    if (f) requestAnimationFrame(() => f.focus({ preventScroll: true }));
  },
  hide() { this.busy = false; this.el.innerHTML = ''; this.el.style.display = 'none'; this.screen = null; this.back = null; this.redo = null; },
  onDevice() { if (this.redo && this.open()) this.redo(true); const b = document.getElementById('bootPrompt'); if (b) b.innerHTML = Boot.prompt(); },
  toast(a, b) {
    const t = document.getElementById('toast'); if (!t) return;
    t.innerHTML = `<strong>${esc(a)}</strong>${b ? `<span>${esc(b)}</span>` : ''}`; t.classList.add('on');
    clearTimeout(this.tt); this.tt = setTimeout(() => t.classList.remove('on'), 2600);
  },
  onClick(e) {
    const tab = e.target.closest('[data-tab]');
    if (tab) { AE.uiTab(); this.settings(this.from, +tab.dataset.tab); return; }
    const row = e.target.closest('.row[data-type]');
    if (row) {
      const t = row.dataset.type;
      if (t === 'toggle') this.adjust(row, 1);
      else if (t === 'choice') { const a = e.target.closest('[data-dir]'); this.adjust(row, a ? +a.dataset.dir : 1); }
      else if (t === 'action') this.action(row);
      return;
    }
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    this.act(b.dataset.act, b);
  },

  // ---------- screens ----------
  runLabel(r) {
    if (!r) return '';
    if (r.mode === 'story') return `Chapter ${ROMAN[r.depth]} · ${STORY[r.depth].title}${r.replay ? ' · replay' : ''}`;
    if (r.mode === 'daily') return `Daily cave · depth ${r.depth}${r.date !== todayStr() ? ' · from ' + r.date : ''}`;
    if (r.mode === 'endless') return `Endless · depth ${r.depth}`;
    return `Descent · depth ${r.depth} · ${DIFFS[r.diff].name}`;
  },
  title(re) {
    G.state = 'title'; Input.showTouch(false); G.busy = false;
    if (!G.demo) makeDemo();
    if (!re) { Music.setMode('title'); AE.muffle(false); }
    const S = Store.data, m = S.meta, last = S.last && S.runs[S.last], nA = Object.keys(m.ach).length;
    const endlessOpen = m.bestDepth >= 5 || Object.keys(m.endings).length > 0;
    const daily = m.dailyBest[todayStr()], st = S.story;
    const storyDim = S.runs.story ? 'chapter ' + S.runs.story.depth + ' of 8' : Object.keys(st.endings).length ? 'finished · ' + kinFound() + ' of 6 found' : 'eight chapters';
    this.show('title', `
      <div class="t-wrap">
        <h1 class="sr">The Listening Dark</h1>
        <div id="titleBox" aria-hidden="true"></div>
        <p class="sub">You cannot see. You can only call, and listen to what answers.</p>
        <nav class="menu">
          ${last ? `<button class="mi" data-act="continue" autofocus>Continue <span class="dim">${esc(this.runLabel(last))}</span></button>` : ''}
          <button class="mi" data-act="story" ${last ? '' : 'autofocus'}>Story <span class="dim">${storyDim}</span></button>
          <button class="mi" data-act="new">Descent <span class="dim">eight depths, one life</span></button>
          <button class="mi" data-act="daily">Daily cave <span class="dim">${todayStr()}${daily ? ' · best ' + daily : ''}</span></button>
          <button class="mi" data-act="endless" ${endlessOpen ? '' : 'disabled'}>Endless deep <span class="dim">${endlessOpen ? (m.endlessBest ? 'deepest ' + m.endlessBest : 'no end, no mercy') : 'opens at depth five'}</span></button>
          <button class="mi" data-act="settings">Settings</button>
          <button class="mi" data-act="howto">How to play</button>
          <button class="mi" data-act="journal">Journal <span class="dim">${nA} / ${ACH.length}</span></button>
          <button class="mi" data-act="credits">Credits</button>
        </nav>
      </div>
      <div class="t-meta"><p class="hp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v6H4zM17 15h3v6h-3z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Best with headphones</p>
      <p>v${VERSION}${Store.persistent ? '' : ' · this browser is not keeping saves'}${Store.recovered ? ' · save restored from backup' : ''}</p></div>`,
    { redo: () => this.title(true), footer: [['nav', 'Move'], ['confirm', 'Select']], keepFocus: re });
  },
  story(re) {
    const S = Store.data, st = S.story, r = S.runs.story;
    const found = KIN.map((k, i) => hasKin(i) ? k.name : null).filter(Boolean);
    const ends = Object.keys(st.endings).map(k => STORY_ENDINGS[k] ? STORY_ENDINGS[k].title : k);
    this.show('story', `
      <div class="pgrid">
        <div>
          <p class="kicker">Story</p>
          <h2>The Colony’s Song</h2>
          <p class="lead">Eight chapters down to the Hollow Heart. Six of the colony are lost in the dark. The song that could save them is in pieces.</p>
          <nav class="menu">
            ${r ? `<button class="mi" data-act="continueSlot" data-v="story" autofocus>Continue <span class="dim">${esc(this.runLabel(r))}</span></button>` : ''}
            <button class="mi" data-act="storyNew" ${r ? '' : 'autofocus'}>${r || ends.length ? 'Begin the story again' : 'Begin the story'}</button>
            <button class="mi" data-act="chapters" ${st.chapters > 1 ? '' : 'disabled'}>Chapter select <span class="dim">${st.chapters > 1 ? st.chapters + ' of 8 open' : 'opens as you go'}</span></button>
            <button class="mi" data-act="back">Back</button>
          </nav>
        </div>
        <aside class="status"><dl>
          <dt>Furthest</dt><dd>Chapter ${ROMAN[st.chapters]}, ${esc(STORY[st.chapters].title)}</dd>
          <dt>The lost</dt><dd>${found.length ? esc(found.join(', ')) + ` (${found.length} of 6)` : 'none found yet'}</dd>
          <dt>Verses</dt><dd>${Object.keys(st.found.verses).length} of 4</dd>
          <dt>Endings</dt><dd>${ends.length ? esc(ends.join(', ')) : 'none yet'} <span class="dim">of 3</span></dd>
        </dl></aside>
      </div>`, { back: () => this.title(), redo: () => this.story(true), footer: [['nav', 'Move'], ['confirm', 'Select'], ['back', 'Back']], keepFocus: re });
  },
  chapters(re) {
    const st = Store.data.story;
    this.show('chapters', `
      <p class="kicker">Chapter select</p>
      <h2>Go back for anyone you left.</h2>
      <p class="lead">A replayed chapter starts with full wings and no boons, then carries on down. The lost you find and the verses you learn stay with you for good.</p>
      <nav class="menu chlist">
        ${STORY.slice(1).map((ch, i) => { const d = i + 1, k = KIN_AT[d], v = SONG_DEPTHS[d];
          const marks = [k != null ? (hasKin(k) ? KIN[k].name + ' found' : 'someone is lost here') : '', v != null ? (st.found.verses[v] ? 'verse learned' : 'a verse is hidden here') : ''].filter(Boolean).join(' · ');
          return `<button class="mi" data-act="chapterPick" data-v="${d}" ${d > st.chapters ? 'disabled' : ''} ${d === 1 ? 'autofocus' : ''}><span class="num">${ROMAN[d]}</span> ${esc(ch.title)} <span class="dim">${d > st.chapters ? 'not reached' : esc(marks)}</span></button>`; }).join('')}
        <button class="mi" data-act="back">Back</button>
      </nav>`, { back: () => this.story(), redo: () => this.chapters(true), footer: [['nav', 'Move'], ['confirm', 'Play'], ['back', 'Back']], keepFocus: re });
  },
  prologue() {
    G.state = 'chapter';
    this.show('intro', `
      <div class="intro">
        <p class="kicker" style="--d:0s">Prologue</p>
        ${PROLOGUE.map((t, i) => `<p style="--d:${0.3 + i * 1.5}s">${esc(t)}</p>`).join('')}
        <button class="mi go" data-act="toChapter" style="--d:${0.3 + PROLOGUE.length * 1.5}s" autofocus>Go on</button>
      </div>`, { back: () => this.chapter(), footer: [['confirm', 'Go on']] });
  },
  chapter() {
    const r = G.run; if (!r) return this.title();
    G.state = 'chapter'; Input.showTouch(false); AE.storySting(); Music.setMode('interlude');
    const d = r.depth, ch = STORY[d], k = KIN_AT[d], v = SONG_DEPTHS[d];
    const notes = [k != null && !r.kin.includes(k) ? 'Somewhere here, a lost voice.' : '', v != null && !r.songs.includes(v) ? 'A verse is hidden in this place.' : ''].filter(Boolean).join(' ');
    this.show('chapter', `
      <div class="intro">
        <p class="kicker" style="--d:0s">Chapter ${ROMAN[d]}</p>
        <h2 class="chtitle" style="--d:.15s">${esc(ch.title)}</h2>
        ${ch.intro.map((t, i) => `<p style="--d:${0.7 + i * 1.3}s">${esc(t)}</p>`).join('')}
        ${notes ? `<p class="note" style="--d:${0.7 + ch.intro.length * 1.3}s">${notes}</p>` : ''}
        <button class="mi go" data-act="begin" style="--d:${0.9 + ch.intro.length * 1.3}s" autofocus>Descend</button>
      </div>`, { back: () => this.act('begin'), footer: [['confirm', 'Descend']] });
  },
  newGame(mode, re) {
    const r = Store.data.runs[mode]; this.mode = mode;
    const head = { endless: ['Endless deep', 'Depth after depth, each one hungrier. No ending.'], story: ['Story', 'Choose how kind the dark should be. You can’t change it later in this telling.'], descent: ['Descent', 'Eight depths down to the Hollow Heart. One life.'] }[mode];
    this.show('diff', `
      <p class="kicker">${head[0]}</p>
      <h2>How kind should the dark be?</h2>
      <p class="lead">${head[1]}</p>
      ${r && mode !== 'story' ? '<p class="warn">Starting over replaces the run you have saved.</p>' : ''}
      <nav class="menu">
        ${r && mode !== 'story' ? `<button class="mi" data-act="continueSlot" data-v="${mode}" autofocus>Continue <span class="dim">${esc(this.runLabel(r))}</span></button>` : ''}
        ${Object.entries(DIFFS).map(([k, d]) => `<button class="mi" data-act="diff" data-v="${k}" ${k === 'standard' && !(r && mode !== 'story') ? 'autofocus' : ''}>${d.name} <span class="dim">${d.desc}</span></button>`).join('')}
        <button class="mi" data-act="back">Back</button>
      </nav>`, { back: () => mode === 'story' ? this.story() : this.title(), redo: () => this.newGame(mode, true), footer: [['nav', 'Move'], ['confirm', 'Select'], ['back', 'Back']], keepFocus: re });
  },
  intro() {
    this.show('intro', `
      <div class="intro">
        <p style="--d:.2s">The colony stopped singing the night the water rose.</p>
        <p style="--d:1.6s">You are the last of them who still calls into the dark.</p>
        <p style="--d:3s">Go down. Listen. Bring the song home.</p>
        <button class="mi go" data-act="begin" style="--d:4.2s" autofocus>Begin</button>
      </div>`, { back: () => this.act('begin'), footer: [['confirm', 'Begin']] });
  },
  rowInner(d) {
    const S = Store.data.settings, v = S[d.k];
    const note = d.note ? `<span class="rnote">${esc(d.note)}</span>` : '';
    const lbl = `<span class="lbl">${esc(d.label)}${note}</span>`;
    if (d.type === 'slider') { const f = (v - d.min) / (d.max - d.min) * 100; return `${lbl}<span class="ctl"><span class="track"><span class="fill" style="width:${f}%"></span><span class="knob" style="left:${f}%"></span></span><output>${d.fmt(v)}</output></span>`; }
    if (d.type === 'toggle') return `${lbl}<span class="ctl"><span class="sw${v ? ' on' : ''}"><i></i></span><output>${v ? 'On' : 'Off'}</output></span>`;
    if (d.type === 'choice') return `${lbl}<span class="ctl"><i class="arr" data-dir="-1">‹</i><output>${esc(d.fmt(v))}</output><i class="arr" data-dir="1">›</i></span>`;
    return `${lbl}<span class="ctl"><output></output></span>`;
  },
  settings(from, tab = this.tab, re) {
    this.tab = tab; this.from = from;
    const T = SETTINGS[tab];
    const locked = tab === 1 ? Object.entries(PALETTES).find(([id]) => !paletteUnlocked(id)) : null;
    this.show('settings', `
      <p class="kicker">Settings</p>
      <div class="tabs" role="tablist">${SETTINGS.map((t, i) => `<button class="tab${i === tab ? ' on' : ''}" role="tab" aria-selected="${i === tab}" data-tab="${i}">${t.name}</button>`).join('')}</div>
      <div class="set" role="tabpanel">
        ${T.rows.map((d, i) => `<button class="mi row${d.danger ? ' danger' : ''}" data-k="${d.k}" data-type="${d.type}" ${i === 0 ? 'autofocus' : ''} ${d.type === 'slider' ? `role="slider" aria-valuemin="${d.min}" aria-valuemax="${d.max}" aria-valuenow="${Store.data.settings[d.k]}"` : ''}>${this.rowInner(d)}</button>`).join('')}
        ${locked ? `<p class="note">${PALETTES[locked[0]].name} echoes: ${locked[1].ending ? 'earned by a certain ending' : locked[1].req + ' moths gathered across all descents (' + Store.data.meta.lifetimeMoths + ' so far)'}</p>` : ''}
        ${tab === 3 ? `<p class="note">Controller: ${Input.padObj ? esc(Input.padObj.id.slice(0, 60)) : 'none detected yet. Press any button on a connected controller.'}</p>` : ''}
      </div>
      <nav class="menu"><button class="mi" data-act="defaults">Restore ${T.name.toLowerCase()} defaults</button><button class="mi" data-act="back">Back</button></nav>`,
    { back: from, redo: () => this.settings(from, this.tab, true), footer: [['nav', 'Move'], ['adjust', 'Change'], ['tab', 'Section'], ['back', 'Back']], keepFocus: re });
  },
  adjust(row, dir) {
    const k = row.dataset.k, d = ROWDEF[k], S = Store.data.settings;
    if (!d) return;
    if (d.type === 'slider') {
      const v = +clamp(Math.round((S[k] + dir * d.step) / d.step) * d.step, d.min, d.max).toFixed(3);
      if (v === S[k]) { AE.uiError(); return; }
      S[k] = v; AE.uiSlide((v - d.min) / (d.max - d.min));
    } else if (d.type === 'toggle') { S[k] = !S[k]; AE.uiToggle(S[k]); }
    else if (d.type === 'choice') { const o = d.opts(); S[k] = o[(o.indexOf(S[k]) + dir + o.length) % o.length]; AE.uiMove(); }
    else return;
    this.updateRow(row); applySettings(k);
  },
  setSlider(row, f) {
    const k = row.dataset.k, d = ROWDEF[k], S = Store.data.settings;
    const v = +clamp(Math.round((d.min + f * (d.max - d.min)) / d.step) * d.step, d.min, d.max).toFixed(3);
    if (v !== S[k]) { S[k] = v; AE.uiSlide(f); this.updateRow(row); applySettings(k); }
  },
  updateRow(row) { const d = ROWDEF[row.dataset.k]; row.innerHTML = this.rowInner(d); if (d.type === 'slider') row.setAttribute('aria-valuenow', Store.data.settings[d.k]); },
  action(row) {
    if (row.dataset.k !== 'erase') return;
    const out = row.querySelector('output');
    if (row.dataset.armed) {
      const s = Store.data.settings; Store.data = Store.defaults(); Store.data.settings = s; s.palette = 'bone'; Store.save();
      out.textContent = 'Erased'; row.disabled = true; AE.uiBack();
    } else { row.dataset.armed = '1'; out.textContent = 'Press again to erase everything'; AE.uiError(); }
  },
  howto(from, re) {
    const set = Input.glyphSet(), pad = set === 'ps' ? 'ps' : 'xbox';
    const col = k => set === k || (k === 'pad' && (set === 'xbox' || set === 'ps')) ? ' class="cur"' : '';
    const G2 = GLYPHS[pad], K = GLYPHS.kb;
    const rows = [['Fly', 'WASD or arrows', G2.move, 'Drag on the left'], ['Call', `${K.call} or left click`, G2.call + ' or RT', 'CALL'], ['Call farther', 'Hold, then release', 'Hold ' + G2.call, 'Hold CALL'], ['Glide silently', 'Hold ' + K.glide, 'Hold ' + G2.glide + ' or LT', 'Push the stick gently'], ['Dart', `${K.dart} or right click`, G2.dart + ', X or RB', 'DART'], ['Pause', 'Esc or P', G2.pause, 'II, top right']];
    const guide = [['shard', 'Violet shards', 'Gather every one to open the way down.'], ['gate', 'The way down', 'Hums once open. Follow it by ear.'], ['moth', 'Moths', 'Glow on their own. Twelve mend a wing. Loud wings scare them off.'], ['bell', 'Bellflowers', 'Ring when your call reaches them, and draw hunters to them.'], ['verse', 'Lost verses', 'Four hide in nooks. Carry all four to the bottom.'], ['kin', 'The lost', 'In the story, six of the colony hide in the dark. Your call makes them answer. Find them to send them home.'], ['stalker', 'Spined hunters', 'Go wherever they last heard something. They click as they move.'], ['lurker', 'Jawed lurkers', 'Wait in nooks. Fly past slowly and they never stir.'], ['mute', 'The Mute', 'At the bottom. It swallows echoes and drifts through stone.']];
    this.show('howto', `
      <p class="kicker">How to play</p>
      <h2>Every call is light. Every call is heard.</h2>
      <div class="howgrid">
        <div>
          <table class="ctl">
            <tr><th></th><th${col('kb')}>Keyboard &amp; mouse</th><th${col('pad')}>Controller</th><th${col('touch')}>Touch</th></tr>
            ${rows.map(r => `<tr><td>${r[0]}</td><td${col('kb')}>${esc(r[1])}</td><td${col('pad')}>${esc(r[2])}</td><td${col('touch')}>${esc(r[3])}</td></tr>`).join('')}
          </table>
          <p class="note">A short chirp is quiet and close. A held call reaches far and wakes everything that listens. Echoes show where things were when the wave touched them, not where they are now.</p>
        </div>
        <ul class="guide">${guide.map(([i, n, d]) => `<li><span class="ic">${ICONS[i]}</span><span><strong>${n}</strong>${d}</span></li>`).join('')}</ul>
      </div>
      <nav class="menu"><button class="mi" data-act="back" autofocus>Back</button></nav>`,
    { back: from, redo: () => this.howto(from, true), footer: [['confirm', 'Back'], ['back', 'Back']] });
  },
  journal(re) {
    const m = Store.data.meta;
    this.show('journal', `
      <p class="kicker">Journal</p>
      <h2>What the dark has taught you</h2>
      <div class="jgrid">
        <div>
          <p class="stats">${m.lifetimeMoths} moths gathered · deepest ${m.bestDepth} · ${Object.keys(m.endings).length} of 2 endings · ${m.runs} descents</p>
          <ol class="verses">${SONG_TEXT.map((t, i) => `<li class="${m.verses[i] ? 'got' : ''}">${m.verses[i] ? '“' + esc(t) + '”' : 'A verse not yet found.'}</li>`).join('')}</ol>
          <p class="kicker" style="margin-top:1.2rem">The lost</p>
          <ul class="kinlist">${KIN.map((k, i) => `<li class="${hasKin(i) ? 'got' : ''}">${hasKin(i) ? esc(k.name) + ' <span class="dim">home</span>' : 'Someone in chapter ' + ROMAN[k.chapter]}</li>`).join('')}</ul>
        </div>
        <ul class="achs">${ACH.map(a => `<li class="${m.ach[a.id] ? 'got' : ''}"><strong>${a.name}</strong><span>${a.desc}</span></li>`).join('')}</ul>
      </div>
      <nav class="menu"><button class="mi" data-act="back" autofocus>Back</button></nav>`,
    { back: () => this.title(), redo: () => this.journal(true), footer: [['back', 'Back']] });
  },
  credits(from) {
    this.show('credits', `
      <p class="kicker">Credits</p>
      <h2>The Listening Dark</h2>
      <dl class="cred">
        <dt>Design, code, writing, art, sound and music</dt><dd>Claude (Anthropic)</dd>
        <dt>Made of</dt><dd>Canvas 2D and the Web Audio API. No image files, no audio files, no third-party code. Every echo is drawn and every sound is synthesized as you play.</dd>
        <dt>Type</dt><dd>EB Garamond by Georg Duffner and Octavio Pardo, SIL Open Font License. Loaded from Google Fonts when online; Georgia when not.</dd>
        <dt>Thanks</dt><dd>To you, for listening.</dd>
      </dl>
      <nav class="menu"><button class="mi" data-act="back" autofocus>Back</button></nav>`,
    { back: from || (() => this.title()), footer: [['back', 'Back']] });
  },
  pause(re) {
    const r = G.run, L = G.L, mm = Math.floor(L.stats.time / 60), ss = String(Math.floor(L.stats.time % 60)).padStart(2, '0'), story = r.mode === 'story';
    const boons = Object.entries(r.boons).map(([id, n]) => (BOONS.find(b => b.id === id) || {}).name + (n > 1 ? ' ' + ['', '', 'II', 'III'][n] : ''));
    this.show('pause', `
      <div class="pgrid">
        <div>
          <p class="kicker">Paused</p>
          <h2>${esc(story ? STORY[r.depth].title : depthName(r))}</h2>
          <nav class="menu">
            <button class="mi" data-act="resume" autofocus>Resume</button>
            <button class="mi" data-act="settings">Settings</button>
            <button class="mi" data-act="howto">How to play</button>
            <button class="mi" data-act="restart">Restart this ${story ? 'chapter' : 'depth'}</button>
            <button class="mi" data-act="quit">Quit to title <span class="dim">resume later from the start of this ${story ? 'chapter' : 'depth'}</span></button>
            ${story ? '' : '<button class="mi danger" data-act="abandon">Abandon this run</button>'}
          </nav>
        </div>
        <aside class="status">
          <dl>
            <dt>${story ? 'Chapter' : 'Depth'}</dt><dd>${story ? ROMAN[r.depth] + ' of VIII' : r.depth + (r.mode === 'endless' ? ' · endless' : ' of ' + FINAL_DEPTH)}</dd>
            <dt>Shards</dt><dd>${L.shardsGot} of ${L.shardsNeeded}${L.gate.open ? ' · the way is open' : ''}</dd>
            <dt>Wings</dt><dd>${r.hearts} of ${r.maxHearts}</dd>
            <dt>Moths</dt><dd>${r.moths} · ${12 - r.mothMeter} more to mend</dd>
            <dt>Verses</dt><dd>${versesKnown(r)} of 4</dd>
            ${story ? `<dt>The lost</dt><dd>${kinFound()} of 6 home${L.kin ? (L.kin.got ? ' · ' + esc(KIN[L.kin.idx].name) + ' found here' : ' · someone is lost here') : ''}</dd>` : ''}
            <dt>This ${story ? 'chapter' : 'depth'}</dt><dd>${mm}:${ss} · ${plural(L.stats.pings, 'call')}</dd>
            <dt>Boons</dt><dd>${boons.length ? boons.map(esc).join(', ') : 'none yet'}</dd>
          </dl>
        </aside>
      </div>`, { back: () => resumeGame(), redo: () => this.pause(true), footer: [['nav', 'Move'], ['confirm', 'Select'], ['back', 'Resume']], keepFocus: re });
  },
  roost(choices, last, re) {
    const r = G.run, mm = Math.floor(last.time / 60), ss = String(Math.floor(last.time % 60)).padStart(2, '0'), story = r.mode === 'story';
    const talk = story ? (STORY[last.depth].roost || []).filter(l => !l[2] || l[2](r)) : [];
    const items = choices.length ? choices.map((b, i) => `<button class="mi boon" data-act="boon" data-v="${b.id}" ${i === 0 ? 'autofocus' : ''}><span class="k">${i + 1}</span><strong>${b.name}${r.boons[b.id] ? ' ' + ['', 'II', 'III'][r.boons[b.id]] : ''}</strong><span class="dim">${b.desc}</span></button>`).join('')
      : `<button class="mi" data-act="boon" data-v="__rest" autofocus>Rest <span class="dim">there is nothing more the cave can teach you</span></button>`;
    this.show('roost', `
      <p class="kicker">${story ? 'The roost, after chapter ' + ROMAN[last.depth] : 'Depth ' + last.depth + ' behind you'}</p>
      <h2>${story ? 'You hang in the dark with the others.' : 'You hang in the dark and rest.'}</h2>
      <p class="stats">${mm}:${ss} · ${plural(last.pings, 'call')} · ${last.hurt ? plural(last.hurt, 'wound') : 'unhurt'} · ${plural(r.moths, 'moth')} · ${r.hearts} of ${r.maxHearts} wings</p>
      ${talk.length ? `<div class="talk">${talk.map((l, i) => { const sp = SPEAKERS[l[0]] || SPEAKERS.n; return `<p style="--d:${re ? 0 : i * 0.9}s"><b style="color:${rgba(sp.col, 1)}">${esc(sp.name)}</b>${esc(l[1])}</p>`; }).join('')}</div>` : ''}
      <p class="lead">${story ? 'Sable has something to teach you.' : 'What has the cave taught you?'}</p>
      <nav class="menu boons">${items}</nav>
      <p class="note">Next: ${story ? 'chapter ' + ROMAN[r.depth] + ', ' + esc(STORY[r.depth].title) : 'depth ' + r.depth + ', ' + esc(depthName(r))}${isFinal(r) ? '. The bottom.' : ''}</p>`,
    { redo: () => this.roost(choices, last, true), footer: [['nav', 'Move'], ['confirm', 'Choose']], keepFocus: re });
  },
  gameover(re) {
    const r = G.run, m = Store.data.meta, story = r.mode === 'story';
    const cause = { stalker: 'A spined hunter found you', lurker: 'The jaws closed', mute: 'The Mute swallowed your voice' }[G.lastHurt] || 'The dark keeps you';
    this.show('over', `
      <p class="kicker">${esc(cause)}</p>
      <h2>The dark keeps you</h2>
      ${story ? `<p class="lead">Chapter ${ROMAN[r.depth]}, ${esc(STORY[r.depth].title)}. The story waits for you at the start of the chapter, with everything you had when you entered it.</p>`
        : `<p class="lead">Depth ${r.depth}, ${esc(depthName(r))}. ${plural(r.moths, 'moth')}. ${r.songs.length ? r.songs.length + ' of 4 verses.' : ''}</p>
      <p class="stats">Score ${score(r)} · deepest ever ${m.bestDepth}${r.mode === 'endless' ? ' · endless best ' + m.endlessBest : ''}</p>`}
      <nav class="menu">
        ${story ? '<button class="mi" data-act="retry" autofocus>Try the chapter again</button>' : `<button class="mi" data-act="again" autofocus>${r.mode === 'daily' ? 'Try the daily cave again' : 'Descend again'}</button>`}
        <button class="mi" data-act="totitle">Title</button>
      </nav>`, { redo: () => this.gameover(true), footer: [['nav', 'Move'], ['confirm', 'Select']], keepFocus: re });
  },
  ending(kind, re) {
    const r = G.run, story = r.mode === 'story';
    let title, text, note;
    if (story) {
      const E = STORY_ENDINGS[kind] || STORY_ENDINGS.return; title = E.title; text = E.lines();
      const left = 6 - kinFound();
      note = kind === 'homecoming' ? 'Every voice is home.' : (left ? `${left} of the colony ${left === 1 ? 'is' : 'are'} still lost. Chapter select can take you back for them. ` : '') + (kind === 'return' ? 'Learn all four verses, and the Hollow Heart can be sung to.' : '');
    } else {
      title = kind === 'chorus' ? 'Chorus' : 'The Return';
      text = kind === 'chorus'
        ? ['The thing that listened was never a thief. It was every voice the water drowned, waiting for one of you to sing first.', 'It sings back now. The Hollow Heart fills with light the way a throat fills with breath.', 'You rise through the cave with the colony\'s song all around you, and for the first time the dark answers kindly.']
        : ['You climb out of the Hollow Heart carrying the shape of the song, but not its heart.', 'Behind you, something enormous keeps listening.', 'At the roost, a few of the colony stir and call back. It is enough, for now. Somewhere below, four verses are still waiting.'];
      note = (kind === 'chorus' ? 'Chorus echoes are yours: change them in Settings.' : 'There is another way through the Hollow Heart.') + ' The endless deep is open.';
    }
    this.show('ending', `
      <p class="kicker">Ending · ${esc(title)}</p>
      <div class="intro">${text.map((t, i) => `<p style="--d:${re ? 0 : 0.4 + i * 1.8}s">${esc(t)}</p>`).join('')}</div>
      <p class="stats" style="--d:${re ? 0 : 5.6}s">${DIFFS[r.diff].name} · ${plural(Math.max(1, Math.round(r.stats.time / 60)), 'minute')} · ${plural(r.stats.pings, 'call')} · ${plural(r.moths, 'moth')} · ${versesKnown(r)} of 4 verses${story ? ' · ' + kinFound() + ' of 6 home' : ' · score ' + (score(r) + 500)}</p>
      <p class="note">${esc(note)}</p>
      <nav class="menu">
        ${story ? '<button class="mi" data-act="epilogue" autofocus>Epilogue</button>' : '<button class="mi" data-act="credits" autofocus>Credits</button>'}
        <button class="mi" data-act="totitle">Title</button>
      </nav>`, { redo: () => this.ending(kind, true), footer: [['nav', 'Move'], ['confirm', 'Select']], keepFocus: re });
  },
  epilogue() {
    Music.setMode('ending_chorus');
    this.show('ending', `
      <p class="kicker">Epilogue</p>
      <div class="intro">${EPILOGUE.map((t, i) => `<p style="--d:${0.3 + i * 1.8}s">${esc(t)}</p>`).join('')}</div>
      <nav class="menu"><button class="mi" data-act="credits" autofocus>Credits</button><button class="mi" data-act="totitle">Title</button></nav>`, { footer: [['nav', 'Move'], ['confirm', 'Select']] });
  },
  confirm(text, yes, no) {
    this.cb = { yes, no };
    this.show('confirm', `<h2>${esc(text)}</h2><nav class="menu"><button class="mi" data-act="yes">Yes</button><button class="mi" data-act="no" autofocus>No</button></nav>`, { back: no, footer: [['nav', 'Move'], ['confirm', 'Select'], ['back', 'Cancel']] });
  },

  act(a, b) {
    // anything that changes scene is accepted once; repeated presses during the change are ignored
    const lock = ['continue', 'continueSlot', 'daily', 'diff', 'begin', 'boon', 'again', 'retry', 'chapterPick', 'yes', 'quit', 'totitle', 'toChapter', 'storyGo'];
    if (lock.includes(a)) { if (this.busy) return; this.busy = true; }
    if (a !== 'back') AE.uiConfirm();
    const paused = G.state === 'paused', here = paused ? () => this.pause() : () => this.title();
    const go = () => { if (G.run && G.run.mode === 'story') this.chapter(); else startDepth(); };
    switch (a) {
      case 'continue': if (loadRun()) go(); else { this.busy = false; this.title(); } break;
      case 'continueSlot': if (loadRun(b.dataset.v)) go(); else { this.busy = false; this.title(); } break;
      case 'story': this.story(); break;
      case 'storyNew':
        if (Store.data.runs.story) this.confirm(`Begin the story again? Your place in chapter ${ROMAN[Store.data.runs.story.depth]} will be lost. The lost you found stay found.`, () => this.newGame('story'), () => this.story());
        else this.newGame('story');
        break;
      case 'chapters': this.chapters(); break;
      case 'chapterPick': { const d = +b.dataset.v, sr = Store.data.runs.story; newRun('story', sr ? sr.diff : 'standard', { chapter: d, replay: true }); this.chapter(); break; }
      case 'new': this.newGame('descent'); break;
      case 'endless': this.newGame('endless'); break;
      case 'daily': { const r = Store.data.runs.daily; if (r && r.date === todayStr() && loadRun('daily')) startDepth(); else { newRun('daily', 'standard'); startDepth(); } break; }
      case 'diff': newRun(this.mode, b.dataset.v); if (this.mode === 'descent') this.intro(); else if (this.mode === 'story') this.prologue(); else startDepth(); break;
      case 'toChapter': this.chapter(); break;
      case 'begin': startDepth(); break;
      case 'settings': this.settings(here, 0); break;
      case 'howto': this.howto(here); break;
      case 'journal': this.journal(); break;
      case 'credits': this.credits(G.state === 'ending' ? () => { G.L = null; this.title(); } : null); break;
      case 'epilogue': this.epilogue(); break;
      case 'back': this.goBack(); break;
      case 'resume': resumeGame(); break;
      case 'restart': this.confirm(`Restart this ${G.run && G.run.mode === 'story' ? 'chapter' : 'depth'}?`, () => { AE.humStop(); restartDepth(); }, () => this.pause()); break;
      case 'quit': AE.humStop(); AE.chargeStop(); G.L = null; this.title(); break;
      case 'abandon': this.confirm('Abandon this run?', () => { clearRun(G.run); AE.humStop(); AE.chargeStop(); G.L = null; this.title(); }, () => this.pause()); break;
      case 'yes': this.cb.yes(); break;
      case 'no': AE.uiBack(); this.cb.no(); break;
      case 'boon': takeBoon(b.dataset.v); break;
      case 'again': { const r = G.run; newRun(r.mode, r.diff); startDepth(); break; }
      case 'retry': if (loadRun(slotOf(G.run))) startDepth(); else { this.busy = false; this.title(); } break;
      case 'totitle': G.L = null; this.title(); break;
      case 'defaults': {
        const def = Store.defaults().settings;
        for (const r of SETTINGS[this.tab].rows) if (r.k in def) Store.data.settings[r.k] = def[r.k];
        applySettings(); this.settings(this.from, this.tab, true); break;
      }
    }
  }
};
