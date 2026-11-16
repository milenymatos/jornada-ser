/* Jornada SER v4 — perfil pela chave do link pessoal, dados separados por cliente e fila offline de sincronização */
const JS = (() => {
  const P = 'jornadaSer.';
  const API = window.JORNADA_API || '';
  const getJ = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const setJ = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const perfis = () => getJ(P + 'perfis', {});           // { <id>: { nome, chave, status, termo } } — só deste aparelho
  const url = new URLSearchParams(location.search);
  let id = url.get('c') && perfis()[url.get('c')] ? url.get('c') : (localStorage.getItem(P + 'ativa') || '');
  if (id && !perfis()[id]) id = '';
  const perfil = () => id ? { id, ...perfis()[id] } : null;
  const guardaPerfil = (cli, chave) => { const ps = perfis(); ps[cli.id] = { ...(ps[cli.id] || {}), nome: cli.nome, status: cli.status, termo: cli.termo, ...(chave ? { chave } : {}) };
    setJ(P + 'perfis', ps); id = cli.id; localStorage.setItem(P + 'ativa', id); };
  const sair = () => { id = ''; localStorage.removeItem(P + 'ativa'); };
  const termoOk = () => { const p = perfil(); return !!(p && p.termo && p.termo.valido); };

  // ——— API (POST text/plain: sem preflight CORS, como no Painel) ———
  const api = (acao, dados = {}, chave) => {
    const k = chave || (perfil() || {}).chave;
    if (!API) return Promise.reject(Object.assign(new Error('sem API'), { rede: true }));
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ chave: k, acao, dados }) })
      .then(r => { if (!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { rede: true }); return r.json(); })
      .catch(e => { if (!e.rede) e.rede = true; throw e; })
      .then(j => { if (!j.ok) throw Object.assign(new Error(j.erro || 'erro'), { codigo: j.codigo }); return j; });
  };
  // entrar com a chave do link (?k=) — valida no servidor antes de guardar
  const entrar = chave => api('eu', {}, chave).then(j => { guardaPerfil(j.cliente, chave); return j.cliente; });
  const atualizarPerfil = () => api('eu').then(j => { guardaPerfil(j.cliente); return j.cliente; });
  const consentir = versao => api('consentir', { versao, aceito: true, dispositivo: navigator.userAgent.slice(0, 160) }).then(j => { guardaPerfil(j.cliente); return j.cliente; });
  const revogar = apagar => api('revogar', { apagar: !!apagar, dispositivo: navigator.userAgent.slice(0, 160) }).then(j => {
    guardaPerfil(j.cliente); if (apagar) ['termometro', 'diario', 'sos', 'fila'].forEach(f => localStorage.removeItem(P + 'c.' + id + '.' + f)); return j; });

  // ——— registros locais: jornadaSer.c.<id>.<ferramenta> ———
  const K = { termo: 'termometro', diario: 'diario', sos: 'sos', pacto: 'pacto' };
  const chave = f => P + 'c.' + id + '.' + f;
  const read = k => id ? getJ(chave(K[k]), []) : [];
  const write = (k, v) => { if (id) setJ(chave(K[k]), v); };
  const novoId = () => { const b = new Uint8Array(12); crypto.getRandomValues(b); return 'r' + Array.from(b, x => x.toString(16).padStart(2, '0')).join(''); };
  // salva (ou atualiza, se já tiver rid) e põe na fila de envio
  const salvar = (k, item) => {
    if (!item.rid) item.rid = novoId();
    const a = read(k), i = a.findIndex(x => x.rid === item.rid); if (i >= 0) a[i] = item; else a.push(item); write(k, a);
    const fila = getJ(chave('fila'), []).filter(x => x.id !== item.rid);
    fila.push({ id: item.rid, ferramenta: K[k], t: item.t, dados: item }); setJ(chave('fila'), fila);
    sincronizar(); return a;
  };
  const push = salvar;

  // ——— fila offline ———
  let enviando = false, falhas = 0, presos = 0;
  const status = () => ({ pendentes: id ? getJ(chave('fila'), []).length : 0, ultima: id ? localStorage.getItem(chave('sinc')) : null, online: navigator.onLine && !falhas, enviando });
  const avisa = () => document.dispatchEvent(new CustomEvent('jornada:sync', { detail: status() }));
  function sincronizar() {
    if (!id || enviando || !termoOk()) return Promise.resolve(status());
    const fila = getJ(chave('fila'), []); if (!fila.length) { avisa(); return Promise.resolve(status()); }
    enviando = true; const lote = fila.slice(0, 50), alvo = id;
    return api('sincronizar', { registros: lote }).then(j => {
      const feitos = new Set([...(j.aceitos || []), ...(j.recusados || []).filter(r => r.motivo !== 'ferramenta').map(r => r.id)]); // ferramenta nova numa API antiga: fica na fila
      falhas = 0; presos = (j.recusados || []).filter(r => r.motivo === 'ferramenta').length;
      if (alvo === id) { setJ(chave('fila'), getJ(chave('fila'), []).filter(x => !feitos.has(x.id))); localStorage.setItem(chave('sinc'), new Date().toISOString()); }
    }).catch(e => { if (e.rede) falhas++; if (e.codigo === 428 || e.codigo === 403) atualizarPerfil().catch(() => {}); })
      .finally(() => { enviando = false; avisa(); const p = status().pendentes; if (p > presos && navigator.onLine) setTimeout(sincronizar, falhas ? Math.min(60000, 5000 * 2 ** (falhas - 1)) : 1500); return status(); });
  }
  // aparelho novo: traz os registros que já estão no servidor
  const restaurar = () => api('meus').then(j => {
    const por = { termometro: 'termo', diario: 'diario', sos: 'sos', pacto: 'pacto' }; let n = 0;
    Object.keys(por).forEach(f => { const loc = read(por[f]), tem = new Set(loc.map(x => x.rid));
      j.registros.filter(r => r.ferramenta === f && !tem.has(r.id)).forEach(r => { loc.push({ ...r.dados, rid: r.id }); n++; }); loc.sort((a, b) => a.t - b.t); write(por[f], loc); });
    return n; });
  addEventListener('online', sincronizar);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizar(); });
  setInterval(() => { if (!document.hidden) sincronizar(); }, 60000);

  // ——— utilidades ———
  const saudacao = (d = new Date()) => { const h = d.getHours(); return h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const dayKey = (d = new Date()) => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const weekStart = (d = new Date()) => { const x = new Date(d); const w = (x.getDay() + 6) % 7; x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - w); return x; };
  const thisWeek = arr => { const s = weekStart().getTime(); return arr.filter(e => new Date(e.t).getTime() >= s); };
  const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const diaIdx = t => (new Date(t).getDay() + 6) % 7;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const amarraLinks = () => { if (!id) return; document.querySelectorAll('a[href$=".html"],a[href*=".html#"]').forEach(a => {
    const [base, hash] = a.getAttribute('href').split('?')[0].split('#'); a.setAttribute('href', base + '?c=' + encodeURIComponent(id) + (hash ? '#' + hash : '')); }); };
  document.addEventListener('DOMContentLoaded', () => { amarraLinks(); sincronizar(); });
  // ferramentas sem perfil ou sem consentimento voltam para a entrada
  const exigePerfil = () => { const p = perfil(); if (!p || !p.chave || !termoOk() || p.status !== 'ativa') location.replace('index.html'); };
  return { perfil, entrar, atualizarPerfil, consentir, revogar, sair, termoOk, api, read, write, push, salvar, status, sincronizar, restaurar,
    saudacao, dayKey, weekStart, thisWeek, DIAS, diaIdx, reduced, esc, exigePerfil, amarraLinks };
})();
