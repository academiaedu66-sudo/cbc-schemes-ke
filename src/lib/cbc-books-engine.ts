import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from 'docx';
import {
  buildDomainLessonNotes,
  getAllApprovedCoursebooksForGradeSubject,
  getApprovedCoursebook,
  getSyllabusForGrade,
  GRADES_CURRICULUM_PLAN,
  KICD_OFFICIAL_APPROVED_PORTAL_URL,
  PREPRIMARY_CURRICULUM_PLAN,
} from '../../scripts/cbc-syllabus-data.mjs';
import { ALL_GAMING_SUBJECTS, resolveSyllabusSubject } from '@/lib/gaming';
import {
  DOMAIN_EXERCISE_BANKS,
  generateDeepSubjectExercise,
  generateExtraTextbookExercise,
  generateWorkedDomainExercise,
  generateWorkedMathematicsExercise,
  type ExerciseItem,
  type StrandContext,
} from '@/lib/gaming-exercises';

export type CbcBookType = 'GRADE_UP' | 'MADE_FAMILIAR' | 'COMPLETE_BUNDLE';

export const BOOK_PRICES_KES: Record<CbcBookType, number> = {
  GRADE_UP: 500,
  MADE_FAMILIAR: 750,
  COMPLETE_BUNDLE: 1500,
};

export const BOOK_SERIES_TITLES: Record<CbcBookType, string> = {
  GRADE_UP: 'CBC GRADE UP',
  MADE_FAMILIAR: 'SUPER-LIGHT CBC COMPILATION',
  COMPLETE_BUNDLE: 'SMART CBC ALL SUBJECTS',
};

interface SyllabusBlock {
  strand: string;
  subs: string[];
  kiq: string;
  resources: string;
}

export interface EnrichedSubTopic {
  term: number;
  strandIndex: number;
  strand: string;
  substrand: string;
  subtopicTitle: string;
  kiq: string;
  resources: string;
}

export interface ApprovedBookRef {
  series: string;
  publisher: string;
  authors: string;
  note?: string;
}

export interface StructuredSubstrandNotes {
  substrandIndex: number;
  substrandCode: string;
  substrandTitle: string;
  term: number;
  kiq: string;
  resources: string;
  points: string[];
}

export interface StructuredStrandNotes {
  strandIndex: number;
  strandTitle: string;
  term: number;
  kiq: string;
  resources: string;
  totalPoints: number;
  substrands: StructuredSubstrandNotes[];
}

export interface StructuredSyllabusNotesResult {
  gradeKey: string;
  gradeLabel: string;
  subject: string;
  coursebookTitle: string;
  approvedBooks: ApprovedBookRef[];
  officialPortalUrl: string;
  totalStrands: number;
  totalSubstrands: number;
  totalPoints: number;
  minPointsPerSubstrand: number;
  minPointsPerStrand: number;
  strands: StructuredStrandNotes[];
}

function cleanScope(text: string): string {
  return String(text || '')
    .replace(/\s*\([^)]*Scope\)/gi, '')
    .trim();
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

function wrapPdfText(text: string, maxChars = 88): string[] {
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

function splitSubAspects(sub: string): string[] {
  const cleaned = cleanScope(sub);
  const colonIdx = cleaned.indexOf(':');
  let prefix = '';
  let rest = cleaned;
  if (colonIdx > 0 && colonIdx < cleaned.length - 3) {
    prefix = cleaned.slice(0, colonIdx).trim();
    rest = cleaned.slice(colonIdx + 1).trim();
  }
  // Remove parenthetical lists temporarily before splitting top-level commas so we don't split inside parens
  const parenTokens: string[] = [];
  const masked = rest.replace(/\([^)]*\)/g, (m) => {
    parenTokens.push(m);
    return `__PAREN_${parenTokens.length - 1}__`;
  });

  const rawParts = masked
    .split(/[,;&]|\band\b|\bna\b/i)
    .map((p) =>
      p
        .replace(/__PAREN_(\d+)__/g, (_all, idx) => parenTokens[Number(idx)] || '')
        .trim()
    )
    .filter((p) => p.length > 3);

  if (rawParts.length <= 1) return [cleaned];
  return rawParts.map((part) =>
    prefix && !part.toLowerCase().includes(prefix.toLowerCase())
      ? `${prefix}: ${part}`
      : part
  );
}

/**
 * Extracts fine-grained constituent concepts from a Sub-strand title (both top-level parts
 * and parenthetical examples/parameters) so each sub-element receives explicit coverage in Short Notes.
 */
function extractSubstrandConcepts(substrandTitle: string): string[] {
  const cleaned = cleanScope(substrandTitle);
  const concepts: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (raw: string) => {
    const t = raw.replace(/^[:\-–—,\s]+|[:\-–—,\s]+$/g, '').trim();
    if (t.length < 3) return;
    const k = t.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      concepts.push(t);
    }
  };

  for (const topPart of splitSubAspects(cleaned)) {
    const withoutParen = topPart.replace(/\([^)]*\)/g, '').trim();
    pushUnique(withoutParen || topPart);
  }

  const parenMatches = cleaned.match(/\(([^)]+)\)/g) || [];
  for (const pm of parenMatches) {
    const inner = pm.slice(1, -1);
    for (const item of inner.split(/[,/&;]|\bvs\b|\band\b|\bna\b/i)) {
      pushUnique(item);
    }
  }

  if (concepts.length === 0) pushUnique(cleaned);
  return concepts;
}

export function formatBookGradeLabel(gradeKey: string): string {
  const up = gradeKey.toUpperCase().trim();
  if (up === 'PP1' || up === 'PP2') return up;
  return `Grade ${up}`;
}

export function getSubjectsForGradeKey(gradeKey: string): string[] {
  const up = gradeKey.toUpperCase().trim();
  if (up === 'PP1' || up === 'PP2') {
    const found = PREPRIMARY_CURRICULUM_PLAN.find((p) => p.gradeCode === up);
    if (found) return [...found.subjects];
  } else {
    const gNum = Number(up);
    const found = GRADES_CURRICULUM_PLAN.find((p) => p.grade === gNum);
    if (found) return [...found.subjects];
  }
  return [...ALL_GAMING_SUBJECTS];
}

function resolveDomainKey(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes('math')) return 'mathematics';
  if (s.includes('fasihi')) return 'fasihi_kiswahili';
  if (s.includes('kiswahili')) return 'kiswahili';
  if (s.includes('literature in english')) return 'literature_english';
  if (s === 'french') return 'french';
  if (s === 'arabic') return 'arabic';
  if (s === 'german') return 'german';
  if (s.includes('english') || s.includes('language')) return 'english';
  if (s.includes('biology')) return 'biology';
  if (s.includes('chemistry')) return 'chemistry';
  if (
    s.includes('electricity') ||
    s.includes('aviation') ||
    s.includes('building') ||
    s.includes('metal') ||
    s.includes('power mechanics') ||
    s.includes('woodwork') ||
    s.includes('media technology')
  ) {
    return 'technical_engineering';
  }
  if (s.includes('physics')) return 'physics';
  if (s.includes('home science') || s.includes('homescience')) return 'homescience';
  if (s.includes('marine') || s.includes('fisheries')) return 'agriculture';
  if (s.includes('science')) return 'science';
  if (s.includes('environmental')) return 'environmental';
  if (s.includes('agriculture')) return 'agriculture';
  if (s.includes('business')) return 'business';
  if (
    s.includes('pre-technical') ||
    s.includes('computer') ||
    s.includes('information communication') ||
    s === 'ict'
  ) {
    return 'pretech_computer';
  }
  if (
    s.includes('creative') ||
    s.includes('music') ||
    s.includes('theatre') ||
    s.includes('fine arts') ||
    s.includes('sports') ||
    s.includes('physical education')
  ) {
    return 'creative_sports';
  }
  if (s.includes('christian') || s.includes('cre')) return 'cre';
  if (s.includes('islamic') || s.includes('ire')) return 'ire';
  return 'social_history_geography';
}

export function collectOrderedSubTopics(
  gradeKey: string,
  subject: string
): {
  strands: Array<{
    strand: string;
    subs: string[];
    kiq: string;
    resources: string;
    term: number;
  }>;
  subTopics: EnrichedSubTopic[];
  coursebookTitle: string;
  approvedBooks: ApprovedBookRef[];
  officialPortalUrl: string;
} {
  const sylSubject = resolveSyllabusSubject(subject, gradeKey);
  const gradeArg = gradeKey.toUpperCase().startsWith('PP')
    ? gradeKey.toUpperCase()
    : Number(gradeKey) || 7;
  const syl = getSyllabusForGrade(gradeArg, sylSubject);
  const cb = getApprovedCoursebook(gradeArg, sylSubject);
  const rawApproved = (getAllApprovedCoursebooksForGradeSubject(
    gradeArg,
    sylSubject
  ) || []) as ApprovedBookRef[];

  const strandsMap: Array<{
    strand: string;
    subs: string[];
    kiq: string;
    resources: string;
    term: number;
  }> = [];
  const subTopics: EnrichedSubTopic[] = [];

  for (const term of [1, 2, 3]) {
    const blocks = (syl.strandsByTerm[term] || []) as SyllabusBlock[];
    for (const b of blocks) {
      if (!b || !b.strand || !Array.isArray(b.subs)) continue;
      const strandName = b.strand.trim();
      let grp = strandsMap.find((g) => g.strand === strandName);
      if (!grp) {
        grp = {
          strand: strandName,
          subs: [],
          kiq: b.kiq || '',
          resources: b.resources || 'Approved Learner Book, charts & practical realia',
          term,
        };
        strandsMap.push(grp);
      }
      const sIdx = strandsMap.indexOf(grp);

      for (const rawSub of b.subs) {
        const cleanSub = cleanScope(rawSub);
        if (!grp.subs.includes(cleanSub)) {
          grp.subs.push(cleanSub);
        }
        const aspects = splitSubAspects(cleanSub);
        for (const asp of aspects) {
          subTopics.push({
            term,
            strandIndex: sIdx,
            strand: strandName,
            substrand: cleanSub,
            subtopicTitle: asp,
            kiq: b.kiq || '',
            resources: b.resources || 'Approved Learner Book, charts & practical realia',
          });
        }
      }
    }
  }

  return {
    strands: strandsMap,
    subTopics,
    coursebookTitle: cb.lbTitle,
    approvedBooks: rawApproved,
    officialPortalUrl: KICD_OFFICIAL_APPROVED_PORTAL_URL,
  };
}

