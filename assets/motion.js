/* Jornada SER — camada de movimento (preview). Só apresenta: não toca em dados, API nem regras. */
const JM = (() => {
  const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  // palavras que acendem com desfoque suave (texto continua o mesmo; só ganha spans)
  function acende(el, atraso = 0, base = 0) {
    if (!el) return base;
    const txt = el.textContent; el.textContent = '';
    let i = base;
    txt.split(/(\s+)/).forEach(p => { if (!p) return;
      if (/^\s+$/.test(p)) { el.append(p); return; }
      const s = document.createElement('span'); s.className = 'jm-w';
      s.style.setProperty('--i', i++); s.style.setProperty('--d', atraso + 'ms'); s.textContent = p; el.append(s); });
    el.classList.remove('jm-on'); void el.offsetWidth; if (!reduz()) el.classList.add('jm-on');
    return i;
  }
  // troca de texto com cross-blur
  function troca(el, texto) { if (!el) return; if (texto !== undefined) el.textContent = texto; if (reduz()) return;
    el.classList.remove('jm-troca'); void el.offsetWidth; el.classList.add('jm-troca'); }

  // fantasma: a etapa que sai dissolve para cima enquanto a nova assenta
  function fantasma(el) {
    if (!el || reduz() || !el.offsetParent) return;
    const r = el.getBoundingClientRect(); if (r.height < 4 || r.bottom < 0) return;
    const g = el.cloneNode(true); g.removeAttribute('id'); g.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    g.querySelectorAll('input,textarea,button,a').forEach(x => { x.tabIndex = -1; });
    g.setAttribute('aria-hidden', 'true'); g.classList.add('jm-fantasma');
    Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', animation: 'none' });
    document.body.append(g);
    g.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-18px)', filter: 'blur(6px)' }],
      { duration: 420, easing: 'cubic-bezier(.55,0,.75,.3)', fill: 'forwards' }).onfinish = () => g.remove();
  }

  // fio de progresso orgânico (uma onda manuscrita em cobre)
  function progresso(cor) {
    const box = document.createElement('div'); box.className = 'jm-prog'; box.setAttribute('aria-hidden', 'true'); if (cor) box.style.color = cor;
    box.innerHTML = `<svg viewBox="0 0 300 22" preserveAspectRatio="none"><path class="base"/><path class="feito"/><circle class="ponta" r="3.2"/></svg>`;
    document.body.append(box);
    const pts = []; for (let i = 0; i <= 60; i++) { const x = i / 60 * 300; pts.push([x, 11 + Math.sin(i / 60 * Math.PI * 3.2) * 5 * (0.55 + 0.45 * Math.sin(i / 9))]); }
    const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
    const base = box.querySelector('.base'), feito = box.querySelector('.feito'), ponta = box.querySelector('.ponta');
    base.setAttribute('d', d); feito.setAttribute('d', d);
    const L = feito.getTotalLength(); feito.style.strokeDasharray = L; feito.style.strokeDashoffset = L;
    return { mostra(on) { box.classList.toggle('on', !!on); },
      vai(f) { f = Math.max(0, Math.min(1, f)); feito.style.strokeDashoffset = L * (1 - f);
        const p = feito.getPointAtLength(L * f); ponta.style.transform = `translate(${p.x}px,${p.y}px)`; } };
  }

  // linha cobre que se desenha sozinha (fechamento calmo)
  function linha(dentro, { comOk = true, atraso = 200, apos = false } = {}) {
    if (!dentro) return;
    const pai = apos ? dentro.parentNode : dentro;
    pai.querySelectorAll(':scope > .jm-linha').forEach(x => x.remove());
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'jm-linha'); svg.setAttribute('viewBox', '0 0 340 48'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<path class="tr" d="M2 30 C 40 30, 52 14, 92 20 S 150 40, 196 26 S 262 10, 300 24"/>` +
      (comOk ? `<path class="ok" d="M308 22 l7 7 l14 -16"/>` : '') + `<circle cx="2" cy="30" r="2.4"/>`;
    if (apos) dentro.after(svg); else dentro.append(svg);
    if (reduz()) return svg;
    const tr = svg.querySelector('.tr'), L = tr.getTotalLength();
    tr.animate([{ strokeDasharray: L, strokeDashoffset: L }, { strokeDasharray: L, strokeDashoffset: 0 }], { duration: 1900, delay: atraso, easing: 'cubic-bezier(.45,.05,.2,1)', fill: 'both' });
    const ok = svg.querySelector('.ok'); if (ok) { const l2 = ok.getTotalLength();
      ok.animate([{ strokeDasharray: l2, strokeDashoffset: l2, opacity: 0 }, { opacity: 1, offset: .1 }, { strokeDasharray: l2, strokeDashoffset: 0, opacity: 1 }], { duration: 650, delay: atraso + 1750, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }); }
    svg.querySelector('circle').animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 500, delay: atraso, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
    return svg;
  }

  // contagem que sobe devagar (número de passos)
  function conta(el, alvo, dur = 1400) { if (!el) return; if (reduz() || !alvo) { el.textContent = alvo; return; }
    const t0 = performance.now(); const tick = n => { const t = Math.min(1, (n - t0) / dur), e = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(alvo * e); if (t < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }

  // entrada em sequência (cartões, chips)
  function sequencia(els, { atraso = 0, passo = 90, dist = 28, dur = 900 } = {}) {
    if (reduz()) return; [...els].forEach((el, i) => el.animate([{ opacity: 0, transform: `translateY(${dist}px) scale(.985)` }, { opacity: 1, transform: 'none' }],
      { duration: dur, delay: atraso + i * passo, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' })); }

  // espiral que se abre: a espiral da abertura gira devagar e se expande; o hub aparece
  // por dentro de um braço de espiral (borda nítida), que termina virando o fundo do hub.
  function abreEspiral({ hero, svg, centro, trocar, dur = 1150 }) {
    const de = document.documentElement, body = document.body, W = innerWidth, H = innerHeight;
    const r0 = hero.getBoundingClientRect();
    // 1) foto da abertura por baixo (cópia sem ids, para nada colidir com a lógica)
    const fundo = hero.cloneNode(true); fundo.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    fundo.querySelectorAll('.jm-on').forEach(x => x.classList.remove('jm-on'));
    fundo.removeAttribute('id'); fundo.setAttribute('aria-hidden', 'true'); fundo.classList.add('jm-abre-fundo');
    Object.assign(fundo.style, { position: 'fixed', top: '0', zIndex: '-1', margin: '0', left: r0.left + 'px', width: r0.width + 'px', height: Math.max(H, r0.height) + 'px', minHeight: '0' });
    const cb = getComputedStyle(body); Object.assign(fundo.style, { fontFamily: cb.fontFamily, color: cb.color, webkitFontSmoothing: 'antialiased', boxSizing: 'border-box' });
    de.append(fundo);
    const fsv = fundo.querySelector('.espiral svg'), g = document.createElementNS(NS, 'g');
    [...fsv.childNodes].filter(n => n.nodeName !== 'defs').forEach(n => g.append(n)); fsv.append(g);
    const textos = fundo.querySelectorAll('.abertura > *, .topo');
    textos.forEach((el, i) => el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }],
      { duration: 380, delay: i * 25, easing: 'cubic-bezier(.55,0,.75,.3)', fill: 'forwards' }));
    // 2) o hub entra por cima, recortado pela espiral
    trocar();
    const b = body.getBoundingClientRect(), bx = b.left, by = b.top;
    const sq = .84, k = 22, cg = .34, giro = 0;      // r = k·e^(cθ), achatada como a espiral da marca
    const alcance = Math.hypot(Math.max(centro.x, W - centro.x), Math.max(centro.y, H - centro.y) / sq) * 1.08;
    const TH = 2 * Math.PI + Math.log(alcance / k) / cg;
    const ponto = th => { const r = k * Math.exp(cg * th), a = th + Math.PI + giro; return [centro.x + r * Math.cos(a), centro.y + r * Math.sin(a) * sq]; };
    // 3) a linha que desenha a borda: creme por cima do ameixa, cobre por cima do creme
    const lin = document.createElementNS(NS, 'svg'); lin.setAttribute('class', 'jm-abre-linha'); lin.setAttribute('aria-hidden', 'true');
    lin.setAttribute('viewBox', `0 0 ${W} ${H}`);
    lin.innerHTML = `<path class="a" stroke="#F4EEE5" stroke-opacity=".75" stroke-width="1.3"/><path class="b" stroke="#A75E48" stroke-width="1.6"/>`;
    de.append(lin); const pa = lin.querySelector('.a'), pb = lin.querySelector('.b');
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // calmo nas pontas
    const t0 = performance.now();
    return new Promise(res => {
      const quadro = agora => {
        const t = Math.min(1, (agora - t0) / dur), p = ease(t), th = TH * p;
        const de0 = Math.max(0, th - 2 * Math.PI), n = 90, pts = [];
        for (let i = 0; i <= n; i++) pts.push(ponto(de0 + (th - de0) * i / n));
        body.style.clipPath = `polygon(${centro.x - bx}px ${centro.y - by}px,` + pts.map(q => `${(q[0] - bx).toFixed(1)}px ${(q[1] - by).toFixed(1)}px`).join(',') + ')';
        const ini = Math.max(0, th - Math.PI * 1.35), lp = []; for (let i = 0; i <= 70; i++) lp.push(ponto(ini + (th - ini) * i / 70));
        const d = 'M' + lp.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L'); pa.setAttribute('d', d); pb.setAttribute('d', d);
        lin.style.opacity = t < .72 ? 1 : Math.max(0, 1 - (t - .72) / .28);
        // a espiral original gira devagar e se abre, enquanto a nova assume o lugar
        g.setAttribute('transform', `translate(200 176) rotate(${55 * p}) scale(${1 + 1.4 * p}) translate(-200 -176)`);
        g.style.opacity = 1 - p;
        if (t < 1) requestAnimationFrame(quadro);
        else { body.style.clipPath = ''; fundo.remove(); lin.remove(); res(); }
      };
      requestAnimationFrame(quadro);
    });
  }

  return { reduz, abreEspiral, acende, troca, fantasma, progresso, linha, conta, sequencia };
})();
