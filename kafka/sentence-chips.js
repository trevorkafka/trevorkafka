/*
  Sentence Chips — generic bracket notation
  ( ) round   [ ] square   / / slant   { } brace
  |  divides a chip into parts. Brackets nest. Unclosed brackets auto-close at end.

  Verb linking:  #id marks a verb chip; >id marks the subject; <id marks the object.
    [Trevor's students >1] (have been doing #1) [their homework <1]
  Markers can sit anywhere in the chip text; they're stripped from display.

  Load this file plus sentence-chips.css, then call SentenceChips.init()
*/
(function(global){
  'use strict';

  function parse(str){
    let i = 0;
    function parseChildren(closeChar){
      const children = []; let buf = '';
      const flush = () => { if(buf){ children.push({type:'text', text:buf}); buf=''; } };
      while(i < str.length){
        const ch = str[i];
        if(ch==='(' || ch==='[' || ch==='{'){
          flush(); i++;
          const close = ch==='(' ? ')' : ch==='[' ? ']' : '}';
          children.push({type:'chip', bracket:ch, children:parseChildren(close)});
          continue;
        }
        if(ch==='/'){
          if(closeChar==='/'){ flush(); i++; return children; }
          flush(); i++;
          children.push({type:'chip', bracket:'/', children:parseChildren('/')});
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
  const MARKER_RE = /(^|\s)([#<>])([A-Za-z0-9]+)(?::([A-Za-z0-9_-]+))?(?=\s|$)/g;

  function extractMarkers(node, out){
    node.children.forEach(c => {
      if(c.type === 'text'){
        c.text = c.text.replace(MARKER_RE, (m, pre, sym, id, label) => {
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
    return el;
  }

  /* ---- connectors ---- */
  function drawConnectors(inst){
    const {shell, svg, links} = inst;
    if(!shell.isConnected) return;
    const rect = shell.getBoundingClientRect();
    const W = shell.offsetWidth;
    svg.setAttribute('width', W);
    svg.setAttribute('height', shell.offsetHeight);

    const conns = [];
    for(const id in links.verbs){
      const vEl = links.verbs[id];
      (links.subjects[id]||[]).forEach(t => conns.push({vEl, nEl:t.el, label:t.label, xOff:-6}));
      (links.objects[id] ||[]).forEach(t => conns.push({vEl, nEl:t.el, label:t.label, xOff: 6}));
    }
    if(!conns.length){ svg.innerHTML=''; return; }

    const allRects = [...inst.output.querySelectorAll('.schip2-chip')].map(el => {
      const r = el.getBoundingClientRect();
      return { el, top: r.top - rect.top, bottom: r.bottom - rect.top };
    });

    conns.forEach(c => {
      const rv = c.vEl.getBoundingClientRect(), rn = c.nEl.getBoundingClientRect();
      c.vx = rv.left - rect.left + rv.width/2 + c.xOff;
      c.vTop = rv.top - rect.top;  c.vBot = rv.bottom - rect.top;
      c.nx = rn.left - rect.left + rn.width/2;
      c.nTop = rn.top - rect.top;  c.nBot = rn.bottom - rect.top;
      c.x1 = Math.min(c.vx, c.nx); c.x2 = Math.max(c.vx, c.nx);
      if(Math.abs(c.vTop - c.nTop) < 10){
        c.kind = 'same';
        c.gapTop = c.gapBot = null;
        c.bandKey = 'top' + Math.round(c.vTop);
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
    });

    // group connectors that share a band and overlapping x-ranges; spread them evenly
    const LABEL_PAD = 30, LANE_H = 15, BASE = 20;
    const bands = {};
    conns.forEach(c => (bands[c.bandKey] = bands[c.bandKey] || []).push(c));
    for(const k in bands){
      const group = bands[k];
      group.sort((a,b)=>a.x1-b.x1);
      group.forEach((c,idx) => {
        c.lane = 0;
        for(let j=0;j<idx;j++){
          const o = group[j];
          if(c.x1 < o.x2 + LABEL_PAD && o.x1 < c.x2 + LABEL_PAD && o.lane === c.lane) c.lane = o.lane + 1;
        }
      });
      group.forEach(c => c.lanesInBand = 1 + Math.max(...group.map(g=>g.lane)));
    }

    const topLanes = conns.filter(c=>c.kind==='same').reduce((m,c)=>Math.max(m,c.lane), 0);
    inst.output.style.paddingTop = conns.some(c=>c.kind==='same') ? (44 + topLanes*LANE_H) + 'px' : '10px';

    const clampLabelX = x => Math.max(34, Math.min(W - 34, x));
    let paths = '', labels = '';
    const defs = `<defs><marker id="schip2Arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/></marker></defs>`;

    conns.forEach(c => {
      let d, lx, ly;
      if(c.kind === 'same'){
        const midY = Math.min(c.vTop, c.nTop) - BASE - c.lane*LANE_H;
        d = `M${c.vx},${c.vTop} L${c.vx},${midY} L${c.nx},${midY} L${c.nx},${c.nTop}`;
        lx = (c.vx+c.nx)/2; ly = midY;
      } else if(c.kind === 'gap'){
        // evenly distribute lanes inside the gap; always stays between the rows
        const frac = (c.lane + 1) / (c.lanesInBand + 1);
        const midY = c.gapTop + frac * (c.gapBot - c.gapTop);
        const vAbove = c.vTop < c.nTop;
        const sy = vAbove ? c.vBot : c.vTop;
        const ey = vAbove ? c.nTop : c.nBot;
        d = `M${c.vx},${sy} L${c.vx},${midY} L${c.nx},${midY} L${c.nx},${ey}`;
        lx = (c.vx+c.nx)/2; ly = midY;
      } else {
        const gx = 10 + c.lane*8;
        const vAbove = c.vTop < c.nTop;
        const sy = vAbove ? c.vBot : c.vTop;
        const gapV = vAbove ? c.vBot + 12 + c.lane*5 : c.vTop - 12 - c.lane*5;
        const gapN = vAbove ? c.nTop - 18 - c.lane*5 : c.nBot + 18 + c.lane*5;
        const ey = vAbove ? c.nTop : c.nBot;
        d = `M${c.vx},${sy} L${c.vx},${gapV} L${gx},${gapV} L${gx},${gapN} L${c.nx},${gapN} L${c.nx},${ey}`;
        lx = gx + (c.nx - gx)*0.4; ly = gapN;
      }
      paths += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.6" marker-end="url(#schip2Arrow)"/>`;
      labels += `<text x="${clampLabelX(lx)}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace,Consolas,monospace" font-size="9.5" letter-spacing="0.5" fill="currentColor" style="paint-order:stroke fill;stroke:var(--schip2-paper,#F5EEE2);stroke-width:5;stroke-linejoin:round;">${c.label}</text>`;
    });
    svg.innerHTML = defs + paths + labels;
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
      const siblings = [...container.children].filter(c => c !== dragged);
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
  const instances = [];

  function renderInto(container, source){
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

  global.addEventListener('resize', () => instances.forEach(drawConnectors));

  function init(selector){
    selector = selector || '[data-sentence-chips], .sentence-chip';
    document.querySelectorAll(selector).forEach(el => {
      const src = el.hasAttribute('data-sentence-chips') ? el.getAttribute('data-sentence-chips') : el.textContent;
      renderInto(el, src.trim());
    });
  }

  global.SentenceChips = { parse, renderInto, init };
})(window);
