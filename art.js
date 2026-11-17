// 視覺圖形產生器：以程式畫出海報式的圖形（不使用任何外部圖片）
// ART.svg(kind, seed, word) 回傳 SVG 字串；kind = 'pixel' | 'halftone' | 'stripe'
(function () {
  'use strict';
  function rng(seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const W = 1200, H = 520;

  // 灰底、螢光綠的像素筆畫、灰色堆疊輪廓、細線斜體字
  function pixel(seed, word) {
    const r = rng(seed), g = 40, G = '#3DFF2E'; let o = '';
    o += `<rect width="${W}" height="${H}" fill="#BDBDBD"/>`;
    const blobs = Array.from({ length: 4 }, () => { const cx = 120 + r() * 960, cy = 100 + r() * 320; return Array.from({ length: 6 }, () => [cx + (r() - .5) * 220, cy + (r() - .5) * 170, 26 + r() * 46]); });
    blobs.forEach((b, bi) => {
      const cs = (extra, fill, op) => b.map(c => `<circle cx="${c[0].toFixed(0)}" cy="${c[1].toFixed(0)}" r="${(c[2] + extra).toFixed(0)}" fill="${fill}"${op ? ` opacity="${op}"` : ''}/>`).join('');
      o += `<g class="a-blob" style="--i:${bi}">${cs(30, '#ABABAB')}${cs(21, '#8F8F8F')}${cs(12, '#ADADAD')}${cs(4, '#787878')}${cs(-4, '#8E8E8E')}</g>`;
    });
    const up = String(word || 'READ').toUpperCase();
    o += `<text class="a-script" x="${60 + r() * 60}" y="${150 + r() * 40}" font-family="'Snell Roundhand','Apple Chancery','Brush Script MT',cursive" font-style="italic" font-size="190" fill="none" stroke="#1B1B1B" stroke-width="1.3" textLength="${Math.min(1050, 170 * up.length)}" lengthAdjust="spacing">${esc(up)}</text>`;
    o += `<text class="a-script" x="${80 + r() * 200}" y="${470 - r() * 30}" font-family="'Snell Roundhand','Apple Chancery','Brush Script MT',cursive" font-style="italic" font-size="150" fill="none" stroke="#1B1B1B" stroke-width="1.1" opacity=".8">${esc(up)}</text>`;
    let s = '';
    for (let i = 0; i < 86; i++) {
      const x = Math.floor(r() * (W / g)) * g, y = Math.floor(r() * (H / g)) * g, k = r(), n = 1 + Math.floor(r() * 3);
      let d;
      if (k < .34) d = `M${x} ${y}h${g * n}`;
      else if (k < .62) d = `M${x} ${y}v${g * n}`;
      else if (k < .76) d = `M${x} ${y + g}l${g} ${-g}`;
      else if (k < .88) d = `M${x} ${y}h${g}v${g}`;
      else d = `M${x} ${y + g / 2}h${g}M${x + g / 2} ${y}v${g}`;
      s += `<path d="${d}" style="--i:${i}"/>`;
    }
    o += `<g class="a-strokes" fill="none" stroke="${G}" stroke-width="7" stroke-linecap="square">${s}</g>`;
    return o;
  }

  // 白底、藍色網點方塊、實心小方塊、線框立體大字
  function halftone(seed, word) {
    const r = rng(seed), B = '#1E9BF0'; let o = '';
    o += `<rect width="${W}" height="${H}" fill="#F3F3F1"/>`;
    const blocks = [[0, 0, 300, 250], [520 + r() * 60, 250, 380, 190], [860 + r() * 80, 20, 230, 150]];
    blocks.forEach((b, bi) => {
      const [bx, by, bw, bh] = b, p = 11, ph = r() * 6, fx = .012 + r() * .012, fy = .014 + r() * .012; let dots = '';
      for (let y = p / 2; y < bh; y += p) for (let x = p / 2; x < bw; x += p) {
        const v = (Math.sin((x + ph * 40) * fx * 3.1) * Math.cos((y - ph * 30) * fy * 3.4) + Math.sin((x + y) * .011 + ph) + 2) / 4;
        const rad = .6 + v * 5.4;
        if (rad > .9) dots += `<circle cx="${(bx + x).toFixed(0)}" cy="${(by + y).toFixed(0)}" r="${rad.toFixed(1)}"/>`;
      }
      o += `<g class="a-block" style="--i:${bi}"><rect x="${bx.toFixed(0)}" y="${by}" width="${bw}" height="${bh}" fill="${B}" opacity=".12"/><g fill="${B}">${dots}</g></g>`;
    });
    let sq = '';
    for (let i = 0; i < 7; i++) { const s = 14 + Math.floor(r() * 3) * 10; sq += `<rect class="a-sq" style="--i:${i}" x="${(40 + r() * 1100).toFixed(0)}" y="${(30 + r() * 440).toFixed(0)}" width="${s}" height="${s}" fill="${B}"/>`; }
    o += `<rect class="a-sq" style="--i:0" x="${W - 190}" y="0" width="190" height="26" fill="${B}"/>` + sq;
    const ch = esc(String(word || 'R').toUpperCase()[0]);
    const big = (dx, dy, extra) => `<text x="${330 + dx}" y="${505 + dy}" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="640" fill="none" stroke="#111" stroke-width="1.4">${ch}</text>`;
    o += `<g class="a-letter">${big(34, -26, false)}${big(17, -13, false)}${big(0, 0, true)}</g>`;
    o += `<g font-family="ui-monospace,Menlo,monospace" font-size="15" fill="${B}" letter-spacing="3"><text x="${W - 190}" y="62">read</text><text x="${W - 190}" y="88">look</text><text x="${W - 190}" y="114">read again</text><text x="330" y="232">est.　2 0 2 6</text></g>`;
    return o;
  }

  // 灰白橫條、黑色細線拆解的字形、粉紅斜線
  function stripe(seed, word) {
    const r = rng(seed), P = '#F07BD0'; let o = '';
    const bands = 6, bh = H / bands;
    for (let i = 0; i < bands; i++) o += `<rect class="a-band" style="--i:${i}" y="${(i * bh).toFixed(1)}" width="${W}" height="${(bh + .5).toFixed(1)}" fill="${i % 2 ? '#F4F4F4' : '#ABABAB'}"/>`;
    let k = '', pk = '';
    for (let i = 0; i < 46; i++) {
      const x = 40 + r() * 1120, y = 30 + r() * 460, t = r(), s = 36 + r() * 90;
      let d;
      if (t < .22) d = `M${x} ${y}a${s / 2} ${s / 2} 0 0 1 ${s} 0`;
      else if (t < .40) d = `M${x} ${y}a${s / 2} ${s / 2} 0 1 0 ${s / 2} ${s / 2}`;
      else if (t < .60) d = `M${x} ${y}v${s}`;
      else if (t < .76) d = `M${x} ${y}h${s}`;
      else if (t < .90) d = `M${x} ${y}h10v10h10v10h10v10h10v10`;
      else d = `M${x} ${y}h${s * .6}v${s * .6}`;
      k += `<path d="${d.replace(/(\d+\.\d{2})\d+/g, '$1')}" style="--i:${i}"/>`;
    }
    for (let i = 0; i < 22; i++) { const x = r() * W, y = r() * H, s = 50 + r() * 130, dir = r() < .5 ? 1 : -1; pk += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}l${(s * dir).toFixed(0)} ${s.toFixed(0)}" style="--i:${i}"/>`; }
    o += `<g class="a-pink" fill="none" stroke="${P}" stroke-width="1.6">${pk}</g>`;
    o += `<g class="a-lines" fill="none" stroke="#161616" stroke-width="1.6" stroke-linecap="round">${k}</g>`;
    const up = String(word || 'READ').toUpperCase();
    o += `<g font-family="ui-monospace,Menlo,monospace" font-size="13" fill="#161616" letter-spacing="2">${[...up].slice(0, 12).map((c, i) => `<text x="${(70 + i * (1040 / Math.max(1, up.length - 1 || 1))).toFixed(0)}" y="${(60 + ((i * 97) % 400)).toFixed(0)}">${esc(c)}</text>`).join('')}</g>`;
    o += `<g fill="none" stroke="#161616" stroke-width="2"><rect x="${W - 150}" y="22" width="44" height="44"/><rect x="${W - 92}" y="22" width="44" height="44"/></g><rect x="${W - 142}" y="30" width="28" height="28" fill="#8C8C8C"/><rect x="${W - 84}" y="30" width="28" height="28" fill="#8C8C8C"/>`;
    return o;
  }

  const KINDS = { pixel, halftone, stripe };
  window.ART = {
    kinds: Object.keys(KINDS),
    svg(kind, seed, word) {
      const f = KINDS[kind] || pixel;
      return `<svg class="art art-${kind}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${f(hash(seed + '|' + kind), word)}</svg>`;
    },
  };

  // 設計小節：用英文認識一個設計概念（英文 → 設計 → 英文）
  window.DESIGN_NOTES = [
    { term: 'grid', pos: 'n.', zh: '網格', kind: 'pixel',
      en: 'A grid divides the page into equal units. Every green stroke here starts and ends on the same invisible lines, so the picture feels ordered even though the marks look random.',
      note: '網格把版面切成相同的單位。這裡每一筆綠色線段都落在同一組看不見的格線上，所以看似隨機卻有秩序。',
      look: 'Find three strokes that share the same starting line.' },
    { term: 'contrast', pos: 'n.', zh: '對比', kind: 'pixel',
      en: 'Contrast is the difference between two things placed side by side. A bright colour on a dull ground is noticed first, because the eye moves to the strongest difference.',
      note: '對比是相鄰兩者的差異。暗淡底色上的亮色會最先被看到，因為視線會被最強的差異吸引。',
      look: 'Which element did you see first? Why?' },
    { term: 'layer', pos: 'n. / v.', zh: '層次；疊放', kind: 'pixel',
      en: 'Designers layer shapes to create depth. The grey forms sit at the back, the script runs through the middle, and the green strokes float on top.',
      note: '設計師用疊放製造深度。灰色形體在最後面，手寫體穿過中間，綠色線段浮在最上層。',
      look: 'Name the three layers from back to front.' },
    { term: 'halftone', pos: 'n.', zh: '網點', kind: 'halftone',
      en: 'Halftone turns a photograph into dots of different sizes. Large dots read as shadow and small dots read as light, so a single ink can print a full range of tones.',
      note: '網點把照片轉成大小不同的點。大點看起來是暗部，小點是亮部，所以單一油墨也能印出完整的明暗。',
      look: 'Where are the dots largest? That area is the darkest.' },
    { term: 'outline', pos: 'n.', zh: '外框線；輪廓', kind: 'halftone',
      en: 'An outlined letter keeps its shape but loses its weight. It can be very large without hiding what lies behind it.',
      note: '只留外框的字保有形狀卻沒有重量，可以放得很大而不遮住後面的內容。',
      look: 'Notice how the blue blocks stay visible through the letter.' },
    { term: 'negative space', pos: 'n.', zh: '留白；負空間', kind: 'halftone',
      en: 'Negative space is the empty area around and between the elements. It is not wasted: it gives the eye a place to rest and makes the filled areas easier to read.',
      note: '負空間是元素周圍與之間的空白。它不是浪費，而是讓視線休息，也讓有內容的地方更容易閱讀。',
      look: 'Cover the empty areas with your hand. Does the layout feel heavier?' },
    { term: 'rhythm', pos: 'n.', zh: '節奏', kind: 'stripe',
      en: 'Rhythm appears when an element repeats at regular intervals. The grey and white bands repeat like beats, and the thin lines play across them like a melody.',
      note: '元素以固定間隔重複時就產生節奏。灰白橫條像拍子一樣重複，細線則像旋律在上面遊走。',
      look: 'Count the bands. Is the interval always the same?' },
    { term: 'fragment', pos: 'n. / v.', zh: '碎片；拆解', kind: 'stripe',
      en: 'Each letter has been fragmented into arcs, lines and steps. The reader has to assemble the pieces, which slows the eye down and holds attention longer.',
      note: '每個字母都被拆成弧線、直線和階梯。讀的人必須自己把碎片拼起來，視線因此放慢、停留更久。',
      look: 'Can you still recognise any letters?' },
    { term: 'accent', pos: 'n.', zh: '強調色', kind: 'stripe',
      en: 'An accent is a small amount of a strong colour. Used sparingly, the pink lines guide the eye without competing with the black forms.',
      note: '強調色是少量使用的強烈顏色。粉紅斜線用得很少，所以能引導視線，又不會和黑色線條競爭。',
      look: 'Estimate how much of the area is pink.' },
  ];
})();
