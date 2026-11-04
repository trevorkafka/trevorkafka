/*
  Sentence Chips — generic bracket notation
  ( ) round   [ ] square   / / slant   { } brace
  |  divides a chip into parts. Brackets nest. Unclosed brackets auto-close at end.

  Verb linking:  #id marks a verb chip; >id marks the subject; <id marks the object.
    [Trevor's students >1] (have been doing #1) [their homework <1]
  Markers can sit anywhere in the chip text; they're stripped from display.

  Labels:  ^{text} right after a chip's closing bracket puts a small label above it, e.g. [我]^{主}

  Load this file plus sentence-chips.css, then call SentenceChips.init()
*/
(function(global){
  'use strict';

  const LABEL_OPEN_RE = /(^|\s)[#<>][\p{L}\p{N}\p{M}]+:$/u;

  function parse(str){
    let i = 0;
    // ^{label} right after a chip's closing bracket
    function readLabel(chip){
      if(str[i] === '^' && str[i+1] === '{'){
        const end = str.indexOf('}', i + 2);
        if(end !== -1){ chip.label = str.slice(i + 2, end); i = end + 1; }
      }
    }
    function parseChildren(closeChar){
      const children = []; let buf = '';
      const flush = () => { if(buf){ children.push({type:'text', text:buf}); buf=''; } };
      while(i < str.length){
        const ch = str[i];
        // >2:{主语 subject}: braces right after a marker's colon hold a multi-word label
        if(ch==='{' && LABEL_OPEN_RE.test(buf)){
          const end = str.indexOf('}', i + 1);
          if(end !== -1){ buf += str.slice(i, end + 1); i = end + 1; continue; }
        }
        if(ch==='(' || ch==='[' || ch==='{'){
          flush(); i++;
          const close = ch==='(' ? ')' : ch==='[' ? ']' : '}';
          const chip = {type:'chip', bracket:ch, children:parseChildren(close)};
          children.push(chip); readLabel(chip);
          continue;
        }
        if(ch==='/'){
          if(closeChar==='/'){ flush(); i++; return children; }
          flush(); i++;
          const chip = {type:'chip', bracket:'/', children:parseChildren('/')};
          children.push(chip); readLabel(chip);
          continue;
        }
        if(ch===')' || ch===']' || ch==='}'){
          if(ch===closeChar){ flush(); i++; return children; }
          buf += ch; i++; continue; // stray closer: treat as text
        }
        if(ch==='|'){ flush(); children.push({type:'div'}); i++; continue; }
        buf += ch; i++;
      }
      flush();
      return children; // unclosed: auto-close at end
    }
    return { children: parseChildren(null) };
  }

  const BRACKET_CLASS = { '(':'schip2-round', '[':'schip2-square', '/':'schip2-slant', '{':'schip2-brace' };
  // ids and labels take letters and digits from any script, e.g. <1:表语
  const MARKER_RE = /(^|\s)([#<>])([\p{L}\p{N}\p{M}]+)(?::(\{[^}]*\}|[\p{L}\p{N}\p{M}_-]+))?(?=\s|$)/gu;
  const esc = t => String(t).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);

  function extractMarkers(node, out){
    node.children.forEach(c => {
      if(c.type === 'text'){
        c.text = c.text.replace(MARKER_RE, (m, pre, sym, id, label) => {
          if(label && label[0] === '{') label = label.slice(1, -1).trim() || undefined;
          out.push({sym, id, label});
          return pre ? pre.trimEnd() : '';
        }).replace(/\s{2,}/g,' ');
      }
    });
  }

  function groupParts(children){
    const parts = [[]];
    children.forEach(c => c.type==='div' ? parts.push([]) : parts[parts.length-1].push(c));
    return parts;
  }

  function renderInline(children, parentEl, links){
    children.forEach(c => {
      if(c.type==='text'){
        if(!c.text.trim() && !c.text) return;
        const span = document.createElement('span');
        span.className = 'schip2-text';
        span.textContent = c.text;
        parentEl.appendChild(span);
      } else if(c.type==='chip'){
        parentEl.appendChild(renderChip(c, links));
      } else if(c.type==='div'){
        parentEl.appendChild(document.createTextNode('|'));
      }
    });
  }

  function renderChip(node, links){
    const el = document.createElement('span');
    el.className = 'schip2-chip ' + BRACKET_CLASS[node.bracket];

    const markers = [];
    extractMarkers(node, markers);
    markers.forEach(m => {
      if(m.sym === '#') links.verbs[m.id] = el;
      else if(m.sym === '>') (links.subjects[m.id] = links.subjects[m.id] || []).push({el, label: m.label || 'subject'});
      else if(m.sym === '<') (links.objects[m.id]  = links.objects[m.id]  || []).push({el, label: m.label || 'object'});
    });

    const parts = groupParts(node.children);
    if(parts.length === 1){
      renderInline(parts[0], el, links);
    } else {
      el.classList.add('schip2-split');
      parts.forEach((part, idx) => {
        const partEl = document.createElement('span');
        partEl.className = 'schip2-part';
        renderInline(part, partEl, links);
        el.appendChild(partEl);
        if(idx < parts.length - 1){
          const div = document.createElement('span');
          div.className = 'schip2-divider';
          el.appendChild(div);
        }
      });
    }
    if(node.label){
      el.classList.add('schip2-labelled');
      const lab = document.createElement('span');
      lab.className = 'schip2-label';
      lab.textContent = node.label;
      el.appendChild(lab);
    }
    return el;
  }

  // a chip's box, stretched up to cover its label
  function boxOf(el){
    const r = el.getBoundingClientRect();
    const lab = el.querySelector(':scope > .schip2-label');
    const top = lab ? Math.min(r.top, lab.getBoundingClientRect().top) : r.top;
    return { left: r.left, width: r.width, top, rawTop: r.top, bottom: r.bottom };
  }

  /* ---- connectors ---- */
  // the fill of a chip (or the page) as a CSS variable, so it follows light/dark switches
  const BG_VAR = { 'schip2-round':'--schip2-a-bg', 'schip2-square':'--schip2-b-bg', 'schip2-slant':'--schip2-c-bg', 'schip2-brace':'--schip2-d-bg' };
  function bgVar(chip){
    if(chip) for(const k in BG_VAR) if(chip.classList.contains(k)) return `var(${BG_VAR[k]})`;
    return 'var(--schip2-paper, #F5EEE2)';
  }

  // nearest chip holding both a and b (other than b itself)
  function commonChip(a, b){
    let p = a.parentElement && a.parentElement.closest('.schip2-chip');
    while(p){
      if(p !== b && p.contains(b)) return p;
      p = p.parentElement && p.parentElement.closest('.schip2-chip');
    }
    return null;
  }

  const LABEL_PAD = 30, LANE_H = 15, BASE = 20, ROOM = 30;

  function drawConnectors(inst, pass){
    const {shell, svg, links, output} = inst;
    if(!shell.isConnected) return;
    pass = pass || 0;

    const conns = [];
    for(const id in links.verbs){
      const vEl = links.verbs[id];
      (links.subjects[id]||[]).forEach(t => conns.push({vEl, nEl:t.el, label:t.label, xOff:-6}));
      (links.objects[id] ||[]).forEach(t => conns.push({vEl, nEl:t.el, label:t.label, xOff: 6}));
    }
    conns.forEach(c => c.host = commonChip(c.vEl, c.nEl));

    if(pass === 0){
      // a ^{label} wider than its chip widens the chip's side margins, so neighbouring labels never collide
      output.querySelectorAll('.schip2-labelled').forEach(ch => { ch.style.marginLeft = ch.style.marginRight = ''; });
      output.querySelectorAll('.schip2-labelled').forEach(ch => {
        const lab = ch.querySelector(':scope > .schip2-label');
        const extra = lab ? (lab.offsetWidth - ch.offsetWidth) / 2 + 2 : 0;
        if(extra > 0) ch.style.marginLeft = ch.style.marginRight = (2 + extra) + 'px';
      });
    }
    // a link between two chips inside the same chip runs inside that chip: give it headroom
    if(pass === 0){
      output.querySelectorAll('[data-schip2-room]').forEach(el => { el.style.paddingTop = ''; el.removeAttribute('data-schip2-room'); });
      const room = new Map();
      conns.forEach(c => { if(c.host) room.set(c.host, (room.get(c.host) || 0) + 1); });
      room.forEach((n, el) => {
        const px = ROOM + (n - 1)*LANE_H;
        // a split chip takes the room in its parts, so its dividers still run full height
        const targets = el.classList.contains('schip2-split') ? [...el.children].filter(k => k.classList.contains('schip2-part')) : [el];
        targets.forEach(t => { t.setAttribute('data-schip2-room', n); t.style.paddingTop = (t === el ? px : px + 4) + 'px'; });
      });
    }

    const rect = shell.getBoundingClientRect();
    const W = shell.offsetWidth;
    svg.setAttribute('width', W);
    svg.setAttribute('height', shell.offsetHeight);
    if(!conns.length){ svg.innerHTML=''; return; }

    const rel = el => {
      const b = boxOf(el);
      return { el, left: b.left - rect.left, right: b.left + b.width - rect.left,
               top: b.top - rect.top, rawTop: b.rawTop - rect.top, bottom: b.bottom - rect.top };
    };
    const allRects = [...output.querySelectorAll('.schip2-chip')].map(rel);

    conns.forEach(c => {
      const rv = rel(c.vEl), rn = rel(c.nEl);
      c.vx = (rv.left + rv.right)/2 + c.xOff;
      c.vTop = rv.top; c.vBot = rv.bottom; c.vT = rv.rawTop;
      c.nx = (rn.left + rn.right)/2;
      c.nTop = rn.top; c.nBot = rn.bottom; c.nT = rn.rawTop;
      c.x1 = Math.min(c.vx, c.nx); c.x2 = Math.max(c.vx, c.nx);
      // same row: the two chips overlap vertically (nested chips sit lower than their neighbours)
      if(Math.min(c.vBot, c.nBot) - Math.max(c.vT, c.nT) > 4){
        c.kind = 'same';
        const rowTop = Math.min(c.vT, c.nT), rowBot = Math.max(c.vBot, c.nBot);
        // go over every chip in the way, except the ones holding both ends
        let ceil = Math.min(c.vTop, c.nTop);
        allRects.forEach(r => {
          if(r.el.contains(c.vEl) && r.el.contains(c.nEl)) return;
          if(r.right < c.x1 - 2 || r.left > c.x2 + 2) return;
          if(r.bottom < rowTop || r.rawTop > rowBot) return;
          ceil = Math.min(ceil, r.top);
        });
        c.ceil = ceil;
        c.bandKey = 'same';
      } else {
        const upperBot = Math.min(c.vBot, c.nBot);
        const lowerTop = Math.max(c.vTop, c.nTop);
        // rows are adjacent only if no other chip sits vertically between them
        const blocked = allRects.some(r =>
          r.el !== c.vEl && r.el !== c.nEl &&
          r.top > upperBot - 4 && r.bottom < lowerTop + 4);
        if(!blocked && lowerTop - upperBot >= 18){
          c.kind = 'gap';
          c.gapTop = upperBot + 4; c.gapBot = lowerTop - 4;
          c.bandKey = 'gap' + Math.round((c.gapTop + c.gapBot)/2 / 10);
        } else {
          c.kind = 'gutter';
          c.bandKey = 'gutter';
        }
      }
      c.bandKey += c.host ? ':' + allRects.findIndex(r => r.el === c.host) : '';
    });

    // each connector claims its span plus the width of its label
    const ctx = (drawConnectors.ctx = drawConnectors.ctx || document.createElement('canvas').getContext('2d'));
    ctx.font = '12px ' + getComputedStyle(shell).fontFamily;
    conns.forEach(c => {
      c.tw = ctx.measureText(c.label).width;
      const half = c.tw / 2 + 8, mid = (c.vx + c.nx) / 2;
      c.ox1 = Math.min(c.x1, mid - half); c.ox2 = Math.max(c.x2, mid + half);
    });

    // connectors that share a band and overlap in x take separate lanes
    const bands = {};
    conns.forEach(c => (bands[c.bandKey] = bands[c.bandKey] || []).push(c));
    for(const k in bands){
      const group = bands[k];
      group.sort((a,b) => (a.x2 - a.x1) - (b.x2 - b.x1) || a.x1 - b.x1); // short spans hug the chips
      group.forEach((c,idx) => {
        c.lane = 0;
        let bumped = true;
        while(bumped){
          bumped = false;
          for(let j=0;j<idx;j++){
            const o = group[j];
            if(o.lane === c.lane && c.ox1 < o.ox2 + 4 && o.ox1 < c.ox2 + 4){ c.lane++; bumped = true; }
          }
        }
      });
      group.forEach(c => c.lanesInBand = 1 + Math.max(...group.map(g=>g.lane)));
    }

    const clampLabelX = x => Math.max(34, Math.min(W - 34, x));
    let paths = '', labels = '', minY = Infinity, labelHoles = '';
    const defs = `<defs><marker id="schip2Arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/></marker></defs>`;

    conns.forEach(c => {
      let d, lx, ly;
      if(c.kind === 'same'){
        const midY = c.ceil - BASE - c.lane*LANE_H;
        d = `M${c.vx},${c.vTop} L${c.vx},${midY} L${c.nx},${midY} L${c.nx},${c.nTop}`;
        lx = (c.vx+c.nx)/2; ly = midY;
        if(!c.host) minY = Math.min(minY, midY);
      } else if(c.kind === 'gap'){
        // evenly distribute lanes inside the gap; always stays between the rows
        const frac = (c.lane + 1) / (c.lanesInBand + 1);
        const midY = c.gapTop + frac * (c.gapBot - c.gapTop);
        const vAbove = c.vT < c.nT;
        const sy = vAbove ? c.vBot : c.vTop;
        const ey = vAbove ? c.nTop : c.nBot;
        d = `M${c.vx},${sy} L${c.vx},${midY} L${c.nx},${midY} L${c.nx},${ey}`;
        lx = (c.vx+c.nx)/2; ly = midY;
      } else {
        const gx = 10 + c.lane*8;
        const vAbove = c.vT < c.nT;
        const sy = vAbove ? c.vBot : c.vTop;
        const gapV = vAbove ? c.vBot + 12 + c.lane*5 : c.vTop - 12 - c.lane*5;
        const gapN = vAbove ? c.nTop - 18 - c.lane*5 : c.nBot + 18 + c.lane*5;
        const ey = vAbove ? c.nTop : c.nBot;
        d = `M${c.vx},${sy} L${c.vx},${gapV} L${gx},${gapV} L${gx},${gapN} L${c.nx},${gapN} L${c.nx},${ey}`;
        lx = gx + (c.nx - gx)*0.4; ly = gapN;
        minY = Math.min(minY, gapV, gapN);
      }
      // the label's halo takes the colour of whatever it sits on
      const halo = bgVar(c.host);
      paths += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.6" marker-end="url(#schip2Arrow)"/>`;
      // each label sits on a patch of its background, so lines stop at it (a text halo leaves gaps at spaces)
      labelHoles += `<rect x="${clampLabelX(lx) - c.tw/2 - 4}" y="${ly - 8}" width="${c.tw + 8}" height="16" rx="3" style="fill:${halo}"/>`;
      labels += `<text x="${clampLabelX(lx)}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-family="inherit" font-size="12" fill="currentColor" style="font-family:inherit;">${esc(c.label)}</text>`;
    });

    // make room above the first row for the highest line, then draw again
    const pad = parseFloat(output.style.paddingTop) || 0;
    const want = minY === Infinity ? 10 : Math.max(10, pad + 10 - minY);
    if(Math.abs(want - pad) > 1 && pass < 3){
      output.style.paddingTop = want + 'px';
      return drawConnectors(inst, pass + 1);
    }
    // ^{labels} sit above the lines on their own background, so a line seems to pass behind them
    output.querySelectorAll('.schip2-label').forEach(l => {
      const under = l.parentElement.parentElement && l.parentElement.parentElement.closest('.schip2-chip');
      l.style.background = bgVar(under);
    });
    svg.innerHTML = defs + paths + labelHoles + labels;
  }

  /* ---- drag & drop reordering ---- */
  function enableDrag(rootEl, inst){
    rootEl.querySelectorAll('.schip2-chip').forEach(chip => chip.setAttribute('draggable','true'));
    let dragged = null;
    rootEl.addEventListener('dragstart', e => {
      const chip = e.target.closest('.schip2-chip');
      if(!chip) return;
      dragged = chip;
      chip.classList.add('schip2-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain','');
      e.stopPropagation();
    });
    rootEl.addEventListener('dragend', () => {
      if(dragged) dragged.classList.remove('schip2-dragging');
      dragged = null;
      drawConnectors(inst);
    });
    rootEl.addEventListener('dragover', e => {
      if(!dragged) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const container = dragged.parentNode;
      const siblings = [...container.children].filter(c => c !== dragged && !c.classList.contains('schip2-label'));
      let placed = false;
      for(const sib of siblings){
        const r = sib.getBoundingClientRect();
        if(e.clientY < r.top - 4 || e.clientY > r.bottom + 4) continue;
        if(e.clientX < r.left + r.width/2){ container.insertBefore(dragged, sib); placed = true; break; }
      }
      if(!placed){
        for(let i = siblings.length - 1; i >= 0; i--){
          const r = siblings[i].getBoundingClientRect();
          if(e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4){
            container.insertBefore(dragged, siblings[i].nextSibling); placed = true; break;
          }
        }
        if(!placed) container.appendChild(dragged);
      }
      drawConnectors(inst);
    });
    rootEl.addEventListener('drop', e => e.preventDefault());
  }

  /* ---- public API ---- */
  let instances = [];

  function renderInto(container, source){
    // forget earlier renders that are gone or being replaced
    instances = instances.filter(x => x.shell !== container && x.shell.isConnected);
    container.innerHTML = '';
    container.classList.add('schip2-shell');
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','schip2-connectors');
    container.appendChild(svg);
    const output = document.createElement('div');
    output.className = 'schip2-output';
    container.appendChild(output);

    const links = { verbs:{}, subjects:{}, objects:{} };
    const { children } = parse(source);
    renderInline(children, output, links);

    const hasLinks = Object.keys(links.verbs).length > 0;
    output.style.paddingTop = hasLinks ? '44px' : '0';
    if(hasLinks){ output.classList.add('schip2-haslinks'); output.style.paddingLeft = '30px'; }

    const inst = { shell: container, svg, links, output };
    instances.push(inst);
    enableDrag(output, inst);
    requestAnimationFrame(() => drawConnectors(inst));
    return inst;
  }

  global.addEventListener('resize', () => instances.forEach(x => drawConnectors(x)));

  function init(selector){
    selector = selector || '[data-sentence-chips], .sentence-chip';
    document.querySelectorAll(selector).forEach(el => {
      const src = el.hasAttribute('data-sentence-chips') ? el.getAttribute('data-sentence-chips') : el.textContent;
      renderInto(el, src.trim());
    });
  }

  global.SentenceChips = { parse, renderInto, init };
})(window);
