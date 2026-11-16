/* Pacto de Mudança (Termo de Auto-Compromisso) — Passo 3 do Método SER.
   Texto aprovado pelo Lucas em 15/11/2026 (versão pacto-2026-11-v1). Escrito a partir da descrição da Mileny na "Caixa de ferramentas":
   "documento simbólico, baseado na Psicologia Positiva, onde a cliente assina que compreende que o processo
   depende das escolhas dela, tirando-a do papel de vítima das circunstâncias." */
const PACTO = {
  versao: 'pacto-2026-11-v1',
  clausulas: [
    { id: 'onde', txt: 'Eu reconheço onde estou hoje, sem me julgar. O cansaço que sinto no corpo, na mente e na energia é um sinal, não uma sentença.' },
    { id: 'escolhas', txt: 'Eu compreendo que a minha mudança depende das minhas escolhas. As circunstâncias pesam, mas não decidem por mim.' },
    { id: 'protagonista', txt: 'Eu saio do papel de vítima e assumo o lugar de protagonista da minha história.' },
    { id: 'pequenos', txt: 'Eu me comprometo com passos pequenos e possíveis, mesmo nos dias difíceis. Feito é melhor do que perfeito.' },
    { id: 'recomeco', txt: 'Quando eu me sabotar, vou me acolher e recomeçar, sem desistir de mim.' }
  ],
  areas: ['Equilíbrio emocional', 'Relacionamento', 'Saúde', 'Profissional', 'Segurança material'],   // as áreas da Roda do SER
  fecho: 'Assino este pacto comigo mesma, como um compromisso de cuidado, e não de cobrança.'
};
/* Selo de cera em SVG (contorno irregular, monograma SER em relevo). Determinístico para ficar igual em todo lugar. */
function seloSVG(px, cls) {
  const R = 50, pts = []; let s = 7;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = R - 1 - rnd() * 4.5; pts.push([60 + r * Math.cos(a), 60 + r * Math.sin(a)]); }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) { const p = pts[(i + 1) % pts.length], q = pts[i]; d += `Q${q[0].toFixed(1)} ${q[1].toFixed(1)} ${((q[0] + p[0]) / 2).toFixed(1)} ${((q[1] + p[1]) / 2).toFixed(1)}`; }
  return `<svg class="${cls || ''}" viewBox="0 0 120 120" width="${px}" height="${px}" aria-hidden="true">
    <path d="${d}Z" fill="#A75E48"/><path d="${d}Z" fill="none" stroke="#8C4A37" stroke-width="2" transform="translate(60 60) scale(.98) translate(-60 -60)"/>
    <circle cx="60" cy="60" r="33" fill="#94503C"/><circle cx="60" cy="60" r="30.5" fill="#A75E48"/>
    <circle cx="60" cy="60" r="38" fill="none" stroke="#C27A5F" stroke-width="1.4" stroke-dasharray="1.5 4.2" opacity=".8"/>
    <text x="60" y="70.5" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="27" font-weight="600" fill="#7E3F2E" letter-spacing="1">SER</text>
    <text x="59.4" y="69.6" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="27" font-weight="600" fill="#D9997E" letter-spacing="1" opacity=".9">SER</text>
    <path d="M38 34 Q46 26 58 25" fill="none" stroke="#E8C4B0" stroke-width="2.4" stroke-linecap="round" opacity=".45"/>
  </svg>`;
}
