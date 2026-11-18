import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import {
  collectOrderedSubTopics,
  formatBookGradeLabel,
  getSubjectsForGradeKey,
  buildFullBookQuestionPool,
} from '@/lib/cbc-books-engine';

export interface JamoKjseaMcqItem {
  qNumber: number; // 1..10
  strand: string;
  substrand: string;
  prompt: string;
  options: [string, string, string, string];
  marks: 2;
  answerLetter: string;
  answerValue: string;
  explanation: string;
}

export interface JamoKjseaStructuredItem {
  qNumber: number; // 11..20
  strand: string;
  substrand: string;
  partAPrompt: string;
  partAMarks: 4;
  partAAnswer: string;
  partBPrompt: string;
  partBMarks: 4;
  partBAnswer: string;
  totalMarks: 8;
}

export interface JamoKjseaExamPaper {
  examTitle: string;
  paperCode: string;
  durationLabel: string;
  gradeKey: string;
  gradeLabel: string;
  kiswahiliGradeLabel: string;
  subject: string;
  isKiswahili: boolean;
  strandsCovered: string[];
  sectionA: JamoKjseaMcqItem[]; // Q1..Q10 (10 x 2 = 20 Marks)
  sectionB: JamoKjseaStructuredItem[]; // Q11..Q20 (10 x 8 = 80 Marks)
  totalQuestions: 20;
  totalMarks: 100;
}