function normalizeNoteKey(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/^\d+\.\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts an ExerciseItem into a purely declarative, textbook-style revision statement
 * (using a separate seed space `>= 50000` so worked numerical examples never collide with Questions!).
 */
function formatDomainItemAsDeclarativeNote(
  item: ExerciseItem,
  substrandTitle: string,
  isKiswahili: boolean,
  isMathOrWorked: boolean
): string {
  const corr = String(item.options[item.ans] || '').trim();
  const cleanExp = String(item.exp || '').replace(/\s+/g, ' ').trim();
  const cleanStem = String(item.q || '')
    .replace(/\?+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (isKiswahili) {
    return `Mfano na Kanuni (${substrandTitle}): Katika uchambuzi wa "${cleanStem}", jibu na muundo sahihi ni "${corr}" — ${cleanExp}`;
  }
  if (isMathOrWorked) {
    return `Worked Illustration (${substrandTitle}): Given "${cleanStem}", the verified result is ${corr} (${cleanExp})`;
  }
  return `Key Subject Fact & Rule: ${cleanExp} [Key Term / Verified Benchmark: ${corr}].`;
}

/**
 * Builds the complete, authoritative Short Point-Form Notes Tree for ANY `(gradeKey, subject)`:
 * - Covers 100% of ALL Strands (Term 1 -> Term 2 -> Term 3, First Strand to Last Strand)
 * - Covers 100% of ALL Sub-strands in every Strand
 * - STRICT GUARANTEE: Every Sub-strand has `> 10` points (`12` to `16` distinct numbered points!)
 * - STRICT GUARANTEE: Every Strand has `>= 30` points (`32` to `132+` distinct points!)
 * - Supports `variantOffset` (`0` for SUPER-LIGHT CBC COMPILATION, `1` for CBC GRADE UP inside Master Compilation)
 *   so worked examples & supplementary points never duplicate!
 */
export function buildStructuredSyllabusNotesTree(
  gradeKey: string,
  subject: string,
  variantOffset = 0
): StructuredSyllabusNotesResult {
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const sylSubject = resolveSyllabusSubject(subject, gradeKey);
  const gradeArg = gradeKey.toUpperCase().startsWith('PP')
    ? gradeKey.toUpperCase()
    : Number(gradeKey) || 7;
  const cb = getApprovedCoursebook(gradeArg, sylSubject);
  const { strands, coursebookTitle, approvedBooks, officialPortalUrl } =
    collectOrderedSubTopics(gradeKey, subject);

  const domain = resolveDomainKey(subject);
  const isKis = domain === 'kiswahili' || domain === 'fasihi_kiswahili';
  const bank = DOMAIN_EXERCISE_BANKS[domain] || [];
  const approvedCite =
    approvedBooks.length > 0
      ? approvedBooks
          .slice(0, 2)
          .map((b) => `${b.series} (${b.publisher})`)
          .join('; ')
      : coursebookTitle;

  const usedNotesSet = new Set<string>();
  const usedBankIndices = new Set<number>();

  // If variantOffset > 0 (e.g. Part 2 inside SMART CBC ALL SUBJECTS), seed exclusions from variant 0
  // so 0% of Short Note points ever repeat across Part 1 and Part 2!
  if (variantOffset > 0) {
    const prior = buildStructuredSyllabusNotesTree(gradeKey, subject, 0);
    for (const pSt of prior.strands) {
      for (const pSub of pSt.substrands) {
        for (const pPt of pSub.points) {
          usedNotesSet.add(normalizeNoteKey(pPt));
        }
      }
    }
  }

  let globalSubCounter = 0;

  const structuredStrands: StructuredStrandNotes[] = [];
  let grandTotalPoints = 0;
  let grandTotalSubstrands = 0;
  let minPointsPerSubstrand = 999;
  let minPointsPerStrand = 999;

  for (let sIdx = 0; sIdx < strands.length; sIdx++) {
    const st = strands[sIdx];
    let effectiveSubs = [...st.subs];

    // If a strand ever has only 1 sub-strand, expand its constituent sub-aspects so sub-strands >= 2
    if (effectiveSubs.length < 2) {
      const split = splitSubAspects(effectiveSubs[0] || st.strand);
      if (split.length >= 2) {
        effectiveSubs = split;
      } else {
        const base = effectiveSubs[0] || st.strand;
        effectiveSubs = isKis
          ? [
              `${base}: Dhana na Kanuni za Msingi`,
              `${base}: Matumizi na Uchambuzi wa Kiutendaji`,
              `${base}: Mifano Halisi na Umilisi`,
            ]
          : [
              `${base}: Core Definitions & Principles`,
              `${base}: Practical Procedures & Methods`,
              `${base}: Real-World Application & Mastery`,
            ];
      }
    }

    // Mathematical guarantee:
    // - Every Sub-strand gets >= 12 points (strictly > 10!)
    // - Every Strand gets >= 32 points (strictly >= 30! e.g. 2 subs -> 16 pts each = 32; 3 subs -> 12 pts each = 36)
    const pointsTarget = Math.max(12, Math.ceil(32 / effectiveSubs.length));
    const builtSubstrands: StructuredSubstrandNotes[] = [];
    let strandPointsTotal = 0;

    for (let subIdx = 0; subIdx < effectiveSubs.length; subIdx++) {
      globalSubCounter++;
      const subTitle = effectiveSubs[subIdx];
      const subCode = `${sIdx + 1}.${subIdx + 1}`;
      const concepts = extractSubstrandConcepts(subTitle);
      const hay = `${st.strand} ${subTitle} ${concepts.join(' ')}`.toLowerCase();

      const ctx: StrandContext = {
        gradeKey,
        gradeLabel,
        subject,
        strand: st.strand,
        substrand: subTitle,
      };

      const domainLesson = buildDomainLessonNotes({
        grade: gradeArg,
        subject: sylSubject,
        strand: st.strand,
        baseSubstrand: subTitle,
        aspect: concepts[0] || subTitle,
        phaseTag: variantOffset === 0 ? 'Comprehensive Revision' : 'Exam & Mastery Synthesis',
        kiq: st.kiq,
        resources: st.resources,
        lbCitation: cb.lbShort,
        tgCitation: cb.tgShort,
        isKiswahili: isKis,
      });

      const rawPoints: string[] = [];
      const pushUniquePoint = (candidate: string): boolean => {
        const cleaned = String(candidate || '')
          .replace(/^\s*[-*•]\s*/, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (!cleaned || cleaned.length < 18) return false;
        const norm = normalizeNoteKey(cleaned);
        if (usedNotesSet.has(norm)) return false;
        usedNotesSet.add(norm);
        rawPoints.push(cleaned);
        return true;
      };

      // 1. Core Sub-strand Scope & Syllabus Alignment Point
      if (isKis) {
        pushUniquePoint(
          variantOffset === 0
            ? `Upeo na Maana ya Mada Ndogo (${subCode}): "${subTitle}" chini ya mada kuu "${st.strand}" inamjengea mwanafunzi wa ${gradeLabel} umilisi wa kudumu kulingana na vitabu teule (${approvedCite}).`
            : `Muhtasari wa Umilisi (${subCode}): Katika mada ya "${st.strand}", kipengele cha "${subTitle}" kinahusu kanuni, ufasaha na matumizi sahihi katika tathmini za ${gradeLabel} (${approvedCite}).`
        );
      } else {
        pushUniquePoint(
          variantOffset === 0
            ? `Core Scope & Definition (${subCode}): "${subTitle}" under Strand "${st.strand}" builds essential ${gradeLabel} ${subject} competencies synthesized from official approved coursebooks (${approvedCite}).`
            : `Revision Focus & Mastery Scope (${subCode}): Within "${st.strand}", the sub-strand "${subTitle}" establishes key definitions, analytical methods, and assessment standards for ${gradeLabel} ${subject} (${approvedCite}).`
        );
      }

      // 2. Domain Lesson Core Concept Bullets (3 discipline-tailored points)
      for (const cNote of domainLesson.coreConceptNotes) {
        pushUniquePoint(cNote);
      }

      // 3. Explicit Point-by-Point Breakdown of Every Constituent Concept in this Sub-strand
      const conceptRolesEn = [
        (c: string) =>
          `Key Sub-Component — ${c}: Learners must define "${c}" accurately, identify its distinguishing features within "${subTitle}", and explain how it operates in ${subject}.`,
        (c: string) =>
          `Functional Mechanism of ${c}: Understand the step-by-step rule, structural role, or governing relationship linking "${c}" to the broader principles of "${st.strand}".`,
        (c: string) =>
          `Classification & Comparison in ${c}: Distinguish "${c}" from closely related concepts in "${subTitle}" using clear observable criteria and textbook examples.`,
        (c: string) =>
          `Applied Analysis of ${c}: Evaluate real-life situations and structured tasks involving "${c}" by applying verified ${gradeLabel} ${subject} principles.`,
        (c: string) =>
          `Operational Precision in ${c}: Record terminology, symbols, units, or structural conventions of "${c}" accurately during classwork and assessments.`,
      ];
      const conceptRolesKis = [
        (c: string) =>
          `Kipengele Mahsusi — ${c}: Mwanafunzi afafanue maana, sifa bainifu na muundo wa "${c}" kama unavyojitokeza katika mada ndogo ya "${subTitle}".`,
        (c: string) =>
          `Kanuni na Matumizi ya ${c}: Zingatia upatanisho wa kisarufi, mtiririko wa hoja na mifano sanifu unaposhughulikia "${c}" chini ya "${st.strand}".`,
        (c: string) =>
          `Ulinganuzi wa ${c}: Tofautisha "${c}" na vipengele vingine vinavyokaribiana katika "${subTitle}" kwa kutumia mifano halisi ya Kiswahili sanifu.`,
        (c: string) =>
          `Uchambuzi wa Kiutendaji wa ${c}: Tumia stadi za "${c}" kujibu maswali ya muktadha, kusoma na kuandika kwa ufasaha katika ${gradeLabel}.`,
      ];

      for (let cIdx = 0; cIdx < Math.min(concepts.length, 5); cIdx++) {
        const cName = concepts[cIdx];
        const roleIdx = (cIdx + variantOffset) % (isKis ? conceptRolesKis.length : conceptRolesEn.length);
        const txt = isKis ? conceptRolesKis[roleIdx](cName) : conceptRolesEn[roleIdx](cName);
        pushUniquePoint(txt);
      }

      // 4. Harvest Strand-Matched Domain Facts, Formulas & Worked Examples (4 to 7 points)
      const seedBase = 50_000 + variantOffset * 25_000 + globalSubCounter * 313;
      let domainFactsAdded = 0;
      const desiredDomainFacts = Math.max(4, pointsTarget - 8);

      if (domain === 'mathematics') {
        for (let att = 0; att < 120 && domainFactsAdded < desiredDomainFacts; att++) {
          const w = generateWorkedMathematicsExercise(ctx, seedBase + att * 29);
          if (pushUniquePoint(formatDomainItemAsDeclarativeNote(w, subTitle, false, true))) {
            domainFactsAdded++;
          }
        }
      } else {
        // 4a. Strand-keyword matched static domain bank facts (skipping any used indices)
        for (let bIdx = 0; bIdx < bank.length && domainFactsAdded < 2; bIdx++) {
          const probeIdx = (bIdx + variantOffset * 17 + globalSubCounter * 3) % bank.length;
          if (usedBankIndices.has(probeIdx)) continue;
          const item = bank[probeIdx];
          if (item.tags.some((t) => hay.includes(t.toLowerCase()))) {
            if (pushUniquePoint(formatDomainItemAsDeclarativeNote(item, subTitle, isKis, false))) {
              usedBankIndices.add(probeIdx);
              domainFactsAdded++;
            }
          }
        }

        // 4b. Quantitative / Parametric Worked Domain Illustrations
        for (let att = 0; att < 80 && domainFactsAdded < desiredDomainFacts; att++) {
          const w = generateWorkedDomainExercise(domain, ctx, seedBase + att * 19);
          if (
            w &&
            pushUniquePoint(formatDomainItemAsDeclarativeNote(w, subTitle, isKis, true))
          ) {
            domainFactsAdded++;
          }
        }

        // 4c. Extra Textbook & Deep Subject Knowledge Facts scoped to this Sub-strand
        for (let att = 0; att < 90 && domainFactsAdded < desiredDomainFacts; att++) {
          const ex = generateExtraTextbookExercise(domain, ctx, globalSubCounter * 7 + variantOffset * 31 + att);
          if (
            ex &&
            pushUniquePoint(formatDomainItemAsDeclarativeNote(ex, subTitle, isKis, false))
          ) {
            domainFactsAdded++;
          }
        }
        for (let att = 0; att < 90 && domainFactsAdded < desiredDomainFacts; att++) {
          const dp = generateDeepSubjectExercise(domain, ctx, globalSubCounter * 11 + variantOffset * 37 + att);
          if (
            dp &&
            pushUniquePoint(formatDomainItemAsDeclarativeNote(dp, subTitle, isKis, false))
          ) {
            domainFactsAdded++;
          }
        }
      }

      // 5. Practical Apparatus, Learning Aids & Step-by-Step Procedure Points
      if (isKis) {
        if (variantOffset === 0) {
          pushUniquePoint(
            `Nyenzo na Vifaa vya Kujifunzia (${subCode}): Katika "${subTitle}", tumia ${st.resources.toLowerCase()} kwa mpangilio ili kuonyesha mifano hai na kuimarisha kumbukumbu.`
          );
          pushUniquePoint(
            `Hatua za Kazi Mradi na Mazoezi (${subCode}): ${domainLesson.workedIllustration}`
          );
          pushUniquePoint(
            `Mbinu ya Ushirikiano na Mazoezi ya Mwanafunzi (${subCode}): ${domainLesson.learnerPracticeTask}`
          );
          pushUniquePoint(
            `Matumizi Halisi na Jibu la Swali Dadisi (${subCode}): Kuhusu "${st.kiq || `umuhimu wa ${subTitle}`}", mada hii inakuza mawasiliano bora, maadili ya kijamii na utatuzi wa changamoto nchini Kenya.`
          );
          pushUniquePoint(
            `Tahadhari za Kiutahini katika "${subTitle}": Epuka makosa ya hijai, uakifishaji usio sahihi na kuchanganya ngeli au istilahi unapojibu maswali ya ${gradeLabel}.`
          );
          pushUniquePoint(
            `Kigezo cha Umilisi wa Juu (Exceeding Expectations 80-100%): Mwanafunzi aweze kufafanua kanuni za "${subTitle}", kutunga mifano sanifu na kuhakiki usahihi wa kazi yake.`
          );
        } else {
          pushUniquePoint(
            `Mkakati wa Marudio ya Mtihani (${subCode}): Unapojitayarisha kwa tathmini ya "${subTitle}", linganisha mifano ubaoni na mazoezi ya ${cb.lbShort} ukitumia ${st.resources.toLowerCase()}.`
          );
          pushUniquePoint(
            `Uwasilishaji wa Majibu Yenye Alama Kamili (${subCode}): Jibu maswali ya "${subTitle}" kwa sentensi kamili zenye mtiririko wa mantiki, hijai sahihi na mifano mahsusi.`
          );
          pushUniquePoint(
            `Uchambuzi wa Swali Dadisi (${subCode}): Fafanua kwa mifano miwili ya mazingira ya Kenya jinsi "${subTitle}" inavyojibu: "${st.kiq || `Namna ya kutumia ${subTitle} maishani`}".`
          );
          pushUniquePoint(
            `Uhusiano wa Mada na Taaluma (${subCode}): Stadi zinazokuzwa katika "${subTitle}" zinajenga msingi wa uandishi, uhariri, ualimu, utangazaji na uongozi bora.`
          );
          pushUniquePoint(
            `Ukaguzi wa Makosa ya Kawaida (${subCode}): Hakiki upatanisho wa kisarufi na maana ya msamiati katika "${subTitle}" kabla ya kukamilisha kazi.`
          );
          pushUniquePoint(
            ` Tathmini Binafsi ya Mwanafunzi (${subCode}): ${domainLesson.checkQuestion}`
          );
        }
      } else {
        if (variantOffset === 0) {
          pushUniquePoint(
            `Learning Resources & Practical Setup (${subCode}): Effectively utilize ${st.resources.toLowerCase()} when investigating or demonstrating "${subTitle}" to connect theory to tangible evidence.`
          );
          pushUniquePoint(
            `Step-by-Step Practical / Worked Procedure (${subCode}): ${domainLesson.workedIllustration}`
          );
          pushUniquePoint(
            `Guided Skill Practice & Recording (${subCode}): ${domainLesson.learnerPracticeTask}`
          );
          pushUniquePoint(
            `Safety, Hygiene & Accuracy Standard (${subCode}): Observe strict measurement accuracy, clean formatting, correct SI/domain conventions, and safe handling of ${st.resources.toLowerCase()} during "${subTitle}".`
          );
          pushUniquePoint(
            `Real-Life Kenyan Application & Key Inquiry (${subCode}): Addressing "${st.kiq || `How is ${subTitle} applied in daily life?`}" — competencies in "${subTitle}" directly support household problem-solving, community welfare, and career readiness in Kenya.`
          );
          pushUniquePoint(
            `Common Assessment Pitfalls & Exam Tip (${subCode}): Avoid incomplete definitions, missing working steps, or misinterpreting key terms in "${subTitle}"; always verify answers against the rubric criteria for "${st.strand}".`
          );
        } else {
          pushUniquePoint(
            `Exam-Focus Method & Structure (${subCode}): When answering structured questions on "${subTitle}", state the governing rule/definition first, show sequential working, and cite concrete examples.`
          );
          pushUniquePoint(
            `Apparatus Interpretation & Diagram Precision (${subCode}): In practical or diagram-based tasks on "${subTitle}" involving ${st.resources.toLowerCase()}, label features clearly and record accurate observations.`
          );
          pushUniquePoint(
            `Inquiry Synthesis & Problem-Solving (${subCode}): Apply "${subTitle}" to resolve real-world Kenyan scenarios linked to "${st.kiq || `practical mastery of ${subTitle}`}".`
          );
          pushUniquePoint(
            `Career & Enterprise Pathway Link (${subCode}): Practical proficiency in "${subTitle}" (${subject}) prepares ${gradeLabel} learners for technical, scientific, creative, and entrepreneurial pathways.`
          );
          pushUniquePoint(
            `Quality Assurance & Error Verification (${subCode}): Double-check units, terminology, spelling, and logical consistency across every step of "${subTitle}" before submitting work.`
          );
          pushUniquePoint(
            `Formative Exit Check (${subCode}): ${domainLesson.checkQuestion}`
          );
        }
      }

      // 6. Ensure we strictly reach `pointsTarget` (>= 12, or >= 16 for 2-substrand strands) with 100% unique points!
      const extraAnglesEn = [
        `Cross-Substrand Synthesis (${subCode}): Mastery of "${subTitle}" reinforces foundational concepts across Strand "${st.strand}" and prepares ${gradeLabel} learners for progressive tasks in Term ${st.term}.`,
        `Diagnostic Self-Check Rule (${subCode}): To confirm full command of "${subTitle}", state its core principle clearly, work through one concrete example independently, and verify all units or conventions.`,
        `Local Improvisation & Sustainability (${subCode}): Where standard apparatus (${st.resources.toLowerCase()}) are unavailable, learners can safely improvise locally available, eco-friendly Kenyan materials to model "${subTitle}".`,
        `Digital Literacy & Research Integration (${subCode}): Learners can responsibly use approved digital devices, simulations, or reference charts to observe, record, and present accurate findings on "${subTitle}".`,
        `Values & Core Competencies Developed (${subCode}): Studying "${subTitle}" nurtures critical thinking, problem-solving, collaboration, integrity, and environmental responsibility in ${gradeLabel} ${subject}.`,
        `Rubric Mastery Benchmark (${subCode}): Exceeding Expectations (80-100%) in "${subTitle}" requires accurate terminology, logical step-by-step working, and relevant real-world illustration.`,
      ];
      const extraAnglesKis = [
        `Muunganiko wa Mada (${subCode}): Umilisi wa "${subTitle}" unaimarisha uelewa mpana wa mada kuu ya "${st.strand}" katika Muhula wa ${st.term} kwa wanafunzi wa ${gradeLabel}.`,
        `Kipimo cha Kujitathmini (${subCode}): Ili kujihakikishia umilisi wa "${subTitle}", eleza kanuni kuu kwa maneno yako na utunge mifano miwili sahihi isiyo na makosa ya kisarufi.`,
        `Ubunifu wa Nyenzo za Karibu (${subCode}): Wanafunzi wanaweza kubuni vifaa salama vinavyopatikana katika mazingira ya shule na nyumbani badala ya ${st.resources.toLowerCase()} kujifunzia "${subTitle}".`,
        `Matumizi Salama ya Teknolojia ya Kidijitali (${subCode}): Tumia vifaa vya kidijitali kwa uwajibikaji kutafiti, kusikiliza na kuwasilisha kazi bora kuhusu "${subTitle}".`,
        `Maadili na Umilisi wa Msingi (${subCode}): Mada ndogo ya "${subTitle}" inakuza mawasiliano, ushirikiano, uwajibikaji, heshima na uzalendo miongoni mwa wanafunzi.`,
        `Kiwango cha Juu cha Utendaji (${subCode}): Kupata Kuzidi Matarajio (80-100%) katika "${subTitle}" kunahitaji ufasaha wa lugha, hoja zenye mantiki na mifano mwafaka.`,
      ];

      let extraCursor = 0;
      while (rawPoints.length < pointsTarget && extraCursor < 30) {
        if (domain === 'mathematics') {
          const extraMath = generateWorkedMathematicsExercise(
            ctx,
            seedBase + 4000 + extraCursor * 43
          );
          pushUniquePoint(
            formatDomainItemAsDeclarativeNote(extraMath, subTitle, false, true)
          );
        } else {
          const extraWorked = generateWorkedDomainExercise(
            domain,
            ctx,
            seedBase + 4000 + extraCursor * 47
          );
          if (extraWorked) {
            pushUniquePoint(
              formatDomainItemAsDeclarativeNote(extraWorked, subTitle, isKis, true)
            );
          }
        }

        if (rawPoints.length < pointsTarget) {
          const pool = isKis ? extraAnglesKis : extraAnglesEn;
          if (extraCursor < pool.length) {
            pushUniquePoint(pool[(extraCursor + variantOffset) % pool.length]);
          } else {
            pushUniquePoint(
              isKis
                ? `Kidokezo cha Ziada cha Umilisi #${extraCursor + 1} (${subCode} - ${subTitle}): Hakikisha kila hoja inafafanuliwa kwa ufasaha na kuhusishwa moja kwa moja na muktadha wa "${st.strand}".`
                : `Extended Mastery Point #${extraCursor + 1} (${subCode} - ${subTitle}): Link every definition, procedure, and worked step in "${subTitle}" directly to the assessment objectives of "${st.strand}".`
            );
          }
        }
        extraCursor++;
      }

      const numberedPoints = rawPoints
        .slice(0, pointsTarget)
        .map((pt, idx) => `${idx + 1}. ${pt}`);

      strandPointsTotal += numberedPoints.length;
      minPointsPerSubstrand = Math.min(minPointsPerSubstrand, numberedPoints.length);

      builtSubstrands.push({
        substrandIndex: subIdx + 1,
        substrandCode: subCode,
        substrandTitle: subTitle,
        term: st.term,
        kiq: st.kiq,
        resources: st.resources,
        points: numberedPoints,
      });
    }

    minPointsPerStrand = Math.min(minPointsPerStrand, strandPointsTotal);
    grandTotalPoints += strandPointsTotal;
    grandTotalSubstrands += builtSubstrands.length;

    structuredStrands.push({
      strandIndex: sIdx + 1,
      strandTitle: st.strand,
      term: st.term,
      kiq: st.kiq,
      resources: st.resources,
      totalPoints: strandPointsTotal,
      substrands: builtSubstrands,
    });
  }

  return {
    gradeKey,
    gradeLabel,
    subject,
    coursebookTitle,
    approvedBooks,
    officialPortalUrl,
    totalStrands: structuredStrands.length,
    totalSubstrands: grandTotalSubstrands,
    totalPoints: grandTotalPoints,
    minPointsPerSubstrand: minPointsPerSubstrand === 999 ? 0 : minPointsPerSubstrand,
    minPointsPerStrand: minPointsPerStrand === 999 ? 0 : minPointsPerStrand,
    strands: structuredStrands,
  };
}

// ============================================================================
// ZERO-DUPLICATE QUESTION ENGINE (EXPANDED STEMS FOR 400+ UNIQUE QS/SUBJECT)
// ============================================================================

export interface BookQuestionEntry {
  qNumber: number;
  strand: string;
  substrand: string;
  prompt: string;
  options?: [string, string, string, string];
  marks: number;
  answerText: string;
  explanation: string;
}

const ENGLISH_STRUCTURED_STEMS: Array<{
  marks: number;
  build: (t: EnrichedSubTopic, gradeLabel: string, subject: string) => {
    prompt: string;
    ans: string;
    exp: string;
  };
}> = [
  {
    marks: 4,
    build: (t) => ({
      prompt: `State and explain two core principles or rules learned under "${t.subtopicTitle}".`,
      ans: `Any two accurate principles/rules on "${t.subtopicTitle}" clearly explained (2 x 2 = 4 marks).`,
      exp: `Award 1 mark for naming each valid point and 1 mark for accurate explanation aligned to "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `${t.kiq || `How is "${t.subtopicTitle}" applied in everyday life in Kenya?`} Support your answer with two practical examples.`,
      ans: `Two well-explained real-life Kenyan applications answering the prompt on "${t.subtopicTitle}" (4 marks).`,
      exp: `Award 2 marks per clear, contextually accurate example demonstrating mastery of "${t.substrand}".`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `During a practical activity on "${t.subtopicTitle}" using ${t.resources.toLowerCase()}, outline three sequential steps learners must follow.`,
      ans: `Three logical, ordered practical steps when working with ${t.resources.toLowerCase()} on "${t.subtopicTitle}" (3 marks).`,
      exp: `Award 1 mark for each accurate procedural step in proper sequence.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Distinguish clearly between the key concepts studied in "${t.subtopicTitle}" and give one real-world illustration.`,
      ans: `Clear conceptual distinction on "${t.subtopicTitle}" (2 mks) + 1 accurate real-world illustration (2 mks) = 4 marks.`,
      exp: `Ensure both sides of the distinction are stated explicitly rather than treating one side in isolation.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Identify three safety, hygiene, or accuracy precautions that must be observed when investigating "${t.subtopicTitle}".`,
      ans: `Three valid safety, hygiene, or accuracy precautions relevant to "${t.subtopicTitle}" (3 marks).`,
      exp: `Award 1 mark per distinct, actionable precaution using ${t.resources.toLowerCase()}.`,
    }),
  },
  {
    marks: 4,
    build: (t, gLbl) => ({
      prompt: `A ${gLbl} classmate made a common error while attempting a task on "${t.subtopicTitle}". Identify two common mistakes learners make in this topic and state how to avoid each.`,
      ans: `Two realistic misconceptions/errors on "${t.subtopicTitle}" (2 mks) + corrective method for each (2 mks) = 4 marks.`,
      exp: `Diagnostic awareness prevents careless errors during assessments on "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Explain two benefits of mastering "${t.subtopicTitle}" to a learner’s family or local Kenyan community.`,
      ans: `Two practical household, economic, or community benefits of "${t.subtopicTitle}" explained clearly (4 marks).`,
      exp: `Connect classroom knowledge under "${t.strand}" directly to problem-solving in society.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Define three key technical terms or vocabulary items encountered when studying "${t.subtopicTitle}".`,
      ans: `Accurate definitions of three domain terms belonging to "${t.subtopicTitle}" (3 x 1 = 3 marks).`,
      exp: `Precise command of subject terminology is essential for full marks in structured responses.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Describe how a group of learners can improvise locally available materials in place of ${t.resources.toLowerCase()} to demonstrate "${t.subtopicTitle}".`,
      ans: `Valid local improvisation materials identified (2 mks) + clear explanation of how they model "${t.subtopicTitle}" (2 mks).`,
      exp: `Resourcefulness and environmental responsibility are rewarded when improvising learning aids safely.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Analyze a real-world scenario in Kenya where failure to apply proper rules of "${t.subtopicTitle}" causes a problem, and propose two solutions.`,
      ans: `Clear problem analysis linked to "${t.subtopicTitle}" (2 mks) + two workable solutions (2 mks) = 4 marks.`,
      exp: `Award marks for logical cause-and-effect reasoning and practical remedies.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Write a concise three-point summary checklist that a learner can use to revise "${t.subtopicTitle}" before an assessment.`,
      ans: `Three distinct, accurate summary points capturing the essence of "${t.subtopicTitle}" (3 marks).`,
      exp: `Each bullet must state a complete, verifiable fact or rule under "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Explain how "${t.subtopicTitle}" connects to other sub-strands within "${t.strand}" and why it must be learned in sequence.`,
      ans: `Clear explanation of conceptual progression within "${t.strand}" involving "${t.subtopicTitle}" (4 marks).`,
      exp: `Foundational mastery of "${t.subtopicTitle}" supports advanced tasks across "${t.strand}".`,
    }),
  },
  {
    marks: 4,
    build: (t, _g, subj) => ({
      prompt: `Outline two career or enterprise opportunities in Kenya that rely directly on skills developed in "${t.subtopicTitle}" (${subj}).`,
      ans: `Two relevant careers/enterprises named (2 mks) + clear link to skills in "${t.subtopicTitle}" (2 mks) = 4 marks.`,
      exp: `Demonstrates practical career-pathway awareness grounded in "${t.substrand}".`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `State three observable indicators that show a learner has accurately completed a practical or written task on "${t.subtopicTitle}".`,
      ans: `Three measurable quality/accuracy indicators for "${t.subtopicTitle}" (3 marks).`,
      exp: `Focus on precision, neatness, correct method, and verified results.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Formulate a worked example or short case study illustrating "${t.subtopicTitle}", showing both the setup and final conclusion.`,
      ans: `Original, accurate case study / worked illustration on "${t.subtopicTitle}" (2 mks) + verified conclusion (2 mks).`,
      exp: `Award marks for realistic data/context and logical step-by-step reasoning.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Explain two ethical, environmental, or responsible-citizenship values promoted when practising "${t.subtopicTitle}".`,
      ans: `Two relevant values (e.g. integrity, safety, conservation, respect) explained in the context of "${t.subtopicTitle}" (4 marks).`,
      exp: `Link each value concretely to actions taken during "${t.subtopicTitle}".`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Give three reasons why ${t.resources.toLowerCase()} are effective when studying "${t.subtopicTitle}".`,
      ans: `Three distinct pedagogical/practical advantages of using ${t.resources.toLowerCase()} for "${t.subtopicTitle}" (3 marks).`,
      exp: `Concrete aids enhance visual clarity, hands-on retention, and measurement accuracy.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Compare traditional and modern approaches to handling tasks related to "${t.subtopicTitle}" in Kenya.`,
      ans: `Two valid comparison points showing traditional vs modern methods in "${t.subtopicTitle}" (2 x 2 = 4 marks).`,
      exp: `Highlight efficiency, sustainability, cost, and accuracy across both approaches.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Outline three questions a keen learner should ask when observing a demonstration on "${t.subtopicTitle}".`,
      ans: `Three relevant inquiry questions probing how, why, and where "${t.subtopicTitle}" works (3 marks).`,
      exp: `Critical inquiry deepens conceptual understanding of "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Describe how digital technology or ICT tools can be used responsibly to research or present findings on "${t.subtopicTitle}".`,
      ans: `Two responsible digital/ICT uses for researching, recording, or presenting "${t.subtopicTitle}" (4 marks).`,
      exp: `Include data accuracy, source verification, and online safety.`,
    }),
  },
  {
    marks: 4,
    build: (t, gLbl) => ({
      prompt: `Design a short peer-teaching plan showing how a ${gLbl} learner would explain "${t.subtopicTitle}" to a study partner in two clear stages.`,
      ans: `Stage 1 concept introduction (2 mks) + Stage 2 worked demonstration/check on "${t.subtopicTitle}" (2 mks).`,
      exp: `Peer explanation tests deep conceptual clarity and logical sequencing.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `List three essential records or observations a learner should write down in a notebook during an investigation on "${t.subtopicTitle}".`,
      ans: `Three valid observation/recording items specific to "${t.subtopicTitle}" (3 marks).`,
      exp: `Systematic documentation ensures reproducible and verifiable conclusions.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Explain two ways in which environmental conservation or resource efficiency is practiced during activities on "${t.subtopicTitle}".`,
      ans: `Two concrete conservation/waste-reduction practices during "${t.subtopicTitle}" (2 x 2 = 4 marks).`,
      exp: `Sustainable stewardship of materials and surroundings is an integral competency.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `State three criteria an examiner uses to award full marks on a structured question covering "${t.subtopicTitle}".`,
      ans: `Accurate terminology (1 mk), complete logical working/explanation (1 mk), and contextual relevance/units (1 mk).`,
      exp: `Understanding rubric criteria sharpens exam precision under "${t.strand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Describe two challenges learners in rural or urban Kenyan schools might face when practising "${t.subtopicTitle}" and suggest a practical remedy for each.`,
      ans: `Two realistic implementation challenges (2 mks) + two practical remedies (2 mks) = 4 marks.`,
      exp: `Adaptive problem-solving ensures learning continuity across diverse environments.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Identify three core competencies (such as critical thinking, communication, or collaboration) developed when working in groups on "${t.subtopicTitle}" and state how each is demonstrated.`,
      ans: `Three competencies named and linked to concrete group actions on "${t.subtopicTitle}" (3 marks).`,
      exp: `Award 1 mark for each well-linked competency demonstration.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Explain cause and effect in two key relationships studied within "${t.subtopicTitle}".`,
      ans: `Two accurate cause-and-effect relationships explained under "${t.subtopicTitle}" (2 x 2 = 4 marks).`,
      exp: `Analytical reasoning requires linking underlying causes to observable outcomes.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Suppose you are preparing a school exhibition poster on "${t.subtopicTitle}". State two key headings and summarize the main fact under each heading.`,
      ans: `Two clear headings + accurate summary fact under each for "${t.subtopicTitle}" (4 marks).`,
      exp: `Structured visual communication reinforces conceptual synthesis.`,
    }),
  },
];

const KISWAHILI_STRUCTURED_STEMS: Array<{
  marks: number;
  build: (t: EnrichedSubTopic) => { prompt: string; ans: string; exp: string };
}> = [
  {
    marks: 4,
    build: (t) => ({
      prompt: `Fafanua mambo mawili makuu yanayozingatiwa katika "${t.subtopicTitle}" na utoe mfano mmoja sahihi kwa kila moja.`,
      ans: `Hoja 2 sahihi kuhusu "${t.subtopicTitle}" pamoja na mifano 2 sanifu ya Kiswahili (Alama 2 x 2 = 4).`,
      exp: `Zingatia ufasaha wa lugha, upatanisho wa kisarufi na maelezo yanayolenga "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `${t.kiq || `Ni kwa namna gani "${t.subtopicTitle}" hutumika katika mawasiliano ya kila siku?`} Eleza kwa hoja mbili.`,
      ans: `Maelezo mawili yenye mantiki yanayojibu swali na kuhusisha mazingira halisi ya mwanafunzi (Alama 4).`,
      exp: `Kila hoja iliyofafanuliwa vizuri kwa Kiswahili sanifu ituzwe alama 2.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Tunga sentensi mbili sahihi zinazodhihirisha matumizi na umilisi wa "${t.subtopicTitle}".`,
      ans: `Sentensi 2 sahihi zisizo na makosa ya sarufi wala hijai kuhusu "${t.subtopicTitle}" (Alama 4).`,
      exp: `Hakiki usahihi wa muundo, alama za uakifishaji na matumizi mwafaka ya msamiati.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Eleza umuhimu wa kutumia vifaa vifuatavyo wakati wa kujifunza "${t.subtopicTitle}": ${t.resources}.`,
      ans: `Faida 3 sahihi za kutumia (${t.resources}) katika kujifunza "${t.subtopicTitle}" (Alama 3).`,
      exp: `Tuzo ya alama 1 kwa kila faida sahihi iliyotajwa kwa ufasaha.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Tambua makosa mawili ya kawaida ambayo wanafunzi hufanya katika "${t.subtopicTitle}" na uonyeshe jinsi ya kuyarekebisha.`,
      ans: `Makosa 2 yaliyotambuliwa (alama 2) + marekebisho sahihi kwa kila kosa (alama 2) = Alama 4.`,
      exp: `Kuzingatia kanuni za "${t.substrand}" huondoa utata katika maandishi na mazungumzo.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Eleza manufaa mawili ya kuzingatia stadi za "${t.subtopicTitle}" shuleni na katika jamii ya Kenya.`,
      ans: `Manufaa 2 yaliyofafanuliwa kikamilifu kuhusu "${t.subtopicTitle}" (Alama 4).`,
      exp: `Husisha stadi hiyo na mawasiliano yenye adabu, umoja na ufanisi.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Andika muhtasari wa vidokezo vitatu muhimu vya kuzingatia unapojikumbusha mada ya "${t.subtopicTitle}".`,
      ans: `Vidokezo 3 mahsusi na sahihi vinavyojumuisha kiini cha "${t.subtopicTitle}" (Alama 3).`,
      exp: `Kila kidokezo kiwe kamili na chenye maana inayojitosheleza.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Tofautisha vipengele vikuu vinavyojitokeza katika "${t.subtopicTitle}" kwa kutoa mifano miwili mwafaka.`,
      ans: `Tofauti iliyowekwa wazi kuhusu "${t.subtopicTitle}" (alama 2) + mifano 2 sahihi (alama 2) = Alama 4.`,
      exp: `Tumia viunganishi vya ulinganuzi kwa usahihi.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Bainisha maadili mawili ya kijamii yanayokuzwa kupitia mada ndogo ya "${t.subtopicTitle}".`,
      ans: `Maadili 2 (k.m. heshima, uwajibikaji, ushirikiano) yaliyofafanuliwa kulingana na "${t.subtopicTitle}" (Alama 4).`,
      exp: `Onyesha uhusiano wa moja kwa moja kati ya maadili hayo na "${t.strand}".`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Eleza hatua tatu ambazo kikundi cha wanafunzi kitafuata kinapojadili na kuwasilisha kazi kuhusu "${t.subtopicTitle}".`,
      ans: `Hatua 3 zenye mtiririko mzuri wa utafiti, mjadala na uwasilishaji kuhusu "${t.subtopicTitle}" (Alama 3).`,
      exp: `Zingatia ushirikiano, utamkaji bora na matumizi ya mifano hai.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Andika mazungumzo mafupi ya zamu nne kati ya wanafunzi wawili yakidhihirisha matumizi sahihi ya "${t.subtopicTitle}".`,
      ans: `Mazungumzo mafupi yenye lugha ya adabu na yanayotumia vipengele vya "${t.subtopicTitle}" kwa usahihi (Alama 4).`,
      exp: `Tathmini uhalisia wa muktadha, uakifishaji wa dayalojia na ufasaha.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Fafanua maana ya istilahi au maneno matatu muhimu yanayopatikana katika "${t.subtopicTitle}".`,
      ans: `Maana sahihi za maneno/istilahi 3 zinazohusiana na "${t.subtopicTitle}" (Alama 3).`,
      exp: `Ufafanuzi uzingatie muktadha wa "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Onyesha jinsi teknolojia ya kidijitali inavyoweza kutumiwa kwa usalama kutafiti na kuimarisha umilisi wa "${t.subtopicTitle}".`,
      ans: `Njia 2 salama za kutumia vifaa vya kidijitali katika kujifunza "${t.subtopicTitle}" (Alama 4).`,
      exp: `Zingatia uadilifu mtandaoni na uhakiki wa vyanzo vya habari.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Eleza uhusiano uliopo kati ya "${t.subtopicTitle}" na mada ndogo nyingine ndani ya "${t.strand}".`,
      ans: `Maelezo sahihi yanayoonyesha mtiririko na ujenzi wa umilisi ndani ya "${t.strand}" (Alama 4).`,
      exp: `Msingi imara wa "${t.subtopicTitle}" hurahisisha uelewa wa vipengele vinavyofuata.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Taja vigezo vitatu vinavyoonyesha kuwa mwanafunzi amemudu kikamilifu kazi ya "${t.subtopicTitle}".`,
      ans: `Vigezo 3 vya ufasaha, usahihi wa kanuni na mpangilio bora katika "${t.subtopicTitle}" (Alama 3).`,
      exp: `Tuzo ya alama 1 kwa kila kigezo kilichoelezwa vizuri.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Pendekeza taaluma au kazi mbili nchini Kenya zinazotegemea moja kwa moja umilisi wa "${t.subtopicTitle}" na ueleze jinsi stadi hiyo inavyotumika.`,
      ans: `Taaluma 2 mwafaka (alama 2) + maelezo sahihi ya matumizi ya "${t.subtopicTitle}" (alama 2) = Alama 4.`,
      exp: `Husisha ujuzi wa darasani na ulimwengu wa ajira na ujasiriamali.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Buni kifungu kifupi cha maneno yasiyozidi arobaini kinachojumuisha mifano miwili ya "${t.subtopicTitle}".`,
      ans: `Aya fupi yenye mtiririko mzuri na mifano 2 sahihi ya "${t.subtopicTitle}" (Alama 4).`,
      exp: `Hakiki hijai, muwala na matumizi sahihi ya alama za uakifishaji.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Eleza namna mwanafunzi anavyoweza kutumia mazingira ya nyumbani kuendeleza mazoezi ya "${t.subtopicTitle}".`,
      ans: `Njia 3 za vitendo za kufanya mazoezi ya "${t.subtopicTitle}" nyumbani kwa kushirikiana na familia (Alama 3).`,
      exp: `Ujifunzaji endelevu nje ya darasa huimarisha umilisi.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Linganisha mbinu za kijadi na za kisasa katika kushughulikia masuala yanayohusiana na "${t.subtopicTitle}".`,
      ans: `Hoja 2 za ulinganisho kati ya mbinu za kijadi na za kisasa kuhusu "${t.subtopicTitle}" (Alama 4).`,
      exp: `Onyesha pande zote mbili kwa kutumia viunganishi mwafaka.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Taja maswali matatu ya uchunguzi ambayo mwanafunzi makini anapaswa kujiuliza anaposoma "${t.subtopicTitle}".`,
      ans: `Maswali 3 dadisi yanayochunguza maana, kanuni na matumizi ya "${t.subtopicTitle}" (Alama 3).`,
      exp: `Udadisi hukuza fikra tunduizi katika somo la Kiswahili.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Eleza changamoto mbili wanazokumbana nazo wanafunzi wanapojifunza "${t.subtopicTitle}" na upendekeze suluhisho kwa kila moja.`,
      ans: `Changamoto 2 halisi (alama 2) + suluhisho 2 za vitendo (alama 2) = Alama 4.`,
      exp: `Suluhisho lilenge mazoezi, usomaji mpana na matumizi ya nyenzo sahihi.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Chambua umuhimu wa kuzingatia adabu za lugha na muktadha unapowasilisha hoja kuhusu "${t.subtopicTitle}".`,
      ans: `Hoja 2 zinazofafanua jinsi sajili, muktadha na staha zinavyoongoza "${t.subtopicTitle}" (Alama 4).`,
      exp: `Matumizi ya lugha hutegemea hadhira, mahali na lengo la mawasiliano.`,
    }),
  },
];

function normalizePromptKey(prompt: string): string {
  return String(prompt || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a deterministic, STRICTLY ZERO-DUPLICATE pool of exam & sub-strand questions
 * systematically spanning EVERY Strand and Sub-strand in sequential order!
 * Supports `startOffset` so Book 1 (CBC GRADE UP) and Book 2 (SUPER-LIGHT CBC COMPILATION)
 * have 0% overlap — making all ~340 questions in SMART CBC ALL SUBJECTS 100% unique!
 */
export function buildFullBookQuestionPool(
  gradeKey: string,
  subject: string,
  targetCount: number,
  startOffset = 0
): BookQuestionEntry[] {
  const totalNeeded = startOffset + targetCount;
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const { subTopics } = collectOrderedSubTopics(gradeKey, subject);
  const domain = resolveDomainKey(subject);
  const isKis = domain === 'kiswahili' || domain === 'fasihi_kiswahili';
  const bank = DOMAIN_EXERCISE_BANKS[domain] || [];
  const usedPrompts = new Set<string>();
  const masterOut: BookQuestionEntry[] = [];

  for (let i = 0; i < totalNeeded; i++) {
    const topic = subTopics[i % Math.max(1, subTopics.length)];
    const ctx: StrandContext = {
      gradeKey,
      gradeLabel,
      subject,
      strand: topic.strand,
      substrand: topic.substrand,
    };
    const hay = `${topic.strand} ${topic.substrand} ${topic.subtopicTitle}`.toLowerCase();

    let pickedEx: ExerciseItem | null = null;

    if (i % 3 !== 2) {
      if (domain === 'mathematics') {
        for (let att = 0; att < 400; att++) {
          const cand = generateWorkedMathematicsExercise(ctx, i * 19 + att * 31 + 7);
          const norm = normalizePromptKey(cand.q);
          if (!usedPrompts.has(norm)) {
            pickedEx = cand;
            break;
          }
        }
      } else {
        // 1. Strand-matched bank item
        const matched = bank.find(
          (item) =>
            !usedPrompts.has(normalizePromptKey(item.q)) &&
            item.tags.some((t) => hay.includes(t.toLowerCase()))
        );
        if (matched) pickedEx = matched;

        // 2. Worked quantitative/parametric exercise for this subject
        if (!pickedEx && i % 2 === 1) {
          for (let att = 0; att < 200; att++) {
            const w = generateWorkedDomainExercise(domain, ctx, i * 11 + att * 17 + 5);
            if (w && !usedPrompts.has(normalizePromptKey(w.q))) {
              pickedEx = w;
              break;
            }
          }
        }

        // 3. Remaining bank / extra / deep subject exercises
        if (!pickedEx) {
          const anyBank = bank.find(
            (item) => !usedPrompts.has(normalizePromptKey(item.q))
          );
          if (anyBank) pickedEx = anyBank;
        }
        if (!pickedEx) {
          for (let p = 0; p < 160; p++) {
            const ex = generateExtraTextbookExercise(domain, ctx, i + p);
            if (ex && !usedPrompts.has(normalizePromptKey(ex.q))) {
              pickedEx = ex;
              break;
            }
          }
        }
        if (!pickedEx) {
          for (let p = 0; p < 160; p++) {
            const dp = generateDeepSubjectExercise(domain, ctx, i + p);
            if (dp && !usedPrompts.has(normalizePromptKey(dp.q))) {
              pickedEx = dp;
              break;
            }
          }
        }
        if (!pickedEx) {
          for (let att = 0; att < 250; att++) {
            const w = generateWorkedDomainExercise(domain, ctx, i * 13 + att * 23 + 9);
            if (w && !usedPrompts.has(normalizePromptKey(w.q))) {
              pickedEx = w;
              break;
            }
          }
        }
      }
    }

    if (pickedEx) {
      usedPrompts.add(normalizePromptKey(pickedEx.q));
      const corrLetter = ['A', 'B', 'C', 'D'][pickedEx.ans] || 'A';
      const corrVal = pickedEx.options[pickedEx.ans];
      masterOut.push({
        qNumber: i + 1,
        strand: topic.strand,
        substrand: topic.substrand,
        prompt: pickedEx.q,
        options: pickedEx.options,
        marks: 2,
        answerText: `${corrLetter} (${corrVal})`,
        explanation: pickedEx.exp,
      });
      continue;
    }

    // Structured Written / Practical / Application Question — guaranteed 100% unique!
    if (domain === 'mathematics') {
      let extraMath: ExerciseItem | null = null;
      for (let att = 0; att < 500; att++) {
        const cand = generateWorkedMathematicsExercise(
          ctx,
          1000 + i * 37 + att * 41
        );
        const candPrompt = `${cand.q} (Show all your working steps clearly).`;
        if (
          !usedPrompts.has(normalizePromptKey(cand.q)) &&
          !usedPrompts.has(normalizePromptKey(candPrompt))
        ) {
          extraMath = cand;
          usedPrompts.add(normalizePromptKey(cand.q));
          usedPrompts.add(normalizePromptKey(candPrompt));
          masterOut.push({
            qNumber: i + 1,
            strand: topic.strand,
            substrand: topic.substrand,
            prompt: candPrompt,
            marks: 3,
            answerText: `${cand.options[cand.ans]}`,
            explanation: `Method & Accuracy: ${cand.exp} (Award M1 for formula/setup, M1 for substitution, A1 for accuracy).`,
          });
          break;
        }
      }
      if (extraMath) continue;
    }

    let placedStructured = false;
    const stems = isKis ? KISWAHILI_STRUCTURED_STEMS : ENGLISH_STRUCTURED_STEMS;
    const basePass = Math.floor(i / Math.max(1, subTopics.length));

    for (let shift = 0; shift < stems.length * Math.max(1, subTopics.length); shift++) {
      const tCand = subTopics[(i + shift) % Math.max(1, subTopics.length)];
      const stemIdx = (basePass + shift) % stems.length;
      const built = isKis
        ? KISWAHILI_STRUCTURED_STEMS[stemIdx].build(tCand)
        : ENGLISH_STRUCTURED_STEMS[stemIdx].build(tCand, gradeLabel, subject);
      const mks = stems[stemIdx].marks;
      const norm = normalizePromptKey(built.prompt);
      if (!usedPrompts.has(norm)) {
        usedPrompts.add(norm);
        masterOut.push({
          qNumber: i + 1,
          strand: tCand.strand,
          substrand: tCand.substrand,
          prompt: built.prompt,
          marks: mks,
          answerText: built.ans,
          explanation: built.exp,
        });
        placedStructured = true;
        break;
      }
    }

    if (!placedStructured) {
      const uniquePrompt = isKis
        ? `Kwa kurejelea mada ya "${topic.strand}" (${topic.subtopicTitle}), jadili hoja tatu tofauti zinazoonyesha umilisi wa kipengele cha ${i + 1} katika muktadha wa shule na jamii.`
        : `With direct reference to "${topic.strand}" (${topic.subtopicTitle}), explain three distinct points demonstrating practical mastery in Case Scenario #${i + 1}.`;
      usedPrompts.add(normalizePromptKey(uniquePrompt));
      masterOut.push({
        qNumber: i + 1,
        strand: topic.strand,
        substrand: topic.substrand,
        prompt: uniquePrompt,
        marks: 3,
        answerText: isKis
          ? `Hoja 3 sahihi na zenye mifano kuhusu "${topic.subtopicTitle}" (Alama 3).`
          : `Three distinct, well-explained points on "${topic.subtopicTitle}" (3 marks).`,
        explanation: isKis
          ? `Tuzo ya alama 1 kwa kila hoja sahihi.`
          : `Award 1 mark per distinct, accurate point.`,
      });
    }
  }

  return masterOut.slice(startOffset, startOffset + targetCount).map((entry, idx) => ({
    ...entry,
    qNumber: idx + 1,
  }));
}

// ============================================================================
// FLOWING MULTI-PAGE PDF WRITER (ZERO CLIPPING, EXACT PAGE X OF N HEADERS)
// ============================================================================

function drawPageFrame(params: {
  page: PDFPage;
  boldFont: PDFFont;
  regFont: PDFFont;
  bookTitle: string;
  gradeSubjectLabel: string;
  pageNumber: number;
  totalPages: number;
  accentRgb: [number, number, number];
}) {
  const {
    page,
    boldFont,
    regFont,
    bookTitle,
    gradeSubjectLabel,
    pageNumber,
    totalPages,
    accentRgb,
  } = params;
  const { width, height } = page.getSize();
  const [r, g, b] = accentRgb;

  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: rgb(r, g, b),
    borderWidth: 1.2,
  });

  page.drawRectangle({
    x: 28,
    y: height - 54,
    width: width - 56,
    height: 26,
    color: rgb(r, g, b),
  });

  page.drawText(toPdfSafe(`${bookTitle}  |  ${gradeSubjectLabel}`).slice(0, 74), {
    x: 38,
    y: height - 45,
    size: 9.0,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  const pgTag = `Page ${pageNumber} of ${totalPages}`;
  page.drawText(pgTag, {
    x: width - 38 - boldFont.widthOfTextAtSize(pgTag, 9),
    y: height - 45,
    size: 9,
    font: boldFont,
    color: rgb(1, 0.94, 0.65),
  });

  page.drawLine({
    start: { x: 36, y: 46 },
    end: { x: width - 36, y: 46 },
    thickness: 0.6,
    color: rgb(0.8, 0.84, 0.88),
  });
  page.drawText(
    toPdfSafe(
      `www.cbcmaterials.shop  *  Official 2026 ${bookTitle}  *  WhatsApp: 0705 759 072`
    ),
    {
      x: 38,
      y: 34,
      size: 8,
      font: regFont,
      color: rgb(0.38, 0.43, 0.5),
    }
  );
}

interface FlowPageRecord {
  page: PDFPage;
  sectionLabel: string;
  accentRgb: [number, number, number];
}

class PdfFlowBookWriter {
  public pdfDoc: PDFDocument;
  public boldFont: PDFFont;
  public regFont: PDFFont;
  public bookTitle: string;
  public gradeSubject: string;
  public defaultAccent: [number, number, number];
  public pages: FlowPageRecord[] = [];
  public currentPage!: PDFPage;
  public y = 768;
  private activeSectionLabel = '';
  private activeAccent: [number, number, number];

  constructor(params: {
    pdfDoc: PDFDocument;
    boldFont: PDFFont;
    regFont: PDFFont;
    bookTitle: string;
    gradeSubject: string;
    defaultAccent: [number, number, number];
  }) {
    this.pdfDoc = params.pdfDoc;
    this.boldFont = params.boldFont;
    this.regFont = params.regFont;
    this.bookTitle = params.bookTitle;
    this.gradeSubject = params.gradeSubject;
    this.defaultAccent = params.defaultAccent;
    this.activeAccent = params.defaultAccent;
  }

  public addPage(sectionLabel: string, accentOverride?: [number, number, number]): PDFPage {
    const page = this.pdfDoc.addPage([595.28, 841.89]);
    this.activeSectionLabel = sectionLabel;
    this.activeAccent = accentOverride || this.defaultAccent;
    this.pages.push({
      page,
      sectionLabel: this.activeSectionLabel,
      accentRgb: this.activeAccent,
    });
    this.currentPage = page;
    this.y = 768;
    return page;
  }

  public ensureSpace(neededPt: number): void {
    if (!this.currentPage || this.y - neededPt < 58) {
      this.addPage(this.activeSectionLabel, this.activeAccent);
    }
  }

  public drawSectionBanner(
    title: string,
    subtitle: string,
    fillRgb: [number, number, number],
    borderRgb: [number, number, number],
    textRgb: [number, number, number]
  ): void {
    this.ensureSpace(44);
    this.currentPage.drawRectangle({
      x: 42,
      y: this.y - 34,
      width: 511,
      height: 36,
      color: rgb(fillRgb[0], fillRgb[1], fillRgb[2]),
      borderColor: rgb(borderRgb[0], borderRgb[1], borderRgb[2]),
      borderWidth: 0.9,
    });
    this.currentPage.drawText(toPdfSafe(title).slice(0, 86), {
      x: 50,
      y: this.y - 13,
      size: 9.3,
      font: this.boldFont,
      color: rgb(textRgb[0], textRgb[1], textRgb[2]),
    });
    this.currentPage.drawText(toPdfSafe(subtitle).slice(0, 94), {
      x: 50,
      y: this.y - 27,
      size: 8.1,
      font: this.regFont,
      color: rgb(0.2, 0.25, 0.34),
    });
    this.y -= 44;
  }

  public drawSubstrandHeader(subCode: string, subTitle: string, pointCount: number): void {
    this.ensureSpace(38);
    this.currentPage.drawRectangle({
      x: 42,
      y: this.y - 20,
      width: 511,
      height: 22,
      color: rgb(0.94, 0.97, 0.99),
      borderColor: rgb(0.68, 0.78, 0.9),
      borderWidth: 0.7,
    });
    this.currentPage.drawText(
      toPdfSafe(
        `SUB-STRAND ${subCode}: ${subTitle}  (${pointCount} Essential Revision Points)`
      ).slice(0, 90),
      {
        x: 49,
        y: this.y - 13,
        size: 8.8,
        font: this.boldFont,
        color: rgb(0.06, 0.2, 0.44),
      }
    );
    this.y -= 28;
  }

  public drawNotePoint(pointText: string): void {
    const lines = wrapPdfText(pointText, 84);
    const needed = lines.length * 12.0 + 5.5;
    this.ensureSpace(needed);
    for (let i = 0; i < lines.length; i++) {
      this.currentPage.drawText(lines[i], {
        x: i === 0 ? 46 : 58,
        y: this.y,
        size: 9.0,
        font: this.regFont,
        color: rgb(0.12, 0.16, 0.22),
      });
      this.y -= 11.8;
    }
    this.y -= 4.8;
  }

  public drawQuestionBlock(q: BookQuestionEntry, compactLines = false): void {
    const qLines = wrapPdfText(`Q${q.qNumber}. ${q.prompt} (${q.marks} Marks)`, 82);
    const ruleLines = compactLines ? 3 : 4;
    const optionsHeight = q.options ? 4 * 12.0 + 10 : ruleLines * 12.5 + 12;
    const totalNeeded = 16 + qLines.length * 12.2 + optionsHeight;
    this.ensureSpace(totalNeeded);

    this.currentPage.drawText(
      toPdfSafe(`[Sub-strand: ${q.substrand}]`).slice(0, 90),
      {
        x: 44,
        y: this.y,
        size: 8.3,
        font: this.boldFont,
        color: rgb(0.18, 0.36, 0.62),
      }
    );
    this.y -= 12.5;

    for (const ln of qLines) {
      this.currentPage.drawText(ln, {
        x: 44,
        y: this.y,
        size: 9.3,
        font: this.boldFont,
        color: rgb(0.08, 0.11, 0.16),
      });
      this.y -= 12.0;
    }

    if (q.options) {
      const letters = ['A', 'B', 'C', 'D'];
      for (let oi = 0; oi < 4; oi++) {
        const optLine = toPdfSafe(`   ${letters[oi]}. ${q.options[oi]}`).slice(0, 86);
        this.currentPage.drawText(optLine, {
          x: 50,
          y: this.y,
          size: 8.8,
          font: this.regFont,
          color: rgb(0.18, 0.22, 0.28),
        });
        this.y -= 11.6;
      }
      this.y -= 8;
    } else {
      for (let lnIdx = 0; lnIdx < ruleLines; lnIdx++) {
        this.y -= 12.0;
        this.currentPage.drawLine({
          start: { x: 52, y: this.y },
          end: { x: 545, y: this.y },
          thickness: 0.45,
          color: rgb(0.76, 0.8, 0.85),
        });
      }
      this.y -= 11;
    }
  }

  public drawMarkingEntry(q: BookQuestionEntry): void {
    const ansLines = wrapPdfText(
      `Q${q.qNumber} (${q.marks} mks) - Answer: ${q.answerText}`,
      86
    );
    const expLines = wrapPdfText(`   Explanation: ${q.explanation}`, 88);
    const needed = ansLines.length * 11.4 + expLines.length * 10.8 + 7;
    this.ensureSpace(needed);

    for (const aln of ansLines) {
      this.currentPage.drawText(aln, {
        x: 44,
        y: this.y,
        size: 8.8,
        font: this.boldFont,
        color: rgb(0.04, 0.34, 0.22),
      });
      this.y -= 11.2;
    }
    for (const eln of expLines) {
      this.currentPage.drawText(eln, {
        x: 48,
        y: this.y,
        size: 8.3,
        font: this.regFont,
        color: rgb(0.22, 0.26, 0.33),
      });
      this.y -= 10.6;
    }
    this.y -= 5.5;
  }

  public stampAllPageFrames(pageOffset = 0, grandTotalOverride?: number): void {
    const total = grandTotalOverride ?? this.pages.length + pageOffset;
    for (let i = 0; i < this.pages.length; i++) {
      const rec = this.pages[i];
      drawPageFrame({
        page: rec.page,
        boldFont: this.boldFont,
        regFont: this.regFont,
        bookTitle: this.bookTitle,
        gradeSubjectLabel: rec.sectionLabel
          ? `${this.gradeSubject} (${rec.sectionLabel})`
          : this.gradeSubject,
        pageNumber: i + 1 + pageOffset,
        totalPages: total,
        accentRgb: rec.accentRgb,
      });
    }
  }
}

// ============================================================================
// BUTTON 1: "CBC GRADE UP" — COMPLETE SHORT NOTES (12+ PTS/SUB, 30+ PTS/STRAND)
// + COMPREHENSIVE STRAND QUESTIONS + END-OF-BOOK MARKING SCHEMES (KSh 500)
// ============================================================================

export async function generateCbcGradeUpPdfBuffer(params: {
  gradeKey: string;
  subject: string;
  variantOffset?: number;
}): Promise<Uint8Array> {
  const { gradeKey, subject, variantOffset = 0 } = params;
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const gradeSubject = `${gradeLabel} ${subject}`;

  const notesTree = buildStructuredSyllabusNotesTree(gradeKey, subject, variantOffset);
  const approvedSeriesLine =
    notesTree.approvedBooks.length > 0
      ? notesTree.approvedBooks
          .slice(0, 4)
          .map((b) => `${b.series} (${b.publisher})`)
          .join('; ')
      : notesTree.coursebookTitle;

  // Calculate Book 2 question count so Book 1 starts strictly after Book 2's pool (0% overlap!)
  const book2QPerSub = Math.max(
    9,
    Math.ceil(205 / Math.max(1, notesTree.totalSubstrands))
  );
  const book2QuestionCount = notesTree.totalSubstrands * book2QPerSub;
  const book1QuestionCount = Math.max(180, 200 - notesTree.totalSubstrands);
  const questions = buildFullBookQuestionPool(
    gradeKey,
    subject,
    book1QuestionCount,
    book2QuestionCount
  );

  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const accent: [number, number, number] = [0.03, 0.36, 0.27]; // Deep Emerald

  const flow = new PdfFlowBookWriter({
    pdfDoc,
    boldFont,
    regFont,
    bookTitle: 'CBC GRADE UP',
    gradeSubject,
    defaultAccent: accent,
  });

  // ---------------- PAGE 1: COVER PAGE & SYLLABUS ROADMAP ----------------
  const cover = flow.addPage('Cover & Syllabus Roadmap', accent);
  cover.drawRectangle({
    x: 44,
    y: 635,
    width: 507,
    height: 132,
    color: rgb(0.03, 0.36, 0.27),
  });
  cover.drawText('OFFICIAL 2026 EDITION  *  COMPLETE SHORT NOTES, QUESTIONS & MARKING SCHEMES', {
    x: 58,
    y: 742,
    size: 9.6,
    font: boldFont,
    color: rgb(0.98, 0.82, 0.25),
  });
  cover.drawText('CBC GRADE UP', {
    x: 58,
    y: 700,
    size: 33,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  cover.drawText(toPdfSafe(`${gradeLabel.toUpperCase()} - ${subject.toUpperCase()}`), {
    x: 58,
    y: 670,
    size: 15,
    font: boldFont,
    color: rgb(0.75, 0.97, 0.86),
  });
  cover.drawText(
    toPdfSafe(
      `All ${notesTree.totalStrands} Strands * ${notesTree.totalSubstrands} Sub-strands (${notesTree.totalPoints} Short Note Points) + ${questions.length} Questions + Marking Schemes`
    ).slice(0, 96),
    {
      x: 58,
      y: 648,
      size: 8.9,
      font: regFont,
      color: rgb(0.92, 0.96, 0.99),
    }
  );

  let cy = 612;
  cover.drawText(
    'COMPLETE SYLLABUS STRANDS & SUB-STRANDS COVERED (30+ POINTS PER STRAND):',
    {
      x: 46,
      y: cy,
      size: 10,
      font: boldFont,
      color: rgb(0.06, 0.12, 0.22),
    }
  );
  cy -= 17;

  for (let sIdx = 0; sIdx < notesTree.strands.length && cy > 180; sIdx++) {
    const st = notesTree.strands[sIdx];
    cover.drawText(
      toPdfSafe(
        `${st.strandIndex}. ${st.strandTitle}  [${st.substrands.length} Sub-strands | ${st.totalPoints} Note Points]`
      ).slice(0, 88),
      {
        x: 50,
        y: cy,
        size: 9.1,
        font: boldFont,
        color: rgb(0.03, 0.36, 0.27),
      }
    );
    cy -= 12.5;
    const subPreview = st.substrands.map((s) => s.substrandTitle).join('  |  ');
    for (const ln of wrapPdfText(subPreview, 86).slice(0, 2)) {
      if (cy < 176) break;
      cover.drawText(`   - ${ln}`, {
        x: 54,
        y: cy,
        size: 8.2,
        font: regFont,
        color: rgb(0.22, 0.28, 0.36),
      });
      cy -= 11;
    }
    cy -= 4;
  }

  cover.drawRectangle({
    x: 44,
    y: 64,
    width: 507,
    height: 98,
    color: rgb(0.95, 0.98, 0.96),
    borderColor: rgb(0.03, 0.36, 0.27),
    borderWidth: 1,
  });
  cover.drawText('INSIDE THIS "CBC GRADE UP" SUBJECT BOOK:', {
    x: 58,
    y: 144,
    size: 9.6,
    font: boldFont,
    color: rgb(0.03, 0.36, 0.27),
  });
  cover.drawText(
    toPdfSafe(`1. Approved Coursebooks Synthesized: ${approvedSeriesLine}`).slice(0, 92),
    { x: 58, y: 128, size: 8.3, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    `2. Section A: Short Point-Form Notes (${notesTree.minPointsPerSubstrand}+ pts/Sub-strand, ${notesTree.minPointsPerStrand}+ pts/Strand across ALL Strands).`,
    { x: 58, y: 114, size: 8.4, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    `3. Section B: ${questions.length} Zero-Repeat Strand & Sub-strand Exam Questions covering every topic.`,
    { x: 58, y: 100, size: 8.4, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    '4. Section C (End of Book): Complete Official Marking Schemes & Step-by-Step Worked Solutions.',
    { x: 58, y: 86, size: 8.4, font: boldFont, color: rgb(0.1, 0.24, 0.4) }
  );

  // ---------------- SECTION A: COMPLETE SHORT NOTES (ALL STRANDS & SUB-STRANDS) ----------------
  flow.addPage('Section A: Short Notes', accent);
  for (const st of notesTree.strands) {
    flow.drawSectionBanner(
      `STRAND ${st.strandIndex}: ${st.strandTitle}`,
      `Term ${st.term}  *  ${st.substrands.length} Sub-strands  *  ${st.totalPoints} Essential Point-Form Short Notes`,
      [0.92, 0.98, 0.95],
      [0.03, 0.36, 0.27],
      [0.03, 0.36, 0.27]
    );

    for (const sub of st.substrands) {
      flow.drawSubstrandHeader(sub.substrandCode, sub.substrandTitle, sub.points.length);
      for (const pt of sub.points) {
        flow.drawNotePoint(pt);
      }
      flow.y -= 5;
    }
  }

  // ---------------- SECTION B: TOPICAL & END-OF-STRAND EXAM QUESTIONS ----------------
  flow.addPage('Section B: Exam Questions', accent);
  let activeQuestionStrand = '';
  for (const q of questions) {
    if (q.strand !== activeQuestionStrand) {
      activeQuestionStrand = q.strand;
      flow.drawSectionBanner(
        `EXAM & TOPICAL QUESTIONS — ${activeQuestionStrand}`,
        'Answer all questions clearly in the spaces provided before checking Section C Marking Schemes.',
        [0.93, 0.97, 0.95],
        [0.55, 0.78, 0.68],
        [0.03, 0.36, 0.27]
      );
    }
    flow.drawQuestionBlock(q, false);
  }

  // ---------------- SECTION C (END OF BOOK): COMPLETE MARKING SCHEMES ----------------
  flow.addPage('Section C: Marking Scheme', [0.09, 0.22, 0.48]);
  flow.drawSectionBanner(
    `SECTION C: COMPLETE OFFICIAL MARKING SCHEMES (Q1 - Q${questions.length})`,
    'Verified Answers, Method Marks & Worked Explanations for Every Question in Section B',
    [0.93, 0.95, 0.99],
    [0.55, 0.66, 0.88],
    [0.09, 0.22, 0.48]
  );
  for (const q of questions) {
    flow.drawMarkingEntry(q);
  }

  flow.stampAllPageFrames(0);
  return pdfDoc.save();
}

// ============================================================================
// BUTTON 2: "SUPER-LIGHT CBC COMPILATION" — ALL STRANDS & SUB-STRANDS SHORT NOTES
// (12+ PTS/SUB, 30+ PTS/STRAND) + IMMEDIATE QUESTIONS AFTER EVERY SUB-STRAND (KSh 750)
// ============================================================================

export async function generateMadeFamiliarPdfBuffer(params: {
  gradeKey: string;
  subject: string;
  headerOverrideTitle?: string;
}): Promise<Uint8Array> {
  const { gradeKey, subject, headerOverrideTitle } = params;
  const runningBookTitle = headerOverrideTitle || 'SUPER-LIGHT CBC COMPILATION';
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const gradeSubject = `${gradeLabel} ${subject}`;

  const notesTree = buildStructuredSyllabusNotesTree(gradeKey, subject, 0);
  const approvedSummary =
    notesTree.approvedBooks.length > 0
      ? notesTree.approvedBooks
          .slice(0, 4)
          .map((b) => `${b.series} (${b.publisher})`)
          .join('; ')
      : notesTree.coursebookTitle;

  const questionsPerSubstrand = Math.max(
    9,
    Math.ceil(205 / Math.max(1, notesTree.totalSubstrands))
  );
  const totalQuestionsNeeded = notesTree.totalSubstrands * questionsPerSubstrand;
  const questionPool = buildFullBookQuestionPool(
    gradeKey,
    subject,
    totalQuestionsNeeded,
    0
  );

  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const accent: [number, number, number] = [0.1, 0.24, 0.54]; // Royal Indigo/Blue

  const flow = new PdfFlowBookWriter({
    pdfDoc,
    boldFont,
    regFont,
    bookTitle: runningBookTitle,
    gradeSubject,
    defaultAccent: accent,
  });

  // ---------------- PAGE 1: COVER PAGE ----------------
  const cover = flow.addPage('Cover & Study Roadmap', accent);
  cover.drawRectangle({
    x: 44,
    y: 635,
    width: 507,
    height: 132,
    color: rgb(0.1, 0.24, 0.54),
  });
  cover.drawText('OFFICIAL 2026 EDITION  *  IN-DEPTH POINT-FORM NOTES & IMMEDIATE Q&A', {
    x: 58,
    y: 742,
    size: 9.8,
    font: boldFont,
    color: rgb(0.98, 0.82, 0.25),
  });
  cover.drawText(headerOverrideTitle ? 'SMART CBC ALL SUBJECTS' : 'SUPER-LIGHT CBC', {
    x: 58,
    y: 710,
    size: 27,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  cover.drawText(headerOverrideTitle ? 'MASTER COMPILATION (PART 1)' : 'COMPILATION', {
    x: 58,
    y: 680,
    size: 24,
    font: boldFont,
    color: rgb(0.65, 0.95, 0.82),
  });
  cover.drawText(
    toPdfSafe(
      `${gradeLabel.toUpperCase()} ${subject.toUpperCase()}  *  ${notesTree.totalPoints} Short Note Points + ${questionPool.length} Topical Qs`
    ).slice(0, 94),
    {
      x: 58,
      y: 650,
      size: 9.8,
      font: boldFont,
      color: rgb(0.93, 0.96, 1),
    }
  );

  let cy = 612;
  cover.drawText(
    'ALL SYLLABUS STRANDS & SUB-STRANDS COVERED (30+ POINTS PER STRAND):',
    {
      x: 46,
      y: cy,
      size: 10,
      font: boldFont,
      color: rgb(0.08, 0.14, 0.26),
    }
  );
  cy -= 17;

  for (let sIdx = 0; sIdx < notesTree.strands.length && cy > 180; sIdx++) {
    const st = notesTree.strands[sIdx];
    cover.drawText(
      toPdfSafe(
        `${st.strandIndex}. ${st.strandTitle}  [${st.substrands.length} Sub-strands | ${st.totalPoints} Note Points]`
      ).slice(0, 88),
      {
        x: 50,
        y: cy,
        size: 9.1,
        font: boldFont,
        color: rgb(0.1, 0.24, 0.54),
      }
    );
    cy -= 12.5;
    for (const ln of wrapPdfText(
      st.substrands.map((s) => s.substrandTitle).join('  |  '),
      86
    ).slice(0, 2)) {
      if (cy < 175) break;
      cover.drawText(`   * ${ln}`, {
        x: 54,
        y: cy,
        size: 8.2,
        font: regFont,
        color: rgb(0.22, 0.28, 0.36),
      });
      cy -= 11;
    }
    cy -= 4;
  }

  cover.drawRectangle({
    x: 44,
    y: 64,
    width: 507,
    height: 96,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0.1, 0.24, 0.54),
    borderWidth: 1,
  });
  cover.drawText('INSIDE THIS "SUPER-LIGHT CBC COMPILATION" BOOK:', {
    x: 58,
    y: 142,
    size: 9.6,
    font: boldFont,
    color: rgb(0.1, 0.24, 0.54),
  });
  cover.drawText(
    `  * Complete Short Point-Form Notes: ${notesTree.minPointsPerSubstrand}+ points per Sub-strand & ${notesTree.minPointsPerStrand}+ points per Strand!`,
    { x: 58, y: 126, size: 8.4, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    `  * Immediate Topical Practice: Every Sub-strand's notes are followed immediately by ${questionsPerSubstrand} relevant questions.`,
    { x: 58, y: 112, size: 8.4, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    `  * End-of-Book Answers & Marking Guide: Step-by-step solutions to all ${questionPool.length} Sub-strand Questions.`,
    { x: 58, y: 98, size: 8.4, font: boldFont, color: rgb(0.04, 0.35, 0.25) }
  );
  cover.drawText(
    toPdfSafe(`  * Approved Coursebooks Synthesized: ${approvedSummary}`).slice(0, 92),
    { x: 58, y: 82, size: 8.1, font: regFont, color: rgb(0.3, 0.35, 0.44) }
  );

  // ---------------- SECTION A: NOTES + IMMEDIATE TOPICAL QUESTIONS PER SUB-STRAND ----------------
  flow.addPage('Short Notes & Sub-strand Qs', accent);
  let qCursor = 0;

  for (const st of notesTree.strands) {
    flow.drawSectionBanner(
      `STRAND ${st.strandIndex}: ${st.strandTitle}`,
      `Term ${st.term}  *  ${st.substrands.length} Sub-strands  *  ${st.totalPoints} Point-Form Notes + Immediate Sub-strand Questions`,
      [0.93, 0.96, 1],
      [0.58, 0.7, 0.92],
      [0.1, 0.24, 0.54]
    );

    for (const sub of st.substrands) {
      flow.drawSubstrandHeader(sub.substrandCode, sub.substrandTitle, sub.points.length);
      for (const pt of sub.points) {
        flow.drawNotePoint(pt);
      }

      // Immediately after this Sub-strand's Short Notes, render its Topical Practice Questions!
      flow.ensureSpace(58);
      flow.currentPage.drawRectangle({
        x: 42,
        y: flow.y - 19,
        width: 511,
        height: 21,
        color: rgb(0.99, 0.96, 0.87),
        borderColor: rgb(0.9, 0.76, 0.35),
        borderWidth: 0.8,
      });
      flow.currentPage.drawText(
        toPdfSafe(
          `IMMEDIATE TOPICAL QUESTIONS ON SUB-STRAND ${sub.substrandCode}: "${sub.substrandTitle}"`
        ).slice(0, 88),
        {
          x: 49,
          y: flow.y - 12,
          size: 8.5,
          font: boldFont,
          color: rgb(0.48, 0.28, 0.02),
        }
      );
      flow.y -= 28;

      const subQs = questionPool.slice(qCursor, qCursor + questionsPerSubstrand);
      qCursor += questionsPerSubstrand;
      for (const tq of subQs) {
        flow.drawQuestionBlock(
          {
            ...tq,
            strand: st.strandTitle,
            substrand: sub.substrandTitle,
          },
          true
        );
      }
      flow.y -= 6;
    }
  }

  // ---------------- SECTION B (END OF BOOK): COMPLETE SUB-STRAND ANSWERS ----------------
  flow.addPage('Sub-strand Answers & Guide', [0.03, 0.36, 0.27]);
  flow.drawSectionBanner(
    `COMPLETE ANSWERS & MARKING GUIDE TO SUB-STRAND QUESTIONS (Q1 - Q${questionPool.length})`,
    'Verified Solutions & Step-by-Step Explanations for Every Sub-strand Practice Question',
    [0.92, 0.98, 0.95],
    [0.58, 0.82, 0.72],
    [0.03, 0.36, 0.27]
  );
  for (const q of questionPool) {
    flow.drawMarkingEntry(q);
  }

  flow.stampAllPageFrames(0);
  return pdfDoc.save();
}

// ============================================================================
// BUTTON 3: "SMART CBC ALL SUBJECTS" — MASTER COMPILATION COMBINING EVERYTHING
// (PART 1: SUPER-LIGHT CBC COMPILATION + PART 2: CBC GRADE UP WITH 0% OVERLAP!)
// ============================================================================

export async function generateCompleteCompilationPdfBuffer(params: {
  gradeKey: string;
  subject: string;
}): Promise<Uint8Array> {
  const { gradeKey, subject } = params;
  const [part1Bytes, part2Bytes] = await Promise.all([
    generateMadeFamiliarPdfBuffer({
      gradeKey,
      subject,
      headerOverrideTitle: 'SMART CBC ALL SUBJECTS',
    }),
    generateCbcGradeUpPdfBuffer({
      gradeKey,
      subject,
      variantOffset: 1, // Distinct worked examples & extended mastery notes so 0% repetition across Part 1 & Part 2!
    }),
  ]);

  const mergedPdf = await PDFDocument.create();
  const doc1 = await PDFDocument.load(part1Bytes);
  const doc2 = await PDFDocument.load(part2Bytes);

  const pages1 = await mergedPdf.copyPages(doc1, doc1.getPageIndices());
  for (const p of pages1) mergedPdf.addPage(p);

  const pages2 = await mergedPdf.copyPages(doc2, doc2.getPageIndices());
  for (const p of pages2) mergedPdf.addPage(p);

  // Stamp unified continuous `Page X of GrandTotal` badge over the top-right header pill of every page!
  const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const allPages = mergedPdf.getPages();
  const grandTotal = allPages.length;
  for (let i = 0; i < grandTotal; i++) {
    const pg = allPages[i];
    const { width, height } = pg.getSize();
    const isPart1 = i < doc1.getPageCount();
    const barColor: [number, number, number] = isPart1
      ? i >= doc1.getPageCount() - 9
        ? [0.03, 0.36, 0.27]
        : [0.1, 0.24, 0.54]
      : i >= grandTotal - 10
      ? [0.09, 0.22, 0.48]
      : [0.03, 0.36, 0.27];

    pg.drawRectangle({
      x: width - 155,
      y: height - 53,
      width: 124,
      height: 24,
      color: rgb(barColor[0], barColor[1], barColor[2]),
    });
    const pgTag = `Page ${i + 1} of ${grandTotal}`;
    pg.drawText(pgTag, {
      x: width - 38 - boldFont.widthOfTextAtSize(pgTag, 9),
      y: height - 45,
      size: 9,
      font: boldFont,
      color: rgb(1, 0.94, 0.65),
    });
  }

  return mergedPdf.save();
}

// ============================================================================
// EDITABLE MICROSOFT WORD (.DOCX) EDITION FOR ALL THREE BUTTONS
// ============================================================================

export async function generateCbcBookDocxBuffer(params: {
  bookType: CbcBookType;
  gradeKey: string;
  subject: string;
}): Promise<Buffer> {
  const { bookType, gradeKey, subject } = params;
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const titleName = BOOK_SERIES_TITLES[bookType];

  const primaryNotesTree = buildStructuredSyllabusNotesTree(gradeKey, subject, 0);
  const secondaryNotesTree =
    bookType === 'COMPLETE_BUNDLE'
      ? buildStructuredSyllabusNotesTree(gradeKey, subject, 1)
      : null;

  const qPerSub = Math.max(9, Math.ceil(205 / Math.max(1, primaryNotesTree.totalSubstrands)));
  const mfTotalQs = primaryNotesTree.totalSubstrands * qPerSub;
  const guTotalQs = Math.max(180, 200 - primaryNotesTree.totalSubstrands);

  const madeFamiliarQuestions =
    bookType === 'MADE_FAMILIAR' || bookType === 'COMPLETE_BUNDLE'
      ? buildFullBookQuestionPool(gradeKey, subject, mfTotalQs, 0)
      : [];
  const gradeUpQuestions =
    bookType === 'GRADE_UP' || bookType === 'COMPLETE_BUNDLE'
      ? buildFullBookQuestionPool(gradeKey, subject, guTotalQs, mfTotalQs)
      : [];

  const allQuestionsForMarking =
    bookType === 'MADE_FAMILIAR'
      ? madeFamiliarQuestions
      : bookType === 'GRADE_UP'
      ? gradeUpQuestions
      : [
          ...madeFamiliarQuestions,
          ...gradeUpQuestions.map((q, idx) => ({
            ...q,
            qNumber: mfTotalQs + 1 + idx,
          })),
        ];

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: titleName, bold: true, size: 40 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${gradeLabel} — ${subject} (Official 2026 Edition • www.cbcmaterials.shop)`,
          bold: true,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: 'OFFICIAL APPROVED CBC COURSE MATERIALS SYNTHESIZED IN THIS BOOK',
          bold: true,
        }),
      ],
    }),
    ...(primaryNotesTree.approvedBooks.length > 0
      ? primaryNotesTree.approvedBooks.map(
          (ab, idx) =>
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: `${idx + 1}. ${ab.series} (${ab.publisher}) — `,
                  bold: true,
                }),
                new TextRun({
                  text: `Authors: ${ab.authors}${ab.note ? ` | ${ab.note}` : ''}`,
                }),
              ],
            })
        )
      : [
          new Paragraph({
            children: [new TextRun({ text: primaryNotesTree.coursebookTitle, bold: true })],
          }),
        ]),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: `COMPLETE SYLLABUS STRANDS & SUB-STRANDS COVERED (${primaryNotesTree.totalStrands} STRANDS • ${primaryNotesTree.totalSubstrands} SUB-STRANDS • ${primaryNotesTree.totalPoints}+ SHORT NOTE POINTS)`,
          bold: true,
        }),
      ],
    }),
  ];

  for (const st of primaryNotesTree.strands) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: `Strand ${st.strandIndex}: ${st.strandTitle} (${st.totalPoints} Points): `,
            bold: true,
          }),
          new TextRun({
            text: st.substrands.map((s) => s.substrandTitle).join('; '),
          }),
        ],
      })
    );
  }

  // Render SUPER-LIGHT CBC COMPILATION section (All Strands & Sub-strands 12+ Point Notes + Immediate Questions)
  if (bookType === 'MADE_FAMILIAR' || bookType === 'COMPLETE_BUNDLE') {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'SUPER-LIGHT CBC COMPILATION — IN-DEPTH POINT-FORM SHORT NOTES & IMMEDIATE SUB-STRAND QUESTIONS',
            bold: true,
          }),
        ],
      })
    );

    let qIdx = 0;
    for (const st of primaryNotesTree.strands) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({
              text: `STRAND ${st.strandIndex}: ${st.strandTitle} (${st.totalPoints} Essential Revision Points)`,
              bold: true,
            }),
          ],
        })
      );

      for (const sub of st.substrands) {
        children.push(
          new Paragraph({
            spacing: { before: 140, after: 60 },
            children: [
              new TextRun({
                text: `Sub-strand ${sub.substrandCode}: ${sub.substrandTitle} (${sub.points.length} Points)`,
                bold: true,
                size: 23,
              }),
            ],
          })
        );

        for (const pt of sub.points) {
          children.push(
            new Paragraph({
              spacing: { before: 30, after: 30 },
              children: [new TextRun({ text: pt })],
            })
          );
        }

        children.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [
              new TextRun({
                text: `Topical Practice Questions on Sub-strand ${sub.substrandCode} (${sub.substrandTitle}):`,
                bold: true,
              }),
            ],
          })
        );

        const subQs = madeFamiliarQuestions.slice(qIdx, qIdx + qPerSub);
        qIdx += qPerSub;
        for (const q of subQs) {
          children.push(
            new Paragraph({
              spacing: { before: 60 },
              children: [
                new TextRun({
                  text: `Q${q.qNumber}. ${q.prompt} (${q.marks} Marks)`,
                  bold: true,
                }),
              ],
            })
          );
          if (q.options) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   A) ${q.options[0]}   B) ${q.options[1]}   C) ${q.options[2]}   D) ${q.options[3]}`,
                  }),
                ],
              })
            );
          }
        }
      }
    }
  }

  // Render CBC GRADE UP section (Full 12+ pts/Sub-strand & 30+ pts/Strand Short Notes + 165 Exam Questions)
  if (bookType === 'GRADE_UP' || bookType === 'COMPLETE_BUNDLE') {
    const activeGradeUpNotes = secondaryNotesTree || primaryNotesTree;
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'CBC GRADE UP — COMPLETE STRAND & SUB-STRAND SHORT NOTES (12+ POINTS PER SUB-STRAND, 30+ PER STRAND)',
            bold: true,
          }),
        ],
      })
    );

    for (const st of activeGradeUpNotes.strands) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 70 },
          children: [
            new TextRun({
              text: `STRAND ${st.strandIndex}: ${st.strandTitle} (${st.totalPoints} Points)`,
              bold: true,
            }),
          ],
        })
      );
      for (const sub of st.substrands) {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 50 },
            children: [
              new TextRun({
                text: `Sub-strand ${sub.substrandCode}: ${sub.substrandTitle} (${sub.points.length} Points)`,
                bold: true,
                size: 22,
              }),
            ],
          })
        );
        for (const pt of sub.points) {
          children.push(
            new Paragraph({
              spacing: { before: 28, after: 28 },
              children: [new TextRun({ text: pt })],
            })
          );
        }
      }
    }

    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'CBC GRADE UP — TOPICAL & END-OF-STRAND EXAM QUESTIONS',
            bold: true,
          }),
        ],
      })
    );

    const gUpToRender =
      bookType === 'COMPLETE_BUNDLE'
        ? gradeUpQuestions.map((q, idx) => ({ ...q, qNumber: mfTotalQs + 1 + idx }))
        : gradeUpQuestions;

    for (const q of gUpToRender) {
      children.push(
        new Paragraph({
          spacing: { before: 90 },
          children: [
            new TextRun({
              text: `Q${q.qNumber}. [${q.substrand}] ${q.prompt} (${q.marks} Marks)`,
              bold: true,
            }),
          ],
        })
      );
      if (q.options) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `   A) ${q.options[0]}   B) ${q.options[1]}   C) ${q.options[2]}   D) ${q.options[3]}`,
              }),
            ],
          })
        );
      }
    }
  }

  // Complete Marking Schemes at the end of EVERY book!
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'OFFICIAL MARKING SCHEMES & WORKED SOLUTIONS',
          bold: true,
        }),
      ],
    })
  );

  for (const q of allQuestionsForMarking) {
    children.push(
      new Paragraph({
        spacing: { before: 60 },
        children: [
          new TextRun({
            text: `Q${q.qNumber} (${q.marks} mks): ${q.answerText} — `,
            bold: true,
          }),
          new TextRun({ text: q.explanation }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}