function toPdfSafe(str: string): string {
  return String(str || '')
    .replace(/√/g, 'sqrt')
    .replace(/⁴/g, '^4')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/÷/g, '/')
    .replace(/×/g, 'x')
    .replace(/−/g, '-')
    .replace(/⇒/g, '=>')
    .replace(/→/g, '->')
    .replace(/Ω/g, 'Ohm')
    .replace(/π/g, 'pi')
    .replace(/λ/g, 'lambda')
    .replace(/ρ/g, 'rho')
    .replace(/°/g, ' deg')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/≠/g, '!=')
    .replace(/±/g, '+/-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/•/g, '*')
    .replace(/\s{2,}/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
}

function wrapText(text: string, maxChars = 86): string[] {
  const safe = toPdfSafe(text);
  const out: string[] = [];
  for (const rawLine of safe.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      out.push('');
      continue;
    }
    const words = trimmed.split(' ');
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars) {
        if (cur) out.push(cur);
        cur = w;
      } else {
        cur = cur ? `${cur} ${w}` : w;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

function formatKiswahiliGradeLabel(gradeKey: string): string {
  const up = gradeKey.toUpperCase().trim();
  if (up === 'PP1' || up === 'PP2') return `CHEKECHEA (${up})`;
  return `GREDI YA ${up}`;
}

function resolveExamPaperCode(gradeKey: string, subject: string): string {
  const s = subject.toLowerCase();
  const prefix =
    gradeKey === 'PP1'
      ? '10'
      : gradeKey === 'PP2'
      ? '20'
      : Number(gradeKey) <= 6
      ? '60'
      : Number(gradeKey) <= 9
      ? '90'
      : '95';
  if (s.includes('english') || s.includes('language activities')) return `${prefix}1/1`;
  if (s.includes('kiswahili') || s.includes('fasihi')) return `${prefix}2/1`;
  if (s.includes('math')) return `${prefix}3`;
  if (s.includes('integrated science') || s.includes('science')) return `${prefix}5/1`;
  if (s.includes('agriculture')) return `${prefix}6/1`;
  if (s.includes('social') || s.includes('history') || s.includes('geography')) return `${prefix}7`;
  if (s.includes('christian') || s.includes('cre')) return `${prefix}8`;
  if (s.includes('islamic') || s.includes('ire')) return `${prefix}9`;
  if (s.includes('creative') || s.includes('music') || s.includes('fine arts') || s.includes('sports'))
    return `${prefix}11/1`;
  if (s.includes('pre-technical') || s.includes('computer') || s.includes('ict'))
    return `${prefix}12/1`;
  if (s.includes('biology')) return `${prefix}23/1`;
  if (s.includes('chemistry')) return `${prefix}33/1`;
  if (s.includes('physics')) return `${prefix}32/1`;
  if (s.includes('business')) return `${prefix}65`;
  return `${prefix}4/1`;
}

/**
 * Draws a 100% original, copyright-safe ceremonial Examination Crest Emblem
 * (concentric academic seal rings, laurel wreath arcs, open book of knowledge,
 * rising torch flame & "JK-KJSEA" monogram) inspired by classic examination council seals.
 */
function drawJamoAcademicCrestLogo(
  page: PDFPage,
  cx: number,
  cy: number,
  boldFont: PDFFont
) {
  const darkInk = rgb(0.06, 0.14, 0.12);
  const emerald = rgb(0.03, 0.36, 0.25);
  const gold = rgb(0.78, 0.56, 0.08);
  const lightCream = rgb(0.97, 0.99, 0.97);

  // Outer & Inner Seal Rings
  page.drawCircle({
    x: cx,
    y: cy,
    size: 25,
    borderColor: darkInk,
    borderWidth: 1.8,
    color: lightCream,
  });
  page.drawCircle({
    x: cx,
    y: cy,
    size: 21.5,
    borderColor: emerald,
    borderWidth: 1.0,
  });
  page.drawCircle({
    x: cx,
    y: cy,
    size: 15.5,
    borderColor: gold,
    borderWidth: 0.7,
  });

  // 12 Symmetrical Sunburst Knowledge Rays inside the seal
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    page.drawLine({
      start: { x: cx + Math.cos(rad) * 16.2, y: cy + Math.sin(rad) * 16.2 },
      end: { x: cx + Math.cos(rad) * 20.5, y: cy + Math.sin(rad) * 20.5 },
      thickness: 0.7,
      color: deg % 60 === 0 ? emerald : gold,
    });
  }

  // Stylized Open Book of Knowledge (left & right pages + spine)
  page.drawRectangle({
    x: cx - 10,
    y: cy - 8,
    width: 9.5,
    height: 7.5,
    borderColor: darkInk,
    borderWidth: 1.0,
    color: rgb(1, 1, 1),
  });
  page.drawRectangle({
    x: cx + 0.5,
    y: cy - 8,
    width: 9.5,
    height: 7.5,
    borderColor: darkInk,
    borderWidth: 1.0,
    color: rgb(1, 1, 1),
  });
  page.drawLine({
    start: { x: cx, y: cy - 8.5 },
    end: { x: cx, y: cy - 0.2 },
    thickness: 1.2,
    color: emerald,
  });

  // Torch Pillar & Rising Flame of Excellence above the Open Book
  page.drawLine({
    start: { x: cx, y: cy - 0.5 },
    end: { x: cx, y: cy + 8.5 },
    thickness: 1.8,
    color: darkInk,
  });
  page.drawCircle({
    x: cx,
    y: cy + 10.5,
    size: 2.8,
    color: gold,
    borderColor: emerald,
    borderWidth: 0.8,
  });

  // Bottom Scroll Ribbon Banner across base of crest
  page.drawRectangle({
    x: cx - 26,
    y: cy - 23,
    width: 52,
    height: 9.5,
    color: emerald,
    borderColor: darkInk,
    borderWidth: 0.8,
  });
  const motto = 'KN * KJSEA';
  const mw = boldFont.widthOfTextAtSize(motto, 6.2);
  page.drawText(motto, {
    x: cx - mw / 2,
    y: cy - 20.3,
    size: 6.2,
    font: boldFont,
    color: rgb(1, 0.96, 0.75),
  });
}

const STRUCTURED_PART_A_BUILDERS_EN: Array<
  (sub: string, strand: string, subject: string, gradeLabel: string) => {
    q: string;
    a: string;
  }
> = [
  (sub, strand) => ({
    q: `State and explain two fundamental principles or rules studied under "${sub}" (${strand}).`,
    a: `Award 2 marks each for any two accurate principles/rules of "${sub}" clearly explained (2 x 2 = 4 marks).`,
  }),
  (sub, _strand, subject) => ({
    q: `Distinguish clearly between two major concepts covered in "${sub}" in ${subject}, giving one example for each.`,
    a: `Clear conceptual distinction (2 mks) + valid illustrative example for each side (2 mks) = 4 marks.`,
  }),
  (sub) => ({
    q: `Outline four sequential steps a learner should follow when carrying out a practical or analytical task on "${sub}".`,
    a: `Award 1 mark for each accurate step arranged in logical order on "${sub}" (4 x 1 = 4 marks).`,
  }),
  (sub, _strand, _subj, gradeLabel) => ({
    q: `Identify two common errors ${gradeLabel} candidates make when solving problems in "${sub}" and explain how to correct each error.`,
    a: `Two valid errors identified (2 mks) + accurate corrective measure for each (2 mks) = 4 marks.`,
  }),
  (sub) => ({
    q: `Define two key technical terms used in "${sub}" and explain the significance of each term.`,
    a: `Accurate definition (1 mk x 2) + clear explanation of significance (1 mk x 2) = 4 marks.`,
  }),
  (sub, strand) => ({
    q: `Explain two cause-and-effect relationships observed when investigating "${sub}" under "${strand}".`,
    a: `Two accurate cause-and-effect relationships clearly explained (2 x 2 = 4 marks).`,
  }),
  (sub) => ({
    q: `State four safety, hygiene, or measurement-accuracy precautions required during practical work on "${sub}".`,
    a: `Any four distinct, valid precautions relevant to "${sub}" (4 x 1 = 4 marks).`,
  }),
  (sub, strand) => ({
    q: `Explain how mastering "${sub}" supports progressive understanding of related topics in "${strand}".`,
    a: `Two well-reasoned conceptual links within "${strand}" explained clearly (2 x 2 = 4 marks).`,
  }),
  (sub) => ({
    q: `Formulate a concise worked illustration on "${sub}", showing both the initial setup/data and the verified conclusion.`,
    a: `Correct setup/method on "${sub}" (2 mks) + accurate step-by-step result/conclusion (2 mks) = 4 marks.`,
  }),
  (sub) => ({
    q: `Compare two methods or approaches used when handling tasks in "${sub}" and state one advantage of each.`,
    a: `Valid comparison (2 mks) + one clear advantage for each approach (2 mks) = 4 marks.`,
  }),
];

const STRUCTURED_PART_B_BUILDERS_EN: Array<
  (sub: string, kiq: string, resources: string, subject: string) => {
    q: string;
    a: string;
  }
> = [
  (sub, kiq) => ({
    q: `${kiq || `How is "${sub}" applied in everyday life in Kenya?`} Support your answer with two practical Kenyan examples.`,
    a: `Two contextually accurate Kenyan real-life applications answering the inquiry on "${sub}" (2 x 2 = 4 marks).`,
  }),
  (sub, _kiq, resources) => ({
    q: `Describe how learners can effectively use ${resources.toLowerCase()} (or safe locally improvised alternatives) to demonstrate "${sub}".`,
    a: `Proper setup/improvisation described (2 mks) + clear link to demonstrating "${sub}" (2 mks) = 4 marks.`,
  }),
  (sub) => ({
    q: `A Kenyan community faces a practical challenge related to "${sub}". Propose two sustainable solutions grounded in classroom knowledge.`,
    a: `Two practical, sustainable remedies clearly explained and linked to "${sub}" (2 x 2 = 4 marks).`,
  }),
  (sub, _kiq, _res, subject) => ({
    q: `Explain two career or income-generating opportunities in Kenya that apply competencies developed in "${sub}" (${subject}).`,
    a: `Two relevant careers/enterprises named (2 mks) + clear explanation of how "${sub}" skills apply (2 mks) = 4 marks.`,
  }),
  (sub) => ({
    q: `Explain two environmental stewardship, ethical, or citizenship values promoted when practising "${sub}" at school and at home.`,
    a: `Two relevant values identified and concretely linked to actions in "${sub}" (2 x 2 = 4 marks).`,
  }),
  (sub) => ({
    q: `Outline four observable quality indicators an examiner looks for when assessing a completed practical project or written task on "${sub}".`,
    a: `Four measurable accuracy/neatness/method indicators for "${sub}" (4 x 1 = 4 marks).`,
  }),
  (sub) => ({
    q: `Explain two benefits of applying proper principles of "${sub}" to household health, productivity, or resource conservation in Kenya.`,
    a: `Two distinct household/community benefits explained clearly (2 x 2 = 4 marks).`,
  }),
  (sub) => ({
    q: `Describe two ways digital tools or approved reference media can be used responsibly to verify and present findings on "${sub}".`,
    a: `Two responsible ICT/research applications explained for "${sub}" (2 x 2 = 4 marks).`,
  }),
  (sub, _kiq, resources) => ({
    q: `During a school exhibition on "${sub}", a group displays ${resources.toLowerCase()}. Write two key talking points they should present to visitors.`,
    a: `Two clear, accurate exhibition talking points summarizing "${sub}" (2 x 2 = 4 marks).`,
  }),
  (sub) => ({
    q: `Evaluate what happens when key rules or procedures in "${sub}" are neglected, giving two real-world consequences.`,
    a: `Two realistic consequences of neglecting proper rules in "${sub}" clearly explained (2 x 2 = 4 marks).`,
  }),
];

const STRUCTURED_PART_A_BUILDERS_KIS: Array<
  (sub: string, strand: string) => { q: string; a: string }
> = [
  (sub, strand) => ({
    q: `Fafanua kanuni mbili kuu zinazozingatiwa katika "${sub}" chini ya mada ya "${strand}" kwa kutoa mfano mmoja kwa kila moja.`,
    a: `Kanuni 2 sahihi (alama 2) + mifano 2 sanifu ya Kiswahili (alama 2) = Alama 4.`,
  }),
  (sub) => ({
    q: `Tunga sentensi mbili sanifu na tofauti zinazodhihirisha umilisi kamili wa "${sub}".`,
    a: `Sentensi 2 sahihi zisizo na makosa ya sarufi, hijai wala uakifishaji (Alama 2 x 2 = 4).`,
  }),
  (sub) => ({
    q: `Tofautisha vipengele viwili vikuu vinavyojitokeza katika "${sub}" kwa kutumia mifano mwafaka.`,
    a: `Tofauti iliyowekwa wazi (alama 2) + mifano 2 sahihi (alama 2) = Alama 4.`,
  }),
  (sub) => ({
    q: `Tambua makosa mawili ya kawaida ambayo watahiniwa hufanya katika "${sub}" na uonyeshe jinsi ya kuyarekebisha.`,
    a: `Makosa 2 yaliyotambuliwa (alama 2) + marekebisho sahihi (alama 2) = Alama 4.`,
  }),
  (sub) => ({
    q: `Eleza maana ya istilahi mbili muhimu zinazopatikana katika "${sub}" na utunge sentensi moja kwa kila istilahi.`,
    a: `Maana 2 sahihi (alama 2) + sentensi 2 sanifu (alama 2) = Alama 4.`,
  }),
  (sub) => ({
    q: `Andika hatua nne zenye mtiririko wa mantiki zinazofuatwa wakati wa kuchambua au kuwasilisha kazi ya "${sub}".`,
    a: `Hatua 4 sahihi kwa mpangilio unaofaa (Alama 4 x 1 = 4).`,
  }),
  (sub, strand) => ({
    q: `Onyesha uhusiano wa kijengano uliopo kati ya "${sub}" na vipengele vingine vya mada ya "${strand}".`,
    a: `Hoja 2 zenye mantiki zinazoonyesha muunganiko wa mada (Alama 2 x 2 = 4).`,
  }),
  (sub) => ({
    q: `Buni kifungu kifupi cha maneno yasiyozidi thelathini na tano kinachojumuisha mifano miwili ya "${sub}".`,
    a: `Kifungu chenye muwala, ufasaha na mifano 2 sahihi ya "${sub}" (Alama 4).`,
  }),
  (sub) => ({
    q: `Linganisha matumizi ya "${sub}" katika muktadha rasmi na muktadha usio rasmi.`,
    a: `Hoja 2 za ulinganisho zilizofafanuliwa kwa Kiswahili sanifu (Alama 2 x 2 = 4).`,
  }),
  (sub) => ({
    q: `Taja vigezo vinne ambavyo mtahini huzingatia anapotuza alama kamili katika swali la "${sub}".`,
    a: `Vigezo 4 sahihi (ufasaha, hijai, muundo na mifano mwafaka) (Alama 4 x 1 = 4).`,
  }),
];

const STRUCTURED_PART_B_BUILDERS_KIS: Array<
  (sub: string, kiq: string, resources: string) => { q: string; a: string }
> = [
  (sub, kiq) => ({
    q: `${kiq || `Ni kwa namna gani "${sub}" hutumika katika mawasiliano ya kila siku nchini Kenya?`} Fafanua kwa hoja mbili.`,
    a: `Hoja 2 zilizofafanuliwa kikamilifu kuhusiana na mazingira halisi ya Kenya (Alama 2 x 2 = 4).`,
  }),
  (sub, _kiq, resources) => ({
    q: `Eleza manufaa mawili ya kutumia nyenzo kama vile (${resources.toLowerCase()}) unapojifunza mada ndogo ya "${sub}".`,
    a: `Manufaa 2 sahihi yaliyoelezwa kwa ufasaha (Alama 2 x 2 = 4).`,
  }),
  (sub) => ({
    q: `Bainisha maadili mawili ya kijamii na kitaifa yanayokuzwa kupitia ujifunzaji wa "${sub}".`,
    a: `Maadili 2 (k.m. heshima, uwajibikaji, uzalendo) yaliyohusishwa na "${sub}" (Alama 2 x 2 = 4).`,
  }),
  (sub) => ({
    q: `Pendekeza taaluma mbili nchini Kenya zinazotegemea umilisi wa "${sub}" na ueleze jinsi stadi hiyo inavyotumika.`,
    a: `Taaluma 2 mwafaka (alama 2) + maelezo ya matumizi (alama 2) = Alama 4.`,
  }),
  (sub) => ({
    q: `Andika dayalojia fupi ya zamu nne kati ya wanafunzi wawili ikidhihirisha matumizi sahihi ya "${sub}".`,
    a: `Dayalojia yenye adabu, uakifishaji sahihi na matumizi mwafaka ya "${sub}" (Alama 4).`,
  }),
  (sub) => ({
    q: `Eleza njia mbili salama za kutumia teknolojia ya kidijitali kuimarisha utafiti na uwasilishaji wa "${sub}".`,
    a: `Njia 2 salama za kidijitali zilizofafanuliwa vizuri (Alama 2 x 2 = 4).`,
  }),
  (sub) => ({
    q: `Jadili changamoto mbili zinazoweza kutokea katika mawasiliano endapo kanuni za "${sub}" zitapuuzwa, na utoe suluhisho.`,
    a: `Changamoto 2 + suluhisho sahihi kwa kila moja (Alama 2 x 2 = 4).`,
  }),
  (sub) => ({
    q: `Eleza namna mwanafunzi anavyoweza kushirikiana na familia nyumbani kuendeleza mazoezi ya "${sub}".`,
    a: `Mbinu 2 za vitendo za kufanya mazoezi nyumbani (Alama 2 x 2 = 4).`,
  }),
  (sub) => ({
    q: `Fafanua umuhimu wa kuzingatia sajili na hadhira unapowasilisha ujumbe unaohusu "${sub}".`,
    a: `Hoja 2 sahihi kuhusu sajili, lengo na hadhira (Alama 2 x 2 = 4).`,
  }),
  (sub) => ({
    q: `Andika vidokezo vinne vya muhtasari ambavyo mwanafunzi atatumia kujikumbusha "${sub}" kabla ya mtihani wa kitaifa.`,
    a: `Vidokezo 4 mahsusi na sahihi kuhusu "${sub}" (Alama 4 x 1 = 4).`,
  }),
];

/**
 * Builds an authentic 20-Question "KENYA NATIONAL KJSEA TEST" covering ALL Strands of the subject
 * in round-robin Strand order with STRICTLY ZERO REPETITION!
 * Uses 100% pure Kiswahili when `isKiswahili` is true!
 */
export function buildJamoKenyattaKjseaExam(
  gradeKey: string,
  subject: string
): JamoKjseaExamPaper {
  const validSubjects = getSubjectsForGradeKey(gradeKey);
  const resolvedSubject = validSubjects.includes(subject)
    ? subject
    : validSubjects[0] || subject;
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const kiswahiliGradeLabel = formatKiswahiliGradeLabel(gradeKey);
  const isKis =
    resolvedSubject.toLowerCase().includes('kiswahili') ||
    resolvedSubject.toLowerCase().includes('fasihi');
  const paperCode = resolveExamPaperCode(gradeKey, resolvedSubject);

  const { strands } = collectOrderedSubTopics(gradeKey, resolvedSubject, 0);

  const interleavedUnits: Array<{
    strand: string;
    sub: string;
    kiq: string;
    resources: string;
  }> = [];
  const maxSubsLen = strands.reduce((m, s) => Math.max(m, s.subs.length), 1);
  for (let pass = 0; pass < Math.max(maxSubsLen, 8); pass++) {
    for (const st of strands) {
      const sub = st.subs[pass % Math.max(1, st.subs.length)] || st.strand;
      interleavedUnits.push({
        strand: st.strand,
        sub,
        kiq: st.kiq,
        resources: st.resources,
      });
    }
  }

  const rawPool = buildFullBookQuestionPool(gradeKey, resolvedSubject, 180, 0, 0);
  const mcqCandidates = rawPool.filter((q) => Array.isArray(q.options) && q.options.length === 4);

  const usedPrompts = new Set<string>();
  const sectionA: JamoKjseaMcqItem[] = [];

  for (let i = 0; i < 10; i++) {
    const targetUnit = interleavedUnits[i % interleavedUnits.length];
    // Rotate starting probe index (`i * 5 + 3`) for distinct national-exam MCQ selection across all strands
    let picked: (typeof mcqCandidates)[number] | undefined;
    for (let k = 0; k < mcqCandidates.length; k++) {
      const cand = mcqCandidates[(i * 5 + 3 + k) % mcqCandidates.length];
      if (
        cand.strand === targetUnit.strand &&
        !usedPrompts.has(cand.prompt.toLowerCase().trim())
      ) {
        picked = cand;
        break;
      }
    }
    if (!picked) {
      for (let k = 0; k < mcqCandidates.length; k++) {
        const cand = mcqCandidates[(i * 5 + 3 + k) % mcqCandidates.length];
        if (!usedPrompts.has(cand.prompt.toLowerCase().trim())) {
          picked = cand;
          break;
        }
      }
    }

    if (picked && picked.options) {
      usedPrompts.add(picked.prompt.toLowerCase().trim());
      const letterMatch = picked.answerText.match(/^([A-D])\b/);
      const answerLetter = letterMatch ? letterMatch[1] : 'A';
      const letterIdx = ['A', 'B', 'C', 'D'].indexOf(answerLetter);
      const answerValue = picked.options[letterIdx >= 0 ? letterIdx : 0];
      sectionA.push({
        qNumber: i + 1,
        strand: targetUnit.strand,
        substrand: picked.substrand || targetUnit.sub,
        prompt: picked.prompt,
        options: picked.options,
        marks: 2,
        answerLetter,
        answerValue,
        explanation: picked.explanation,
      });
    } else {
      const fallbackPrompt = isKis
        ? `Katika swali la ${i + 1}, chagua maelezo SAHIHI yanayofafanua kipengele cha "${targetUnit.sub}" (${targetUnit.strand}):`
        : `In Item ${i + 1}, which statement accurately describes a key principle of "${targetUnit.sub}" (${targetUnit.strand})?`;
      usedPrompts.add(fallbackPrompt.toLowerCase());
      const opts: [string, string, string, string] = isKis
        ? [
            `Huimarisha umilisi wa "${targetUnit.sub}" kwa kuzingatia kanuni sanifu za somo`,
            `Hupuuza kabisa matumizi ya ${targetUnit.resources.toLowerCase()}`,
            `Hakina uhusiano wowote na mada ya "${targetUnit.strand}"`,
            `Hutumika nje ya mpangilio wa lugha sanifu`,
          ]
        : [
            `Applies verified rules and ${targetUnit.resources.toLowerCase()} to master "${targetUnit.sub}"`,
            `Disregards measurement accuracy and safety procedures completely`,
            `Has no connection to any concept within "${targetUnit.strand}"`,
            `Eliminates practical observation and logical working`,
          ];
      sectionA.push({
        qNumber: i + 1,
        strand: targetUnit.strand,
        substrand: targetUnit.sub,
        prompt: fallbackPrompt,
        options: opts,
        marks: 2,
        answerLetter: 'A',
        answerValue: opts[0],
        explanation: isKis
          ? `Chaguo A ni sahihi kulingana na kanuni za "${targetUnit.sub}".`
          : `Option A accurately states the core principle of "${targetUnit.sub}".`,
      });
    }
  }

  const sectionB: JamoKjseaStructuredItem[] = [];
  const isMath = resolvedSubject.toLowerCase().includes('math');
  const nonMcqMath = rawPool.filter((q) => !q.options);

  for (let j = 0; j < 10; j++) {
    const qNum = 11 + j;
    const unit = interleavedUnits[(10 + j) % interleavedUnits.length];

    if (isMath && nonMcqMath.length >= (j + 1) * 2) {
      const mA = nonMcqMath[j * 2];
      const mB = nonMcqMath[j * 2 + 1];
      usedPrompts.add(mA.prompt.toLowerCase().trim());
      usedPrompts.add(mB.prompt.toLowerCase().trim());
      sectionB.push({
        qNumber: qNum,
        strand: unit.strand,
        substrand: unit.sub,
        partAPrompt: mA.prompt,
        partAMarks: 4,
        partAAnswer: `${mA.answerText} — ${mA.explanation}`,
        partBPrompt: mB.prompt,
        partBMarks: 4,
        partBAnswer: `${mB.answerText} — ${mB.explanation}`,
        totalMarks: 8,
      });
      continue;
    }

    const builtA = isKis
      ? STRUCTURED_PART_A_BUILDERS_KIS[j % STRUCTURED_PART_A_BUILDERS_KIS.length](
          unit.sub,
          unit.strand
        )
      : STRUCTURED_PART_A_BUILDERS_EN[j % STRUCTURED_PART_A_BUILDERS_EN.length](
          unit.sub,
          unit.strand,
          resolvedSubject,
          gradeLabel
        );

    const builtB = isKis
      ? STRUCTURED_PART_B_BUILDERS_KIS[j % STRUCTURED_PART_B_BUILDERS_KIS.length](
          unit.sub,
          unit.kiq,
          unit.resources
        )
      : STRUCTURED_PART_B_BUILDERS_EN[j % STRUCTURED_PART_B_BUILDERS_EN.length](
          unit.sub,
          unit.kiq,
          unit.resources,
          resolvedSubject
        );

    const suffixTag =
      usedPrompts.has(builtA.q.toLowerCase()) || usedPrompts.has(builtB.q.toLowerCase())
        ? isKis
          ? ` [Zoezi la ${qNum} — ${unit.strand}]`
          : ` [Assessment Task ${qNum} — ${unit.strand}]`
        : '';

    const finalA = `${builtA.q}${suffixTag}`;
    const finalB = `${builtB.q}${suffixTag}`;
    usedPrompts.add(finalA.toLowerCase());
    usedPrompts.add(finalB.toLowerCase());

    sectionB.push({
      qNumber: qNum,
      strand: unit.strand,
      substrand: unit.sub,
      partAPrompt: finalA,
      partAMarks: 4,
      partAAnswer: builtA.a,
      partBPrompt: finalB,
      partBMarks: 4,
      partBAnswer: builtB.a,
      totalMarks: 8,
    });
  }

  return {
    examTitle: 'KENYA NATIONAL KJSEA TEST',
    paperCode,
    durationLabel: isKis ? 'SAA 2' : '2 HOURS',
    gradeKey,
    gradeLabel,
    kiswahiliGradeLabel,
    subject: resolvedSubject,
    isKiswahili: isKis,
    strandsCovered: strands.map((s) => s.strand),
    sectionA,
    sectionB,
    totalQuestions: 20,
    totalMarks: 100,
  };
}

// ============================================================================
// OFFICIAL EXAMINATION BOOKLET PDF GENERATOR (WITH CUSTOM ACADEMIC CREST LOGO)
// ============================================================================

export type KjseaDocMode = 'PAPER' | 'MARKING_SCHEME';

export async function generateJamoKjseaPdfBuffer(params: {
  gradeKey: string;
  subject: string;
  mode?: KjseaDocMode;
}): Promise<Uint8Array> {
  const mode: KjseaDocMode = params.mode === 'MARKING_SCHEME' ? 'MARKING_SCHEME' : 'PAPER';
  const exam = buildJamoKenyattaKjseaExam(params.gradeKey, params.subject);
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const obliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const dispSubj = exam.isKiswahili
    ? exam.subject
        .replace(/Kiswahili Language Activities/i, 'SHUGHULI ZA LUGHA YA KISWAHILI')
        .toUpperCase()
    : exam.subject.toUpperCase();
  const dispGrade = exam.isKiswahili
    ? exam.kiswahiliGradeLabel
    : exam.gradeLabel.toUpperCase();

  const pages: PDFPage[] = [];
  const newExamPage = (): PDFPage => {
    const p = pdfDoc.addPage([595.28, 841.89]);
    pages.push(p);
    return p;
  };

  let curPage = newExamPage();
  const { width, height } = curPage.getSize();
  let y = height - 64;

  const ensureSpace = (needed: number) => {
    if (y - needed < 58) {
      curPage = newExamPage();
      y = height - 64;
    }
  };

  const centerTextOn = (
    pg: PDFPage,
    txt: string,
    yPos: number,
    sz: number,
    fnt: PDFFont,
    col: [number, number, number] = [0.05, 0.07, 0.1]
  ) => {
    const safe = toPdfSafe(txt);
    const tw = fnt.widthOfTextAtSize(safe, sz);
    pg.drawText(safe, {
      x: Math.max(42, (width - tw) / 2),
      y: yPos,
      size: sz,
      font: fnt,
      color: rgb(col[0], col[1], col[2]),
    });
  };

  if (mode === 'PAPER') {
    // ---------------- PAGE 1: OFFICIAL EXAMINATION COVER PAGE ----------------
    const cover = curPage;

    cover.drawRectangle({
      x: 32,
      y: 34,
      width: width - 64,
      height: height - 68,
      borderColor: rgb(0.08, 0.1, 0.14),
      borderWidth: 1.5,
    });

    // Top-Right Paper Code Box
    cover.drawRectangle({
      x: width - 126,
      y: height - 66,
      width: 84,
      height: 22,
      borderColor: rgb(0.1, 0.1, 0.1),
      borderWidth: 1,
    });
    cover.drawText(toPdfSafe(exam.paperCode), {
      x: width - 110,
      y: height - 59,
      size: 10.5,
      font: boldFont,
      color: rgb(0.05, 0.05, 0.05),
    });

    // Top-Center Original Copyright-Safe Academic Crest Logo
    drawJamoAcademicCrestLogo(cover, width / 2, height - 70, boldFont);

    centerTextOn(
      cover,
      exam.isKiswahili
        ? 'TATHMINI YA ELIMU YA SHULE YA SEKONDARI MSINGI KENYA (KJSEA)'
        : 'KENYA JUNIOR SCHOOL EDUCATION ASSESSMENT (KJSEA)',
      height - 110,
      10.4,
      boldFont
    );
    centerTextOn(
      cover,
      'KENYA NATIONAL KJSEA TEST',
      height - 131,
      17.5,
      boldFont,
      [0.03, 0.3, 0.22]
    );
    centerTextOn(cover, `${dispGrade}  -  ${dispSubj}`, height - 150, 11.8, boldFont);
    centerTextOn(
      cover,
      exam.isKiswahili ? 'MUDA: SAA 2' : 'TIME: 2 HOURS',
      height - 166,
      10.8,
      boldFont,
      [0.55, 0.1, 0.1]
    );

    // Candidate Identification Box
    const boxTop = height - 178;
    cover.drawRectangle({
      x: 44,
      y: boxTop - 84,
      width: width - 88,
      height: 82,
      borderColor: rgb(0.12, 0.15, 0.2),
      borderWidth: 1,
      color: rgb(0.985, 0.99, 0.995),
    });

    const idRows = exam.isKiswahili
      ? [
          'Jina la Mtahiniwa: ......................................................................................................................................',
          'Nambari ya Tathmini (KJSEA): ...................................................   Msimbo wa Shule: ................................',
          'Jina la Shule: .............................................................................................................................................',
          'Sahihi ya Mtahiniwa: .................................................................   Tarehe: ...............................................',
        ]
      : [
          "Candidate's Name: ...........................................................................................................................",
          'Assessment Number: .............................................................   School Code: .....................................',
          'School Name: ...................................................................................................................................',
          "Candidate's Signature: .........................................................   Date: ..................................................",
        ];

    let idY = boxTop - 19;
    for (const rTxt of idRows) {
      cover.drawText(toPdfSafe(rTxt), {
        x: 52,
        y: idY,
        size: 9.0,
        font: boldFont,
        color: rgb(0.1, 0.12, 0.16),
      });
      idY -= 18.5;
    }

    // INSTRUCTIONS TO CANDIDATES / MAAGIZO KWA WATAHINIWA
    let instY = boxTop - 102;
    cover.drawText(
      exam.isKiswahili ? 'MAAGIZO KWA WATAHINIWA' : 'INSTRUCTIONS TO CANDIDATES',
      {
        x: 44,
        y: instY,
        size: 10.5,
        font: boldFont,
        color: rgb(0.05, 0.08, 0.12),
      }
    );
    cover.drawLine({
      start: { x: 44, y: instY - 3 },
      end: { x: 235, y: instY - 3 },
      thickness: 0.9,
      color: rgb(0.05, 0.08, 0.12),
    });
    instY -= 16;

    const coverInstructions = exam.isKiswahili
      ? [
          '(a) Andika jina lako, nambari yako ya tathmini, jina la shule na msimbo wa shule katika nafasi ulizoachiwa hapo juu.',
          '(b) Tia sahihi yako na uandike tarehe ya mtihani katika nafasi zilizoachwa hapo juu.',
          '(c) Karatasi hii ya mtihani ina sehemu MBILI: SEHEMU A (Maswali 1 hadi 10 — Alama 20) na SEHEMU B (Maswali 11 hadi 20 — Alama 80). Muda: SAA 2.',
          '(d) Jibu MASWALI YOTE ISHIRINI (20) katika karatasi hii. Mada kuu zote za silabasi zimetahiniwa bila urudiaji wowote.',
          '(e) Majibu yote LAZIMA yaandikwe katika nafasi zilizoachwa ndani ya kijitabu hiki cha maswali.',
          '(f) Usiondoe ukurasa wowote kutoka kwenye kijitabu hiki cha mtihani.',
          '(g) Watahiniwa wahakikishe kuwa kurasa zote zimechapishwa kama ilivyoonyeshwa na kwamba hakuna maswali yaliyokosekana (Swali la 1 hadi la 20).',
          '(h) Watahiniwa ni lazima wajibu maswali yote kwa lugha ya Kiswahili Sanifu.',
        ]
      : [
          '(a) Write your name, Assessment Number, School Name, and School Code in the spaces provided at the top of this page.',
          '(b) Sign and write the date of the examination in the spaces provided above.',
          '(c) This question paper consists of TWO sections: SECTION A (Questions 1 to 10 — 20 Marks) and SECTION B (Questions 11 to 20 — 80 Marks). Duration: 2 HOURS.',
          '(d) Answer ALL the TWENTY (20) questions in this paper. Every syllabus strand is covered with zero question repetition.',
          '(e) All answers and working steps MUST be written clearly in the spaces provided in this question booklet.',
          '(f) Do NOT tear out or remove any pages from this question booklet.',
          '(g) Non-programmable silent electronic calculators and mathematical tables may be used where applicable.',
          '(h) Candidates should check the question paper to ascertain that all the pages are printed as indicated and that no questions are missing (Questions 1 to 20).',
          '(i) Candidates must answer all the questions in English.',
        ];

    for (const rule of coverInstructions) {
      const lines = wrapText(rule, 89);
      for (let li = 0; li < lines.length; li++) {
        cover.drawText(lines[li], {
          x: li === 0 ? 46 : 62,
          y: instY,
          size: 8.6,
          font: regFont,
          color: rgb(0.12, 0.15, 0.2),
        });
        instY -= 11.2;
      }
      instY -= 3.0;
    }

    // Strands Examined Summary Strip
    instY -= 3;
    cover.drawRectangle({
      x: 44,
      y: instY - 36,
      width: width - 88,
      height: 40,
      color: rgb(0.95, 0.98, 0.96),
      borderColor: rgb(0.03, 0.36, 0.27),
      borderWidth: 0.8,
    });
    cover.drawText(
      exam.isKiswahili
        ? 'MADA KUU ZA SILABASI ZILIZOTAHINIWA (SWALI LA 1 - 20):'
        : 'SYLLABUS STRANDS EXAMINED ACROSS QUESTIONS 1 - 20:',
      {
        x: 52,
        y: instY - 10,
        size: 8.3,
        font: boldFont,
        color: rgb(0.03, 0.36, 0.27),
      }
    );
    const strandLine = wrapText(exam.strandsCovered.join('  *  '), 90).slice(0, 2);
    let stY = instY - 22;
    for (const sln of strandLine) {
      cover.drawText(sln, {
        x: 52,
        y: stY,
        size: 7.8,
        font: regFont,
        color: rgb(0.18, 0.24, 0.3),
      });
      stY -= 9.5;
    }

    // FOR OFFICIAL EXAMINER'S USE ONLY / KWA MATUMIZI YA MTAHINI PEKEE
    const tblTop = 186;
    cover.drawText(
      exam.isKiswahili
        ? 'KWA MATUMIZI YA MTAHINI PEKEE'
        : "FOR OFFICIAL EXAMINER'S USE ONLY",
      {
        x: 44,
        y: tblTop + 8,
        size: 9.4,
        font: boldFont,
        color: rgb(0.06, 0.08, 0.12),
      }
    );

    const tblX = 44;
    const tblW = width - 88;
    const rowH = 22.5;
    const cols = [0, 115, 215, 320, 418, tblW];

    for (let r = 0; r <= 4; r++) {
      const ry = tblTop - r * rowH;
      cover.drawLine({
        start: { x: tblX, y: ry },
        end: { x: tblX + tblW, y: ry },
        thickness: r === 0 || r === 1 || r === 4 ? 1.1 : 0.7,
        color: rgb(0.1, 0.12, 0.16),
      });
    }
    for (const cx of cols) {
      cover.drawLine({
        start: { x: tblX + cx, y: tblTop },
        end: { x: tblX + cx, y: tblTop - 4 * rowH },
        thickness: 0.8,
        color: rgb(0.1, 0.12, 0.16),
      });
    }

    const gridRows = exam.isKiswahili
      ? [
          ['Sehemu', 'Maswali', 'Upeo wa Alama', 'Alama za Mtahiniwa', 'Kiwango cha Utendaji'],
          ['SEHEMU A', '1 - 10', '20', '', ''],
          ['SEHEMU B', '11 - 20', '80', '', ''],
          ['JUMLA KUU', '1 - 20', '100', '', 'KM / KUF / KUK / CH'],
        ]
      : [
          ['Section', 'Questions', 'Maximum Score', "Candidate's Score", 'Performance Level'],
          ['SECTION A', '1 - 10', '20', '', ''],
          ['SECTION B', '11 - 20', '80', '', ''],
          ['TOTAL SCORE', '1 - 20', '100', '', 'EE / ME / AE / BE'],
        ];

    for (let r = 0; r < gridRows.length; r++) {
      const row = gridRows[r];
      const textY = tblTop - (r + 1) * rowH + 7.5;
      for (let c = 0; c < row.length; c++) {
        cover.drawText(row[c], {
          x: tblX + cols[c] + 5,
          y: textY,
          size: r === 0 || r === 3 ? 8.1 : 8.4,
          font: r === 0 || r === 3 ? boldFont : regFont,
          color: rgb(0.08, 0.1, 0.14),
        });
      }
    }

    cover.drawText(
      exam.isKiswahili
        ? 'Viwango: KM = Kuzidi Matarajio (80-100%) | KUF = Kufikia (50-79%) | KUK = Kukaribia (30-49%) | CH = Chini (0-29%)'
        : 'Performance Levels: EE = Exceeding (80-100%) | ME = Meeting (50-79%) | AE = Approaching (30-49%) | BE = Below (0-29%)',
      {
        x: 44,
        y: 74,
        size: 7.5,
        font: obliqueFont,
        color: rgb(0.25, 0.3, 0.38),
      }
    );
    cover.drawText(exam.isKiswahili ? '[Fungua ukurasa' : '[Turn over', {
      x: width - (exam.isKiswahili ? 124 : 102),
      y: 52,
      size: 9.2,
      font: boldFont,
      color: rgb(0.08, 0.1, 0.14),
    });

    // ---------------- FLOWING QUESTION PAGES (SECTION A: Q1-10, SECTION B: Q11-20) ----------------
    curPage = newExamPage();
    y = height - 64;

    curPage.drawRectangle({
      x: 40,
      y: y - 26,
      width: width - 80,
      height: 28,
      color: rgb(0.93, 0.96, 0.98),
      borderColor: rgb(0.15, 0.25, 0.4),
      borderWidth: 0.9,
    });
    curPage.drawText(
      exam.isKiswahili
        ? 'SEHEMU A: MASWALI YA KUCHAGUA JIBU SAHIHI (MASWALI 1 - 10)  [ALAMA 20]'
        : 'SECTION A: MULTIPLE CHOICE QUESTIONS (QUESTIONS 1 - 10)  [20 MARKS]',
      {
        x: 48,
        y: y - 16,
        size: 9.5,
        font: boldFont,
        color: rgb(0.08, 0.18, 0.35),
      }
    );
    y -= 40;

    for (const mcq of exam.sectionA) {
      const qLines = wrapText(`${mcq.qNumber}. ${mcq.prompt}`, 82);
      const needed = 14 + qLines.length * 12 + 4 * 12 + 18;
      ensureSpace(needed);

      curPage.drawText(
        toPdfSafe(
          exam.isKiswahili
            ? `[Mada Kuu: ${mcq.strand}  |  Alama 2]`
            : `[Strand: ${mcq.strand}  |  2 Marks]`
        ).slice(0, 90),
        {
          x: 42,
          y,
          size: 7.9,
          font: obliqueFont,
          color: rgb(0.28, 0.36, 0.48),
        }
      );
      y -= 12;

      for (let li = 0; li < qLines.length; li++) {
        curPage.drawText(qLines[li], {
          x: li === 0 ? 42 : 56,
          y,
          size: 9.3,
          font: boldFont,
          color: rgb(0.06, 0.09, 0.14),
        });
        y -= 12;
      }

      const letters = ['A', 'B', 'C', 'D'];
      for (let oi = 0; oi < 4; oi++) {
        curPage.drawText(
          toPdfSafe(`   ${letters[oi]}.  ${mcq.options[oi]}`).slice(0, 88),
          {
            x: 52,
            y,
            size: 8.9,
            font: regFont,
            color: rgb(0.14, 0.18, 0.24),
          }
        );
        y -= 11.5;
      }

      curPage.drawText(
        exam.isKiswahili ? 'Jibu la Mtahiniwa: [      ]' : 'Candidate Answer: [      ]',
        {
          x: width - 180,
          y: y + 6,
          size: 8.4,
          font: boldFont,
          color: rgb(0.15, 0.25, 0.4),
        }
      );
      y -= 10;
    }

    // Section B Header
    ensureSpace(60);
    y -= 6;
    curPage.drawRectangle({
      x: 40,
      y: y - 26,
      width: width - 80,
      height: 28,
      color: rgb(0.93, 0.98, 0.95),
      borderColor: rgb(0.04, 0.36, 0.26),
      borderWidth: 0.9,
    });
    curPage.drawText(
      exam.isKiswahili
        ? 'SEHEMU B: MASWALI YA MUUNDO NA MAELEZO (MASWALI 11 - 20)  [ALAMA 80]'
        : 'SECTION B: STRUCTURED & APPLIED QUESTIONS (QUESTIONS 11 - 20)  [80 MARKS]',
      {
        x: 48,
        y: y - 16,
        size: 9.5,
        font: boldFont,
        color: rgb(0.03, 0.34, 0.24),
      }
    );
    y -= 40;

    const drawDottedLines = (count: number) => {
      for (let d = 0; d < count; d++) {
        y -= 13.5;
        curPage.drawText(
          '.......................................................................................................................................................',
          {
            x: 54,
            y,
            size: 8.5,
            font: regFont,
            color: rgb(0.55, 0.6, 0.66),
          }
        );
      }
      y -= 8;
    };

    for (const sq of exam.sectionB) {
      const aLines = wrapText(`(a) ${sq.partAPrompt}`, 80);
      const bLines = wrapText(`(b) ${sq.partBPrompt}`, 80);
      const needed =
        18 + aLines.length * 12 + 4 * 14 + bLines.length * 12 + 4 * 14 + 20;
      ensureSpace(needed);

      curPage.drawText(
        toPdfSafe(
          exam.isKiswahili
            ? `${sq.qNumber}.  [${sq.strand}  -  ${sq.substrand}]   (Jumla: Alama ${sq.totalMarks})`
            : `${sq.qNumber}.  [${sq.strand}  -  ${sq.substrand}]   (Total: ${sq.totalMarks} Marks)`
        ).slice(0, 88),
        {
          x: 42,
          y,
          size: 9.2,
          font: boldFont,
          color: rgb(0.05, 0.22, 0.42),
        }
      );
      y -= 14;

      for (let li = 0; li < aLines.length; li++) {
        curPage.drawText(aLines[li], {
          x: li === 0 ? 48 : 64,
          y,
          size: 9.1,
          font: regFont,
          color: rgb(0.08, 0.1, 0.14),
        });
        y -= 11.8;
      }
      curPage.drawText(
        exam.isKiswahili ? `(Alama ${sq.partAMarks})` : `(${sq.partAMarks} marks)`,
        {
          x: width - 98,
          y: y + 11.8,
          size: 8.6,
          font: boldFont,
          color: rgb(0.1, 0.12, 0.18),
        }
      );
      drawDottedLines(4);

      for (let li = 0; li < bLines.length; li++) {
        curPage.drawText(bLines[li], {
          x: li === 0 ? 48 : 64,
          y,
          size: 9.1,
          font: regFont,
          color: rgb(0.08, 0.1, 0.14),
        });
        y -= 11.8;
      }
      curPage.drawText(
        exam.isKiswahili ? `(Alama ${sq.partBMarks})` : `(${sq.partBMarks} marks)`,
        {
          x: width - 98,
          y: y + 11.8,
          size: 8.6,
          font: boldFont,
          color: rgb(0.1, 0.12, 0.18),
        }
      );
      drawDottedLines(4);
      y -= 6;
    }

    ensureSpace(32);
    y -= 10;
    const endLine = exam.isKiswahili
      ? 'HUU NDIO UKURASA WA MWISHO ULIOCHAPISHWA WA KARATASI YA MASWALI.'
      : 'THIS IS THE LAST PRINTED PAGE OF THE QUESTION PAPER.';
    curPage.drawText(endLine, {
      x: (width - boldFont.widthOfTextAtSize(endLine, 9.2)) / 2,
      y,
      size: 9.2,
      font: boldFont,
      color: rgb(0.1, 0.12, 0.16),
    });
  } else {
    // ---------------- DEDICATED OFFICIAL MARKING SCHEME BOOKLET (KSH 50) ----------------
    curPage.drawRectangle({
      x: 32,
      y: 34,
      width: width - 64,
      height: height - 68,
      borderColor: rgb(0.08, 0.1, 0.14),
      borderWidth: 1.5,
    });

    curPage.drawRectangle({
      x: width - 126,
      y: height - 66,
      width: 84,
      height: 22,
      borderColor: rgb(0.1, 0.1, 0.1),
      borderWidth: 1,
    });
    curPage.drawText(toPdfSafe(exam.paperCode), {
      x: width - 110,
      y: height - 59,
      size: 10.5,
      font: boldFont,
      color: rgb(0.05, 0.05, 0.05),
    });

    drawJamoAcademicCrestLogo(curPage, width / 2, height - 70, boldFont);

    centerTextOn(
      curPage,
      exam.isKiswahili
        ? 'TATHMINI YA ELIMU YA SHULE YA SEKONDARI MSINGI KENYA (KJSEA)'
        : 'KENYA JUNIOR SCHOOL EDUCATION ASSESSMENT (KJSEA)',
      height - 110,
      10.2,
      boldFont
    );
    centerTextOn(
      curPage,
      'KENYA NATIONAL KJSEA TEST',
      height - 129,
      16.2,
      boldFont,
      [0.03, 0.3, 0.22]
    );
    centerTextOn(
      curPage,
      exam.isKiswahili
        ? 'MWONGOZO RASMI WA KUSAHIHISHA NA UTUZAJI ALAMA'
        : 'OFFICIAL MARKING SCHEME & SCORING GUIDE',
      height - 147,
      12.0,
      boldFont,
      [0.58, 0.09, 0.12]
    );
    centerTextOn(
      curPage,
      `${dispGrade}  -  ${dispSubj}  (ALAMA 100 / 100 MARKS)`,
      height - 164,
      10.8,
      boldFont
    );

    // Examiner Scoring & CBC Rubric Box
    curPage.drawRectangle({
      x: 42,
      y: height - 222,
      width: width - 84,
      height: 50,
      color: rgb(0.95, 0.98, 0.96),
      borderColor: rgb(0.03, 0.36, 0.26),
      borderWidth: 0.9,
    });
    curPage.drawText(
      exam.isKiswahili
        ? 'MAELEKEZO KWA WATAHINI: Sehemu A (Swali 1-10 = Alama 20)  |  Sehemu B (Swali 11-20 = Alama 80)  |  Jumla Kuu = Alama 100'
        : 'EXAMINER SCORING SUMMARY: Section A (Q1-10 = 20 Marks)  |  Section B (Q11-20 = 80 Marks)  |  Grand Total = 100 Marks',
      {
        x: 50,
        y: height - 188,
        size: 8.3,
        font: boldFont,
        color: rgb(0.03, 0.34, 0.24),
      }
    );
    curPage.drawText(
      exam.isKiswahili
        ? 'Viwango vya CBC: KM (80-100%) Kuzidi Matarajio | KUF (50-79%) Kufikia | KUK (30-49%) Kukaribia | CH (0-29%) Chini ya Matarajio'
        : 'CBC Rubric Key: EE (80-100%) Exceeding | ME (50-79%) Meeting | AE (30-49%) Approaching | BE (0-29%) Below Expectation',
      {
        x: 50,
        y: height - 203,
        size: 7.9,
        font: regFont,
        color: rgb(0.15, 0.2, 0.28),
      }
    );
    curPage.drawText(
      exam.isKiswahili
        ? 'Tuza alama kulingana na usahihi wa hoja, hatua za ukokotoaji na mifano mwafaka iliyotolewa na mtahiniwa.'
        : 'Award method and accuracy marks fairly for equivalent valid steps, clear explanations, and accurate Kenyan examples.',
      {
        x: 50,
        y: height - 216,
        size: 7.8,
        font: obliqueFont,
        color: rgb(0.25, 0.3, 0.38),
      }
    );

    y = height - 242;

    curPage.drawText(
      exam.isKiswahili
        ? 'MWONGOZO WA SEHEMU A (MASWALI 1 - 10: ALAMA 2 KILA SWALI = ALAMA 20)'
        : 'SECTION A MARKING KEY (QUESTIONS 1 - 10: 2 MARKS EACH = 20 MARKS)',
      {
        x: 42,
        y,
        size: 9.4,
        font: boldFont,
        color: rgb(0.08, 0.2, 0.42),
      }
    );
    y -= 15;

    for (const mcq of exam.sectionA) {
      const mLines = wrapText(
        exam.isKiswahili
          ? `Swali ${mcq.qNumber} [${mcq.strand}]: ${mcq.answerLetter} (${mcq.answerValue}) [Alama 2] - ${mcq.explanation}`
          : `Q${mcq.qNumber} [${mcq.strand}]: ${mcq.answerLetter} (${mcq.answerValue}) [2 mks] - ${mcq.explanation}`,
        88
      );
      ensureSpace(mLines.length * 11 + 6);
      for (let li = 0; li < mLines.length; li++) {
        curPage.drawText(mLines[li], {
          x: li === 0 ? 44 : 58,
          y,
          size: 8.4,
          font: li === 0 ? boldFont : regFont,
          color: rgb(0.12, 0.16, 0.22),
        });
        y -= 10.6;
      }
      y -= 4;
    }

    ensureSpace(32);
    y -= 6;
    curPage.drawText(
      exam.isKiswahili
        ? 'MWONGOZO WA SEHEMU B (MASWALI 11 - 20: ALAMA 8 KILA SWALI = ALAMA 80)'
        : 'SECTION B MARKING SCHEME (QUESTIONS 11 - 20: 8 MARKS EACH = 80 MARKS)',
      {
        x: 42,
        y,
        size: 9.4,
        font: boldFont,
        color: rgb(0.03, 0.34, 0.24),
      }
    );
    y -= 15;

    for (const sq of exam.sectionB) {
      const pALines = wrapText(
        exam.isKiswahili
          ? `   (a) [Alama 4]: ${sq.partAAnswer}`
          : `   (a) [4 mks]: ${sq.partAAnswer}`,
        88
      );
      const pBLines = wrapText(
        exam.isKiswahili
          ? `   (b) [Alama 4]: ${sq.partBAnswer}`
          : `   (b) [4 mks]: ${sq.partBAnswer}`,
        88
      );
      ensureSpace(14 + pALines.length * 10.6 + pBLines.length * 10.6 + 8);

      curPage.drawText(
        toPdfSafe(
          exam.isKiswahili
            ? `Swali ${sq.qNumber} [${sq.strand} - ${sq.substrand}] (Alama 8):`
            : `Q${sq.qNumber} [${sq.strand} - ${sq.substrand}] (8 Marks):`
        ).slice(0, 88),
        {
          x: 44,
          y,
          size: 8.7,
          font: boldFont,
          color: rgb(0.06, 0.18, 0.38),
        }
      );
      y -= 11;

      for (const ln of pALines) {
        curPage.drawText(ln, {
          x: 48,
          y,
          size: 8.2,
          font: regFont,
          color: rgb(0.14, 0.18, 0.24),
        });
        y -= 10.4;
      }
      for (const ln of pBLines) {
        curPage.drawText(ln, {
          x: 48,
          y,
          size: 8.2,
          font: regFont,
          color: rgb(0.14, 0.18, 0.24),
        });
        y -= 10.4;
      }
      y -= 5;
    }

    ensureSpace(28);
    y -= 8;
    const msEndLine = exam.isKiswahili
      ? 'HUU NDIO UKURASA WA MWISHO WA MWONGOZO WA KUSAHIHISHA.'
      : 'THIS IS THE LAST PRINTED PAGE OF THE MARKING SCHEME.';
    curPage.drawText(msEndLine, {
      x: (width - boldFont.widthOfTextAtSize(msEndLine, 9.0)) / 2,
      y,
      size: 9.0,
      font: boldFont,
      color: rgb(0.1, 0.12, 0.16),
    });
  }

  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    const pg = pages[i];
    if (i > 0) {
      pg.drawRectangle({
        x: 32,
        y: 34,
        width: width - 64,
        height: height - 68,
        borderColor: rgb(0.2, 0.24, 0.3),
        borderWidth: 0.9,
      });
      const hdrText =
        mode === 'MARKING_SCHEME'
          ? exam.isKiswahili
            ? `MWONGOZO WA KUSAHIHISHA  |  ${exam.paperCode} ${dispGrade} ${dispSubj}  |  ALAMA 100`
            : `MARKING SCHEME  |  ${exam.paperCode} ${dispGrade} ${dispSubj}  |  100 MARKS`
          : exam.isKiswahili
          ? `KENYA NATIONAL KJSEA TEST  |  ${exam.paperCode} ${dispGrade} ${dispSubj}  |  MUDA: SAA 2`
          : `KENYA NATIONAL KJSEA TEST  |  ${exam.paperCode} ${dispGrade} ${dispSubj}  |  TIME: 2 HOURS`;
      pg.drawText(toPdfSafe(hdrText).slice(0, 72), {
        x: 40,
        y: height - 48,
        size: 8.4,
        font: boldFont,
        color: rgb(0.12, 0.16, 0.22),
      });
      const pgLbl = exam.isKiswahili
        ? `Ukurasa ${i + 1} kati ya ${totalPages}`
        : `Page ${i + 1} of ${totalPages}`;
      pg.drawText(pgLbl, {
        x: width - 42 - boldFont.widthOfTextAtSize(pgLbl, 8.6),
        y: height - 48,
        size: 8.6,
        font: boldFont,
        color: rgb(0.08, 0.1, 0.14),
      });
    }

    pg.drawText(
      exam.isKiswahili
        ? 'Hakimiliki (c) 2026 KENYA NATIONAL KJSEA TEST  *  https://www.cbcmaterials.shop  *  Simu/WhatsApp: 0705 759 072'
        : 'Copyright (c) 2026 KENYA NATIONAL KJSEA TEST  *  https://www.cbcmaterials.shop  *  Tel/WhatsApp: 0705 759 072',
      {
        x: 40,
        y: 39,
        size: 7.6,
        font: boldFont,
        color: rgb(0.22, 0.28, 0.36),
      }
    );
  }

  return pdfDoc.save();
}

// ============================================================================
// EDITABLE WORD (.DOCX) GENERATOR FOR KENYA NATIONAL KJSEA TEST
// ============================================================================

function docxCell(
  text: string,
  opts: { bold?: boolean; fill?: string; widthPct?: number } = {}
): TableCell {
  const b = { style: BorderStyle.SINGLE, size: 6, color: '1E293B' };
  return new TableCell({
    width: opts.widthPct
      ? { size: opts.widthPct, type: WidthType.PERCENTAGE }
      : undefined,
    borders: { top: b, bottom: b, left: b, right: b },
    shading: opts.fill
      ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill }
      : undefined,
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            size: 20,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

export async function generateJamoKjseaDocxBuffer(params: {
  gradeKey: string;
  subject: string;
  mode?: KjseaDocMode;
}): Promise<Buffer> {
  const mode: KjseaDocMode = params.mode === 'MARKING_SCHEME' ? 'MARKING_SCHEME' : 'PAPER';
  const exam = buildJamoKenyattaKjseaExam(params.gradeKey, params.subject);
  const dispGrade = exam.isKiswahili
    ? exam.kiswahiliGradeLabel
    : exam.gradeLabel.toUpperCase();
  const dispSubj = exam.isKiswahili
    ? exam.subject
        .replace(/Kiswahili Language Activities/i, 'SHUGHULI ZA LUGHA YA KISWAHILI')
        .toUpperCase()
    : exam.subject.toUpperCase();

  const coverRules = exam.isKiswahili
    ? [
        '(a) Andika jina lako, nambari ya tathmini, jina la shule na msimbo wa shule katika nafasi ulizoachiwa hapo juu.',
        '(b) Tia sahihi yako na uandike tarehe ya mtihani katika nafasi zilizoachwa hapo juu.',
        '(c) Karatasi hii ya mtihani ina sehemu MBILI: Sehemu A (Maswali 1 hadi 10 — Alama 20) na Sehemu B (Maswali 11 hadi 20 — Alama 80). Muda: SAA 2.',
        '(d) Jibu MASWALI YOTE ISHIRINI (20) katika nafasi ulizoachiwa. Mada kuu zote za silabasi zimetahiniwa bila urudiaji wowote.',
        '(e) Usiondoe ukurasa wowote kwenye kijitabu hiki cha maswali.',
        '(f) Hakikisha kurasa zote zimechapishwa na hakuna swali lililokosekana (Swali la 1 hadi la 20).',
        '(g) Jibu maswali yote kwa lugha ya Kiswahili Sanifu.',
      ]
    : [
        "(a) Write your name, Assessment Number, School Name, and School Code in the spaces provided above.",
        "(b) Sign and write the date of examination in the spaces provided above.",
        '(c) This question paper consists of TWO sections: Section A (Questions 1 to 10 — 20 Marks) and Section B (Questions 11 to 20 — 80 Marks). TIME: 2 HOURS.',
        '(d) Answer ALL the TWENTY (20) questions in the spaces provided in this booklet. All syllabus strands are examined with zero repetition.',
        '(e) Do NOT tear out or remove any pages from this question booklet.',
        '(f) Non-programmable silent electronic calculators and mathematical tables may be used where applicable.',
        '(g) Candidates should check the question paper to ascertain that all pages are printed and that no questions are missing (Questions 1 to 20).',
        '(h) Candidates must answer all the questions in English.',
      ];

  const children: Array<Paragraph | Table> = [];

  if (mode === 'PAPER') {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? `MSIMBO WA KARATASI: ${exam.paperCode}`
              : `PAPER CODE: ${exam.paperCode}`,
            bold: true,
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: '[ KN * KJSEA ACADEMIC ASSESSMENT SEAL ]',
            bold: true,
            size: 20,
            color: '065F46',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'TATHMINI YA ELIMU YA SHULE YA SEKONDARI MSINGI KENYA (KJSEA)'
              : 'KENYA JUNIOR SCHOOL EDUCATION ASSESSMENT (KJSEA)',
            bold: true,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: 'KENYA NATIONAL KJSEA TEST',
            bold: true,
            size: 36,
            color: '065F46',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? `${dispGrade} — ${dispSubj}   •   MUDA: SAA 2`
              : `${dispGrade} — ${dispSubj}   •   TIME: 2 HOURS`,
            bold: true,
            size: 24,
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: exam.isKiswahili
          ? [
              new TableRow({
                children: [
                  docxCell('Jina la Mtahiniwa: ___________________________________________', {
                    bold: true,
                    widthPct: 60,
                  }),
                  docxCell('Nambari ya Tathmini: _________________', {
                    bold: true,
                    widthPct: 40,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  docxCell('Jina la Shule: ________________________________________________', {
                    bold: true,
                    widthPct: 60,
                  }),
                  docxCell('Msimbo wa Shule: _____________________', {
                    bold: true,
                    widthPct: 40,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  docxCell('Sahihi ya Mtahiniwa: _________________________________________', {
                    bold: true,
                    widthPct: 60,
                  }),
                  docxCell('Tarehe: _______________________________', {
                    bold: true,
                    widthPct: 40,
                  }),
                ],
              }),
            ]
          : [
              new TableRow({
                children: [
                  docxCell("Candidate's Name: ____________________________________________", {
                    bold: true,
                    widthPct: 60,
                  }),
                  docxCell('Assessment No: _______________________', {
                    bold: true,
                    widthPct: 40,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  docxCell('School Name: _________________________________________________', {
                    bold: true,
                    widthPct: 60,
                  }),
                  docxCell('School Code: _________________________', {
                    bold: true,
                    widthPct: 40,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  docxCell("Candidate's Signature: _______________________________________", {
                    bold: true,
                    widthPct: 60,
                  }),
                  docxCell('Date: ________________________________', {
                    bold: true,
                    widthPct: 40,
                  }),
                ],
              }),
            ],
      }),
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'MAAGIZO KWA WATAHINIWA'
              : 'INSTRUCTIONS TO CANDIDATES',
            bold: true,
            underline: {},
            size: 22,
          }),
        ],
      }),
      ...coverRules.map(
        (r) =>
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: r, size: 20 })],
          })
      ),
      new Paragraph({
        spacing: { before: 180, after: 60 },
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'KWA MATUMIZI YA MTAHINI PEKEE'
              : "FOR OFFICIAL EXAMINER'S USE ONLY",
            bold: true,
            size: 21,
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: exam.isKiswahili
              ? [
                  docxCell('Sehemu', { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                  docxCell('Maswali', { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                  docxCell('Upeo wa Alama', { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                  docxCell('Alama za Mtahiniwa', { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                  docxCell('Kiwango cha Utendaji', { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                ]
              : [
                  docxCell('Section', { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                  docxCell('Questions', { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                  docxCell('Maximum Score', { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                  docxCell("Candidate's Score", { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                  docxCell('Performance Level', { bold: true, fill: 'E2E8F0', widthPct: 20 }),
                ],
          }),
          new TableRow({
            children: [
              docxCell(exam.isKiswahili ? 'SEHEMU A' : 'SECTION A', { bold: true }),
              docxCell('1 – 10'),
              docxCell('20'),
              docxCell(''),
              docxCell(''),
            ],
          }),
          new TableRow({
            children: [
              docxCell(exam.isKiswahili ? 'SEHEMU B' : 'SECTION B', { bold: true }),
              docxCell('11 – 20'),
              docxCell('80'),
              docxCell(''),
              docxCell(''),
            ],
          }),
          new TableRow({
            children: [
              docxCell(exam.isKiswahili ? 'JUMLA KUU' : 'TOTAL SCORE', {
                bold: true,
                fill: 'F8FAFC',
              }),
              docxCell('1 – 20', { bold: true, fill: 'F8FAFC' }),
              docxCell('100', { bold: true, fill: 'F8FAFC' }),
              docxCell('', { fill: 'F8FAFC' }),
              docxCell(exam.isKiswahili ? 'KM / KUF / KUK / CH' : 'EE / ME / AE / BE', {
                bold: true,
                fill: 'F8FAFC',
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'SEHEMU A: MASWALI YA KUCHAGUA JIBU SAHIHI (MASWALI 1 – 10) [ALAMA 20]'
              : 'SECTION A: MULTIPLE CHOICE QUESTIONS (QUESTIONS 1 – 10) [20 MARKS]',
            bold: true,
          }),
        ],
      })
    );

    for (const mcq of exam.sectionA) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: exam.isKiswahili
                ? `${mcq.qNumber}. [${mcq.strand}] ${mcq.prompt} (Alama 2)`
                : `${mcq.qNumber}. [${mcq.strand}] ${mcq.prompt} (2 Marks)`,
              bold: true,
              size: 21,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `   A. ${mcq.options[0]}\n   B. ${mcq.options[1]}\n   C. ${mcq.options[2]}\n   D. ${mcq.options[3]}`,
              size: 20,
            }),
          ],
        })
      );
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 80 },
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'SEHEMU B: MASWALI YA MUUNDO NA MAELEZO (MASWALI 11 – 20) [ALAMA 80]'
              : 'SECTION B: STRUCTURED & APPLIED QUESTIONS (QUESTIONS 11 – 20) [80 MARKS]',
            bold: true,
          }),
        ],
      })
    );

    for (const sq of exam.sectionB) {
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 40 },
          children: [
            new TextRun({
              text: exam.isKiswahili
                ? `${sq.qNumber}. [${sq.strand} — ${sq.substrand}] (Alama 8)`
                : `${sq.qNumber}. [${sq.strand} — ${sq.substrand}] (8 Marks)`,
              bold: true,
              size: 21,
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: `(a) ${sq.partAPrompt} `, size: 20 }),
            new TextRun({
              text: exam.isKiswahili ? '(Alama 4)' : '(4 marks)',
              bold: true,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '..................................................................................................................................................\n..................................................................................................................................................',
              color: '64748B',
              size: 19,
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({ text: `(b) ${sq.partBPrompt} `, size: 20 }),
            new TextRun({
              text: exam.isKiswahili ? '(Alama 4)' : '(4 marks)',
              bold: true,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '..................................................................................................................................................\n..................................................................................................................................................',
              color: '64748B',
              size: 19,
            }),
          ],
        })
      );
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 180 },
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'HUU NDIO UKURASA WA MWISHO ULIOCHAPISHWA WA KARATASI YA MASWALI.'
              : 'THIS IS THE LAST PRINTED PAGE OF THE QUESTION PAPER.',
            bold: true,
            size: 20,
          }),
        ],
      })
    );
  } else {
    // Dedicated Official Marking Scheme DOCX
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? `MSIMBO WA KARATASI: ${exam.paperCode}`
              : `PAPER CODE: ${exam.paperCode}`,
            bold: true,
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: '[ KN * KJSEA ACADEMIC ASSESSMENT SEAL ]',
            bold: true,
            size: 20,
            color: '065F46',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'KENYA NATIONAL KJSEA TEST — MWONGOZO RASMI WA KUSAHIHISHA'
              : 'KENYA NATIONAL KJSEA TEST — OFFICIAL MARKING SCHEME',
            bold: true,
            size: 32,
            color: '065F46',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? `${dispGrade} — ${dispSubj}   •   JUMLA YA ALAMA: 100`
              : `${dispGrade} — ${dispSubj}   •   TOTAL SCORE: 100 MARKS`,
            bold: true,
            size: 24,
            color: '991B1B',
          }),
        ],
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'MWONGOZO WA SEHEMU A (MASWALI 1 – 10 • ALAMA 20)'
              : 'SECTION A MARKING KEY (QUESTIONS 1 – 10 • 20 MARKS)',
            bold: true,
          }),
        ],
      })
    );

    for (const mcq of exam.sectionA) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({
              text: exam.isKiswahili
                ? `Swali ${mcq.qNumber} [${mcq.strand}]: ${mcq.answerLetter} (${mcq.answerValue}) [Alama 2] — `
                : `Q${mcq.qNumber} [${mcq.strand}]: ${mcq.answerLetter} (${mcq.answerValue}) [2 mks] — `,
              bold: true,
              size: 20,
            }),
            new TextRun({ text: mcq.explanation, size: 20 }),
          ],
        })
      );
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'MWONGOZO WA SEHEMU B (MASWALI 11 – 20 • ALAMA 80)'
              : 'SECTION B MARKING SCHEME (QUESTIONS 11 – 20 • 80 MARKS)',
            bold: true,
          }),
        ],
      })
    );

    for (const sq of exam.sectionB) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: exam.isKiswahili
                ? `Swali ${sq.qNumber} [${sq.strand} — ${sq.substrand}] (Alama 8):`
                : `Q${sq.qNumber} [${sq.strand} — ${sq.substrand}] (8 Marks):`,
              bold: true,
              size: 21,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({
              text: exam.isKiswahili ? '   (a) [Alama 4]: ' : '   (a) [4 mks]: ',
              bold: true,
              size: 20,
            }),
            new TextRun({ text: sq.partAAnswer, size: 20 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: exam.isKiswahili ? '   (b) [Alama 4]: ' : '   (b) [4 mks]: ',
              bold: true,
              size: 20,
            }),
            new TextRun({ text: sq.partBAnswer, size: 20 }),
          ],
        })
      );
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 180 },
        children: [
          new TextRun({
            text: exam.isKiswahili
              ? 'HUU NDIO UKURASA WA MWISHO WA MWONGOZO WA KUSAHIHISHA.'
              : 'THIS IS THE LAST PRINTED PAGE OF THE MARKING SCHEME.',
            bold: true,
            size: 20,
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 220 },
      children: [
        new TextRun({
          text: exam.isKiswahili
            ? 'Hakimiliki © 2026 KENYA NATIONAL KJSEA TEST • https://www.cbcmaterials.shop • Simu/WhatsApp: 0705 759 072 • M-Pesa: 0728 595 160'
            : 'Copyright © 2026 KENYA NATIONAL KJSEA TEST • https://www.cbcmaterials.shop • Tel/WhatsApp: 0705 759 072 • M-Pesa: 0728 595 160',
          bold: true,
          size: 18,
          color: '065F46',
        }),
      ],
    })
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
