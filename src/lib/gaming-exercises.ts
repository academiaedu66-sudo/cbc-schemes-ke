export interface ExerciseItem {
  q: string;
  options: [string, string, string, string];
  ans: number;
  exp: string;
  tags: string[]; // Strand / Sub-strand topic keywords for sequential end-of-strand matching
}

export interface StrandContext {
  gradeKey: string;
  gradeLabel: string;
  subject: string;
  strand: string;
  substrand: string;
}

export function packChoices(
  correct: string | number,
  distractors: Array<string | number>,
  seed: number
): { options: [string, string, string, string]; ans: number } {
  const corrStr = String(correct).trim();
  const uniqueDist: string[] = [];
  for (const d of distractors) {
    const s = String(d).trim();
    if (s && s.toLowerCase() !== corrStr.toLowerCase() && !uniqueDist.includes(s)) {
      uniqueDist.push(s);
    }
    if (uniqueDist.length === 3) break;
  }
  let fallbackIdx = 1;
  while (uniqueDist.length < 3) {
    const fb = `Option ${fallbackIdx++}`;
    if (fb !== corrStr && !uniqueDist.includes(fb)) uniqueDist.push(fb);
  }

  const raw = [corrStr, uniqueDist[0], uniqueDist[1], uniqueDist[2]];
  // Deterministic permutation using seed so options are cleanly distributed A/B/C/D
  const arr = [...raw];
  let s = Math.abs(seed) + 17;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return {
    options: arr as [string, string, string, string],
    ans: arr.indexOf(corrStr),
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

// ============================================================================
// 1. END-OF-STRAND WORKED EXERCISE GENERATORS (BY SUBJECT DOMAIN)
// ============================================================================

export function generateWorkedMathematicsExercise(
  ctx: StrandContext,
  seed: number
): ExerciseItem {
  const upperG = ctx.gradeKey.toUpperCase();
  const isPP = upperG === 'PP1' || upperG === 'PP2';
  const gNum = isPP ? 0 : Number(upperG) || 7;
  const hay = `${ctx.strand} ${ctx.substrand}`.toLowerCase();
  const v = Math.abs(seed);

  // Early Years (PP1, PP2, Grades 1–3)
  if (isPP || gNum <= 3) {
    const mode = v % 5;
    const q = Math.floor(v / 5);
    if (mode === 0) {
      const shapes = [
        { name: 'triangle', sides: 3 },
        { name: 'square', sides: 4 },
        { name: 'rectangle', sides: 4 },
        { name: 'pentagon', sides: 5 },
        { name: 'hexagon', sides: 6 },
        { name: 'octagon', sides: 8 },
      ];
      const sh = shapes[q % shapes.length];
      const count = 2 + (Math.floor(q / shapes.length) % 24);
      const total = sh.sides * count;
      const p = packChoices(total, [total + 2, total - 1, total + 3], v);
      return {
        q: `One ${sh.name} has ${sh.sides} straight sides. How many sides do ${count} separate ${sh.name}s have altogether?`,
        options: p.options,
        ans: p.ans,
        exp: `${count} × ${sh.sides} sides = ${total} sides.`,
        tags: ['geometry', 'shape'],
      };
    }

    if (mode === 1) {
      const notes = [50, 100, 200, 500, 1000];
      const paid = notes[q % notes.length];
      const maxSteps = Math.max(4, Math.floor((paid - 15) / 5));
      const price = paid - 5 * (1 + (Math.floor(q / notes.length) % maxSteps));
      const change = paid - price;
      const p = packChoices(`KSh ${change}`, [`KSh ${change + 10}`, `KSh ${Math.max(5, change - 5)}`, `KSh ${change + 25}`], v);
      return {
        q: `A learner buys stationery for KSh ${price} and pays the shopkeeper with a KSh ${paid} note. How much balance (change) does the learner get?`,
        options: p.options,
        ans: p.ans,
        exp: `Balance = KSh ${paid} − KSh ${price} = KSh ${change}.`,
        tags: ['money', 'currency'],
      };
    }

    if (mode === 2) {
      const unit = ['m', 'cm', 'kg', 'litres'][q % 4];
      const a = 6 + (Math.floor(q / 4) % 47);
      const b = 5 + (Math.floor(q / 13) % 43);
      const sum = a + b;
      const p = packChoices(`${sum} ${unit}`, [`${sum + 3} ${unit}`, `${Math.abs(a - b) + 1} ${unit}`, `${sum + 10} ${unit}`], v);
      return {
        q: `Work out: ${a} ${unit} + ${b} ${unit} = ______`,
        options: p.options,
        ans: p.ans,
        exp: `${a} ${unit} + ${b} ${unit} = ${sum} ${unit}.`,
        tags: ['measurement', 'length', 'mass', 'capacity'],
      };
    }

    if (mode === 3) {
      const kids = 2 + (q % 9);
      const each = 2 + (Math.floor(q / 9) % 16);
      const mangoes = kids * each;
      const p = packChoices(each, [each + 2, Math.max(1, each - 1), each + 5], v);
      return {
        q: `Mother shared ${mangoes} ripe mangoes equally among ${kids} children. How many mangoes did each child get?`,
        options: p.options,
        ans: p.ans,
        exp: `${mangoes} ÷ ${kids} = ${each} mangoes each.`,
        tags: ['division', 'sharing'],
      };
    }

    if (q % 2 === 0) {
      const a = 5 + (q % 71);
      const b = 4 + (Math.floor(q / 7) % 61);
      const sum = a + b;
      const p = packChoices(sum, [sum + 2, sum - 1, sum + 10], v);
      return {
        q: `Add the whole numbers: ${a} + ${b} = ______`,
        options: p.options,
        ans: p.ans,
        exp: `${a} + ${b} = ${sum}.`,
        tags: ['numbers', 'addition'],
      };
    } else {
      const sub = 6 + (q % 47);
      const ans = 7 + (Math.floor(q / 11) % 59);
      const top = sub + ans;
      const p = packChoices(ans, [ans + 3, Math.max(1, ans - 2), ans + 10], v);
      return {
        q: `Work out the subtraction: ${top} − ${sub} = ______`,
        options: p.options,
        ans: p.ans,
        exp: `${top} − ${sub} = ${ans}.`,
        tags: ['numbers', 'subtraction'],
      };
    }
  }

  // Strand: CALCULUS / MATRICES / ALGEBRA (Grades 4–12)
  if (hay.includes('calculus') || hay.includes('differentiation') || hay.includes('integration')) {
    const a = 2 + (v % 11);
    const n = 2 + (Math.floor(v / 11) % 4);
    const b = 3 + (Math.floor(v / 44) % 19);
    const c = 1 + (v % 13);
    const coef = a * n;
    const pwr = n - 1 === 1 ? 'x' : `x^${n - 1}`;
    const corr = `${coef}${pwr} + ${b}`;
    const p = packChoices(corr, [`${a}${pwr} + ${b}`, `${coef}x^${n} + ${b}`, `${coef}${pwr}`], v);
    return {
      q: `Find the derivative dy/dx of the curve y = ${a}x^${n} + ${b}x − ${c}.`,
      options: p.options,
      ans: p.ans,
      exp: `Applying dy/dx (ax^n) = a·n·x^(n−1): dy/dx = ${coef}${pwr} + ${b}.`,
      tags: ['calculus', 'differentiation'],
    };
  }

  if (hay.includes('matri')) {
    const a = 2 + (v % 9);
    const b = 1 + (Math.floor(v / 9) % 7);
    const c = 1 + (Math.floor(v / 63) % 6);
    const d = 3 + (Math.floor(v / 7) % 8);
    const det = a * d - b * c;
    const p = packChoices(det, [a * d + b * c, det + 5, det - 3], v);
    return {
      q: `Find the determinant of the 2×2 matrix M = [[${a}, ${b}], [${c}, ${d}]].`,
      options: p.options,
      ans: p.ans,
      exp: `Determinant = ad − bc = (${a} × ${d}) − (${b} × ${c}) = ${a * d} − ${b * c} = ${det}.`,
      tags: ['matrices', 'algebra'],
    };
  }

  if (hay.includes('quadratic')) {
    const r1 = 1 + (v % 11);
    const r2 = r1 + 1 + (Math.floor(v / 11) % 12);
    const bCoef = r1 + r2;
    const cCoef = r1 * r2;
    const p = packChoices(`x = ${r1} or x = ${r2}`, [`x = -${r1} or x = -${r2}`, `x = ${r1} or x = -${r2}`, `x = ${bCoef} or x = ${cCoef}`], v);
    return {
      q: `Solve the quadratic equation by factorization: x² − ${bCoef}x + ${cCoef} = 0.`,
      options: p.options,
      ans: p.ans,
      exp: `(x − ${r1})(x − ${r2}) = 0, giving roots x = ${r1} or x = ${r2}.`,
      tags: ['quadratic', 'algebra'],
    };
  }

  if (hay.includes('algebra') || hay.includes('equation') || hay.includes('inequalit') || hay.includes('expression')) {
    if (v % 2 === 0) {
      const m = 2 + (v % 11);
      const x = 3 + (Math.floor(v / 11) % 19);
      const c = 4 + (Math.floor(v / 23) % 25);
      const rhs = m * x + c;
      const p = packChoices(`x = ${x}`, [`x = ${x + 2}`, `x = ${Math.max(1, x - 2)}`, `x = ${x + 4}`], v);
      return {
        q: `Solve for x in the linear equation: ${m}x + ${c} = ${rhs}.`,
        options: p.options,
        ans: p.ans,
        exp: `${m}x = ${rhs} − ${c} = ${m * x} ⇒ x = ${m * x} ÷ ${m} = ${x}.`,
        tags: ['algebra', 'equations'],
      };
    } else {
      const a1 = 3 + (v % 13);
      const b1 = 2 + (Math.floor(v / 13) % 11);
      const a2 = 2 + (Math.floor(v / 7) % 9);
      const b2 = 1 + (Math.floor(v / 17) % 8);
      const xCoef = a1 + a2;
      const yCoef = b1 + b2;
      const p = packChoices(`${xCoef}x + ${yCoef}y`, [`${xCoef}x − ${yCoef}y`, `${a1 * a2}x + ${b1 * b2}y`, `${xCoef + yCoef}xy`], v);
      return {
        q: `Simplify the algebraic expression by collecting like terms: ${a1}x + ${b1}y + ${a2}x + ${b2}y.`,
        options: p.options,
        ans: p.ans,
        exp: `Group like terms: (${a1} + ${a2})x + (${b1} + ${b2})y = ${xCoef}x + ${yCoef}y.`,
        tags: ['algebra', 'expressions'],
      };
    }
  }

  // Strand: MEASUREMENTS & COMMERCIAL ARITHMETIC
  if (
    hay.includes('measurement') ||
    hay.includes('area') ||
    hay.includes('volume') ||
    hay.includes('speed') ||
    hay.includes('commercial') ||
    hay.includes('money') ||
    hay.includes('interest') ||
    hay.includes('pythagor')
  ) {
    const mode = v % 4;
    const q = Math.floor(v / 4);
    if (mode === 0) {
      const r = 7 * (1 + (q % 12));
      const area = (22 * r * r) / 7;
      const circ = (2 * 22 * r) / 7;
      const p = packChoices(`${area} cm²`, [`${circ} cm²`, `${area + 44} cm²`, `${r * r} cm²`], v);
      return {
        q: `Calculate the area of a circular flowerbed of radius ${r} cm. (Take π = 22/7)`,
        options: p.options,
        ans: p.ans,
        exp: `Area = πr² = (22/7) × ${r} × ${r} = ${area} cm².`,
        tags: ['area', 'measurement'],
      };
    }
    if (mode === 1) {
      const l = 5 + (q % 13);
      const w = 4 + (Math.floor(q / 13) % 11);
      const h = 3 + (Math.floor(q / 7) % 9);
      const vol = l * w * h;
      const p = packChoices(`${vol} cm³`, [`${2 * (l * w + l * h + w * h)} cm³`, `${l + w + h} cm³`, `${vol + l * w} cm³`], v);
      return {
        q: `A rectangular water container measures ${l} cm long, ${w} cm wide, and ${h} cm high. Calculate its volume.`,
        options: p.options,
        ans: p.ans,
        exp: `Volume = length × width × height = ${l} × ${w} × ${h} = ${vol} cm³.`,
        tags: ['volume', 'measurement'],
      };
    }
    if (mode === 2) {
      const speed = 40 + 5 * (q % 15);
      const hrs = 2 + (Math.floor(q / 15) % 8);
      const dist = speed * hrs;
      const p = packChoices(`${dist} km`, [`${dist + speed} km`, `${Math.round(speed / hrs)} km`, `${dist - 25} km`], v);
      return {
        q: `A bus travels at an average speed of ${speed} km/h for ${hrs} hours. What total distance does it cover?`,
        options: p.options,
        ans: p.ans,
        exp: `Distance = Speed × Time = ${speed} km/h × ${hrs} h = ${dist} km.`,
        tags: ['speed', 'measurement'],
      };
    }
    const principal = 2000 * (2 + (q % 15));
    const rate = 4 + (Math.floor(q / 15) % 12);
    const time = 2 + (Math.floor(q / 7) % 5);
    const si = (principal * rate * time) / 100;
    const p = packChoices(`KSh ${si.toLocaleString()}`, [`KSh ${(si + principal).toLocaleString()}`, `KSh ${Math.round(si / 2).toLocaleString()}`, `KSh ${(si + 500).toLocaleString()}`], v);
    return {
      q: `Calculate the simple interest earned on KSh ${principal.toLocaleString()} invested at ${rate}% per annum for ${time} years.`,
      options: p.options,
      ans: p.ans,
      exp: `Simple Interest = (P × R × T) / 100 = (${principal} × ${rate} × ${time}) / 100 = KSh ${si.toLocaleString()}.`,
      tags: ['interest', 'commercial', 'money'],
    };
  }

  // Strand: GEOMETRY & TRIGONOMETRY
  if (hay.includes('geometry') || hay.includes('angle') || hay.includes('polygon') || hay.includes('circle') || hay.includes('trigonometr') || hay.includes('loci')) {
    if (v % 2 === 0) {
      const a1 = 25 + (v % 61);
      const a2 = 30 + (Math.floor(v / 13) % 59);
      const a3 = 180 - a1 - a2;
      const p = packChoices(`${a3}°`, [`${a3 + 10}°`, `${Math.max(12, a3 - 10)}°`, `${360 - a1 - a2}°`], v);
      return {
        q: `Two interior angles of a triangle measure ${a1}° and ${a2}°. Calculate the size of the third interior angle.`,
        options: p.options,
        ans: p.ans,
        exp: `Interior angles of a triangle add up to 180°: 180° − (${a1}° + ${a2}°) = ${a3}°.`,
        tags: ['geometry', 'angles'],
      };
    } else {
      const sides = 5 + (v % 21);
      const sumDeg = (sides - 2) * 180;
      const p = packChoices(`${sumDeg}°`, [`${sides * 180}°`, `${sumDeg - 180}°`, `${sumDeg + 180}°`], v);
      return {
        q: `Find the sum of all interior angles of a convex ${sides}-sided polygon.`,
        options: p.options,
        ans: p.ans,
        exp: `Sum of interior angles = (n − 2) × 180° = (${sides} − 2) × 180° = ${sumDeg}°.`,
        tags: ['geometry', 'polygons'],
      };
    }
  }

  // Strand: DATA HANDLING, STATISTICS & PROBABILITY
  if (hay.includes('data') || hay.includes('statistic') || hay.includes('probabilit') || hay.includes('dispersion') || hay.includes('graph')) {
    if (v % 2 === 0) {
      const base = 12 + (v % 65);
      const step = 1 + (Math.floor(v / 65) % 5);
      const nums = [base - 2 * step, base - step, base, base + step, base + 2 * step];
      const p = packChoices(base, [base + step, base - step, base * 5], v);
      return {
        q: `Calculate the arithmetic mean of the five test scores: ${nums.join(', ')}.`,
        options: p.options,
        ans: p.ans,
        exp: `Sum = ${base * 5}; Mean = ${base * 5} ÷ 5 = ${base}.`,
        tags: ['data', 'mean', 'statistics'],
      };
    } else {
      const red = 2 + (v % 9);
      const blue = 3 + (Math.floor(v / 9) % 10);
      const green = 1 + (Math.floor(v / 17) % 8);
      const total = red + blue + green;
      const g = gcd(red, total);
      const corr = `${red / g}/${total / g}`;
      const g2 = gcd(blue, total);
      const d1 = `${blue / g2}/${total / g2}`;
      const p = packChoices(corr, [d1, `${red}/${blue + green}`, `1/${total + 1}`], v);
      return {
        q: `A bag contains ${red} red marbles, ${blue} blue marbles, and ${green} green marbles. If one marble is picked at random, what is the probability that it is red?`,
        options: p.options,
        ans: p.ans,
        exp: `Total marbles = ${total}. P(red) = ${red}/${total} = ${corr}.`,
        tags: ['probability', 'data'],
      };
    }
  }

  // Strand: NUMBERS (Place Value, GCD/LCM, Percentages, Squares, Integers)
  const numMode = v % 4;
  const nq = Math.floor(v / 4);
  if (numMode === 0) {
    const k = 2 + (nq % 23);
    const mPair = [[3, 4, 12], [4, 6, 12], [3, 5, 15], [4, 5, 20], [5, 6, 30]][Math.floor(nq / 23) % 5];
    const n1 = k * mPair[0];
    const n2 = k * mPair[1];
    const lcmVal = k * mPair[2];
    const p = packChoices(lcmVal, [k, n1 + n2, lcmVal + k * 2], v);
    return {
      q: `Two school bells ring at intervals of ${n1} minutes and ${n2} minutes respectively. If they ring together now, after how many minutes will they next ring together?`,
      options: p.options,
      ans: p.ans,
      exp: `The Least Common Multiple (LCM) of ${n1} and ${n2} is ${lcmVal} minutes.`,
      tags: ['numbers', 'lcm', 'gcd'],
    };
  }
  if (numMode === 1) {
    const pct = [10, 15, 20, 25, 30, 35, 40, 45, 60, 75][nq % 10];
    const amt = 100 * (2 + (Math.floor(nq / 10) % 25));
    const val = (pct * amt) / 100;
    const p = packChoices(val, [val + 40, Math.max(10, val - 30), val * 2], v);
    return {
      q: `Work out ${pct}% of ${amt}.`,
      options: p.options,
      ans: p.ans,
      exp: `(${pct} ÷ 100) × ${amt} = ${val}.`,
      tags: ['numbers', 'percentages', 'fractions'],
    };
  }
  if (numMode === 2) {
    const dTh = 1 + (nq % 9);
    const dH = (Math.floor(nq / 9) % 10);
    const dT = 1 + (Math.floor(nq / 17) % 9);
    const dO = 1 + (Math.floor(nq / 29) % 9);
    const fullNum = dTh * 1000 + dH * 100 + dT * 10 + dO;
    const totVal = dTh * 1000;
    const p = packChoices(totVal.toLocaleString(), [`${dTh * 100}`, `${dTh * 10000}`, `${dTh}`], v);
    return {
      q: `What is the total value of digit ${dTh} in the thousand’s place of ${fullNum.toLocaleString()}?`,
      options: p.options,
      ans: p.ans,
      exp: `Digit ${dTh} is in the thousands place, so its total value is ${dTh} × 1,000 = ${totVal.toLocaleString()}.`,
      tags: ['numbers', 'place value'],
    };
  }
  const s1 = 3 + (nq % 19);
  const s2 = 4 + (Math.floor(nq / 19) % 17);
  const res = s1 * s1 + s2 * s2;
  const p = packChoices(res, [(s1 + s2) * (s1 + s2), Math.abs(s1 * s1 - s2 * s2) + 1, s1 * 2 + s2 * 2], v);
  return {
    q: `Evaluate: ${s1}² + ${s2}².`,
    options: p.options,
    ans: p.ans,
    exp: `${s1}² + ${s2}² = ${s1 * s1} + ${s2 * s2} = ${res}.`,
    tags: ['numbers', 'squares'],
  };
}

// Worked End-of-Strand Generators for Science, Business, Tech/Computer, Geography/Social, Agriculture, Creative & Religious Studies
export function generateWorkedDomainExercise(
  domain: string,
  ctx: StrandContext,
  seed: number
): ExerciseItem | null {
  const hay = `${ctx.strand} ${ctx.substrand}`.toLowerCase();
  const v = Math.abs(seed);

  // SCIENCE / BIOLOGY / CHEMISTRY / PHYSICS WORKED EXERCISES
  if (domain === 'science' || domain === 'biology' || domain === 'chemistry' || domain === 'physics') {
    if (domain === 'biology' || (domain === 'science' && (hay.includes('microscop') || hay.includes('cell') || hay.includes('living')))) {
      if (v % 2 === 0) {
        const q = Math.floor(v / 2);
        const actMm = 10 + 5 * (q % 14); // 10..75 mm
        const magFactor = 2 + (Math.floor(q / 14) % 9); // ×2..×10
        const drawMm = actMm * magFactor;
        const p = packChoices(`×${magFactor}`, [`×${drawMm + actMm}`, `×${magFactor + 2}`, `×${(1 / magFactor).toFixed(2)}`], v);
        return {
          q: `In a biology practical, a fresh hibiscus leaf has an actual length of ${actMm} mm. A student draws a biological diagram of the leaf measuring ${drawMm} mm long. Calculate the linear magnification of the drawing.`,
          options: p.options,
          ans: p.ans,
          exp: `Drawing magnification = Drawing length ÷ Actual length = ${drawMm} mm ÷ ${actMm} mm = ×${magFactor}.`,
          tags: ['microscope', 'cell', 'biology', 'living'],
        };
      } else {
        const q = Math.floor(v / 2);
        const quads = 4 + (q % 9);
        const avgPerQuad = 3 + (Math.floor(q / 9) % 14);
        const totalPlants = quads * avgPerQuad;
        const p = packChoices(`${avgPerQuad} plants/m²`, [`${totalPlants} plants/m²`, `${totalPlants * quads} plants/m²`, `${avgPerQuad + 4} plants/m²`], v);
        return {
          q: `During an ecology study on the school field, learners threw a 1 m² quadrat ${quads} times at random and counted a total of ${totalPlants} blackjack plants. Calculate the average population density per m².`,
          options: p.options,
          ans: p.ans,
          exp: `Average density = Total plants counted ÷ Total area sampled = ${totalPlants} ÷ ${quads} m² = ${avgPerQuad} plants/m².`,
          tags: ['ecology', 'biology', 'living'],
        };
      }
    }

    if (domain === 'chemistry' || (domain === 'science' && (hay.includes('atom') || hay.includes('element') || hay.includes('mixture') || hay.includes('acid')))) {
      if (v % 2 === 0) {
        const q = Math.floor(v / 2);
        const protons = 4 + (q % 26); // Z = 4..29
        const neutrons = protons + (Math.floor(q / 26) % 7);
        const massNum = protons + neutrons;
        const p = packChoices(massNum, [protons, neutrons, massNum + protons], v);
        return {
          q: `An atom of isotope X contains ${protons} protons and ${neutrons} neutrons in its nucleus. What is its mass number (nucleon number)?`,
          options: p.options,
          ans: p.ans,
          exp: `Mass number (A) = Protons (${protons}) + Neutrons (${neutrons}) = ${massNum}.`,
          tags: ['atom', 'chemistry', 'elements'],
        };
      } else {
        const q = Math.floor(v / 2);
        const molarMasses: Array<[string, number]> = [
          ['NaOH', 40],
          ['CaCO₃', 100],
          ['H₂SO₄', 98],
          ['NaCl', 58.5],
          ['KOH', 56],
          ['MgO', 40],
        ];
        const [formula, mr] = molarMasses[q % molarMasses.length];
        const moles = (1 + (Math.floor(q / molarMasses.length) % 18)) * 0.5;
        const massG = Number((moles * mr).toFixed(2));
        const p = packChoices(`${moles} moles`, [`${(moles * 2).toFixed(1)} moles`, `${(massG + mr).toFixed(1)} moles`, `${(moles / 2).toFixed(2)} moles`], v);
        return {
          q: `Calculate the number of moles contained in ${massG} g of pure ${formula} (Relative Formula Mass = ${mr}).`,
          options: p.options,
          ans: p.ans,
          exp: `Moles = Mass ÷ Molar Mass = ${massG} g ÷ ${mr} g/mol = ${moles} moles.`,
          tags: ['stoichiometry', 'chemistry', 'mole'],
        };
      }
    }

    // Physics / Force & Energy calculations
    const physMode = v % 4;
    const pq = Math.floor(v / 4);
    if (physMode === 0) {
      const area = 2 + (pq % 11);
      const pressure = 25 + 15 * (Math.floor(pq / 11) % 16);
      const force = area * pressure;
      const p = packChoices(`${pressure} Pa`, [`${force * area} Pa`, `${force + area} Pa`, `${Math.round(pressure / 2)} Pa`], v);
      return {
        q: `A crate exerts a perpendicular force of ${force} N over a floor contact area of ${area} m². Calculate the pressure exerted in Pascals.`,
        options: p.options,
        ans: p.ans,
        exp: `Pressure = Force ÷ Area = ${force} N ÷ ${area} m² = ${pressure} Pa (N/m²).`,
        tags: ['pressure', 'force', 'physics'],
      };
    }
    if (physMode === 1) {
      const current = 2 + (pq % 11);
      const res = 3 + (Math.floor(pq / 11) % 17);
      const volt = current * res;
      const p = packChoices(`${volt} V`, [`${current + res} V`, `${(res / current).toFixed(1)} V`, `${volt * 2} V`], v);
      return {
        q: `An electric resistor of ${res} Ω carries a steady current of ${current} A. Calculate the potential difference (voltage) across it.`,
        options: p.options,
        ans: p.ans,
        exp: `By Ohm’s Law, V = I × R = ${current} A × ${res} Ω = ${volt} V.`,
        tags: ['electricity', 'force', 'physics'],
      };
    }
    if (physMode === 2) {
      const freq = 10 + 5 * (pq % 17);
      const waveLen = 2 + (Math.floor(pq / 17) % 11);
      const speed = freq * waveLen;
      const p = packChoices(`${speed} m/s`, [`${freq + waveLen} m/s`, `${(freq / waveLen).toFixed(1)} m/s`, `${speed + 20} m/s`], v);
      return {
        q: `A progressive wave travels with a frequency of ${freq} Hz and a wavelength of ${waveLen} m. Calculate the wave speed.`,
        options: p.options,
        ans: p.ans,
        exp: `Wave speed v = f × λ = ${freq} Hz × ${waveLen} m = ${speed} m/s.`,
        tags: ['waves', 'energy', 'physics'],
      };
    }
    const vol = 10 + 5 * (pq % 13);
    const dens = 2 + (Math.floor(pq / 13) % 12);
    const mass = vol * dens;
    const p = packChoices(`${dens} g/cm³`, [`${mass * vol} g/cm³`, `${mass - vol} g/cm³`, `${dens + 3} g/cm³`], v);
    return {
      q: `A metallic specimen of mass ${mass} g displaces ${vol} cm³ of water in an eureka can. Calculate its density.`,
      options: p.options,
      ans: p.ans,
      exp: `Density = Mass ÷ Volume = ${mass} g ÷ ${vol} cm³ = ${dens} g/cm³.`,
      tags: ['density', 'scientific', 'physics'],
    };
  }

  // BUSINESS STUDIES WORKED EXERCISES
  if (domain === 'business') {
    if (v % 2 === 0) {
      const q = Math.floor(v / 2);
      const cap = 40000 + 10000 * (q % 19);
      const liab = 15000 + 5000 * (Math.floor(q / 19) % 13);
      const assets = cap + liab;
      const p = packChoices(`KSh ${cap.toLocaleString()}`, [`KSh ${(assets + liab).toLocaleString()}`, `KSh ${liab.toLocaleString()}`, `KSh ${(cap - 10000).toLocaleString()}`], v);
      return {
        q: `At the close of the financial year, Baraka Enterprises had Total Assets of KSh ${assets.toLocaleString()} and Total Liabilities of KSh ${liab.toLocaleString()}. Calculate the owner’s Capital.`,
        options: p.options,
        ans: p.ans,
        exp: `Assets = Capital + Liabilities ⇒ Capital = ${assets.toLocaleString()} − ${liab.toLocaleString()} = KSh ${cap.toLocaleString()}.`,
        tags: ['accounting', 'bookkeeping', 'finance'],
      };
    } else {
      const q = Math.floor(v / 2);
      const cost = 18000 + 3000 * (q % 17);
      const gross = 7000 + 1500 * (Math.floor(q / 17) % 11);
      const exp = 2000 + 500 * (Math.floor(q / 7) % 9);
      const sales = cost + gross;
      const net = gross - exp;
      const p = packChoices(`KSh ${net.toLocaleString()}`, [`KSh ${gross.toLocaleString()}`, `KSh ${(gross + exp).toLocaleString()}`, `KSh ${(sales - exp).toLocaleString()}`], v);
      return {
        q: `A trader bought goods for KSh ${cost.toLocaleString()} and sold them for KSh ${sales.toLocaleString()}. Given operating expenses of KSh ${exp.toLocaleString()}, calculate the Net Profit.`,
        options: p.options,
        ans: p.ans,
        exp: `Gross Profit = ${sales.toLocaleString()} − ${cost.toLocaleString()} = KSh ${gross.toLocaleString()}; Net Profit = ${gross.toLocaleString()} − ${exp.toLocaleString()} = KSh ${net.toLocaleString()}.`,
        tags: ['profit', 'income', 'finance'],
      };
    }
  }

  // PRE-TECHNICAL & COMPUTER STUDIES WORKED EXERCISES
  if (domain === 'pretech_computer') {
    if (v % 2 === 0) {
      const q = Math.floor(v / 2);
      const dec = 8 + (q % 235); // 8..242 -> 235 unique 8-bit binary conversions!
      const bin = dec.toString(2).padStart(8, '0');
      const w1 = (dec + 1).toString(2).padStart(8, '0');
      const w2 = (dec + 2).toString(2).padStart(8, '0');
      const w3 = Math.max(1, dec - 3).toString(2).padStart(8, '0');
      const p = packChoices(bin, [w1, w2, w3], v);
      return {
        q: `Convert the denary (base 10) whole number ${dec} into its 8-bit binary (base 2) equivalent.`,
        options: p.options,
        ans: p.ans,
        exp: `Dividing ${dec} repeatedly by 2 gives the 8-bit binary number ${bin}₂.`,
        tags: ['computer', 'programming', 'hardware'],
      };
    } else {
      const q = Math.floor(v / 2);
      const a = 10 + (q % 29);
      const b = 12 + (Math.floor(q / 29) % 31);
      const c = 14 + (Math.floor(q / 13) % 23);
      const sum = a + b + c;
      const p = packChoices(sum, [Math.round(sum / 3), Math.max(a, b, c), sum + 10], v);
      return {
        q: `In a spreadsheet worksheet, cells B2, B3, and B4 contain ${a}, ${b}, and ${c} respectively. What result is returned by the formula =SUM(B2:B4)?`,
        options: p.options,
        ans: p.ans,
        exp: `=SUM(B2:B4) computes ${a} + ${b} + ${c} = ${sum}.`,
        tags: ['spreadsheet', 'productivity', 'software'],
      };
    }
  }

  // SOCIAL STUDIES / GEOGRAPHY / HISTORY WORKED EXERCISES
  if (domain === 'social_history_geography') {
    if (v % 2 === 0) {
      const q = Math.floor(v / 2);
      const scales: Array<[string, number]> = [
        ['1:50,000', 0.5],
        ['1:100,000', 1],
        ['1:25,000', 0.25],
      ];
      const [scaleLbl, factorKm] = scales[q % scales.length];
      const cm = 4 + (Math.floor(q / scales.length) % 36);
      const km = Number((cm * factorKm).toFixed(2));
      const p = packChoices(`${km} km`, [`${(km * 10).toFixed(1)} km`, `${(km * 2).toFixed(2)} km`, `${(km + 3).toFixed(2)} km`], v);
      return {
        q: `On a ${scaleLbl} topographical map, a straight murram road measures ${cm} cm. Calculate the actual ground distance of the road in kilometres.`,
        options: p.options,
        ans: p.ans,
        exp: `At scale ${scaleLbl}, 1 cm represents ${factorKm} km, so ${cm} cm × ${factorKm} = ${km} km.`,
        tags: ['map', 'scale', 'environment'],
      };
    } else {
      const q = Math.floor(v / 2);
      const minT = 8 + (q % 17);
      const range = 5 + (Math.floor(q / 17) % 16);
      const maxT = minT + range;
      const p = packChoices(`${range}°C`, [`${maxT + minT}°C`, `${((maxT + minT) / 2).toFixed(1)}°C`, `${range + 4}°C`], v);
      return {
        q: `A school weather station recorded a daily maximum temperature of ${maxT}°C and a minimum temperature of ${minT}°C. Calculate the diurnal temperature range.`,
        options: p.options,
        ans: p.ans,
        exp: `Diurnal temperature range = ${maxT}°C − ${minT}°C = ${range}°C.`,
        tags: ['weather', 'climate', 'environment'],
      };
    }
  }

  // AGRICULTURE & ENVIRONMENTAL WORKED EXERCISES
  if (domain === 'agriculture' || domain === 'environmental') {
    const q = v;
    const lengthM = 4 + 2 * (q % 13);
    const widthM = 3 + (Math.floor(q / 13) % 11);
    const area = lengthM * widthM;
    const rateGrams = 100 * (1 + (Math.floor(q / 7) % 6)); // 100..600 g per m²
    const totalKg = Number(((area * rateGrams) / 1000).toFixed(2));
    const p = packChoices(`${totalKg} kg`, [`${area} kg`, `${(totalKg * 10).toFixed(1)} kg`, `${rateGrams} kg`], v);
    return {
      q: `A school garden plot measures ${lengthM} m long by ${widthM} m wide. If organic compost manure is applied at ${rateGrams} g per square metre, how many kilograms of compost are required?`,
      options: p.options,
      ans: p.ans,
      exp: `Plot area = ${lengthM} × ${widthM} = ${area} m². Total compost = (${area} × ${rateGrams} g) ÷ 1,000 = ${totalKg} kg.`,
      tags: ['crop', 'soil', 'food', 'garden'],
    };
  }

  // CREATIVE ARTS & SPORTS WORKED RHYTHM / SCORE EXERCISES
  if (domain === 'creative_sports') {
    const semibreves = 1 + (v % 6);
    const minims = 1 + (Math.floor(v / 6) % 7);
    const crotchets = 1 + (Math.floor(v / 42) % 8);
    const beats = semibreves * 4 + minims * 2 + crotchets * 1;
    const p = packChoices(`${beats} crotchet beats`, [`${beats + 2} crotchet beats`, `${semibreves + minims + crotchets} crotchet beats`, `${Math.max(2, beats - 3)} crotchet beats`], v);
    return {
      q: `In staff music notation, calculate the total number of crotchet beats in ${semibreves} semibreve(s), ${minims} minim(s), and ${crotchets} crotchet(s).`,
      options: p.options,
      ans: p.ans,
      exp: `(${semibreves} × 4) + (${minims} × 2) + (${crotchets} × 1) = ${beats} crotchet beats.`,
      tags: ['music', 'rhythm', 'performing'],
    };
  }

  // IRE WORKED ZAKAH EXERCISES
  if (domain === 'ire') {
    const savings = 160000 + 20000 * (v % 95);
    const zakah = Math.round(savings * 0.025);
    const p = packChoices(`KSh ${zakah.toLocaleString()}`, [`KSh ${(zakah * 2).toLocaleString()}`, `KSh ${(zakah * 4).toLocaleString()}`, `KSh ${Math.round(zakah / 2).toLocaleString()}`], v);
    return {
      q: `A Muslim trader has Halal savings of KSh ${savings.toLocaleString()} above the Nisab for one lunar year (Hawl). Calculate the obligatory Zakah payable at 2.5%.`,
      options: p.options,
      ans: p.ans,
      exp: `Zakah = 2.5% × KSh ${savings.toLocaleString()} = KSh ${zakah.toLocaleString()}.`,
      tags: ['zakah', 'ibadah', 'pillars'],
    };
  }

  // CRE WORKED CHRISTIAN STEWARDSHIP / TITHE EXERCISES
  if (domain === 'cre') {
    const harvest = 10 * (2 + (v % 85));
    const tithe = harvest / 10;
    const p = packChoices(`${tithe} bags`, [`${tithe * 2} bags`, `${Math.max(1, tithe - 1)} bags`, `${harvest - tithe} bags`], v);
    return {
      q: `Practising Christian stewardship and giving (Malachi 3:10 / Leviticus 27:30), a family harvests ${harvest} bags of maize and sets aside a tithe (one-tenth) to support church work and orphans. How many bags do they give as tithe?`,
      options: p.options,
      ans: p.ans,
      exp: `One-tenth (10%) of ${harvest} bags = ${harvest} ÷ 10 = ${tithe} bags.`,
      tags: ['stewardship', 'wealth', 'christian living'],
    };
  }

  return null;
}

// ============================================================================
// 2. ENGLISH & LANGUAGE ACTIVITIES — END-OF-STRAND EXERCISES (130+ ITEMS)
// ============================================================================

function buildEnglishExercises(): ExerciseItem[] {
  const items: ExerciseItem[] = [];
  let s = 101;

  // A) Question Tags (Listening/Speaking & Grammar)
  const tagRows: Array<[string, string, [string, string, string]]> = [
    ['Amina speaks fluent English', "doesn't she?", ['does she?', "isn't she?", "didn't she?"]],
    ['The learners have completed their homework', "haven't they?", ['have they?', "didn't they?", "aren't they?"]],
    ['Juma did not attend choir practice yesterday', 'did he?', ["didn't he?", 'was he?', 'does he?']],
    ['Let us plant tree seedlings around the school', 'shall we?', ['will we?', "shan't we?", "don't we?"]],
    ['Open the classroom windows quietly', 'will you?', ["don't you?", 'shall you?', 'do you?']],
    ['I am the next speaker in the debate', "aren't I?", ['am I not?', 'am I?', "isn't I?"]],
    ['She rarely arrives late for morning assembly', 'does she?', ["doesn't she?", 'is she?', 'did she?']],
    ['Nothing was damaged during the heavy rain', 'was it?', ["wasn't it?", 'were they?', 'did it?']],
    ['Everyone stood at attention for the anthem', "didn't they?", ["didn't he?", 'did they?', "weren't they?"]],
    ['We will visit Nairobi National Museum tomorrow', "won't we?", ['will we?', "shan't we?", "wouldn't we?"]],
    ['You can ride a bicycle safely', "can't you?", ['can you?', "don't you?", "couldn't you?"]],
    ['The baby was sleeping peacefully in the cot', "wasn't it?", ['was it?', "isn't it?", "weren't they?"]],
  ];
  for (const [stem, corr, dist] of tagRows) {
    const p = packChoices(corr, dist, s++);
    items.push({
      q: `Supply the correct question tag: "${stem}, ________"`,
      options: p.options,
      ans: p.ans,
      exp: `The statement "${stem}" takes the question tag "${corr}".`,
      tags: ['grammar', 'language', 'tag', 'speaking', 'sentence'],
    });
  }

  // B) Active to Passive Voice
  const passiveRows: Array<[string, string, [string, string, string]]> = [
    ['The prefect rang the school bell.', 'The school bell was rung by the prefect.', ['The school bell is rung by the prefect.', 'The school bell had rung by the prefect.', 'The school bell was ringed by the prefect.']],
    ['The chef is preparing a balanced meal.', 'A balanced meal is being prepared by the chef.', ['A balanced meal was being prepared by the chef.', 'A balanced meal has been prepared by the chef.', 'A balanced meal is prepared by the chef.']],
    ['Wanjiku has written a neat formal letter.', 'A neat formal letter has been written by Wanjiku.', ['A neat formal letter was written by Wanjiku.', 'A neat formal letter had been written by Wanjiku.', 'A neat formal letter is written by Wanjiku.']],
    ['Farmers grow tea in Kericho County.', 'Tea is grown in Kericho County by farmers.', ['Tea was grown in Kericho County by farmers.', 'Tea is being grown in Kericho County by farmers.', 'Tea has grown in Kericho County by farmers.']],
    ['The goalkeeper caught the penalty shot.', 'The penalty shot was caught by the goalkeeper.', ['The penalty shot is caught by the goalkeeper.', 'The penalty shot was catched by the goalkeeper.', 'The penalty shot had caught by the goalkeeper.']],
    ['Our class will clean the science laboratory.', 'The science laboratory will be cleaned by our class.', ['The science laboratory would be cleaned by our class.', 'The science laboratory is cleaned by our class.', 'The science laboratory will cleaned by our class.']],
  ];
  for (const [act, corr, dist] of passiveRows) {
    const p = packChoices(corr, dist, s++);
    items.push({
      q: `Rewrite in the passive voice: "${act}"`,
      options: p.options,
      ans: p.ans,
      exp: `Maintaining the original verb tense gives: "${corr}"`,
      tags: ['grammar', 'voice', 'writing', 'sentence'],
    });
  }

  // C) Prepositions, Conjunctions & Pronouns in Context
  const prepRows: Array<[string, string, [string, string, string], string]> = [
    ['The pupils congratulated Moraa ______ winning the science fair.', 'on', ['for', 'at', 'with'], 'We say "congratulate someone ON" an achievement.'],
    ['My elder sister prefers fresh milk ______ soda.', 'to', ['than', 'over', 'from'], 'The verb "prefer" pairs with the preposition "to".'],
    ['The headteacher divided the textbooks ______ the four streams.', 'among', ['between', 'into', 'within'], '"Among" is used for three or more groups; "between" is for two.'],
    ['The cat jumped ______ the open window into the garden.', 'through', ['across', 'over', 'along'], '"Through" shows movement from one side of an enclosed opening to the other.'],
    ['Neither the captain ______ the players were discouraged by the rain.', 'nor', ['or', 'and', 'but'], '"Neither" always pairs with the correlative conjunction "nor".'],
    ['______ it was raining heavily, the marathon runners finished the race.', 'Although', ['Despite', 'Because', 'Unless'], '"Although" introduces a full clause of contrast (subject + verb).'],
    ['You will not pass the driving test ______ you practise regularly.', 'unless', ['if', 'whether', 'since'], '"Unless" means "except if".'],
    ['The boy ______ bicycle had a flat tyre walked to school.', 'whose', ['who', 'whom', 'which'], '"Whose" is the possessive relative pronoun showing ownership.'],
    ['Each of the participants ______ awarded a certificate of merit.', 'was', ['were', 'are', 'have'], 'Singular indefinite pronoun "Each" takes a singular verb ("was").'],
    ['The luggage ______ too heavy for the little boy to lift alone.', 'is', ['are', 'were', 'have been'], '"Luggage" is an uncountable noun and takes a singular verb ("is").'],
    ['She has lived in Nakuru ______ 2019.', 'since', ['for', 'from', 'by'], '"Since" marks a specific starting point in time; "for" marks a duration.'],
    ['The patient succumbed ______ malaria before reaching the clinic.', 'to', ['from', 'of', 'with'], 'The correct English collocation is "succumb to".'],
  ];
  for (const [sent, corr, dist, exp] of prepRows) {
    const p = packChoices(corr, dist, s++);
    items.push({
      q: `Choose the correct word to fill the blank: "${sent}"`,
      options: p.options,
      ans: p.ans,
      exp,
      tags: ['grammar', 'prepositions', 'conjunctions', 'language'],
    });
  }

  // D) Vocabulary: Synonyms, Antonyms, Homophones, Silent Letters & Collective Nouns
  const vocabRows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['Which letter is SILENT when pronouncing the word "KNIFE"?', 'k', ['n', 'f', 'i'], 'In words beginning with "kn-" (knife, knee, knock), the "k" is silent.', ['listening', 'pronunciation', 'phonics', 'sound']],
    ['Which letter is SILENT in the word "PLUMBER"?', 'b', ['p', 'm', 'r'], 'After "m" at the end of a root (comb, lamb, plumber), "b" is silent.', ['listening', 'pronunciation', 'phonics']],
    ['Which letter is SILENT in the word "HONEST"?', 'h', ['o', 'n', 't'], '"Honest", "hour", and "heir" begin with a silent "h".', ['listening', 'pronunciation', 'phonics']],
    ['Choose the correct collective noun: A ________ of ships sailed into Mombasa Port.', 'fleet', ['flock', 'herd', 'pack'], 'A group of ships is called a fleet.', ['vocabulary', 'nouns', 'reading']],
    ['Choose the correct collective noun: A ________ of bees settled on the mango tree.', 'swarm', ['pride', 'shoal', 'troop'], 'A large group of bees or flying insects is a swarm.', ['vocabulary', 'nouns', 'reading']],
    ['Choose the correct collective noun: The bride carried a colourful ________ of flowers.', 'bouquet', ['bunch', 'bundle', 'constellation'], 'Arranged flowers carried or gifted form a bouquet.', ['vocabulary', 'nouns']],
    ['Select the word OPPOSITE in meaning (antonym) to "GENEROUS":', 'stingy', ['kind', 'wealthy', 'polite'], '"Generous" means willing to give freely; its antonym is "stingy" (mean).', ['vocabulary', 'reading']],
    ['Select the word CLOSEST in meaning (synonym) to "COURAGEOUS":', 'brave', ['timid', 'careless', 'fierce'], '"Courageous" and "brave" both mean showing no fear in difficulty.', ['vocabulary', 'reading']],
    ['Select the antonym of the word "ANCIENT":', 'modern', ['antique', 'historic', 'aged'], '"Ancient" means very old; its opposite is "modern".', ['vocabulary', 'reading']],
    ['Choose the correct homophone: The school ________ addressed the parents in the hall.', 'principal', ['principle', 'princely', 'principals'], '"Principal" is the head of a school; "principle" is a moral rule.', ['vocabulary', 'spelling', 'writing']],
    ['Choose the correct homophone: We bought pens, rulers, and envelopes at the ________ shop.', 'stationery', ['stationary', 'stationery’s', 'stationing'], '"Stationery" (with -ery) refers to writing materials; "stationary" means not moving.', ['vocabulary', 'spelling', 'writing']],
    ['What does the phrasal verb "put out" mean in: "Firefighters quickly put out the fire"?', 'extinguished', ['started', 'announced', 'postponed'], 'To "put out" a fire or light means to extinguish it.', ['vocabulary', 'grammar', 'reading']],
    ['What does the phrasal verb "call off" mean in: "The referee had to call off the match"?', 'cancel', ['telephone', 'celebrate', 'begin'], 'To "call off" an event means to cancel it.', ['vocabulary', 'grammar', 'reading']],
    ['When greeting your teacher at 8:00 a.m., what is the most polite greeting to use?', 'Good morning, Teacher.', ['Good night, Teacher.', 'Good evening, Teacher.', 'Goodbye, Teacher.'], '"Good morning" is used politely from sunrise until noon.', ['greetings', 'polite', 'etiquette', 'listening']],
    ['What polite expression should you use when asking to pass between two elders?', 'Excuse me, please.', ['Move away!', 'Look at me.', 'Hurry up!'], '"Excuse me, please" demonstrates courtesy and respect.', ['polite', 'etiquette', 'listening']],
    ['In oral literature, "My house has no door" (Answer: An egg) is an example of a:', 'riddle', ['proverb', 'lullaby', 'dirge'], 'A riddle presents a puzzling metaphor in a challenge-and-response session.', ['oral', 'riddles', 'listening', 'literature']],
    ['Which oral song is sung softly to soothe a crying baby to sleep?', 'A lullaby', ['A work song', 'A war song', 'A wedding chant'], 'Lullabies use gentle rhythm and repetition to calm babies to sleep.', ['oral', 'songs', 'literature']],
    ['In a formal letter of application, which complimentary close follows "Dear Sir/Madam,"?', 'Yours faithfully,', ['Yours sincerely,', 'Your loving friend,', 'Best wishes,'], 'When the recipient is not addressed by name ("Dear Sir/Madam"), close with "Yours faithfully,".', ['writing', 'letter', 'functional']],
    ['Which written record captures the official deliberations and resolutions of a club meeting?', 'Minutes', ['A recipe', 'A personal diary', 'An inventory'], 'Minutes are the official structured record of a meeting’s agenda and decisions.', ['writing', 'minutes', 'functional']],
    ['Which punctuation mark is placed at the end of a direct question?', 'Question mark (?)', ['Full stop (.)', 'Comma (,)', 'Semicolon (;)'], 'Every direct interrogative sentence ends with a question mark (?).', ['writing', 'punctuation', 'capital']],
    ['Which word below is an ADJECTIVE in: "The tall giraffe ate green acacia leaves"?', 'tall', ['giraffe', 'ate', 'leaves'], '"Tall" (and "green") describes a noun, making it an adjective.', ['grammar', 'adjectives']],
    ['Choose the correct plural of the noun "CHILD":', 'children', ['childs', 'childrens', 'childes'], '"Child" forms an irregular plural: "children".', ['nouns', 'plural', 'grammar']],
    ['Choose the correct plural of the noun "LOAF":', 'loaves', ['loafs', 'loafes', 'loavs'], 'Nouns ending in -f like "loaf", "leaf", and "knife" change -f to -ves in the plural.', ['nouns', 'plural', 'grammar']],
    ['Change to indirect (reported) speech: Ali said, "I am feeling happy today."', 'Ali said that he was feeling happy that day.', ['Ali said that I am feeling happy today.', 'Ali said that he is feeling happy today.', 'Ali asked if he was feeling happy today.'], 'Present continuous shifts to past continuous ("was feeling") and "today" becomes "that day".', ['grammar', 'speech', 'writing']],
  ];
  for (const [q, corr, dist, exp, tags] of vocabRows) {
    const p = packChoices(corr, dist, s++);
    items.push({ q, options: p.options, ans: p.ans, exp, tags });
  }

  return items;
}

// ============================================================================
// 3. KISWAHILI — MAZOEZI YA MWISHO WA MADA (130+ PURE KISWAHILI ITEMS)
// ============================================================================

function buildKiswahiliExercises(): ExerciseItem[] {
  const items: ExerciseItem[] = [];
  let s = 301;

  // A) Maamkizi, Adabu na Kusikiliza/Kuzungumza
  const maamkizi: Array<[string, string, [string, string, string], string]> = [
    ['Mtu akikusalimia "Shikamoo!", unapaswa kumjibu vipi?', 'Marahaba', ['Sijambo', 'Binuru', 'Ahsante'], 'Jibu rasmi la heshima kwa "Shikamoo" ni "Marahaba".'],
    ['Jibu sahihi la maamkizi ya asubuhi "Sabalkheri!" ni lipi?', 'Aheri / Sabalkheri', ['Masalkheri', 'Alamsiki', 'Makiwa'], '"Sabalkheri" hujibiwa "Aheri" au "Sabalkheri".'],
    ['Wakati wa kuagana usiku mtu akisema "Alamsiki!", utamjibu:', 'Binuru', ['Marahaba', 'Tunayo', 'Salama'], '"Alamsiki" hujibiwa "Binuru" (maana yake: kwa nuru).'],
    ['Mtu aliyefiwa huambiwa "Makiwa!", naye hujibu vipi?', 'Tunayo / Yamepita', ['Ahsante sana', 'Sijambo', 'Binuru'], 'Aliyefiwa akipewa pole kwa neno "Makiwa" hujibu "Tunayo" au "Yamepita".'],
    ['Mwalimu anapoingia darasani na kusema "Hamjambo wanafunzi?", wanafunzi hujibu:', 'Hatujambo mwalimu', ['Sijambo mwalimu', 'Hawajambo mwalimu', 'Marahaba mwalimu'], 'Wingi wa "Hujambo -> Sijambo" ni "Hamjambo -> Hatujambo".'],
    ['Ni neno lipi la adabu hutumiwa unapoomba kupita kati ya watu wawili?', 'Samahani / Simile', ['Tokeni', 'Haraka', 'Pole'], '"Samahani" au "Simile" huonyesha heshima unapoomba njia.'],
  ];
  for (const [q, corr, dist, exp] of maamkizi) {
    const p = packChoices(corr, dist, s++);
    items.push({ q, options: p.options, ans: p.ans, exp, tags: ['kusikiliza', 'maamkizi', 'kuzungumza'] });
  }

  // B) Ngeli za Nomino na Upatanisho wa Kisarufi
  const ngeliRows: Array<[string, string, [string, string, string], string]> = [
    ['Nomino " Daktari " huorodheshwa katika ngeli ipi ya Kiswahili?', 'A-WA', ['U-I', 'KI-VI', 'I-ZI'], 'Majina yote ya viumbe hai (watu, wanyama, ndege, samaki) huingia katika ngeli ya A-WA.'],
    ['Chagua kiambishi sahihi kukamilisha: "Mti mrefu ______meanguka shambani."', 'u', ['i', 'li', 'ki'], '"Mti" iko katika ngeli ya U-I (mti u-meanguka / miti i-meanguka).'],
    ['Chagua upatanisho sahihi: "Viatu vyangu vipya ______mepotea."', 'vi', ['zi', 'ya', 'i'], '"Kiatu / Viatu" iko katika ngeli ya KI-VI (ki-mepotea / vi-mepotea).'],
    ['Nomino "Yai" na "Gari" ziko katika ngeli ipi?', 'LI-YA', ['KI-VI', 'U-ZI', 'I-ZI'], 'Yai linaingia LI-YA: Yai li-mevunjika / Mayai ya-mevunjika.'],
    ['Kamilisha kwa upatanisho sahihi: "Nyumba hizi ______mejengwa kwa mawe imara."', 'zi', ['i', 'vi', 'ya'], '"Nyumba" iko katika ngeli ya I-ZI (umoja: i-mejengwa; wingi: zi-mejengwa).'],
    ['Nomino "Ukuta" (wingi: "Kuta") iko katika ngeli ipi?', 'U-ZI', ['U-I', 'U-YA', 'LI-YA'], 'Ukuta u-mepakwa rangi / Kuta zi-mepakwa rangi -> Ngeli ya U-ZI.'],
    ['Nomino "Ugonjwa" (wingi: "Magonjwa") iko katika ngeli ipi?', 'U-YA', ['U-ZI', 'U-I', 'I-ZI'], 'Ugonjwa u-mezuiwa / Magonjwa ya-mezuiwa -> Ngeli ya U-YA.'],
    ['Kamilisha sentensi: "Kuimba kwake ______liwavutia wageni wote."', 'ku', ['pa', 'mu', 'li'], 'Vitenzi-jina vinavyoanza kwa ku- huingia katika ngeli ya KU (ku-liwavutia).'],
    ['Chagua upatanisho sahihi wa mahali: "Ndani ya darasa ______na wanafunzi wengi."', 'm', ['pa', 'ku', 'zi'], '"Ndani ya" hudokeza mahali ndani, hivyo hutumia kiambishi "m-" (mna) katika PA-KU-MU.'],
    ['Kipepeo mrembo ______meruka juu ya ua.', 'a', ['ki', 'u', 'li'], 'Ingawa "kipepeo" huanza kwa ki-, ni kiumbe hai (mdudu), hivyo huchukua ngeli ya A-WA ("ameruka").'],
  ];
  for (const [q, corr, dist, exp] of ngeliRows) {
    const p = packChoices(corr, dist, s++);
    items.push({ q, options: p.options, ans: p.ans, exp, tags: ['sarufi', 'ngeli', 'umoja', 'wingi'] });
  }

  // C) Umoja na Wingi & Ukanushaji wa Sentensi
  const sarufiRows: Array<[string, string, [string, string, string], string]> = [
    ['Andika kwa wingi: "Mwanafunzi amesoma kitabu kizuri."', 'Wanafunzi wamesoma vitabu vizuri.', ['Wanafunzi amesoma vitabu kizuri.', 'Mwanafunzi wamesoma vitabu vizuri.', 'Wanafunzi wanasoma vitabu vizuri.'], 'Mwanafunzi -> Wanafunzi, amesoma -> wamesoma, kitabu kizuri -> vitabu vizuri.'],
    ['Andika kwa wingi: "Ufunguo wangu umepotea."', 'Funguo zangu zimepotea.', ['Mafunguo yangu yamepotea.', 'Ufunguo zetu zimepotea.', 'Vifunguo vyangu vimepotea.'], '"Ufunguo" iko katika ngeli ya U-ZI: wingi ni "Funguo zangu zimepotea."'],
    ['Kanusha sentensi ifuatayo: "Juma anacheza mpira uwanjani."', 'Juma hachezi mpira uwanjani.', ['Juma hakucheza mpira uwanjani.', 'Juma hajacheza mpira uwanjani.', 'Juma hatacheza mpira uwanjani.'], 'Wakati uliopo (-na-) hukanushwa kwa "ha-...-i": anacheza -> hachezi.'],
    ['Kanusha sentensi ifuatayo: "Wageni wamefika mapema leo."', 'Wageni hawajafika mapema leo.', ['Wageni hawakufika mapema leo.', 'Wageni hawafiki mapema leo.', 'Wageni hawatafika mapema leo.'], 'Hali timilifu (-me-) hukanushwa kwa kutumia kiambishi "-ja-": wamefika -> hawajafika.'],
    ['Kanusha sentensi ifuatayo: "Mvua ilinyesha jana jioni."', 'Mvua haikunyesha jana jioni.', ['Mvua hainyeshi jana jioni.', 'Mvua haijanyesha jana jioni.', 'Mvua haitanyesha jana jioni.'], 'Wakati uliopita (-li-) hukanushwa kwa "-ku-": ilinyesha -> haikunyesha.'],
    ['Ukubwa wa nomino "MJI" ni upi?', 'Jiji', ['Kijiji', 'Majiji', 'Mjini'], 'Wastani: mji; Ukubwa: jiji; Udogo: kijiji.'],
    ['Udogo wa nomino "NDEGE" ni upi?', 'Kidege', ['Dege', 'Madege', 'Videge'], 'Ukubwa wa "ndege" ni "dege", na udogo wake katika umoja ni "kidege".'],
    ['Katika sentensi "Mtoto mtiifu alikimbia haraka sana", neno "haraka" ni aina gani ya neno?', 'Kielezi (E)', ['Kivumishi (V)', 'Nomino (N)', 'Kihusishi (H)'], '"Haraka" linaeleza jinsi kitendo cha kukimbia kilivyofanyika, hivyo ni kielezi cha namna.'],
    ['Kauli ya kutendewa ya kitenzi "ANDIKA" ni ipi?', 'Andikiwa', ['Andikia', 'Andikisha', 'Andikika'], 'Kuandika -> kuandikia (kutendea) -> kuandikiwa (kutendewa).'],
    ['Alama ya uakifishaji ( : ) inayotangulia orodha ya vitu huitwaje?', 'ukoloni / nukta pacha', ['mkato / koma', 'kikomo / nukta', 'ritifaa / king’ong’o'], 'Alama ya ( : ) huitwa nukta pacha au ukoloni na hutumiwa kutambulisha orodha.'],
  ];
  for (const [q, corr, dist, exp] of sarufiRows) {
    const p = packChoices(corr, dist, s++);
    items.push({ q, options: p.options, ans: p.ans, exp, tags: ['sarufi', 'sentensi', 'kuandika', 'nyakati'] });
  }

  // D) Methali, Nahau, Vitendawili, Msamiati na Insha
  const fasihiRows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['Kamilisha methali: "Haraka haraka ________."', 'haina baraka', ['ndiyo mwendo', 'hujaza kibaba', 'huvunja guu'], 'Methali kamili ni "Haraka haraka haina baraka."', ['methali', 'fasihi', 'kusoma']],
    ['Kamilisha methali: "Haba na haba ________."', 'hujaza kibaba', ['haina baraka', 'si kitu', 'ndiyo mwanzo'], '"Haba na haba hujaza kibaba" hufundisha uvumilivu na kuweka akiba kidogo kidogo.', ['methali', 'fasihi']],
    ['Kamilisha methali: "Mtoto umleavyo ________."', 'ndivyo akuavyo', ['ndivyo aendavyo', 'hukua haraka', 'humfurahisha mzazi'], 'Malezi bora tangu utotoni huamua tabia ya mtoto ukubwani.', ['methali', 'maadili']],
    ['Kamilisha methali: "Umoja ni nguvu, utengano ni ________."', 'udhaifu', ['ushindi', 'amani', 'upendo'], 'Methali hii inahimiza mshikamano na ushirikiano katika jamii.', ['methali', 'utaifa']],
    ['Kamilisha methali: "Subira huvuta ________."', 'heri', ['shari', 'mali', 'kasi'], 'Mwenye uvumilivu hupata mafanikio mema mwishowe ("Subira huvuta heri").', ['methali', 'uadilifu']],
    ['Maana ya nahau "kupiga moyo konde" ni ipi?', 'Kujipa ujasiri na kuvumilia', ['Kukasirika sana', 'Kukata tamaa kabisa', 'Kukimbia kwa hofu'], '"Kupiga moyo konde" humaanisha kujikaza kisabuni au kujipa moyo wakati wa shida.', ['nahau', 'msamiati', 'fasihi']],
    ['Mtu mwenye tabia ya wizi husemwa kwa nahau kuwa ana:', 'mkono mrefu', ['mkono birika', 'moyo mweupe', 'ulimi mtamu'], '"Mkono mrefu" ni nahau inayomaanisha tabia ya udokozi au wizi; "mkono birika" ni mchoyo.', ['nahau', 'msamiati']],
    ['Maana ya nahau "kuvaa miwani" katika muktadha wa semi za Kiswahili ni:', 'Kulewa pombe', ['Kusoma kwa bidii', 'Kuona mbali sana', 'Kuwa mzee'], 'Nahau "kuvaa miwani" humaanisha kulewa.', ['nahau', 'msamiati']],
    ['Tegua kitendawili: "Nyumba yangu haina mlango."', 'Yai', ['Uyoga', 'Kobe', 'Konokono'], 'Ganda la yai limefungika pande zote bila mlango — jibu ni Yai.', ['vitendawili', 'fasihi', 'kusikiliza']],
    ['Tegua kitendawili: "Askari wangu wamevaa sare nyeupe na wanasimama mstari mmoja."', 'Meno', ['Miti', 'inguo', 'Ndege'], 'Meno kinywani ni meupe na yamepangika kwa safu.', ['vitendawili', 'fasihi']],
    ['Tegua kitendawili: "Kuku wangu ametagia mibani."', 'Nanasi', ['Chungwa', 'Embe', 'Ndizi'], 'Tunda la nanasi hukua katikati ya majani yenye miiba ("ametagia mibani").', ['vitendawili', 'fasihi']],
    ['Malipo anayolipa abiria anaposafiri kwa basi, gari au meli huitwaje?', 'Nauli', ['Karo', 'Kodi', 'Ushuru'], 'Nauli ni malipo ya usafiri; karo ni ada ya shule; kodi ni malipo ya pango.', ['msamiati', 'uchumi']],
    ['Fedha zinazolipwa shuleni kwa ajili ya masomo ya mwanafunzi huitwa:', 'Karo', ['Mahari', 'Mshahara', 'Kiingilio'], 'Ada ya masomo shuleni au chuoni huitwa karo.', ['msamiati', 'elimu']],
    ['Katika uandishi wa barua rasmi (ya kikazi), kunakuwa na anwani ngapi?', 'Mbili (ya mwandishi na ya mwandikiwa)', ['Moja pekee (ya mwandishi)', 'Tatu', 'Hakuna anwani'], 'Barua rasmi huwa na anwani mbili: anwani ya mwandishi na anwani ya mwandikiwa.', ['insha', 'kuandika', 'barua']],
    ['Insha inayoandikwa kunukuu maazimio yaliyofikiwa katika mkutano rasmi huitwaje?', 'Kumbukumbu', ['Tawasifu', 'Wasifu', 'Hotuba'], 'Rekodi rasmi ya majadiliano na maazimio ya mkutano huitwa Kumbukumbu.', ['insha', 'kumbukumbu', 'kuandika']],
    ['Masimulizi ambayo mhusika anaandika kuhusu maisha yake mwenyewe huitwa:', 'Tawasifu', ['Wasifu', 'Shajara', 'Risala'], 'Tawasifu huandikwa na mtu mwenyewe kuhusu maisha yake; Wasifu huandikwa na mtu mwingine kumhusu.', ['insha', 'fasihi', 'kuandika']],
  ];
  for (const [q, corr, dist, exp, tags] of fasihiRows) {
    const p = packChoices(corr, dist, s++);
    items.push({ q, options: p.options, ans: p.ans, exp, tags });
  }

  return items;
}

// ============================================================================
// 4. SCIENCE, BIOLOGY, CHEMISTRY, PHYSICS & ENVIRONMENTAL EXERCISES
// ============================================================================

function buildBiologyExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['Which cell organelle is known as the "powerhouse of the cell" because it releases energy during respiration?', 'Mitochondrion', ['Ribosome', 'Golgi apparatus', 'Lysosome'], 'Mitochondria are the sites of aerobic respiration producing ATP energy.', ['cell', 'organelles', 'living']],
    ['Which two structures are present in a palisade plant cell but ABSENT in a mammalian cheek cell?', 'Cellulose cell wall and chloroplasts', ['Nucleus and cell membrane', 'Cytoplasm and mitochondria', 'Ribosomes and vacuoles'], 'Plant cells have a rigid cellulose cell wall and green chloroplasts for photosynthesis.', ['cell', 'plant', 'microscope']],
    ['What is the net movement of water molecules from a dilute solution to a concentrated solution across a semi-permeable membrane?', 'Osmosis', ['Diffusion', 'Active transport', 'Transpiration'], 'Osmosis is the movement of water molecules across a selectively permeable membrane down a water potential gradient.', ['osmosis', 'membrane', 'cell']],
    ['When testing a leaf or food sample for STARCH using iodine solution, what colour change confirms a positive test?', 'Blue-black', ['Brick-red', 'Purple / violet', 'Cloudy white emulsion'], 'Iodine solution turns from brown/yellow to blue-black in the presence of starch.', ['nutrition', 'starch', 'photosynthesis', 'biomolecules']],
    ['Which chemical reagent is heated with a food solution to test for reducing sugars such as glucose?', "Benedict's solution", ['Biuret reagent', 'Iodine solution', 'Ethanol'], "Benedict's solution changes from blue -> green -> yellow -> orange/brick-red when heated with reducing sugars.", ['nutrition', 'biomolecules', 'digestion']],
    ['What gas is released as a by-product during the light stage of photosynthesis in green plants?', 'Oxygen', ['Carbon(IV) oxide', 'Nitrogen', 'Methane'], 'Photolysis of water during photosynthesis releases oxygen gas into the atmosphere.', ['photosynthesis', 'plant', 'nutrition']],
    ['In the human digestive system, where does most absorption of digested food into the bloodstream take place?', 'Ileum (small intestine)', ['Stomach', 'Colon (large intestine)', 'Oesophagus'], 'The ileum is long, coiled, and lined with villi and microvilli for efficient absorption of nutrients.', ['digestion', 'nutrition', 'human']],
    ['Which enzyme in human saliva begins the chemical digestion of cooked starch in the mouth?', 'Salivary amylase (ptyalin)', ['Pepsin', 'Trypsin', 'Lipase'], 'Salivary amylase hydrolyses cooked starch into maltose at neutral/slightly alkaline pH.', ['digestion', 'enzyme', 'nutrition']],
    ['Which chamber of the mammalian heart has the thickest muscular wall to pump oxygenated blood to the entire body?', 'Left ventricle', ['Right ventricle', 'Left atrium (auricle)', 'Right atrium (auricle)'], 'The left ventricle generates high pressure to pump blood through the aorta to all systemic tissues.', ['heart', 'transport', 'blood']],
    ['Which blood component is responsible for clotting blood at a wound to prevent excessive bleeding and entry of pathogens?', 'Platelets (thrombocytes)', ['Red blood cells (erythrocytes)', 'White blood cells (leucocytes)', 'Blood plasma'], 'Platelets release thromboplastin, initiating the conversion of fibrinogen into insoluble fibrin threads.', ['blood', 'transport']],
    ['Tiny air sacs in the mammalian lungs where gaseous exchange occurs by diffusion are called:', 'Alveoli', ['Bronchioles', 'Trachea', 'Nephrons'], 'Alveoli are one-cell thick, moist, numerous, and surrounded by dense capillary networks.', ['gaseous', 'respiration', 'lungs']],
    ['What are the functional microscopic filtering units inside the mammalian kidney?', 'Nephrons', ['Alveoli', 'Villi', 'Neurones'], 'Each kidney contains millions of nephrons that perform ultrafiltration and selective reabsorption.', ['excretory', 'kidney', 'homeostasis']],
    ['Which hormone secreted by the pancreas lowers high blood glucose levels back to normal?', 'Insulin', ['Glucagon', 'Adrenaline', 'Thyroxine'], 'Insulin stimulates liver and muscle cells to convert excess glucose into glycogen.', ['homeostasis', 'blood sugar', 'hormone']],
    ['In flowering plants, the transfer of pollen grains from the anther to the stigma is called:', 'Pollination', ['Fertilization', 'Germination', 'Transpiration'], 'Pollination precedes fertilization in sexual reproduction of flowering plants.', ['reproduction', 'pollination', 'plant']],
    ['According to Binomial Nomenclature, how should the scientific name of human beings be written correctly in print?', 'Homo sapiens (italicised, genus capitalised)', ['homo Sapiens', 'HOMO SAPIENS', 'Homo Sapiens (both capitalised, not underlined)'], 'Genus starts with a capital letter, species is all lowercase, and both are italicised (or underlined separately when handwritten).', ['taxonomy', 'biodiversity', 'binomial']],
    ['In a terrestrial food chain: Grass -> Grasshopper -> Frog -> Snake -> Hawk, which organism is the primary producer?', 'Grass', ['Grasshopper', 'Frog', 'Hawk'], 'Green plants (grass) trap solar energy via photosynthesis to manufacture organic food.', ['ecology', 'food chain', 'interdependence']],
    ['Which type of cell division produces four genetically non-identical haploid gametes for sexual reproduction?', 'Meiosis', ['Mitosis', 'Binary fission', 'Budding'], 'Meiosis halves the chromosome number (diploid 2n -> haploid n) to form gametes.', ['genetics', 'meiosis', 'reproduction']],
    ['In humans, where does fertilization of the ovum by a sperm cell normally occur?', 'Oviduct (Fallopian tube)', ['Uterus (womb)', 'Ovary', 'Cervix'], 'Fertilization occurs in the upper part of the oviduct before the zygote implants in the uterus.', ['reproduction', 'human', 'adolescence']],
  ];
  let s = 501;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

function buildChemistryExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['Why is a non-luminous Bunsen burner flame preferred over a luminous flame for heating in the laboratory?', 'It is hotter and does not deposit black soot on apparatus', ['It is bright yellow and easy to see', 'It is produced when the air hole is completely closed', 'It uses more gas and produces smoke'], 'Opening the air hole admits oxygen for complete combustion, producing a clean, very hot blue flame.', ['apparatus', 'bunsen', 'scientific', 'laboratory']],
    ['Which method is used to separate miscible liquids with close but different boiling points, such as ethanol (78°C) and water (100°C)?', 'Fractional distillation', ['Simple filtration', 'Use of a separating funnel', 'Magnetic separation'], 'A fractionating column separates miscible liquids based on differences in their boiling points.', ['mixtures', 'distillation', 'separation']],
    ['Which separation technique is used to separate the coloured dyes in black fountain-pen ink?', 'Paper chromatography', ['Sublimation', 'Decantation', 'Winnowing'], 'Chromatography separates solutes based on differential solubility in the solvent and adsorption on paper.', ['mixtures', 'chromatography', 'separation']],
    ['When solid ammonium chloride or iodine is heated, it changes directly from solid to vapour without melting. This process is called:', 'Sublimation', ['Condensation', 'Evaporation', 'Crystallisation'], 'Sublimation is the direct transition between solid and gaseous states.', ['mixtures', 'sublimation', 'changes']],
    ['A solution tested with universal indicator gives a pH value of 2. This solution is:', 'Strongly acidic', ['Weakly acidic', 'Neutral', 'Strongly alkaline'], 'pH 1–3 indicates a strong acid; pH 7 is neutral; pH 12–14 indicates a strong alkali.', ['acids', 'bases', 'ph', 'indicators']],
    ['What colour does blue litmus paper turn when dipped into lemon juice or dilute hydrochloric acid?', 'Red', ['Remains blue', 'Green', 'Yellow'], 'Acids turn blue litmus paper red.', ['acids', 'bases', 'litmus']],
    ['What are the two essential substances required for iron nails to RUST?', 'Water (moisture) and oxygen', ['Carbon(IV) oxide and nitrogen', 'Dry air and oil', 'Sunlight and salt only'], 'Rusting (hydrated iron(III) oxide formation) requires both oxygen and water.', ['rusting', 'changes', 'metals']],
    ['Which chemical symbol represents the element Sodium on the Periodic Table?', 'Na', ['So', 'Sd', 'N'], 'Sodium takes its symbol Na from its Latin name "Natrium".', ['elements', 'symbols', 'periodic']],
    ['Group VIII (Group 0) elements such as Helium, Neon, and Argon are chemically unreactive because they:', 'Have completely filled outer electron energy levels', ['Have one valence electron', 'Are all transition metals', 'Readily gain two electrons'], 'Noble gases have stable duplet (2) or octet (8) outer electron shells.', ['periodic', 'atomic', 'bonding']],
    ['What type of chemical bond is formed when sodium transfers its outer valence electron to chlorine to form NaCl?', 'Ionic (electrovalent) bond', ['Covalent bond', 'Metallic bond', 'Hydrogen bond'], 'Transfer of electrons from a metal to a non-metal forms oppositely charged ions held by ionic bonds.', ['bonding', 'ionic', 'atomic']],
    ['Brass is a useful corrosion-resistant alloy made by mixing copper with which metal?', 'Zinc', ['Tin', 'Iron', 'Aluminium'], 'Brass = Copper + Zinc; Bronze = Copper + Tin.', ['metals', 'alloys', 'mixtures']],
    ['Permanent hardness of water caused by dissolved calcium sulphate can be removed by:', 'Adding washing soda (sodium carbonate) or distillation', ['Boiling the water only', 'Filtering through a clean cloth', 'Decanting the water'], 'Boiling only removes temporary hardness; sodium carbonate or ion-exchange/distillation removes permanent hardness.', ['water', 'hardness', 'mixtures']],
    ['Why should water NEVER be poured onto a Class B petrol fire or a live electrical fire?', 'Petrol floats and spreads burning, while water conducts electricity causing electrocution', ['Water freezes on contact with petrol', 'Water increases nitrogen in the air', 'Water damages the floor tiles'], 'Foam or CO2 extinguishers should be used instead of water on flammable liquid and electrical fires.', ['fire', 'safety', 'laboratory']],
    ['Which gas turns limewater (calcium hydroxide solution) milky by forming a white precipitate?', 'Carbon(IV) oxide (CO₂)', ['Oxygen (O₂)', 'Hydrogen (H₂)', 'Nitrogen (N₂)'], 'Carbon(IV) oxide reacts with calcium hydroxide to form insoluble white calcium carbonate.', ['elements', 'compounds', 'chemistry']],
    ['Which gas relights a glowing wooden splint in the laboratory?', 'Oxygen', ['Hydrogen', 'Carbon(IV) oxide', 'Ammonia'], 'Oxygen supports combustion and relights a glowing splint; hydrogen burns with a "pop" sound.', ['elements', 'chemistry', 'laboratory']],
  ];
  let s = 601;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

function buildPhysicsExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['What is the SI base unit of electric current?', 'Ampere (A)', ['Volt (V)', 'Ohm (Ω)', 'Watt (W)'], 'Electric current is measured in Amperes (A) using an ammeter connected in series.', ['electricity', 'si units', 'force']],
    ['Why are domestic lighting circuits in Kenyan homes connected in PARALLEL rather than in series?', 'Each bulb receives full mains voltage and operates independently if another blows', ['Parallel circuits use no switches', 'One blown bulb switches off the whole house', 'Current is identical through appliances of different power'], 'Parallel wiring supplies every branch with 240 V and allows independent switching.', ['electricity', 'circuits', 'force']],
    ['Why do heavy farm tractors have very wide rear tyres?', 'To increase contact area and reduce pressure so the tractor does not sink in soft soil', ['To increase pressure on the ground', 'To make the tractor move faster on tarmac', 'To reduce the mass of the tractor'], 'Since Pressure = Force ÷ Area, increasing area decreases pressure on muddy soil.', ['pressure', 'force', 'solids']],
    ['In a liquid at rest, how does liquid pressure vary with depth (P = hρg)?', 'Pressure increases with depth', ['Pressure decreases with depth', 'Pressure is greatest at the top surface', 'Pressure depends on the width of the container'], 'Liquid pressure is directly proportional to depth h and density ρ, which is why dam walls are thicker at the base.', ['pressure', 'liquids', 'force']],
    ['State the fundamental Law of Magnetism:', 'Like poles repel and unlike poles attract', ['All metals are attracted by magnets', 'North poles attract North poles', 'Magnetic lines cross one another'], 'Two North or two South poles repel, whereas a North pole attracts a South pole.', ['magnetism', 'force']],
    ['Which group consists ONLY of magnetic materials?', 'Iron, steel, nickel, and cobalt', ['Copper, aluminium, brass, and zinc', 'Plastic, glass, rubber, and wood', 'Silver, gold, copper, and lead'], 'Ferromagnetic materials strongly attracted by magnets are iron, steel, cobalt, and nickel.', ['magnetism', 'materials']],
    ['Why are convex mirrors fitted as side driving mirrors on vehicles?', 'They give an upright diminished image over a wide field of view', ['They form inverted real images', 'They magnify distant objects tenfold', 'They absorb glare at night'], 'Convex mirrors diverge rays to provide drivers with a wide rear view.', ['mirrors', 'curved', 'light', 'energy']],
    ['By which method does heat energy from the Sun travel through the vacuum of space to reach the Earth?', 'Radiation', ['Conduction', ['Convection'][0], 'Evaporation'], 'Thermal radiation consists of infrared electromagnetic waves and requires no material medium.', ['heat', 'energy', 'waves']],
    ['Sound waves cannot travel through a vacuum because sound waves are:', 'Mechanical longitudinal waves that require vibrating particles of a medium', ['Transverse electromagnetic waves', 'Too fast for air molecules', 'Absorbed by glass walls'], 'Sound requires a solid, liquid, or gas medium to transmit compressions and rarefactions.', ['waves', 'sound', 'energy']],
    ['What energy transformation occurs inside a hydroelectric power station like Masinga Dam?', 'Gravitational potential energy -> Kinetic energy -> Electrical energy', ['Chemical energy -> Heat energy -> Light energy', 'Solar energy -> Chemical energy -> Sound energy', 'Nuclear energy -> Kinetic energy -> Heat energy'], 'Falling water converts potential energy to kinetic energy of turbines, driving generators to produce electricity.', ['energy', 'electricity', 'force']],
    ['What safety device in a three-pin plug melts and breaks the circuit when excessive current flows?', 'Fuse', ['Earth pin', 'Step-up transformer', 'Rheostat'], 'A fuse contains a thin wire rated to melt and disconnect live current during an overload or short circuit.', ['electricity', 'safety', 'force']],
    ['Which renewable source of electricity harnesses underground steam in Olkaria, Naivasha?', 'Geothermal energy', ['Hydroelectric energy', 'Tidal energy', 'Biomass energy'], 'Kenya is a leading producer of geothermal electricity tapped from volcanic steam wells at Olkaria.', ['electricity', 'renewable', 'energy']],
  ];
  let s = 701;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

function buildEnvironmentalExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['What should we ALWAYS use when washing our hands after visiting the toilet and before eating?', 'Clean running water and soap', ['Cold water only without soap', 'Dry sand or leaves', 'Stagnant puddle water'], 'Soap and clean running water remove germs and prevent diarrhoeal diseases like cholera.', ['hygiene', 'clean', 'social']],
    ['Which personal item should NEVER be shared with friends to prevent spreading skin, eye, or gum infections?', 'Toothbrush, towel, comb, and razor', ['Storybooks and football', 'Desks and wall charts', 'Rulers and crayons'], 'Personal grooming items like toothbrushes, combs, and handkerchiefs can transmit infections if shared.', ['hygiene', 'clean', 'healthy']],
    ['Before crossing a busy road at a pedestrian crossing, what is the safest rule to follow?', 'Stop, look right, look left, look right again, and cross briskly when clear', ['Run across quickly without looking', 'Cross between two parked buses', 'Play ball while crossing'], 'Looking right-left-right ensures oncoming vehicles from both lanes have stopped.', ['safety', 'road', 'pedestrian']],
    ['On road traffic lights, what does the GREEN light for pedestrians mean?', 'Safe to cross the road carefully', ['Stop and wait on the pavement', 'Get ready to stop', 'Cars should speed up'], 'A green pedestrian signal indicates vehicles have stopped so pedestrians may cross safely.', ['safety', 'road']],
    ['Which method is the simplest and most reliable way of making river or well water safe for drinking at home?', 'Boiling the water and storing it in a clean covered container', ['Pouring it into an open cup immediately', 'Adding soil to make it settle', 'Cooling it in the shade'], 'Boiling kills disease-causing germs (bacteria and parasites) in drinking water.', ['water', 'boiling', 'natural']],
    ['Which type of soil has very fine particles, feels sticky when wet, and is best for modelling pots and animals?', 'Clay soil', ['Sandy soil', 'Loam soil', 'Gravel'], 'Clay soil retains water and moulds smoothly without cracking easily during modelling.', ['soil', 'clay', 'natural']],
    ['Which type of soil is best for growing food crops in our school garden because it is fertile and drains well?', 'Loam soil', ['Pure sand', 'Rocky gravel', 'Sticky clay'], 'Loam soil has balanced water retention, aeration, and humus for healthy crop roots.', ['soil', 'plants', 'natural']],
    ['Which part of a green plant holds it firmly in the soil and absorbs water and mineral salts?', 'Roots', ['Flowers', ['Fruits'][0], 'Seeds'], 'Roots anchor the plant firmly and absorb water and dissolved nutrients from the soil.', ['plants', 'natural']],
    ['Which domestic animal gives our family milk, beef, and manure for the farm?', 'Cow (cattle)', ['Cat', 'Dog', 'Donkey'], 'Cattle provide milk, meat (beef), hides, and farmyard manure.', ['animals', 'domestic', 'natural']],
    ['Which domestic animal protects our homestead from intruders and strangers?', 'Dog', ['Sheep', 'Rabbit', 'Duck'], 'Dogs guard homes and alert families to danger.', ['animals', 'domestic']],
    ['What clothes are best to wear on a cold, rainy morning when going to school?', 'Warm sweater, raincoat/umbrella, and gumboots', ['Light vest and open sandals only', 'Swimming costume', 'Wet cotton shirt'], 'Warm, waterproof clothing keeps the body dry and prevents catching chills.', ['weather', 'natural']],
    ['How can learners conserve water and electricity at school every day?', 'Close taps tightly after use and switch off lights in empty classrooms', ['Leave taps running while playing', 'Keep classroom lights on all weekend', 'Wash corridors with drinking water'], 'Turning off unused taps and lights prevents wastage of scarce water and energy resources.', ['conserving', 'water', 'resources']],
    ['Instead of burning plastic bottles in the school compound, how can we manage solid waste safely?', 'Sort waste into bins and reuse or recycle plastics', ['Throw litter into nearby rivers', 'Scatter wrappers on the playground', 'Bury polythene bags in the flowerbed'], 'Sorting, reusing, and recycling keep the environment clean and prevent air and soil pollution.', ['waste', 'recycling', 'caring']],
  ];
  let s = 801;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

// ============================================================================
// 5. AGRICULTURE, SOCIAL/HISTORY/GEOGRAPHY, BUSINESS, PRE-TECH/COMPUTER,
//    CREATIVE ARTS & SPORTS, CRE & IRE END-OF-STRAND EXERCISES
// ============================================================================

function buildAgricultureExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['Which type of soil erosion forms deep wide channels on sloping land that cannot be crossed by normal farm machinery?', 'Gully erosion', ['Splash erosion', 'Sheet erosion', 'Rill erosion'], 'Unchecked rills deepen into large gullies; gabions (porous stone check-dams) are built across gullies to rehabilitate them.', ['soil', 'erosion', 'conservation']],
    ['What is the main purpose of spreading dry grass or crop residues (MULCH) around growing vegetable crops?', 'To conserve soil moisture, suppress weeds, and reduce splash erosion', ['To attract crop pests to the stems', 'To bake the soil hard under sunlight', 'To stop roots from absorbing water'], 'Organic mulch shades the soil, reduces evaporation, smothers weeds, and decomposes into humus.', ['soil', 'conservation', 'water', 'crop']],
    ['Which method of irrigation delivers water drop-by-drop directly to the root zone of plants through perforated pipes?', 'Drip irrigation', ['Flood irrigation', 'Overhead sprinkler irrigation', 'Furrow flooding'], 'Drip irrigation minimizes evaporation and runoff, making it the most water-efficient method in dry areas.', ['water', 'irrigation', 'conservation']],
    ['In nursery bed management, what does "HARDENING OFF" seedlings one week before transplanting involve?', 'Gradually reducing shading and watering frequency so seedlings adapt to open-field conditions', ['Pouring boiling water on the nursery bed', 'Applying double nitrogen fertilizer daily', 'Cutting off the roots of seedlings'], 'Hardening off prepares tender seedlings to withstand direct sunlight and wind after transplanting.', ['crop', 'nursery', 'gardening', 'production']],
    ['Removing overcrowded or weak excess seedlings from a seedbed to leave healthy spacing is called:', 'Thinning', ['Gapping', 'Pricking out', 'Weeding'], 'Thinning reduces competition for light, water, and nutrients; gapping replaces failed seeds.', ['crop', 'production', 'gardening']],
    ['Which farm structure made of wire-mesh boxes filled with stones is built across deep gullies to trap soil and slow runoff?', 'Gabions (porous check-dams)', ['Cut-off drains', 'Trash lines', 'Grass strips'], 'Gabions slow down stormwater while trapping eroded silt to heal gullies.', ['soil', 'conservation', 'erosion']],
    ['Which nutritional deficiency disease in young children is caused by severe lack of PROTEINS in the diet?', 'Kwashiorkor', ['Rickets', 'Scurvy', 'Goitre'], 'Kwashiorkor is caused by protein deficiency and presents with swollen abdomen/feet and reddish-brown sparse hair.', ['nutrition', 'diet', 'food', 'health']],
    ['Lack of Vitamin C (ascorbic acid) found in fresh citrus fruits and green vegetables causes:', 'Scurvy (bleeding gums and slow wound healing)', ['Night blindness', 'Rickets', 'Anaemia'], 'Vitamin C keeps gums and connective tissues healthy; deficiency leads to scurvy.', ['nutrition', 'food', 'diet']],
    ['Which mineral salt is required alongside Vitamin D for the formation of strong bones and teeth?', 'Calcium', ['Iodine', 'Sodium', 'Chlorine'], 'Calcium and Vitamin D prevent rickets in children and osteomalacia in adults.', ['nutrition', 'food', 'diet']],
    ['Why is STEAMING considered one of the healthiest methods of cooking food for invalids and convalescents?', 'Nutrients are not dissolved into cooking water and the food is light and easy to digest', ['It uses large amounts of cooking oil', 'It chars the outside of the food', 'It destroys all water-soluble vitamins'], 'Steamed food does not come into direct contact with boiling water, preserving vitamins and minerals.', ['cooking', 'food', 'nutrition', 'hygiene']],
    ['Processing fresh farm milk into yoghurt or mala, or Irish potatoes into crisps before selling is an example of:', 'Value addition to agricultural produce', ['Soil conservation', 'Mixed cropping', 'Shifting cultivation'], 'Value addition extends shelf life, reduces post-harvest spoilage, and increases farmer income.', ['value', 'marketing', 'food', 'production']],
    ['In needlework and garment repair, which permanent hand stitch is strongest and resembles machine stitching on the right side?', 'Backstitch', ['Tacking (basting) stitch', 'Running stitch', 'Loop stitch'], 'Backstitch forms overlapping firm stitches ideal for repairing seams by hand.', ['stitches', 'laundry', 'clothing', 'home']],
    ['Why should coloured cotton clothes be dried inside-out under shade rather than in scorching midday sun?', 'To prevent the fabric dye from fading (bleaching) in strong sunlight', ['To make them stay wet longer', 'To shrink the fabric', 'To attract dust'], 'Direct ultraviolet sunlight bleaches coloured dyes; drying in airy shade preserves garment colour.', ['laundry', 'clothing', 'hygiene']],
  ];
  let s = 901;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

function buildSocialHistoryGeographyExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['Which weather station instrument is used to measure atmospheric pressure?', 'Barometer', ['Hygrometer', 'Anemometer', 'Rain gauge'], 'A mercury or aneroid barometer measures atmospheric pressure; a hygrometer measures relative humidity; an anemometer measures wind speed.', ['weather', 'climate', 'instruments', 'environment']],
    ['Why is a Stevenson screen at a weather station painted white with louvered sides and raised 1.2 metres above the ground?', 'To reflect direct solar heat while allowing free air circulation for accurate shade air temperature', ['To trap rainwater inside the box', 'To measure wind direction', 'To attract birds and insects'], 'White paint reflects radiant heat and louvers allow free airflow around the thermometers and hygrometer.', ['weather', 'stevenson', 'environment']],
    ['How were the Great Rift Valley and Block (Horst) Mountains like Ruwenzori and Pare formed?', 'Faulting caused by tensional and compressional earth forces', ['Glacial erosion only', 'Coral reef deposition', 'Wind deflation'], 'Crustal faulting caused land blocks either to subside (forming the Rift Valley) or uplift/tilt (forming Horst/Block mountains).', ['rift valley', 'physical', 'faulting', 'landforms']],
    ['What causes day and night on Earth?', 'Rotation of the Earth on its axis once every 24 hours from West to East', ['Revolution of the Earth around the Sun in 365¼ days', 'Eclipses of the Moon every night', 'Tilting of ocean currents'], 'As the Earth rotates from West to East (15° per hour), the side facing the Sun experiences day while the opposite side has night.', ['earth', 'solar', 'rotation', 'environment']],
    ['Which Kenyan language group includes the Agikuyu, Abaluhya, Akamba, Abagusii, Ameru, and Mijikenda?', 'Bantu speakers', ['River-Lake Nilotes', 'Eastern Cushites', 'Highland Nilotes'], 'These communities belong to the Western and Eastern Bantu groups in Kenya.', ['people', 'language', 'migration', 'population']],
    ['Which prehistoric archaeological site on the shores of Lake Turkana is famous as the "Cradle of Humankind"?', 'Koobi Fora', ['Fort Jesus', 'Gedi Ruins', 'Vasco da Gama Pillar'], 'Fossils of Australopithecus and early Homo species were unearthed at Koobi Fora in Marsabit/Turkana basin.', ['human origin', 'evolution', 'archaeological', 'historic']],
    ['In Ancient Egypt, which shaduf-based invention was used by farmers along River Nile?', 'A pivoted lever irrigation device for lifting water onto farm canals', ['A bronze war chariot', 'A stone pyramid tomb', 'A papyrus reed boat'], 'The shadoof used a counterweight beam to lift Nile water into higher irrigation channels.', ['egypt', 'civilizations', 'nile', 'agriculture']],
    ['Which traditional Kenyan council of elders governed the Ameru community and settled disputes peacefully?', 'Njuri Ncheke', ['Kabaka Lukiiko', 'Ruoth Council', 'Kambi Elders'], 'Njuri Ncheke served as the supreme legislative, judicial, and environmental conservation council among the Ameru.', ['traditional', 'governance', 'political']],
    ['Which European conference of 1884–1885 laid down rules for the Scramble and Partition of Africa without African representation?', 'The Berlin Conference chaired by Otto von Bismarck', ['The Lancaster House Conference', 'The Pan-African Congress in Manchester', 'The Versailles Peace Conference'], 'European powers partitioned Africa at the Berlin Conference (1884–1885).', ['scramble', 'partition', 'colonialism', 'berlin']],
    ['Which Giriama woman leader bravely mobilized coastal resistance against British colonial hut tax and forced labour?', 'Mekatilili wa Menza', ['Wangu wa Makeri', 'Moraa Moka Ngiti', 'Syokimau'], 'Mekatilili wa Menza led the Agiriama resistance (1913–1914) to defend cultural and land rights.', ['leaders', 'colonialism', 'nationalism', 'independence']],
    ['Under the Constitution of Kenya 2010, what are the THREE arms of the National Government?', 'The Legislature (Parliament), the Executive, and the Judiciary', ['The Senate, the Cabinet, and the Police', 'The Governors, Senators, and Chiefs', 'The Judiciary, IEBC, and KRA'], 'Separation of powers divides government into Legislature (makes laws), Executive (implements laws), and Judiciary (interprets laws).', ['constitution', 'arms', 'governance', 'citizenship']],
    ['Which Chapter of the Constitution of Kenya 2010 contains the Bill of Rights guaranteeing fundamental rights and freedoms?', 'Chapter Four (Chapter 4)', ['Chapter One', 'Chapter Six', 'Chapter Eleven'], 'Chapter 4 is the Bill of Rights; Chapter 6 covers Leadership and Integrity; Chapter 11 covers Devolved Government.', ['constitution', 'human rights', 'citizenship']],
    ['How many devolved County Governments were established in Kenya under the 2010 Constitution?', '47 County Governments', ['8 Provincial Councils', '290 County Governments', '52 County Governments'], 'Kenya has 1 National Government and 47 devolved County Governments.', ['county', 'devolved', 'governance']],
    ['Which independent constitutional commission conducts and supervises presidential, parliamentary, and county elections in Kenya?', 'Independent Electoral and Boundaries Commission (IEBC)', ['Public Service Commission (PSC)', 'Judicial Service Commission (JSC)', 'Ethics and Anti-Corruption Commission (EACC)'], 'IEBC registers voters, delimits constituencies/wards, and conducts elections and referenda.', ['iebc', 'elections', 'governance', 'democracy']],
    ['Soda ash (trona), Kenya’s leading mineral export used in glass and soap manufacture, is mined at:', 'Lake Magadi', ['Kariandusi', 'Kerio Valley', 'Bamburi'], 'Trona is dredged from Lake Magadi in Kajiado County and processed into soda ash.', ['mining', 'resources', 'economic']],
    ['What is the most constructive non-violent method of resolving a boundary dispute between two neighbours?', 'Mediation and peaceful dialogue involving community elders or legal arbitrators', ['Fighting and destroying fences', 'Spreading rumours on social media', 'Refusing to speak forever'], 'Dialogue, negotiation, and mediation resolve conflicts peacefully and preserve harmony.', ['conflict', 'peace', 'citizenship']],
  ];
  let s = 1001;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

function buildBusinessExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['In economics and production, what are the FOUR factors of production and their respective rewards?', 'Land (rent), Labour (wages/salaries), Capital (interest), Entrepreneurship (profit)', ['Land (wages), Labour (profit), Money (tax), Transport (fare)', 'Buildings, Lorries, Cash, and Shopkeepers', 'Demand, Supply, Price, and Market'], 'The four factors of production earn rent (land), wages (labour), interest (capital), and profit (entrepreneurship).', ['production', 'resources', 'entrepreneurship']],
    ['Which basic human needs are essential for survival regardless of income?', 'Food, shelter, and clothing', ['Luxury cars, jewellery, and foreign holidays', 'Video games, designer watches, and cinemas', 'Airplanes and swimming pools'], 'Basic (primary) wants—food, shelter, and clothing—cannot be postponed as life depends on them.', ['needs', 'wants', 'consumer']],
    ['According to the Law of Demand, ceteris paribus (all other factors held constant), when the price of a normal good rises:', 'The quantity demanded decreases', ['The quantity demanded increases', 'Supply falls to zero', 'Consumers buy twice as much'], 'Price and quantity demanded are inversely related along a normal demand curve.', ['demand', 'supply', 'market']],
    ['In home trade, which commercial document is sent by a seller to a buyer to CORRECT an overcharge on an invoice?', 'Credit Note (usually printed in red)', ['Debit Note', 'Proforma Invoice', 'Advice Note'], 'A Credit Note reduces the amount owed by the buyer (e.g. for returned goods or overcharges); a Debit Note corrects an undercharge.', ['trade', 'transactions', 'bookkeeping']],
    ['Which principle of insurance states that the insured must disclose all material facts honestly when applying for a policy?', 'Utmost Good Faith (Uberrimae Fidei)', ['Subrogation', 'Contribution', 'Proximate Cause'], 'Failure to disclose material facts breaches Utmost Good Faith and voids the insurance contract.', ['insurance', 'finance', 'services']],
    ['Which principle of insurance restores the insured to the exact financial position they occupied just before the loss occurred—without making a profit?', 'Indemnity', ['Insurable Interest', 'Pooling of Risks', 'Endowment'], 'Property insurance contracts are contracts of indemnity—compensation cannot exceed actual loss.', ['insurance', 'finance']],
    ['Which institution regulates commercial banks, issues Kenyan currency notes/coins, and acts as banker to the government?', 'Central Bank of Kenya (CBK)', ['Kenya Revenue Authority (KRA)', 'Nairobi Securities Exchange (NSE)', 'Capital Markets Authority (CMA)'], 'CBK formulates monetary policy, issues legal tender, and supervises commercial banks.', ['banking', 'money', 'finance']],
    ['Value Added Tax (VAT) and Excise Duty are classified under public finance as:', 'Indirect taxes (shifted onto consumers in prices of goods/services)', ['Direct personal taxes', 'Voluntary donations', 'County parking fines'], 'Indirect taxes are levied on expenditure on goods and services, whereas PAYE and Corporate Tax are direct taxes on income.', ['tax', 'public finance', 'revenue']],
    ['What are the "4 Ps" of the marketing mix used by businesses to satisfy customers?', 'Product, Price, Place, and Promotion', ['Profit, People, Paper, and Postage', ['Purchase, Payment, Packing, and Posting'][0], 'Planning, Producing, Pricing, and Paying'], 'Marketing strategy revolves around Product quality/design, Price, Place (distribution), and Promotion.', ['marketing', 'entrepreneurship', 'promotion']],
    ['A warehouse located at a port or airport where imported dutiable goods are stored until customs duty is paid is a:', 'Bonded warehouse', ['Private retailer store', 'Free public shed', 'Wholesaler counter'], 'Goods in a bonded warehouse are held under customs bond until import duties are cleared.', ['warehousing', 'trade']],
    ['Which financial statement summarizes a firm’s Assets, Liabilities, and Capital on a specific date?', 'Statement of Financial Position (Balance Sheet)', ['Trading Account', 'Petty Cash Voucher', 'Bank Deposit Slip'], 'The Statement of Financial Position shows financial standing (Assets = Capital + Liabilities) as at a given date.', ['financial position', 'accounting', 'statements']],
  ];
  let s = 1101;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

function buildPreTechComputerExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['Which Personal Protective Equipment (PPE) protects a workshop technician’s eyes when grinding metal or sawing timber?', 'Safety goggles / face shield', ['Rubber sandals', 'Cotton handkerchief', 'Woollen scarf'], 'Impact-resistant safety goggles shield the eyes from flying metal sparks, wood chips, and chemical splashes.', ['safety', 'ppe', 'workshop', 'foundations']],
    ['In technical drawing, what does a thin DASHED (short-dash) line represent on an orthographic view?', 'Hidden details / edges not directly visible from that view', ['Visible outer object outlines', ['Lines of symmetry (centre lines)'][0], 'Leader lines'], 'Continuous thick lines show visible outlines; dashed lines show hidden edges; chain lines show centre axes.', ['drawing', 'lines', 'communication', 'orthographic']],
    ['At what angle to the horizontal baseline are receding axes drawn in a standard ISOMETRIC 3D drawing?', '30° on both left and right sides', ['45° on one side only', '60° and 90°', '15° on both sides'], 'Isometric projection sets both receding axes at 30° to the horizontal with true scale lengths.', ['isometric', 'oblique', 'drawing', 'communication']],
    ['Which workshop marking-out and testing tool is used to check whether two planed timber surfaces meet at an exact 90° right angle?', 'Try-square', ['Tenon saw', 'Scriber', 'Mallet'], 'A try-square tests 90° squareness of edges and guides perpendicular pencil lines across wood.', ['tools', 'measuring', 'marking', 'materials']],
    ['Which hand saw has a stiffened brass/steel back rib for making straight, accurate joints in woodwork?', 'Tenon saw', ['Hacksaw', 'Coping saw', 'Rip saw'], 'A tenon saw cuts accurate woodworking joints; a hacksaw cuts metal pipes and rods.', ['cutting', 'tools', 'wood', 'materials']],
    ['How do thermoplastics (e.g., PVC, polythene) differ from thermosetting plastics (e.g., melamine, Bakelite) when heated?', 'Thermoplastics soften and can be remoulded on heating, whereas thermosets char and cannot be remoulded', ['Thermosets melt into liquid water', 'Thermoplastics conduct high-voltage electricity', 'Both dissolve in cold water'], 'Cross-links in thermosetting polymers make them rigid and heat-resistant (used for saucepan handles and electrical sockets).', ['polymers', 'materials', 'plastics']],
    ['Inside a computer’s Central Processing Unit (CPU), which component performs arithmetic calculations and logical comparisons?', 'Arithmetic and Logic Unit (ALU)', ['Read-Only Memory (ROM)', 'Hard Disk Drive (HDD)', 'Uninterruptible Power Supply (UPS)'], 'The CPU comprises the ALU (calculations & logic), Control Unit (instruction coordination), and Registers.', ['cpu', 'hardware', 'computer']],
    ['What is the key difference between RAM (Random Access Memory) and ROM (Read-Only Memory)?', 'RAM is volatile (loses data when power goes off), while ROM is non-volatile and stores boot firmware', ['RAM permanently stores files without electricity', 'ROM is erased every time you close a browser', 'RAM is an external printer'], 'RAM holds active programs temporarily; ROM retains startup BIOS/UEFI instructions permanently.', ['hardware', 'memory', 'computer']],
    ['Which category of software manages computer hardware resources and provides a platform for applications (e.g., Windows, Linux, Android)?', 'Operating System (System Software)', ['Word processor', 'Web browser', 'Presentation slide deck'], 'An Operating System is core system software managing CPU scheduling, memory, files, and I/O devices.', ['software', 'operating', 'computer']],
    ['A fraudulent email pretending to come from a bank or mobile-money provider to trick a user into revealing their PIN or password is called:', 'Phishing', ['Defragmentation', 'Cloud syncing', 'Compiling'], 'Phishing is a social-engineering cyberattack; never share M-Pesa PINs, OTPs, or passwords via links.', ['online safety', 'phishing', 'cyber', 'data']],
    ['Which Kenyan agency certifies product quality and stamps the Standardization Mark ("Diamond Mark") on safe goods?', 'Kenya Bureau of Standards (KEBS)', ['Communications Authority of Kenya (CAK)', 'Central Bank of Kenya (CBK)', 'Registrar of Persons'], 'KEBS sets quality standards and protects consumers against substandard products.', ['consumer', 'kebs', 'protection']],
    ['In visual/block programming (such as Scratch) or Python, which programming construct repeats a block of instructions until a condition is met?', 'A loop (iteration)', ['A comment', 'A syntax error', 'A static constant'], 'Loops (repeat / while / for) execute instructions repeatedly without duplicating code.', ['programming', 'coding', 'scratch', 'loops']],
  ];
  let s = 1201;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

function buildCreativeSportsExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    ['In colour theory, which set contains ONLY the three PRIMARY pigment colours that cannot be mixed from other colours?', 'Red, Yellow, and Blue', ['Green, Orange, and Purple', 'Black, White, and Grey', 'Pink, Brown, and Turquoise'], 'Mixing pairs of primary colours yields secondary colours: Red+Yellow=Orange, Blue+Yellow=Green, Red+Blue=Purple.', ['colour', 'painting', 'drawing', 'creating']],
    ['Which dry-media shading technique creates dark and light tonal values using tiny closely-spaced DOTS?', 'Stippling', ['Smudging', 'Cross-hatching', 'Wash painting'], 'Stippling varies dot density to create smooth tonal gradation in still-life drawing.', ['drawing', 'shading', 'stippling', 'creating']],
    ['In weaving a mat or basket, the longitudinal stationary threads stretched on a loom are called WARP, while the threads woven across over-and-under are called:', 'Weft', ['Kiln', 'Slip', 'Armature'], 'Weaving interlaces horizontal weft strands across vertical warp strands.', ['weaving', 'basketry', 'craft']],
    ['In fabric decoration, why is hot melted wax applied to cloth during the BATIK process?', 'To resist dye from penetrating waxed areas, creating decorative patterns', ['To burn holes in the cotton fabric', 'To make the cloth heavier permanently', 'To bleach the cloth white'], 'Batik is a wax-resist dyeing technique; once dyed and dried, the wax is ironed or boiled out.', ['batik', 'tie-and-dye', 'fabric', 'performing']],
    ['What is the traditional eight-stringed plucked lyre played by the Luo community of Kenya?', 'Nyatiti', ['Kayamba', 'Isukuti', 'Wandindi'], 'Nyatiti is an 8-stringed Luo lyre; Obokano is the large Gusii lyre; Kayamba is a Mijikenda reed rattle; Wandindi is a Gikuyu fiddle.', ['instruments', 'folk', 'music', 'performing']],
    ['In a 4/4 time signature in music staff notation, what do the top "4" and bottom "4" indicate?', 'Four crotchet (quarter-note) beats in every bar', ['Four semibreves in every bar', 'Four quavers in an entire song', 'Play four octaves higher'], 'In 4/4 (common time), the top 4 = 4 beats per bar, and the bottom 4 = crotchet beat unit.', ['music', 'time signature', 'rhythm', 'foundations']],
    ['Complete the ascending tonic sol-fa ladder: d  r  m  f  ____  l  t  d’', 's (soh)', ['p', 'k', 'b'], 'The eight sol-fa syllables ascending are doh, ray, mi, fah, soh, lah, ti, doh’.', ['music', 'sol-fa', 'melody', 'performing']],
    ['In athletics sprint races (100m, 200m, 400m) using a crouch start, what are the THREE official starter’s commands in exact order?', '"On your marks!" -> "Set!" -> Gun / Whistle ("Go!")', ['"Ready!" -> "Steady!" -> "Run!"', '"Stand!" -> "Jump!" -> "Sprint!"', '"Set!" -> "On your marks!" -> "Stop!"'], 'World Athletics crouch-start commands are strictly "On your marks", "Set", followed by the starting gun.', ['athletics', 'sprint', 'creating', 'performing']],
    ['In a 4 × 100 m relay race, what happens if runners pass the baton OUTSIDE the designated takeover (exchange) zone?', 'The team is disqualified', ['The team is awarded bonus seconds', 'The race restarts for everyone', 'Nothing—batons can be thrown anywhere'], 'The baton must be handed (not thrown) strictly within the marked exchange zone.', ['relay', 'athletics', 'team']],
    ['In a standard game of Netball, how many players from ONE team are allowed on the court at a time, and for how many seconds may a player hold the ball?', '7 players per team; maximum 3 seconds holding the ball', ['11 players; 10 seconds', '6 players; unlimited time', '5 players; 24 seconds'], 'Netball teams field 7 positional players (GS, GA, WA, C, WD, GD, GK) and enforce the 3-second held-ball rule.', ['netball', 'ball games', 'performing']],
    ['In Volleyball, what is the maximum number of hits a team is allowed (excluding a block) to return the ball over the net?', '3 touches (e.g., dig, set, spike)', ['1 touch only', '5 touches', 'Unlimited touches'], 'A volleyball team may contact the ball at most three times before sending it over the net, and no player may hit it twice consecutively.', ['volleyball', 'ball games']],
    ['In sports first aid for a sprained ankle, what does the acronym R.I.C.E. stand for?', 'Rest, Ice, Compression, Elevation', ['Run, Inject, Carry, Exercise', 'Rub, Ignite, Clean, Extend', 'Relax, Inhale, Cough, Exhale'], 'R.I.C.E. reduces internal bleeding, swelling, and pain immediately after a soft-tissue sprain.', ['first aid', 'sportsmanship', 'appreciation']],
  ];
  let s = 1301;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

function buildCreExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    // Strand 1: Creation & The Bible
    ['According to Genesis Chapter 1, on which day did God create human beings (male and female) in His own image and likeness?', 'The sixth (6th) day', ['The first (1st) day', 'The fourth (4th) day', 'The seventh (7th) day'], 'God created land animals and human beings on Day 6, and rested and blessed Day 7.', ['creation', 'creator', 'human']],
    ['How do Christians best demonstrate STEWARDSHIP over God’s creation in their community?', 'Planting trees, conserving water/soil, and caring humanely for animals', ['Cutting down forests for quick charcoal', 'Dumping plastic waste into rivers', 'Poaching wild animals'], 'In Genesis 1:28 & 2:15, God placed human beings in charge of cultivating and guarding the environment.', ['creation', 'stewardship', 'creator']],
    ['What caused the Fall of Humanity in the Garden of Eden according to Genesis Chapter 3?', 'Disobedience to God’s command not to eat from the tree of knowledge of good and evil', ['Building the Tower of Babel', 'Refusing to enter Noah’s ark', 'Worshipping the golden calf'], 'Adam and Eve disobeyed God’s instruction after yielding to the serpent’s temptation.', ['fall', 'salvation', 'creation']],
    ['How many books make up the entire Protestant Holy Bible (Old Testament + New Testament)?', '66 books (39 Old Testament and 27 New Testament)', ['73 books (46 OT and 27 NT)', '60 books (30 OT and 30 NT)', '39 books altogether'], 'The Protestant canon has 39 Old Testament books and 27 New Testament books = 66 books.', ['bible', 'divisions', 'creation']],
    ['Which group consists ONLY of the four Gospel books in the New Testament?', 'Matthew, Mark, Luke, and John', ['Genesis, Exodus, Leviticus, and Numbers', ['Romans, Corinthians, Galatians, and Ephesians'][0], 'Acts, James, Jude, and Revelation'], 'Matthew, Mark, Luke, and John record the birth, life, teachings, death, and resurrection of Jesus Christ.', ['bible', 'divisions']],
    ['Why was the translation of the Holy Bible into local Kenyan languages (such as Kiswahili, Gikuyu, Dholuo, Luhya, Kalenjin) important?', 'It enabled Kenyans to read and understand God’s Word in their own mother tongue for evangelism and literacy', ['It replaced prayer in churches', 'It stopped people from learning English', 'It reduced the number of chapters in Genesis'], 'Bible translation by missionaries and Bible Society of Kenya promoted literacy, local worship, and African church growth.', ['bible', 'translation', 'kenya']],
    ['On which mountain did God give Moses the Ten Commandments written on two stone tablets?', 'Mount Sinai (Mount Horeb)', ['Mount Carmel', 'Mount Olive', 'Mount Ararat'], 'God made the Sinai Covenant with the Israelites and gave Moses the Decalogue on Mount Sinai (Exodus 20).', ['bible', 'salvation', 'creation']],
    // Strand 2: Life & Ministry of Jesus Christ
    ['In which town of Judea was Jesus Christ born, fulfilling Prophet Micah’s prophecy?', 'Bethlehem', ['Nazareth', 'Capernaum', 'Jericho'], 'Jesus was born in Bethlehem of Judea during the census ordered by Emperor Augustus (Luke 2).', ['birth', 'jesus', 'ministry']],
    ['Who baptized Jesus Christ in River Jordan, and what visible sign of the Holy Spirit appeared?', 'John the Baptist; the Holy Spirit descended like a dove', ['Simon Peter; fire fell from the sky', 'Nicodemus; thunder shook the temple', 'Zechariah; a rainbow appeared'], 'John baptized Jesus in River Jordan, heaven opened, the Spirit descended like a dove, and the Father’s voice spoke.', ['baptism', 'birth', 'jesus']],
    ['How old was boy Jesus when He stayed behind in the Jerusalem Temple listening to and asking the teachers questions?', '12 years old', ['8 years old', '18 years old', '30 years old'], 'At age 12 during the Passover festival, Jesus remained in His Father’s house (Luke 2:41–52).', ['boyhood', 'birth', 'jesus']],
    ['In the Parable of the Good Samaritan (Luke 10:25–37), what main Christian lesson did Jesus teach?', 'Showing practical mercy and compassion to anyone in need regardless of tribe or background', ['Praying loudly on street corners', 'Travelling only in large groups', 'Saving money in the temple treasury'], 'True neighbourliness crosses ethnic and social barriers to help suffering people.', ['parables', 'teachings', 'jesus']],
    ['In the Parable of the Lost (Prodigal) Son (Luke 15), what does the father’s warm welcome represent?', 'God’s unconditional love and readiness to forgive repentant sinners', ['Encouraging youth to waste inheritance', 'Punishing older siblings', 'Refusing to work on the farm'], 'God rejoices whenever a sinner repents sincerely and returns home.', ['parables', 'teachings', 'jesus']],
    ['What was the FIRST miracle Jesus performed during a wedding feast at Cana of Galilee (John 2)?', 'Turning water into wine', ['Feeding 5,000 people with five loaves and two fish', 'Walking on water', 'Healing blind Bartimaeus'], 'At Mary’s intercession, Jesus turned six stone jars of water into fine wine at Cana, revealing His glory.', ['miracles', 'jesus', 'ministry']],
    ['When Jesus healed the ten men with leprosy (Luke 17:11–19), how many came back to thank Him, and who was he?', 'Only one—a Samaritan', ['All ten men returned together', 'Nine Pharisees returned', 'None of them returned'], 'Only one grateful Samaritan returned to praise God, teaching the Christian value of gratitude.', ['miracles', 'healing', 'compassion']],
    ['What is the central Christian significance of the RESURRECTION of Jesus Christ on Easter Sunday?', 'It proves Jesus’ victory over sin and death and gives believers hope of eternal life', ['It ended the Roman Empire immediately', 'It abolished the need for prayer', 'It closed the synagogue in Nazareth'], 'Christ’s resurrection is the foundation of Christian faith, salvation, and eternal hope (1 Corinthians 15).', ['resurrection', 'passion', 'death', 'jesus']],
    // Strand 3: The Church & Christian Living
    ['On the Day of Pentecost (Acts Chapter 2), what happened to the disciples gathered in Jerusalem?', 'They were filled with the Holy Spirit, saw tongues of fire, and spoke in other languages boldly', ['They sailed to Rome', 'They built Solomon’s Temple', 'They crowned Stephen king'], 'Pentecost marks the birth and empowerment of the Early Church by the Holy Spirit.', ['pentecost', 'holy spirit', 'church']],
    ['According to Galatians 5:22–23, which list contains ONLY Fruits of the Holy Spirit?', 'Love, joy, peace, patience, kindness, goodness, faithfulness, humility, and self-control', ['Pride, envy, anger, and selfishness', 'Wealth, fame, eloquence, and strength', 'Prophecy, miracles, and administration only'], 'Paul lists nine character qualities (Fruits of the Spirit) produced in a Spirit-led believer.', ['fruit', 'holy spirit', 'church']],
    ['How should a Christian learner use social media and digital devices responsibly during leisure time?', 'Share edifying educational content, respect others’ privacy, and avoid cyberbullying or immoral sites', ['Spread false gossip about classmates', 'Send abusive messages anonymously', 'Spend all night gaming instead of sleeping or studying'], 'Christians are called to honour God in speech, truthfulness, and self-control online and offline.', ['social media', 'leisure', 'christian living']],
    ['Why do Christians strongly oppose drug and substance abuse (such as alcohol, bhang, and miraa/khat)?', 'The human body is the Temple of the Holy Spirit and drugs harm health, judgment, and families', ['Drugs are only meant for elderly people', 'Substances make learners study faster', 'Hospitals have too many doctors'], '1 Corinthians 6:19–20 teaches that our bodies are temples of the Holy Spirit and must be kept pure and healthy.', ['drug', 'substance', 'christian living']],
  ];
  let s = 1401;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

function buildIreExercises(): ExerciseItem[] {
  const rows: Array<[string, string, [string, string, string], string, string[]]> = [
    // Strand 1: Qur'an & Hadith
    ['Through which Archangel did Allah reveal the Holy Qur’an to Prophet Muhammad (PBUH) beginning in Cave Hira?', 'Angel Jibril (AS)', ['Angel Mikail (AS)', 'Angel Israfil (AS)', 'Angel Izrail (AS)'], 'Angel Jibril (AS) is entrusted with conveying divine revelation (Wahy) to Allah’s Prophets.', ['qur’an', 'revelation', 'hadith']],
    ['Which Surah’s opening five verses ("Iqra bismi Rabbikalladhi khalaq...") were the FIRST revelation of the Holy Qur’an?', 'Surah Al-Alaq (Chapter 96)', ['Surah Al-Fatiha', 'Surah Al-Baqarah', 'Surah An-Nasr'], 'The first five verses of Surah Al-Alaq were revealed in Cave Hira during Ramadhan, commanding humanity to read/seek knowledge.', ['qur’an', 'revelation', 'surah']],
    ['Which Surah of the Holy Qur’an is known as "Ummul-Qur’an" (Mother of the Qur’an) and MUST be recited in every Rakaat of Swalah?', 'Surah Al-Fatiha', ['Surah Al-Ikhlas', 'Surah Al-Kauthar', 'Surah Al-Asr'], 'Prophet Muhammad (PBUH) taught that there is no valid prayer for one who does not recite Fatiha-tul-Kitab.', ['surah', 'qur’an', 'swalah']],
    ['What is the central teaching of Surah Al-Ikhlas (Chapter 112: "Qul Huwallahu Ahad")?', 'Tawheed—the absolute Oneness and uniqueness of Allah, Who neither begets nor is born', ['Rules of inheritance', 'Rites of Hajj in Mina', 'History of Abraha’s elephant army'], 'Surah Al-Ikhlas summarizes pure Tawheed (monotheism) and equals one-third of the Qur’an in reward.', ['surah', 'tawheed', 'qur’an']],
    ['Under which Rightly Guided Caliph were standardized copies of the Mushaf (Holy Qur’an) compiled and sent to major Islamic provinces?', 'Caliph Uthman bin Affan (RA) (after initial compilation under Caliph Abu Bakr RA)', ['Umar bin Abdul-Aziz', 'Harun Ar-Rashid', 'Salahuddin Ayyubi'], 'Abu Bakr (RA) commissioned Zaid bin Thabit to compile the first Mushaf, and Uthman (RA) standardized official copies.', ['compilation', 'preservation', 'qur’an']],
    ['In Ulumul-Hadith (Science of Hadith), what do the two main parts of a Hadith—SANAD and MATN—mean?', 'Sanad is the chain of narrators; Matn is the actual text/wording of the Prophet’s teaching', ['Sanad is a Surah; Matn is a verse', 'Sanad is fasting; Matn is charity', 'Sanad is Arabic grammar; Matn is calligraphy'], 'Scholars verify both the unbroken reliability of narrators (Sanad) and authenticity of the text (Matn).', ['hadith', 'ulumul', 'sunnah']],
    ['Complete the famous Hadith teaching on sincerity: "Innamal a’malu bin-niyyat" — Actions are judged ONLY according to:', 'Intentions (Niyyah)', ['Wealth spent', 'Public praise', 'Physical strength'], 'Every deed in Islam is rewarded according to the sincerity of one’s intention for Allah’s pleasure.', ['hadith', 'character', 'akhlaq']],
    // Strand 2: Pillars of Iman & Devotional Acts (Ibadah)
    ['How many Pillars of Islam and how many Articles of Iman (Faith) are there in Islam?', '5 Pillars of Islam and 6 Articles of Iman', ['6 Pillars of Islam and 5 Articles of Iman', '4 Pillars of Islam and 4 Articles of Iman', '7 Pillars of Islam and 6 Articles of Iman'], 'Islam is built on 5 Pillars (Shahadah, Swalah, Zakah, Saum, Hajj); Iman has 6 Articles (Allah, Angels, Books, Prophets, Last Day, Qadar).', ['iman', 'ibadah', 'pillars']],
    ['Match the four major Revealed Books correctly to the Prophets who received them:', 'Taurat -> Musa (AS); Zabur -> Dawud (AS); Injil -> Isa (AS); Qur’an -> Muhammad (PBUH)', ['Taurat -> Ibrahim; Zabur -> Nuh; Injil -> Musa; Qur’an -> Yusuf', ['Zabur -> Isa; Injil -> Dawud; Taurat -> Ismail; Qur’an -> Muhammad'][0], 'Suhuf -> Dawud; Taurat -> Isa; Injil -> Musa; Qur’an -> Muhammad'], 'Belief in Allah’s revealed scriptures in their original form is the third Article of Iman.', ['books', 'iman', 'pillars']],
    ['Who are the FIVE "Ulul-Azm" (Arch-Prophets of resolute perseverance) mentioned in the Holy Qur’an?', 'Nuh (AS), Ibrahim (AS), Musa (AS), Isa (AS), and Muhammad (PBUH)', ['Adam, Idris, Hud, Salih, and Lut (AS)', 'Yusuf, Yaqub, Ishaq, Ismail, and Ayub (AS)', 'Dawud, Sulaiman, Yunus, Zakariyyah, and Yahya (AS)'], 'These five messengers showed extraordinary patience and steadfastness in delivering Allah’s message.', ['iman', 'prophets', 'pillars']],
    ['When clean water is unavailable or medically harmful to use before prayer, a Muslim performs dry ablution using clean earth/dust called:', 'Tayammum', ['Ghusl', 'Istinjaa', 'Miswak'], 'Tayammum (striking clean earth and wiping the face and hands with intention) substitutes Wudhu/Ghusl when water is unavailable.', ['tayammum', 'wudhu', 'taharah', 'ibadah']],
    ['State the exact number of obligatory (Fardh) Rakaat in the five daily prayers from dawn to night (Fajr, Dhuhr, Asr, Maghrib, Isha):', 'Fajr (2), Dhuhr (4), Asr (4), Maghrib (3), Isha (4) — total 17 Rakaat', ['Fajr (2), Dhuhr (2), Asr (4), Maghrib (4), Isha (4)', 'Fajr (4), Dhuhr (4), Asr (4), Maghrib (3), Isha (3)', 'Fajr (2), Dhuhr (4), Asr (3), Maghrib (3), Isha (4)'], 'A Muslim performs 17 obligatory Rakaat across the five daily prayers.', ['swalah', 'ibadah', 'pillars']],
    ['Which sacred rite of Hajj on the 9th of Dhul-Hijjah did the Prophet (PBUH) describe as the essence of Hajj ("Al-Hajju Arafah")?', 'Standing in supplication on the Plain of Arafah (Wuquf bi Arafah)', ['Visiting Madinah market', 'Drinking Zamzam water only', 'Sacrificing in Muharram'], 'Missing Wuquf at Arafah on 9th Dhul-Hijjah invalidates the Hajj pilgrimage.', ['hajj', 'ibadah', 'pillars']],
    ['Fasting (Saum) during the holy month of Ramadhan teaches Muslims:', 'Taqwa (God-consciousness), self-discipline, patience, and empathy for the hungry', ['Laziness during daytime', 'Showing off wealth at feasts', 'Skipping daily prayers'], 'Surah Al-Baqarah 2:183 states that fasting is prescribed so that believers may attain Taqwa.', ['ramadhan', 'swawm', 'ibadah']],
    // Strand 3: Akhlaq, Muamalat & Islamic Heritage (Seerah)
    ['Before prophethood in Makkah, what honourable title was given to Prophet Muhammad (PBUH) because of his honesty and trustworthiness?', 'Al-Amin (The Trustworthy) and As-Sadiq (The Truthful)', ['Al-Faruq', 'Dhun-Nurayn', 'Asadullah'], 'Even Quaraysh opponents entrusted their valuables to the Prophet (PBUH), calling him Al-Amin.', ['seerah', 'sidq', 'akhlaq']],
    ['What does the Islamic virtue of "Birrul-Walidayn" command every Muslim learner to practise?', 'Kindness, obedience, respect, and dutiful care towards both parents', ['Wasting food and water (Israf)', 'Backbiting classmates (Ghibah)', 'Charging interest on loans (Riba)'], 'In Surah Al-Isra (17:23–24), Allah links dutiful kindness to parents immediately after worshipping Him alone.', ['birrul', 'akhlaq', 'virtues']],
    ['Why are Riba (usury/interest), Maysir (gambling), and hoarding strictly prohibited (Haram) in Islamic Muamalat (trade)?', 'They exploit others unfairly and consume wealth unjustly instead of honest trade', ['They reduce shop opening hours', 'They require written receipts', 'They increase charity to orphans'], 'Islam requires mutual consent, honest weights and measures, and Halal earnings free from exploitation.', ['halal', 'muamalat', 'prohibitions']],
    ['What historic event in 622 CE marks the beginning of the Islamic Hijri lunar calendar?', 'The Hijrah (migration) of Prophet Muhammad (PBUH) and Muslims from Makkah to Madinah', ['The Battle of Uhud', 'The birth of Prophet Ibrahim (AS)', 'The building of Al-Azhar Mosque'], 'Caliph Umar bin Khattab (RA) established the Hijrah (622 CE) as Year 1 AH of the Islamic calendar.', ['seerah', 'heritage', 'prophet']],
    ['Upon arriving in Madinah after the Hijrah, how did Prophet Muhammad (PBUH) unite the Muhajirun (migrants) and Ansar (helpers)?', 'He established a bond of Islamic brotherhood (Mu’akhah) and drafted the Charter/Constitution of Madinah', ['He divided them into rival tribes', 'He sent the Muhajirun back to Abyssinia', 'He taxed the Ansar heavily'], 'The Ansar generously shared homes and farms with their Muhajirun brothers, creating a model united society.', ['seerah', 'heritage', 'prophet']],
  ];
  let s = 1501;
  return rows.map(([q, corr, dist, exp, tags]) => {
    const p = packChoices(corr, dist, s++);
    return { q, options: p.options, ans: p.ans, exp, tags };
  });
}

// ============================================================================
// 6. CACHED DOMAIN EXERCISE BANKS MAP
// ============================================================================

export const DOMAIN_EXERCISE_BANKS: Record<string, ExerciseItem[]> = {
  english: buildEnglishExercises(),
  kiswahili: buildKiswahiliExercises(),
  biology: buildBiologyExercises(),
  chemistry: buildChemistryExercises(),
  physics: buildPhysicsExercises(),
  science: [
    ...buildChemistryExercises(),
    ...buildBiologyExercises(),
    ...buildPhysicsExercises(),
  ],
  environmental: [
    ...buildEnvironmentalExercises(),
    ...buildAgricultureExercises().slice(0, 6),
  ],
  agriculture: buildAgricultureExercises(),
  social_history_geography: buildSocialHistoryGeographyExercises(),
  business: buildBusinessExercises(),
  pretech_computer: buildPreTechComputerExercises(),
  creative_sports: buildCreativeSportsExercises(),
  cre: buildCreExercises(),
  ire: buildIreExercises(),
  literature_english: buildEnglishExercises(),
  fasihi_kiswahili: buildKiswahiliExercises(),
  technical_engineering: [
    ...buildPhysicsExercises(),
    ...buildPreTechComputerExercises(),
  ],
  homescience: [
    ...buildAgricultureExercises(),
    ...buildEnvironmentalExercises(),
  ],
  french: buildEnglishExercises(),
  arabic: buildIreExercises(),
  german: buildEnglishExercises(),
};

// ============================================================================
// 7. EXTENDED END-OF-STRAND TEXTBOOK DRILLS (120+ UNIQUE EXERCISES PER SUBJECT)
// ============================================================================

const ENGLISH_IRREGULAR_VERBS: Array<[string, string, string, string]> = [
  ['write', 'wrote', 'written', 'a neat composition'],
  ['speak', 'spoke', 'spoken', 'politely to the visitors'],
  ['choose', 'chose', 'chosen', 'the green storybook'],
  ['break', 'broke', 'broken', 'the old flower vase'],
  ['ring', 'rang', 'rung', 'the assembly bell on time'],
  ['sing', 'sang', 'sung', 'the national anthem proudly'],
  ['begin', 'began', 'begun', 'the morning revision exercise'],
  ['swim', 'swam', 'swum', 'across the shallow pool'],
  ['take', 'took', 'taken', 'all library books back'],
  ['give', 'gave', 'given', 'water to the tree seedlings'],
  ['eat', 'ate', 'eaten', 'a balanced lunch'],
  ['draw', 'drew', 'drawn', 'an accurate map of Kenya'],
  ['grow', 'grew', 'grown', 'healthy sukuma wiki in the garden'],
  ['throw', 'threw', 'thrown', 'litter into the dustbin'],
  ['wear', 'wore', 'worn', 'clean school uniforms'],
  ['drive', 'drove', 'driven', 'carefully past the zebra crossing'],
  ['ride', 'rode', 'ridden', 'the bicycle along the lane'],
  ['hide', 'hid', 'hidden', 'behind the tall hedge'],
  ['forget', 'forgot', 'forgotten', 'to carry an umbrella'],
  ['forgive', 'forgave', 'forgiven', 'her classmate warmly'],
  ['freeze', 'froze', 'frozen', 'the water into ice cubes'],
  ['steal', 'stole', 'stolen', 'maize cobs from the granary'],
  ['tear', 'tore', 'torn', 'a page from the old calendar'],
  ['blow', 'blew', 'blown', 'the referee whistle loudly'],
  ['shake', 'shook', 'shaken', 'hands after the tournament'],
  ['weave', 'wove', 'woven', 'a colourful sisal basket'],
  ['sink', 'sank', 'sunk', 'to the bottom of the beaker'],
  ['drink', 'drank', 'drunk', 'boiled clean water'],
  ['fly', 'flew', 'flown', 'over Nairobi National Park'],
  ['know', 'knew', 'known', 'the correct spelling'],
];

const ENGLISH_ADJECTIVES: Array<[string, string, string, string, string]> = [
  ['tall', 'taller', 'tallest', 'giraffe', 'animal in the park'],
  ['fast', 'faster', 'fastest', 'cheetah', 'sprinter on the track'],
  ['heavy', 'heavier', 'heaviest', 'elephant', 'box on the shelf'],
  ['clean', 'cleaner', 'cleanest', 'classroom', 'stream in the school'],
  ['bright', 'brighter', 'brightest', 'lantern', 'star in the night sky'],
  ['brave', 'braver', 'bravest', 'firefighter', 'rescuer in the team'],
  ['polite', 'more polite', 'most polite', 'prefect', 'speaker in the hall'],
  ['careful', 'more careful', 'most careful', 'driver', 'cyclist on the road'],
  ['generous', 'more generous', 'most generous', 'neighbour', 'donor at the event'],
  ['important', 'more important', 'most important', 'lesson', 'rule in the lab'],
  ['deep', 'deeper', 'deepest', 'ocean trench', 'lake in the valley'],
  ['wide', 'wider', 'widest', 'highway', 'river in the county'],
  ['happy', 'happier', 'happiest', 'child', 'choir at the festival'],
  ['strong', 'stronger', 'strongest', 'ox', 'bridge across the river'],
  ['wise', 'wiser', 'wisest', 'elder', 'judge in the story'],
];

const KISWAHILI_VERBS: Array<[string, string, string, string, string]> = [
  ['soma', 'somea', 'somewa', 'someka', 'somesha'],
  ['pika', 'pikia', 'pikiwa', 'pikika', 'pikisha'],
  ['jenga', 'jengea', 'jengewa', 'jengeka', 'jengesha'],
  ['lima', 'limia', 'limiwa', 'limika', 'limisha'],
  ['funga', 'fungia', 'fungiwa', 'fungika', 'fungisha'],
  ['andika', 'andikia', 'andikiwa', 'andikika', 'andikisha'],
  ['chora', 'chorea', 'chorewa', 'choreka', 'choresha'],
  ['panda', 'pandia', 'pandiwa', 'pandika', 'pandisha'],
  ['imba', 'imbia', 'imbiwa', 'imbika', 'imbisha'],
  ['shona', 'shonea', 'shonewa', 'shoneka', 'shonesha'],
  ['beba', 'bebea', 'bebewa', 'bebeka', 'bebesha'],
  ['fagia', 'fagilia', 'fagiliwa', 'fagilika', 'fagilisha'],
  ['osha', 'oshea', 'oshewa', 'osheka', 'oshesha'],
  ['kata', 'katia', 'katiwa', 'katika', 'katisha'],
  ['nunua', 'nunulia', 'nunuliwa', 'nunulika', 'nunulisha'],
];

const SWAHILI_HOURS = [
  'moja', 'mbili', 'tatu', 'nne', 'tano', 'sita',
  'saba', 'nane', 'tisa', 'kumi', 'kumi na moja', 'kumi na mbili',
];

const EXTRA_CRE_EXERCISES: Array<[string, string, [string, string, string], string]> = [
  ['On the FIRST day of creation in Genesis 1, what did God create?', 'Day and night (light separated from darkness)', ['Sun, moon, and stars', 'Birds and sea creatures', 'Dry land and vegetation'], 'God created light on Day 1; sky on Day 2; land & plants on Day 3; sun, moon & stars on Day 4; sea life & birds on Day 5; land animals & humans on Day 6.'],
  ['On the FOURTH day of creation, what did God place in the sky to govern day and night and mark seasons?', 'The sun, the moon, and the stars', ['Rain clouds and wind', 'Eagles and doves', 'Rivers and oceans'], 'Genesis 1:14–19 records the creation of the sun, moon, and stars on Day 4.'],
  ['Why did God instruct Noah to build the Ark before sending the flood?', 'Because Noah was righteous and walked faithfully with God while wickedness filled the earth', ['Because Noah wanted to catch whales', 'Because there was drought in Egypt', 'Because Pharaoh chased him'], 'God saved righteous Noah, his family, and pairs of living creatures in the Ark (Genesis 6–8).'],
  ['From which city did God call Abraham (then Abram) to leave and go to the land of Canaan?', 'Haran (after leaving Ur of the Chaldeans)', ['Jericho', 'Damascus', 'Nineveh'], 'At age 75 in Haran, Abram obeyed God’s call to journey to Canaan (Genesis 12:1–4).'],
  ['What was the outward sign of God’s covenant with Abraham and his male descendants in Genesis 17?', 'Circumcision', ['Building a golden altar', 'Wearing purple robes', 'Fasting for forty days'], 'Circumcision of every eight-day-old male served as the physical sign of the Abrahamic Covenant.'],
  ['During the night of the Passover in Egypt, what did the Israelites smear on their doorposts so the angel of death would pass over their homes?', 'The blood of a one-year-old unblemished lamb', ['Olive oil and honey', 'River Nile mud', 'Ashes from a furnace'], 'Lamb’s blood smeared with hyssop marked Israelite homes during the tenth plague (Exodus 12).'],
  ['Which of the Ten Commandments is the FIRST commandment with a promise attached to it?', '"Honour your father and your mother, so that you may live long in the land"', ['"You shall not steal"', '"You shall not bear false witness"', '"You shall not covet"'], 'Exodus 20:12 (Ephesians 6:2) promises long life and blessing to children who honour their parents.'],
  ['With what simple weapon and faith in God did young shepherd David defeat the Philistine giant Goliath?', 'A sling and a smooth stone from the stream', ['A heavy bronze chariot', 'King Saul’s iron spear', 'A bow and poisoned arrows'], 'David trusted in the Lord Almighty rather than armour and struck Goliath with a slung stone (1 Samuel 17).'],
  ['Which king of Israel was renowned for praying to God for WISDOM to judge God’s people fairly and for building the first Jerusalem Temple?', 'King Solomon', ['King Saul', 'King Ahab', 'King Rehoboam'], 'God granted Solomon unmatched wisdom and discernment because he asked for wisdom rather than riches (1 Kings 3).'],
  ['On Mount Carmel, which prophet contested against the 450 prophets of Baal to prove that Yahweh is the true living God?', 'Prophet Elijah', ['Prophet Jonah', 'Prophet Amos', 'Prophet Hosea'], 'God answered Elijah’s prayer by sending fire from heaven to consume the water-soaked sacrifice on Mount Carmel (1 Kings 18).'],
  ['Which Old Testament prophet is especially known as the "Prophet of Social Justice" who condemned the rich for oppressing the poor?', 'Prophet Amos', ['Prophet Haggai', 'Prophet Nahum', 'Prophet Obadiah'], 'Amos preached: "Let justice roll on like a river, righteousness like a never-failing stream!" (Amos 5:24).'],
  ['Which angel appeared to both Zechariah in the Temple and Virgin Mary in Nazareth to announce the births of John and Jesus?', 'Angel Gabriel', ['Angel Michael', 'Angel Raphael', 'Angel Uriel'], 'Luke Chapter 1 records Angel Gabriel’s annunciations to Zechariah and to Mary.'],
  ['What gifts did the Wise Men (Magi) from the East present to baby Jesus in Bethlehem?', 'Gold, frankincense, and myrrh', ['Silver, wheat, and olive oil', 'Sheep, doves, and honey', 'Scrolls, sandals, and cloaks'], 'Gold symbolized kingship, frankincense deity/priesthood, and myrrh His future suffering death (Matthew 2:11).'],
  ['For how many days and nights did Jesus fast in the wilderness before overcoming the devil’s three temptations using Scripture?', '40 days and 40 nights', ['7 days and 7 nights', '12 days and 12 nights', '70 days'], 'Jesus fasted 40 days in the Judean wilderness and answered every temptation with "It is written..." (Matthew 4:1–11).'],
  ['What were Simon Peter and his brother Andrew doing by Lake Galilee when Jesus called them to become "fishers of men"?', 'Casting fishing nets into the lake', ['Collecting Roman taxes', 'Making wooden yokes', 'Guarding the city gate'], 'Peter, Andrew, James, and John were fishermen; Matthew (Levi) was a tax collector.'],
  ['Complete the Beatitude from Jesus’ Sermon on the Mount: "Blessed are the peacemakers, for they will be called ________."', 'children of God', ['rulers of the earth', 'the richest in Jerusalem', 'judges of Israel'], 'Matthew 5:9 promises that peacemakers shall be called children (sons) of God.'],
  ['In the Parable of the Sower (Luke 8), what do the seeds that fell on GOOD SOIL represent?', 'People who hear God’s Word, retain it in an honest heart, and persevere to bear fruit', ['People who never hear the Gospel', 'People choked by worries and riches', 'People who forget immediately'], 'Good soil represents receptive, obedient believers who put God’s Word into daily practice.'],
  ['With how many loaves of bread and fish did Jesus miraculously feed the crowd of 5,000 men (plus women and children)?', '5 barley loaves and 2 fish (with 12 baskets of leftovers collected)', ['7 loaves and 7 fish', '12 loaves and 5 fish', '2 loaves and 10 fish'], 'A young boy shared his 5 barley loaves and 2 small fish, and Jesus blessed and multiplied them (John 6:9–13).'],
  ['Who was the blind beggar sitting by the roadside near Jericho who cried out, "Jesus, Son of David, have mercy on me!" and received his sight?', 'Bartimaeus (son of Timaeus)', ['Zacchaeus', 'Nicodemus', 'Joseph of Arimathea'], 'Jesus commended Bartimaeus: "Go, your faith has healed you" (Mark 10:46–52).'],
  ['Who was the short chief tax collector in Jericho who climbed a sycamore-fig tree to see Jesus and repented by giving half his possessions to the poor?', 'Zacchaeus', ['Caiaphas', 'Barabbas', 'Pontius Pilate'], 'Jesus visited Zacchaeus’ house and declared, "Today salvation has come to this house" (Luke 19:1–10).'],
  ['During the Last Supper with His disciples, what did the unleavened bread and cup of wine symbolize?', 'Jesus’ body given for humanity and His blood of the New Covenant poured out for forgiveness of sins', ['Harvest celebration of barley', 'Victory over King Herod', 'Journey to Egypt'], 'Jesus instituted the Holy Eucharist / Lord’s Supper in remembrance of His sacrificial death (Luke 22:19–20).'],
  ['Who was the first Christian martyr stoned to death while praying for his persecutors ("Lord, do not hold this sin against them")?', 'Stephen, one of the seven deacons', ['Barnabas', 'Timothy', 'Silas'], 'Acts Chapter 7 records Stephen’s courageous defence of the faith and Christ-like forgiveness at his martyrdom.'],
  ['On the road to which city was Saul of Tarsus blinded by a heavenly light and converted to become Apostle Paul?', 'Damascus', ['Antioch', 'Corinth', 'Ephesus'], 'Risen Jesus spoke to Saul on the road to Damascus, transforming him into the missionary Apostle Paul (Acts 9).'],
  ['Why do Christians value honest work and condemn laziness and bribery?', 'God Himself worked in creation and commands believers to earn a living honestly to support themselves and the needy', ['Work is a curse to be avoided', 'Bribery makes courts faster', 'Only leaders should work'], '2 Thessalonians 3:10 & Ephesians 4:28 teach Christians to work diligently with their own hands and share with those in need.'],
  ['How should a true Christian friend act when a classmate is grieving or sick?', 'Visit, comfort, pray with them, and help them catch up with class notes', ['Laugh at their misfortune', 'Isolate them from the group', 'Demand money before helping'], 'Galatians 6:2 instructs believers to "Carry each other’s burdens, and in this way you will fulfil the law of Christ."'],
];

const EXTRA_IRE_EXERCISES: Array<[string, string, [string, string, string], string]> = [
  ['For how many total years was the Holy Qur’an revealed piecemeal to Prophet Muhammad (PBUH) in Makkah and Madinah?', '23 years (13 years in Makkah and 10 years in Madinah)', ['10 years altogether', '40 years in Makkah', '63 years'], 'Gradual revelation over 23 years strengthened the Prophet’s heart and addressed events step by step.'],
  ['How many Surahs (chapters) and how many Juz (parts) make up the Holy Qur’an?', '114 Surahs and 30 Juz', ['99 Surahs and 20 Juz', '120 Surahs and 40 Juz', '66 Surahs and 12 Juz'], 'The Holy Qur’an begins with Surah Al-Fatiha (#1) and ends with Surah An-Nas (#114), divided into 30 equal Juz.'],
  ['Which two Surahs are together called "Al-Mu’awwidhatayn" (The Two Surahs of Seeking Refuge in Allah from all evil)?', 'Surah Al-Falaq (113) and Surah An-Nas (114)', ['Surah Al-Baqarah and Al-Imran', 'Surah Yasin and Ar-Rahman', 'Surah Al-Fil and Al-Quraish'], 'Reciting Surah Al-Falaq and Surah An-Nas seeks Allah’s protection from external harm and evil whispers.'],
  ['According to Surah Al-Asr (Chapter 103), all human beings are in a state of loss EXCEPT those who:', 'Have Iman (faith), do righteous deeds, and advise one another to truth and patience (Sabr)', ['Accumulate gold and silver', 'Build tall palaces', 'Travel to distant lands'], 'Surah Al-Asr sets four conditions for true success: faith, good deeds, mutual counsel to truth, and patience.'],
  ['Which Surah warns those who neglect prayers for show (Riyaa), repulse orphans, and refuse small kindnesses to neighbours?', 'Surah Al-Ma’un (Chapter 107)', ['Surah Al-Kauthar', 'Surah Al-Ikhlas', 'Surah Al-Qadr'], 'Surah Al-Ma’un condemns hypocrisy that ignores the orphan and the needy while praying only to be seen.'],
  ['In which special night of Ramadhan—described in Surah Al-Qadr as "better than a thousand months"—did revelation of the Qur’an begin?', 'Laylatul-Qadr (The Night of Decree/Power)', ['Laylatul-Isra', 'Day of Ashura', 'Yawmul-Arafah'], 'Worship on Laylatul-Qadr (sought in the odd nights of the last ten days of Ramadhan) exceeds 1,000 months (over 83 years).'],
  ['Which Archangel is entrusted by Allah with blowing the Trumpet (As-Sur) on the Last Day (Yawmul-Qiyamah)?', 'Angel Israfil (AS)', ['Angel Mikail (AS)', 'Angel Malik (AS)', 'Angel Ridhwan (AS)'], 'Jibril brings revelation; Mikail oversees rain/sustenance; Israfil blows the Trumpet; Malik guards Hellfire; Ridhwan guards Paradise.'],
  ['Which two authentic Hadith collections are together honoured as "As-Sahihayn" (The Two Most Authentic Books after the Qur’an)?', 'Sahih Al-Bukhari and Sahih Muslim', ['Muwatta Malik and Musnad Ahmad', 'Tarikh Tabari and Sirah Ibn Hisham', 'Tafsir Ibn Kathir and Jalalayn'], 'Imam Al-Bukhari and Imam Muslim applied rigorous criteria in compiling authentic Prophetic traditions.'],
  ['Which of the following acts NULLIFIES (breaks) a Muslim’s state of Wudhu (ablution)?', 'Deep sleep, passing wind/urine/stool, or loss of consciousness', ['Smiling politely at a classmate', 'Reciting Surah Al-Ikhlas', 'Drinking clean water'], 'Any discharge from the two passages, deep sleep, or fainting invalidates Wudhu and requires fresh ablution before Swalah.'],
  ['Before starting Swalah, which condition (Shart) requires a worshipper in Kenya to face the direction of the Sacred Ka’bah in Makkah?', 'Facing the Qiblah (Istiqbal al-Qiblah)', ['Wearing a white cap', 'Praying on a velvet carpet', 'Closing the mosque windows'], 'Facing the Qiblah, purity (Taharah), covering Awrah, entering prayer time, and intention are prerequisites of Swalah.'],
  ['How is Salatul-Janazah (the Islamic funeral prayer for a deceased Muslim) performed?', 'Standing throughout with 4 Takbirs, recitation, blessings on the Prophet, and Du’a—WITHOUT Ruku or Sujud', ['Sitting down with 2 Rakaat and 4 Sujud', 'Running seven times around the bier', 'Reciting Adhan and Iqamah loudly'], 'Salatul-Janazah is Fardh Kifayah performed standing with four Takbirs and no bowing or prostration.'],
  ['A Muslim traveller on a lawful long journey is granted the concession (Rukhsah) of QASR, which means:', 'Shortening four-Rakaat prayers (Dhuhr, Asr, Isha) to two Rakaat each', ['Shortening Fajr to one Rakaat', 'Skipping all prayers for a month', 'Shortening Maghrib to one Rakaat'], 'Qasr shortens 4-Rakaat obligatory prayers (Dhuhr, Asr, Isha) to 2 Rakaat; Fajr (2) and Maghrib (3) are never shortened.'],
  ['According to Surah At-Tawbah (9:60), how many categories of eligible recipients (Asnaf) may receive obligatory Zakah?', '8 categories (including the poor/Fuqara, needy/Masakin, debtors, wayfarers, etc.)', ['2 categories only', '12 categories', 'Anyone including wealthy kings'], 'Allah specifies the exact eight rightful categories of Zakah beneficiaries in Qur’an 9:60.'],
  ['What is Zakatul-Fitr, and when must it be given out?', 'Obligatory charity of staple food given at the end of Ramadhan BEFORE the Eid-ul-Fitr prayer', ['Optional charity given in Muharram', 'Business tax paid every five years', 'Dowry paid during marriage'], 'Zakatul-Fitr purifies the fasting person from idle talk and feeds the poor so everyone rejoices on Eid day.'],
  ['In which year known as "Amul-Fil" (The Year of the Elephant) was Prophet Muhammad (PBUH) born in Makkah?', '570 CE (12th Rabi-ul-Awwal)', ['610 CE', '622 CE', '632 CE'], 'Prophet Muhammad (PBUH) was born in 570 CE, received prophethood at age 40 (610 CE), migrated in 622 CE, and passed away in 632 CE.'],
  ['Who was the FIRST person to embrace Islam and comfort Prophet Muhammad (PBUH) after the first revelation in Cave Hira?', 'Lady Khadijah bint Khuwaylid (RA)', ['Khalid bin Walid (RA)', 'Abu Sufyan (RA)', 'Salman Al-Farisi (RA)'], 'Lady Khadijah (RA), his noble wife, immediately believed and reassured him, taking him to Waraqah bin Nawfal.'],
  ['During early persecution in Makkah, to which righteous Christian king (Negus) in East Africa did the Prophet send Muslim refugees for safety?', 'King Ashama (An-Najashi) of Abyssinia (Habasha / Ethiopia)', ['Emperor Heraclius of Rome', 'Chosroes of Persia', 'King of Spain'], 'An-Najashi of Abyssinia welcomed the Muslim migrants warmly and refused to hand them back to the Quraysh.'],
  ['Which was the FIRST major defensive battle fought in 2 AH (624 CE) where 313 Muslims achieved victory over 1,000 Makkans?', 'The Battle of Badr', ['The Battle of Uhud', 'The Battle of Khandaq (Trench)', 'The Battle of Tabuk'], 'Allah granted the 313 believers victory at Badr on 17th Ramadhan 2 AH.'],
  ['Who were the FOUR Rightly Guided Caliphs (Al-Khulafa Ar-Rashidun) in chronological order after Prophet Muhammad (PBUH)?', 'Abu Bakr As-Siddiq -> Umar bin Al-Khattab -> Uthman bin Affan -> Ali bin Abi Talib (RA)', ['Umar -> Abu Bakr -> Ali -> Uthman', 'Muawiyah -> Yazid -> Marwan -> Abdul-Malik', 'Ali -> Hasan -> Husain -> Zaid'], 'The 30-year era of the Khulafa Ar-Rashidun followed the prophetic model of justice and consultation (Shura).'],
  ['When a fellow Muslim greets you with "Assalamu Alaikum" (Peace be upon you), what is the best Islamic response?', '"Wa Alaikumus-Salam wa Rahmatullahi wa Barakatuh"', ['"Good night"', '"Alhamdulillah" only', 'Remaining silent'], 'Surah An-Nisa 4:86 instructs believers to return a greeting with one even better or at least equal to it.'],
];

const EXTRA_GENERAL_EXERCISES: Record<string, Array<[string, string, [string, string, string], string]>> = {
  environmental: [
    ['Which sense organ do we use to SMELL fresh flowers or smoke in the kitchen?', 'The nose', ['The ears', 'The eyes', 'The knees'], 'Humans have five main sense organs: eyes (sight), ears (hearing), nose (smell), tongue (taste), and skin (touch).'],
    ['When is your shadow on the school playground SHORTEST during a sunny day?', 'At noon (midday) when the sun is directly overhead', ['Early in the morning at sunrise', 'Late in the evening at sunset', 'At midnight'], 'Shadows are longest at sunrise and sunset and shortest around 12:00 noon.'],
    ['Which part of the sukuma wiki (kale) and cabbage plant do we cook and eat as vegetables?', 'The leaves', ['The roots', 'The bark', 'The thorns'], 'Sukuma wiki, spinach, and cabbage are leafy vegetables; carrots and cassava are edible roots.'],
    ['Which part of the carrot and cassava plant stores food that we harvest and eat?', 'The roots (root tubers)', ['The flowers', 'The pods', 'The tendrils'], 'Carrots and cassava store food in swollen underground roots; sugarcane and Irish potatoes store food in stems.'],
    ['On the National Flag of Kenya, what does the GREEN band symbolize?', 'Kenya’s rich agricultural land, natural vegetation, and resources', ['Blood shed during the struggle for independence', 'Peace and unity', 'The people of Kenya'], 'Black = the people; Red = blood shed for freedom; Green = land & agriculture; White fimbriation = peace & unity; Shield & spears = defence of freedom.'],
    ['Which group of foods gives our bodies ENERGY to run, play, and work?', 'Ugali, rice, chapati, potatoes, and yams (carbohydrates)', ['Water and table salt only', 'Tea leaves without milk', 'Lemon peel'], 'Energy-giving foods (carbohydrates), body-building foods (proteins like beans, milk, eggs), and protective foods (fruits & vegetables) form a balanced meal.'],
    ['Which insect is harmful at home because it breeds in Pit latrines/rubbish and spreads cholera and typhoid germs onto uncovered food?', 'The housefly', ['The honeybee', 'The butterfly', 'The dragonfly'], 'Covering food, keeping latrines clean, and disposing of waste properly prevents houseflies from contaminating food.'],
    ['Which useful insect visits flowers for nectar and produces sweet honey for human food and medicine?', 'The honeybee', ['The mosquito', 'The tsetse fly', 'The cockroach'], 'Honeybees pollinate crops and produce honey and beeswax in beehives (apiculture).'],
    ['Female Anopheles mosquitoes transmit which common disease when they bite people at night?', 'Malaria (prevented by sleeping under a treated mosquito net and draining stagnant water)', ['Ringworm', 'Tooth decay', 'Rickets'], 'Draining stagnant water, clearing tall bushes near houses, and sleeping under ITNs prevents malaria.'],
    ['What should you do immediately if your clothes accidentally catch fire?', 'STOP, DROP to the ground, and ROLL to smother the flames', ['Run fast into the wind', 'Hide inside a wooden cupboard', 'Fan the flames with paper'], 'Running feeds oxygen to flames; stopping, dropping, and rolling cuts off oxygen and puts out the fire.'],
  ],
  agriculture: [
    ['Replacing seeds that failed to germinate in a planted crop field so that there are no empty spaces in rows is called:', 'Gapping', ['Thinning', 'rogueing', 'Pruning'], 'Gapping ensures optimum plant population across the field; thinning removes overcrowded excess seedlings.'],
    ['Removing diseased or off-type plants completely from a healthy seed crop field to stop disease spread is called:', 'Rogueing', ['Mulching', 'Earthing up', 'Top-dressing'], 'Uprooting and destroying infected plants (rogueing) prevents viral and bacterial diseases from spreading.'],
    ['Heaping soil around the base of growing Irish potatoes, groundnuts, or maize stems is known as:', 'Earthing up', ['Pricking out', 'Winnowing', 'Threshing'], 'Earthing up encourages tuber expansion in Irish potatoes, prevents greening of tubers, and supports maize prop roots.'],
    ['Why is a compost heap turned periodically and sprinkled with moderate water during decomposition?', 'To supply air (oxygen) and moisture needed by decomposing microorganisms', ['To freeze the bacteria', 'To wash away all nutrients', 'To attract termites only'], 'Aerobic bacteria and fungi require air and moisture to break down organic matter into rich humus.'],
    ['Lack of IRON in a person’s diet leads to reduced haemoglobin in red blood cells, causing:', 'Anaemia (fatigue, pale gums/palms, breathlessness)', ['Goitre', 'Rickets', 'Scurvy'], 'Iron-rich foods such as liver, dark green leafy vegetables (managu, spinach), and beans prevent nutritional anaemia.'],
    ['Lack of IODINE in the diet causes swelling of the thyroid gland in the neck known as:', 'Goitre', ['Kwashiorkor', 'Marasmus', 'Beriberi'], 'Using iodized table salt and eating seafood prevents iodine-deficiency goitre.'],
    ['Which food preservation method removes moisture from grains, fish, or vegetables so bacteria and moulds cannot grow?', 'Drying / dehydration (sun-drying or solar drying)', ['Soaking in warm water', 'Leaving uncovered in humid air', 'Wrapping wet in polythene'], 'Microorganisms require moisture to multiply; drying grains to safe moisture (~13%) prevents aflatoxin mould and spoilage.'],
    ['When laundering a white cotton shirt stained with fresh blood, what water temperature should be used FIRST?', 'Cold water with salt (hot water cooks protein and fixes blood stains permanently)', ['Boiling water immediately', 'Hot iron before washing', 'Paraffin'], 'Protein stains like blood and egg must be soaked in cold water first because hot water coagulates protein into the fibres.'],
  ],
  social_history_geography: [
    ['Which weather station instrument consists of wet-bulb and dry-bulb thermometers used to measure relative humidity of the air?', 'Hygrometer', ['Anemometer', 'Wind vane', 'Sunshine recorder'], 'The difference in readings between dry-bulb and wet-bulb thermometers indicates atmospheric relative humidity.'],
    ['Which line of latitude divides the Earth into the Northern and Southern Hemispheres and passes right through Kenya?', 'The Equator (0° latitude)', ['The Tropic of Cancer (23½° N)', 'The Tropic of Capricorn (23½° S)', 'The Greenwich Meridian (0° longitude)'], 'The Equator (0°) crosses Kenya through counties including Kisumu, Nandi, Baringo, Laikipia, Meru, and Garissa.'],
    ['In which town on the Kenyan coast did the Portuguese build Fort Jesus in 1593 to guard the Old Port?', 'Mombasa', ['Lamu', 'Kisumu', 'Nakuru'], 'Fort Jesus in Mombasa was designed by Cairati in 1593 and is today a UNESCO World Heritage Site and national museum.'],
    ['On which historic date did Kenya attain full Republic status (Jamhuri Day) with Mzee Jomo Kenyatta as first President?', '12th December 1964 (after Internal Self-Government on 1st June 1963 and Independence on 12th December 1963)', ['20th October 1952', '1st May 1960', '27th August 2010'], 'Madaraka Day is 1st June (1963); Independence was 12th December 1963; Kenya became a Republic on 12th December 1964.'],
    ['Who heads a County Executive Government in Kenya and is directly elected by registered voters of that county?', 'The County Governor (assisted by the Deputy Governor and County Executive Committee)', ['The County Commissioner', 'The Speaker of the Senate', 'The Chief Justice'], 'Each of Kenya’s 47 counties elects a Governor to head the County Executive, while the Speaker presides over the County Assembly.'],
    ['Which multi-purpose river development project along River Tana generates the largest share of Kenya’s hydro-electric power?', 'The Seven Forks Scheme (Masinga, Kamburu, Gitaru, Kindaruma, and Kiambere Dams)', ['Aswan High Dam', 'Kariba Dam', 'Akosombo Dam'], 'The Seven Forks cascade on River Tana generates hydro-electricity, controls floods, and supplies water.'],
    ['Which regional intergovernmental organization unites Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, DRC, and Somalia?', 'East African Community (EAC), headquartered in Arusha, Tanzania', ['ECOWAS', 'SADC', 'European Union'], 'The EAC promotes a Customs Union, Common Market, free movement, and regional infrastructure across Eastern Africa.'],
    ['Diatomite—a chalky mineral used in water filters and heat insulation—is mined in Kenya primarily at:', 'Kariandusi near Gilgil in Nakuru County', ['Lake Magadi', 'Bamburi in Mombasa', 'Kakamega Forest'], 'Kariandusi is famous for both diatomite deposits and Acheulean prehistoric hand-axe sites.'],
  ],
  business: [
    ['What type of business unit is owned, financed, and managed by ONE person who enjoys all profits and bears unlimited liability?', 'Sole proprietorship (sole trader)', ['Public limited company', 'Savings and Credit Cooperative (SACCO)', 'Parastatal corporation'], 'A sole proprietorship is quick to form and flexible, though the owner has unlimited personal liability for business debts.'],
    ['What is the key advantage of a Savings and Credit Cooperative Society (SACCO) to Kenyan teachers, farmers, and workers?', 'Members pool regular savings and access affordable loans at low interest rates plus annual dividends', ['Loans carry 100% monthly compound interest', 'Only foreign banks can join', 'Profits go to a single private owner'], 'SACCOs operate on democratic cooperative principles (one member, one vote) to empower members financially.'],
    ['In double-entry bookkeeping, state the golden rule for recording every business transaction:', 'For every debit entry, there must be a corresponding and equal credit entry', ['Record cash sales only and ignore expenses', 'Enter all items on the credit side twice', 'Write balances in pencil only'], 'Dual aspect keeps the ledger and Trial Balance in equilibrium (Total Debits = Total Credits).'],
    ['When the Central Bank raises interest rates and cash-reserve ratios to reduce excessive money supply in the economy, what problem is it controlling?', 'Inflation (persistent general rise in prices)', ['Population census', 'Soil erosion', 'Road congestion'], 'Contractionary monetary policy curbs excess demand-pull inflation and stabilizes currency purchasing power.'],
    ['Which mode of transport is most economical for carrying bulky, heavy, low-value cargo like coal, crude oil, and machinery across continents?', 'Sea / water transport (ocean cargo ships and tankers)', ['Air freight by passenger jet', 'Motorcycle courier', 'Handcarts'], 'Ocean shipping offers huge carrying capacity and the lowest cost per tonne-kilometre for intercontinental bulk trade.'],
    ['Which commercial document is sent by a buyer to a supplier officially ordering specific goods at stated prices?', 'Local Purchase Order (LPO)', ['Receipt', 'Statement of Account', 'Cash Sale Slip'], 'After reviewing a quotation/catalogue, the buyer issues an official Purchase Order (LPO) to order the goods.'],
  ],
  pretech_computer: [
    ['Which workshop holding tool is bolted firmly to the edge of a workbench to grip timber or metal securely while sawing or filing?', 'Bench vice (woodworker’s or engineer’s vice)', ['Vernier callipers', 'Plumb bob', 'Spirit level'], 'Clamping workpieces firmly in a bench vice keeps both hands safe on the cutting tool and ensures accuracy.'],
    ['Why are saucepan handles and electrical plug casings manufactured from thermosetting plastics rather than metals?', 'Thermosets are poor conductors (insulators) of heat and electricity and do not melt when hot', ['Thermosets conduct electricity faster than copper', 'Metals are transparent', 'Plastics attract magnets'], 'Electrical and thermal insulation protects users from burns and electric shock.'],
    ['Which network device connects a school’s Local Area Network (LAN) to the wider Internet and forwards data packets between networks?', 'Router', ['Barcode scanner', 'Plotter', 'Joystick'], 'A router directs packets across IP networks (e.g., LAN to WAN/Internet), while a switch connects devices within a LAN.'],
    ['In a relational database table of Students, which field uniquely identifies every individual student record without duplicates?', 'Primary Key (e.g., Admission Number / UPI)', ['First Name', 'Favourite Sport', 'Age'], 'Two students can share a name or age, so a unique Admission Number / Assessment Number serves as the Primary Key.'],
    ['What is the strongest practice for creating a secure account password and protecting digital accounts?', 'Combine uppercase, lowercase, numbers, and symbols (12+ characters) and enable Two-Factor Authentication (2FA)', ['Use "123456" on every website', 'Write your password on the classroom noticeboard', 'Use your first name backwards'], 'Strong passphrases plus 2FA protect accounts even if a password list is leaked elsewhere.'],
    ['Which wooden hammer with a large hardwood or rubber head is used to strike wood chisels without damaging their handles?', 'Mallet', ['Sledgehammer', 'Ball-pein hammer', 'Crowbar'], 'A wooden mallet delivers controlled blows to wood chisels and joints without splitting handles or denting timber.'],
  ],
  creative_sports: [
    ['When mixing watercolours or poster paints on a palette, mixing BLUE and YELLOW produces which secondary colour?', 'Green', ['Orange', 'Purple (Violet)', 'Brown'], 'Blue + Yellow = Green; Red + Yellow = Orange; Red + Blue = Purple/Violet.'],
    ['In pottery and ceramics, why are air bubbles wedged (kneaded) out of clay before firing pots in a hot kiln?', 'Trapped air pockets expand on heating and cause clay pots to crack or explode in the kiln', ['Air bubbles turn clay into glass', 'Kneading makes clay dry in one second', 'Kilns only bake wet mud'], 'Wedging removes air pockets and gives clay uniform consistency so vessels fire intact into bisqueware.'],
    ['What are the FOUR sequential phases of executing the Long Jump in athletics?', 'Approach run -> Take-off -> Flight -> Landing', ['Throw -> Spin -> Catch -> Roll', ['Dive -> Float -> Stroke -> Turn'][0], 'Crouch -> Baton pass -> Hurdle -> Finish'], 'A jumper builds speed on the runway, takes off from one foot on the board, sails in flight, and lands safely in the sand pit.'],
    ['In Association Football (Soccer), which player is the ONLY member permitted to handle the ball with hands—and strictly inside their own penalty area?', 'The Goalkeeper', ['The Centre Forward', 'The Corner-Kick Taker', 'The Team Captain anywhere on the pitch'], 'Handling the ball deliberately by an outfield player results in a direct free kick or penalty kick.'],
    ['When singing the Kenya National Anthem at a school assembly or national event, how must citizens conduct themselves?', 'Stand upright at attention facing the flag, remove hats, and sing respectfully without walking around', ['Sit down and chat with friends', 'Run across the parade ground', 'Clap after every word'], 'Standing at attention honours Kenya’s sovereignty, unity, and national values.'],
    ['Which traditional Mijikenda percussion instrument is a flat rectangular reed raft filled with dry seeds and shaken rhythmically?', 'Kayamba', ['Chivoti', 'Abu', 'Orutu'], 'The Kayamba is shaken with both hands to accompany coastal folk songs and dances such as Sengenya.'],
  ],
  literature_english: [
    ['In oral literature, a traditional narrative in which a small clever animal (such as Hare or Tortoise) outwits a much larger, stronger animal is classified as a:', 'Trickster narrative', ['Dilemma narrative', 'Etiological (explanatory) myth', 'Elegy'], 'Trickster tales celebrate wit and intelligence over brute force while warning against gullibility and greed.'],
    ['Which literary device occurs when the audience in a play knows a crucial truth that the character speaking on stage does NOT yet know?', 'Dramatic irony', ['Onomatopoeia', 'Alliteration', 'Oxymoron'], 'Dramatic irony builds tension and engagement as the audience anticipates the character’s discovery of the truth.'],
    ['In poetry analysis, who is the "persona" of a poem?', 'The voice or speaker created by the poet to narrate or express feelings in the poem', ['Always the publisher of the anthology', 'The stage lighting technician', 'The bookbinder'], 'The persona is the speaking voice inside the poem, distinct from the biographical poet.'],
    ['In Henrik Ibsen’s play "The Master Builder", what profession does the protagonist Halvard Solness practise?', 'Master architect / builder', ['Ship captain', ' Silversmith', 'Magistrate'], 'Halvard Solness is an ambitious aging architect haunted by fear of being overtaken by the younger generation.'],
    ['In Binwell Sinyangwe’s novel "A Cowrie of Hope", what precious crop does the widow Nasula travel to Lusaka to sell so she can pay her daughter Sula’s secondary school fees?', 'A bag of Mbala beans', ['Bales of cotton', 'Sacks of coffee', 'Crates of tea'], 'Nasula’s determined struggle after her bag of beans is stolen highlights resilience, maternal sacrifice, and justice.'],
    ['In Austin Bukenya’s African play "The Bride", which central social conflict drives Namvua and Lekindo’s struggle?', 'Youthful love, human dignity, and progressive unity clashing with rigid generational prejudice and tradition', ['A dispute over railway construction', 'Deep-sea fishing rights', 'Gold mining taxes'], '"The Bride" examines rite-of-passage traditions, inclusivity, and moral courage among youth.'],
    ['What do we call an oral narrative that ends with an open moral question forcing listeners to debate two equally difficult choices?', 'Dilemma narrative', ['Lullaby', 'Panegyric praise poem', 'Tongue twister'], 'Dilemma stories sharpen critical thinking, debate, and ethical judgement in listeners.'],
    ['A figure of speech that gives human actions, feelings, or speech to non-human objects or nature (e.g., "The angry wind whispered through the trees") is:', 'Personification', ['Simile', 'Litotes', 'Euphemism'], 'Personification attributes human qualities to inanimate things or abstract ideas to create vivid imagery.'],
  ],
  fasihi_kiswahili: [
    ['Katika fasihi simulizi, hadithi zinazoeleza chanzo cha maumbile au matukio ya kiasili (k.m. kwa nini kinyonga hutembea polepole) huitwaje?', 'Visasili (au ngano za usuli)', ['Hurafa', 'Mighani / Visakale', ' Vitendawili'], 'Visasili na ngano za usuli hufafanua imani ya jamii kuhusu asili ya ulimwengu na tabia za viumbe.'],
    ['Shairi la Kiswahili lenye mishororo MINNE (4) katika kila ubeti hujulikana kwa bahari gani?', 'Tarbia', ['Tathlitha (mishororo 3)', 'Takhmisa (mishororo 5)', 'Tathnia (mishororo 2)'], 'Tathnia = 2, Tathlitha = 3, Tarbia = 4, na Takhmisa = 5 katika kila ubeti.'],
    ['Mshororo wa mwisho unaorudiwarudiwa neno kwa neno katika kila ubeti wa shairi huitwaje?', 'Kibwagizo (mkarara)', ['Kituo kimalizio', 'Ukwapi', 'Utao'], 'Mshororo wa mwisho ukibadilika ubeti hadi ubeti huitwa kimalizio; ukirudiwa sawa kabisa huitwa kibwagizo.'],
    ['Katika ushairi wa arudhi, idadi ya silabi zinazopimwa katika kila mshororo au kipande cha mshororo huitwaje?', 'Mizani', ['Vina', 'Dhamira', 'Muwala'], 'Mizani ni kipimo cha idadi ya silabi katika mshororo, ilhali vina ni silabi zenye mlio sawa katikati na mwishoni.'],
    ['Mbinu ya lugha ambapo mwandishi hutumia maneno ya upole na staha kuficha ukali au aibu (k.m. "ameaga dunia" badala ya "amekufa") huitwaje?', 'Tafsida (tasfida)', ['Chuku', 'Kejeli', 'Tanakali za sauti'], 'Tafsida hulinda adabu na heshima katika mawasiliano ya Kiswahili.'],
    ['Kazi ya fasihi andishi ambayo mwandishi anasimulia kisa cha maisha yake MWENYEWE tangu utotoni (kama "Mlemavu? Sio Mimi") huitwaje?', 'Tawasifu', ['Wasifu', 'Tamthilia', 'Novela'], 'Tawasifu huandikwa na mhusika mwenyewe (nafsi ya kwanza), ilhali wasifu (k.m. Wasifu wa Mekatilili wa Menza) huandikwa na mtu mwingine kumhusu.'],
    ['Hadithi za fasihi simulizi zinazosimulia matendo ya kishujaa ya majagina wa jamii (kama Fumo Liyongo au Luanda Magere) huitwaje?', 'Mighani (visakale)', ['Ngano za mtanziko', 'Soga', 'Mawaidha'], 'Mighani huwasawiri mashujaa wenye nguvu za ajabu wanaopigania jamii zao.'],
    ['Katika uchambuzi wa tamthilia (kama "Narudi Nyumbani", "Kasri la Faraja" au "Sauti ya Kimya"), maelezo yaliyo katika mabano yanayoonyesha vitendo au hisia za mhusika jukwaani huitwaje?', 'Maelekezo ya jukwaani', ['Dibaji', 'Hotuba ndefu', 'Taharuki'], 'Maelekezo ya jukwaani humwongoza mwigizaji na msomaji kuona miondoko, mavazi na mandhari ya tukio.'],
  ],
  technical_engineering: [
    ['By Ohm’s Law, calculate the current flowing through a 12 Ohm heating resistor connected across a 240 V mains supply:', '20 A (since I = V / R = 240 / 12)', ['2,880 A', '0.05 A', '228 A'], 'Current I = Voltage (V) / Resistance (R) = 240 V / 12 Ohm = 20 Amperes.'],
    ['In a Kenyan three-pin domestic electrical plug, which colour insulation identifies the EARTH wire?', 'Green and Yellow striped (connected to the top longest earth pin)', ['Brown (Live)', 'Blue (Neutral)', 'Solid Red'], 'Modern IEE colour code: Brown = Live, Blue = Neutral, Green/Yellow = Earth.'],
    ['In aircraft aerodynamics, what are the FOUR primary forces acting on an aeroplane in flight?', 'Lift, Weight (Gravity), Thrust, and Drag', ['Torque, Friction, Magnetism, and Pressure', 'Pitch, Roll, Yaw, and Stall', 'Altitude, Heading, Speed, and Climb'], 'In steady, level, unaccelerated flight, Lift equals Weight and Thrust equals Drag.'],
    ['Which control surfaces hinged on the trailing outer edges of an aircraft’s wings control ROLL about the longitudinal axis?', 'Ailerons (Elevator controls pitch; Rudder controls yaw)', ['Rudder', 'Flaps only', 'Landing gear'], 'Moving ailerons differentially rolls the aircraft left or right; the elevator pitches nose up/down; the rudder yaws left/right.'],
    ['In building construction, builders measure sides of 3 m, 4 m, and 5 m when setting out foundation corners to guarantee an exact angle of:', '90 degrees (right-angled corner by Pythagoras: 3^2 + 4^2 = 5^2)', ['45 degrees', '60 degrees', '120 degrees'], 'Because 9 + 16 = 25, a 3-4-5 triangle ensures perfectly square building corners on site.'],
    ['Why must freshly poured concrete slabs and columns be kept damp (CURED) for at least 7 to 28 days?', 'To allow cement hydration reactions to continue so concrete gains maximum strength without shrinkage cracks', ['To wash out all cement paste', 'To make the steel rust quickly', 'To dry the sand instantly'], 'Rapid drying halts hydration prematurely, causing weak, dusty, cracked concrete.'],
    ['In woodwork joinery, which strong interlocking joint is traditionally used to join table rails into table legs?', 'Mortise and tenon joint', ['Simple butt joint', 'Edge-to-edge rub joint', 'Mitre joint'], 'A mortise cut into the leg receives a matching tenon on the rail, resisting racking and twisting forces.'],
    ['In a four-stroke internal combustion engine, state the correct sequence of the four piston strokes:', 'Intake (Induction) -> Compression -> Power (Combustion) -> Exhaust', ['Power -> Exhaust -> Compression -> Intake', 'Compression -> Intake -> Exhaust -> Power', 'Intake -> Exhaust -> Compression -> Power'], 'The piston draws air/fuel on Intake, compresses it, fires on Power, and expels burnt gases on Exhaust.'],
  ],
  homescience: [
    ['Deficiency of Vitamin C (ascorbic acid) in the diet causes bleeding spongy gums and slow wound healing known as:', 'Scurvy', ['Rickets (Vitamin D / Calcium)', 'Night blindness (Vitamin A)', 'Pellagra (Niacin)'], 'Fresh citrus fruits (oranges, lemons), guavas, tomatoes, and green leafy vegetables supply Vitamin C.'],
    ['Why should green leafy vegetables be washed BEFORE cutting and cooked quickly in minimal water with a lid on?', 'To prevent water-soluble vitamins (Vitamin C and B-complex) from leaching out or being destroyed by prolonged heat', ['To make them tough and bitter', 'To remove dietary fibre', 'To increase cooking fuel consumption'], 'Cutting before washing or over-boiling leaches water-soluble vitamins into discarded water.'],
    ['Which natural plant textile fibre comes from the cotton boll, absorbs moisture well, is strong when wet, and is cool to wear in warm climates?', 'Cotton', ['Nylon (synthetic polyamide)', 'Polyester', 'Acrylic'], 'Cotton is a cellulosic plant fibre ideal for tropical clothing, bedsheets, and towels.'],
    ['On a commercial garment care label, what does a triangle symbol crossed out with an "X" instruct you NOT to do?', 'Do NOT bleach the garment', ['Do NOT fold', 'Do NOT wear outdoors', 'Do NOT sew buttons'], 'Care symbols: tub = washing, triangle = bleaching, square = drying, iron = ironing, circle = dry-cleaning.'],
  ],
  french: [
    ['Choose the correct French greeting used politely in the morning ("Good morning"):', 'Bonjour', ['Bonsoir', 'Bonne nuit', 'Au revoir'], '"Bonjour" means Good morning / Good day; "Bonsoir" is Good evening; "Au revoir" is Goodbye.'],
    ['Complete with the correct present-tense form of the verb "être" (to be): "Nous ________ élèves au Kenya."', 'sommes (Nous sommes)', ['suis', 'est', 'sont'], 'Conjugation of être: je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont.'],
    ['Complete with the correct form of "avoir" (to have): "J’________ quinze ans."', 'ai (J’ai quinze ans)', ['as', 'a', 'avons'], 'In French, age is expressed using the verb avoir: "J’ai quinze ans" (I am fifteen years old).'],
    ['Which definite article agrees correctly with the feminine singular noun "école" starting with a vowel?', 'l’ (l’école)', ['le', 'la', 'les'], 'Before a singular noun starting with a vowel or mute h, le and la contract to l’ (l’école, l’ami).'],
  ],
  arabic: [
    ['What is the standard polite Islamic and Arabic greeting meaning "Peace be upon you"?', 'As-salamu alaykum (answered with Wa alaykumu s-salam)', ['Sabah al-khayr only at midnight', 'Ma’a as-salamah when arriving', 'Shukran'], '"As-salamu alaykum" means Peace be upon you, and the reply is "Wa alaykumu s-salam".'],
    ['In Arabic grammar, which demonstrative pronoun ("This") is used for a MASCULINE singular noun such as "kitabun" (a book)?', 'Hadha (Hadha kitabun)', ['Hadhihi (feminine singular)', 'Ha’ula’i (plural)', 'Tilka'], '"Hadha" is masculine singular ("Hadha kitabun" = This is a book), while "Hadhihi" is feminine singular ("Hadhihi madrasatun").'],
    ['How many nouns does the Arabic DUAL form (Al-Muthanna) refer to?', 'Exactly TWO (2) persons or items', ['One item only', 'Three or more items', 'Zero items'], 'Arabic distinguishes Singular (Mufrad = 1), Dual (Muthanna = 2), and Plural (Jam’u = 3 or more).'],
  ],
  german: [
    ['Complete the German self-introduction sentence with the correct form of "heißen": "Guten Tag! Ich ________ Amina."', 'heiße (Ich heiße Amina)', ['heißt', 'heißen', 'bin heißen'], 'Present tense of heißen: ich heiße, du heißt, er/sie heißt, wir heißen.'],
    ['Choose the correct present-tense form of "sein" (to be): "Wir ________ Schüler in Nairobi."', 'sind (Wir sind)', ['bin', 'bist', 'ist'], 'Conjugation of sein: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.'],
    ['In a standard German main clause (Hauptsatz), in which position must the conjugated verb stand?', 'Position 2 (second grammatical element)', ['Always at the very end', 'Position 5', 'Before every noun'], 'German main clauses follow the V2 (verb-second) rule, e.g., "Heute gehe ich in die Schule."'],
  ],
};

export function generateExtraTextbookExercise(
  domain: string,
  ctx: StrandContext,
  indexSeed: number
): ExerciseItem | null {
  const v = Math.abs(indexSeed);

  if (domain === 'english') {
    const totalIrreg = ENGLISH_IRREGULAR_VERBS.length;
    const totalAdj = ENGLISH_ADJECTIVES.length;
    if (v < totalIrreg * 2) {
      const [inf, past, part, obj] = ENGLISH_IRREGULAR_VERBS[v % totalIrreg];
      if (v < totalIrreg) {
        const p = packChoices(part, [past, `${inf}ed`, `${inf}s`], v + 31);
        return {
          q: `Complete the sentence with the correct form of "${inf}": "The learners have ________ ${obj}."`,
          options: p.options,
          ans: p.ans,
          exp: `After "have / has / had", use the past participle "${part}" ("have ${part}").`,
          tags: ['grammar', 'verbs', 'writing'],
        };
      } else {
        const p = packChoices(past, [part, `${inf}ed`, `${inf}ing`], v + 47);
        return {
          q: `Fill in the blank in the simple past tense using "${inf}": "Yesterday, the class ________ ${obj}."`,
          options: p.options,
          ans: p.ans,
          exp: `The simple past tense of "${inf}" is "${past}".`,
          tags: ['grammar', 'tense', 'writing'],
        };
      }
    }
    const adjIdx = (v - totalIrreg * 2) % totalAdj;
    const [base, comp, sup, nounA, groupDesc] = ENGLISH_ADJECTIVES[adjIdx];
    if ((v - totalIrreg * 2) < totalAdj) {
      const p = packChoices(sup, [comp, base, `more ${sup}`], v + 59);
      return {
        q: `Choose the correct superlative adjective to complete the sentence: "That was the ________ (${base}) ${groupDesc}."`,
        options: p.options,
        ans: p.ans,
        exp: `Comparing three or more items after "the" takes the superlative form "${sup}".`,
        tags: ['grammar', 'adjectives'],
      };
    }
    const p = packChoices(comp, [sup, base, `most ${base}`], v + 73);
    return {
      q: `Choose the correct comparative adjective: "This ${nounA} is ________ (${base}) than the other one."`,
      options: p.options,
      ans: p.ans,
      exp: `Comparing two items with "than" uses the comparative form "${comp}".`,
      tags: ['grammar', 'adjectives'],
    };
  }

  if (domain === 'kiswahili') {
    const verbTotal = KISWAHILI_VERBS.length;
    if (v < verbTotal * 3) {
      const [root, tendea, tendewa, tendeka, tendesha] = KISWAHILI_VERBS[v % verbTotal];
      const mode = Math.floor(v / verbTotal);
      if (mode === 0) {
        const p = packChoices(`ku${tendea}`, [`ku${tendewa}`, `ku${tendeka}`, `ku${tendesha}`], v + 19);
        return {
          q: `Andika kitenzi "ku${root}" katika kauli ya KUTENDEA:`,
          options: p.options,
          ans: p.ans,
          exp: `Kauli ya kutendea ya kitenzi "ku${root}" ni "ku${tendea}".`,
          tags: ['sarufi', 'vitenzi'],
        };
      }
      if (mode === 1) {
        const p = packChoices(`ku${tendewa}`, [`ku${tendea}`, `ku${tendeka}`, `ku${root}`], v + 29);
        return {
          q: `Andika kitenzi "ku${root}" katika kauli ya KUTENDEWA:`,
          options: p.options,
          ans: p.ans,
          exp: `Kauli ya kutendewa ya kitenzi "ku${root}" ni "ku${tendewa}".`,
          tags: ['sarufi', 'vitenzi'],
        };
      }
      const p = packChoices(`ku${tendeka}`, [`ku${tendea}`, `ku${tendewa}`, `ku${tendesha}`], v + 43);
      return {
        q: `Andika kitenzi "ku${root}" katika kauli ya KUTENDEKA:`,
        options: p.options,
        ans: p.ans,
        exp: `Kauli ya kutendeka ya kitenzi "ku${root}" ni "ku${tendeka}".`,
        tags: ['sarufi', 'vitenzi'],
      };
    }

    // Saa za Kiswahili (7:00 a.m. -> Saa moja kamili asubuhi, etc.)
    const tIdx = v - verbTotal * 3;
    const stdHr = 7 + (tIdx % 11); // 7..17 (7:00 a.m. to 5:45 p.m.)
    const minSlot = Math.floor(tIdx / 11) % 4;
    const swIdx = ((stdHr - 6 + 11) % 12); // 7->0 ('moja'), 8->1 ('mbili')...
    const swWord = SWAHILI_HOURS[swIdx];
    const wrongWord1 = SWAHILI_HOURS[(swIdx + 6) % 12]; // common English-hour trap!
    const wrongWord2 = SWAHILI_HOURS[(swIdx + 1) % 12];
    const period = stdHr < 12 ? 'asubuhi' : stdHr < 16 ? 'mchana' : 'jioni';
    const disp12 = stdHr <= 12 ? stdHr : stdHr - 12;
    const ampm = stdHr < 12 ? 'a.m.' : 'p.m.';

    if (minSlot === 0) {
      const corr = `Saa ${swWord} kamili ${period}`;
      const p = packChoices(corr, [`Saa ${wrongWord1} kamili ${period}`, `Saa ${wrongWord2} na nusu ${period}`, `Saa ${swWord} na robo ${period}`], v + 61);
      return {
        q: `Katika usomaji wa saa kwa Kiswahili sanifu, ${disp12}:00 ${ampm} (${period}) husomwaje?`,
        options: p.options,
        ans: p.ans,
        exp: `Mfumo wa saa za Kiswahili huanza kuhesabu macheo (6:00 a.m. = saa kumi na mbili), hivyo ${disp12}:00 ${ampm} ni "${corr}".`,
        tags: ['saa', 'kusoma', 'sarufi'],
      };
    }
    if (minSlot === 1) {
      const corr = `Saa ${swWord} na robo ${period}`;
      const p = packChoices(corr, [`Saa ${wrongWord1} na robo ${period}`, `Saa ${swWord} kasorobo ${period}`, `Saa ${swWord} na nusu ${period}`], v + 67);
      return {
        q: `Wakati wa ${disp12}:15 ${ampm} (${period}) husomwaje kwa Kiswahili?`,
        options: p.options,
        ans: p.ans,
        exp: `Dakika 15 baada ya saa kamili ni "na robo": "${corr}".`,
        tags: ['saa', 'kusoma'],
      };
    }
    if (minSlot === 2) {
      const corr = `Saa ${swWord} na nusu ${period}`;
      const p = packChoices(corr, [`Saa ${wrongWord1} na nusu ${period}`, `Saa ${swWord} na robo ${period}`, `Saa ${wrongWord2} kamili ${period}`], v + 71);
      return {
        q: `Wakati wa ${disp12}:30 ${ampm} (${period}) husomwaje kwa Kiswahili?`,
        options: p.options,
        ans: p.ans,
        exp: `Dakika 30 ni nusu saa: "${corr}".`,
        tags: ['saa', 'kusoma'],
      };
    }
    const nextSw = SWAHILI_HOURS[(swIdx + 1) % 12];
    const corr = `Saa ${nextSw} kasorobo ${period}`;
    const p = packChoices(corr, [`Saa ${swWord} kasorobo ${period}`, `Saa ${wrongWord1} na robo ${period}`, `Saa ${nextSw} na robo ${period}`], v + 79);
    return {
      q: `Wakati wa ${disp12}:45 ${ampm} (${period}) husomwaje kwa Kiswahili sanifu?`,
      options: p.options,
      ans: p.ans,
      exp: `Dakika 45 inamaanisha bado robo saa kufika saa inayofuata: "${corr}".`,
      tags: ['saa', 'kusoma'],
    };
  }

  if (domain === 'cre') {
    if (v < EXTRA_CRE_EXERCISES.length) {
      const [q, corr, dist, exp] = EXTRA_CRE_EXERCISES[v];
      const p = packChoices(corr, dist, v + 83);
      return { q, options: p.options, ans: p.ans, exp, tags: ['cre'] };
    }
    // Biblical Books & Chapters / Disciples / Values scenario drills
    const scenarios: Array<[string, string, [string, string, string], string]> = [
      ['Which book is the VERY FIRST book of the Old Testament?', 'Genesis', ['Exodus', 'Matthew', 'Psalms'], 'Genesis ("Beginning") opens the Holy Bible with creation and the patriarchs.'],
      ['Which book is the LAST book of the New Testament?', 'Revelation (Apocalypse)', ['Jude', 'Acts of the Apostles', 'Malachi'], 'Revelation, written by Apostle John on Patmos, concludes the New Testament.'],
      ['Which Old Testament book is a collection of 150 sacred songs and prayers, many composed by King David?', 'Psalms', ['Proverbs', 'Leviticus', 'Joshua'], 'The Book of Psalms contains 150 hymns of praise, thanksgiving, and lament.'],
      ['Which Old Testament book closes the Protestant Old Testament canon just before Matthew?', 'Malachi', ['Zechariah', 'Daniel', 'Chronicles'], 'Malachi is the twelfth Minor Prophet and the final book of the Old Testament.'],
      ['Which New Testament book records the spread of the Early Church from Jerusalem to Rome after Jesus’ ascension?', 'Acts of the Apostles (written by Luke)', ['Romans', 'Hebrews', 'Galatians'], 'Acts of the Apostles is the historical sequel to the Gospel of Luke.'],
      ['A classmate drops a KSh 200 note without noticing while leaving the classroom. What Christian value guides you to pick it up and return it immediately?', 'Honesty and integrity', ['Greed', 'Boastfulness', 'Revenge'], '"You shall not steal" and Christian integrity require returning lost property to its rightful owner.'],
    ];
    const scIdx = v - EXTRA_CRE_EXERCISES.length;
    if (scIdx < scenarios.length) {
      const [q, corr, dist, exp] = scenarios[scIdx];
      const p = packChoices(corr, dist, v + 97);
      return { q, options: p.options, ans: p.ans, exp, tags: ['cre'] };
    }
  }

  if (domain === 'ire') {
    if (v < EXTRA_IRE_EXERCISES.length) {
      const [q, corr, dist, exp] = EXTRA_IRE_EXERCISES[v];
      const p = packChoices(corr, dist, v + 89);
      return { q, options: p.options, ans: p.ans, exp, tags: ['ire'] };
    }
  }

  const extraPool = EXTRA_GENERAL_EXERCISES[domain];
  if (extraPool && v < extraPool.length) {
    const [q, corr, dist, exp] = extraPool[v];
    const p = packChoices(corr, dist, v + 91);
    return { q, options: p.options, ans: p.ans, exp, tags: [domain] };
  }

  return null;
}

// Additional structured textbook tables so every subject easily exceeds 110+ real exercises!
const TEN_COMMANDMENTS_DRILLS: Array<[string, string, string]> = [
  ['Putting God first above idols, superstition, and material things', 'First Commandment: "You shall have no other gods before Me"', 'Exodus 20:3'],
  ['Refusing to bow down to carved images or worship money', 'Second Commandment: "You shall not make for yourself an idol"', 'Exodus 20:4'],
  ['Speaking God’s holy name with reverence rather than swearing', 'Third Commandment: "You shall not misuse the name of the Lord your God"', 'Exodus 20:7'],
  ['Setting aside a day of worship and rest to honour God', 'Fourth Commandment: "Remember the Sabbath day by keeping it holy"', 'Exodus 20:8'],
  ['Speaking respectfully to your parents and helping them at home', 'Fifth Commandment: "Honour your father and your mother"', 'Exodus 20:12'],
  ['Protecting human life, avoiding violence, andcontrolling anger', 'Sixth Commandment: "You shall not murder"', 'Exodus 20:13'],
  ['Remaining faithful and pure in Christian marriage', 'Seventh Commandment: "You shall not commit adultery"', 'Exodus 20:14'],
  ['Refusing to cheat in exams, shoplift, or take a classmate’s pen', 'Eighth Commandment: "You shall not steal"', 'Exodus 20:15'],
  ['Telling the truth in court and refusing to spread false rumours', 'Ninth Commandment: "You shall not give false testimony against your neighbour"', 'Exodus 20:16'],
  ['Being content with what your family has without envying a friend’s property', 'Tenth Commandment: "You shall not covet"', 'Exodus 20:17'],
];

const FRUITS_OF_SPIRIT_SCENARIOS: Array<[string, string]> = [
  ['Sharing your lunch willingly with a hungry deskmate who forgot theirs', 'Kindness / Goodness'],
  ['Staying calm and waiting your turn in the dining hall queue without pushing', 'Patience (Longsuffering)'],
  ['Saying "No" firmly to tempting bad company and controlling your temper', 'Self-control (Temperance)'],
  ['Living in harmony with classmates from all Kenyan communities', 'Peace'],
  ['Keeping your promises and completing duties even when no teacher is watching', 'Faithfulness'],
  ['Rejoicing and thanking God even during challenging exam preparation', 'Joy'],
  ['Admitting your mistake politely without pride or arrogance', 'Humility (Gentleness)'],
  ['Forgiving someone who stepped on your foot and caring for everyone unselfishly', 'Love'],
];

const BIBLICAL_FIGURES_MATCH: Array<[string, string, [string, string, string]]> = [
  ['Which Old Testament patriarch had twelve sons whose descendants formed the twelve tribes of Israel?', 'Jacob (renamed Israel)', ['Isaac', 'Esau', 'Lot']],
  ['Which son of Jacob was sold into slavery in Egypt by his jealous brothers, interpreted Pharaoh’s dreams, and saved his family from famine?', 'Joseph', ['Reuben', 'Benjamin', 'Judah']],
  ['Who assisted Moses as spokesperson before Pharaoh and served as the first High Priest of Israel?', 'Aaron (brother of Moses)', ['Joshua', 'Caleb', 'Hur']],
  ['Who succeeded Moses and led the Israelites across River Jordan into the Promised Land of Canaan?', 'Joshua son of Nun', ['Gideon', 'Samson', 'Samuel']],
  ['Which courageous female Judge and Prophetess led Israel to victory alongside Barak in Judges Chapter 4?', 'Deborah', ['Ruth', 'Esther', 'Hannah']],
  ['Which Moabite widow showed loyal love to her mother-in-law Naomi saying, "Where you go I will go, and your God will be my God"?', 'Ruth', ['Orpah', 'Miriam', ' Martha']],
  ['Which brave Jewish Queen risked her life before King Xerxes of Persia to save her people from Haman’s plot?', 'Queen Esther', ['Jezebel', 'Athaliah', 'Delilah']],
  ['Who was Hannah’s dedicated son who grew up serving at Shiloh under Priest Eli and anointed Saul and David?', 'Prophet Samuel', ['Nathan', 'Elisha', 'Ezra']],
  ['Which prophet succeeded Elijah after Elijah was taken up to heaven in a whirlwind with a chariot of fire?', 'Prophet Elisha', ['Prophet Isaiah', 'Prophet Ezekiel', 'Prophet Hosea']],
  ['Which prophet foretold 700 years beforehand that the Messiah would be called "Wonderful Counsellor, Mighty God, Prince of Peace"?', 'Prophet Isaiah (Isaiah 9:6)', ['Prophet Jonah', 'Prophet Nahum', 'Prophet Haggai']],
  ['Which reluctant prophet was swallowed by a great fish before preaching repentance to the city of Nineveh?', 'Prophet Jonah', ['Prophet Habakkuk', 'Prophet Joel', 'Prophet Zephaniah']],
  ['Which devout man was thrown into a den of lions in Babylon because he refused to stop praying to God three times a day?', 'Daniel', ['Nebuchadnezzar', 'Belshazzar', 'Cyrus']],
  ['Which three Hebrew youths were rescued unharmed by God from King Nebuchadnezzar’s fiery furnace?', 'Shadrach, Meshach, and Abednego', ['Shem, Ham, and Japheth', 'Peter, James, and John', 'Korah, Dathan, and Abiram']],
  ['Who were the parents of John the Baptist in Luke Chapter 1?', 'Priest Zechariah and Elizabeth', ['Joseph and Mary', 'Elkanah and Hannah', 'Aquila and Priscilla']],
  ['Which sister of Martha and Lazarus sat attentively at Jesus’ feet listening to His teachings while Lazarus was later raised from the dead?', 'Mary of Bethany', ['Salome', 'Sapphira', 'Lydia']],
  ['Which generous Christian woman in Joppa (Tabitha), famous for sewing clothes for widows, was raised back to life through Peter’s prayer?', 'Dorcas (Tabitha)', ['Priscilla', 'Phoebe', 'Eunice']],
  ['Which purple-cloth merchant in Philippi became Paul’s first European convert and opened her home to the believers?', 'Lydia of Thyatira', ['Claudia', 'Chloe', 'Drusilla']],
  ['Who accompanied Apostle Paul on his first missionary journey and was known as the "Son of Encouragement"?', 'Barnabas', ['Apollos', 'Felix', 'Festus']],
  ['Which young pastor was mentored by Apostle Paul and praised for knowing the Holy Scriptures from childhood through his mother Eunice and grandmother Lois?', 'Timothy', ['Philemon', 'Titus', 'Onesimus']],
  ['Which Roman centurion in Caesarea was a God-fearing Gentile whose household received the Holy Spirit when Peter preached to them (Acts 10)?', 'Cornelius', ['Julius', 'Claudius Lysias', 'Pilate']],
  ['Why did Ananias and Sapphira fall dead in the Early Church (Acts Chapter 5)?', 'Because they lied to the Holy Spirit by secretly keeping back part of the land sale proceeds while pretending to give all', ['Because they refused to travel to Rome', 'Because Roman soldiers arrested them', 'Because they forgot the Psalms']],
  ['At which city were the followers of Jesus Christ FIRST called "Christians" (Acts 11:26)?', 'Antioch', ['Bethlehem', 'Jericho', 'Alexandria']],
  ['In Jesus’ Parable of the Talents (Matthew 25), why was the master displeased with the servant who received one talent?', 'He lazily buried his talent in the ground instead of putting his abilities and resources to productive use', ['He invested it and earned double', 'He donated it to orphans', 'He built a barn']],
  ['In the Parable of the Lost Sheep (Luke 15), what does the shepherd do when one sheep out of 100 goes astray?', 'Leaves the 99 in the open country and searches diligently until he finds the lost one, rejoicing', ['Forgets about the single sheep', 'Sells the remaining 99 sheep', 'Closes the kraal gate']],
  ['According to James 1:27, pure and faultless religion that God our Father accepts involves:', 'Looking after orphans and widows in their distress and keeping oneself unpolluted by the world', ['Wearing expensive garments on Sunday only', 'Boasting about fasting', 'Arguing over genealogies']],
  ['When tempted by peers to cheat in a national examination, what is the upright Christian decision?', 'Refuse firmly, rely on honest preparation and prayer, and uphold personal integrity', ['Copy quietly so nobody sees', 'Pay someone for leaked papers', 'Blame the subject teacher']],
  ['In Christian teaching on wealth and poverty, why should blessed believers pay tithes, taxes, and help the needy?', 'All wealth belongs to God, taxes fund public services (Romans 13), and generous giving blesses the poor', ['To boast on television', 'To avoid working again', 'To bribe officials']],
  ['What Christian lesson do learners draw from Jesus washing His disciples’ feet during the Last Supper (John 13)?', 'Humble servant leadership—true greatness lies in serving others selflessly', ['Refusing to wear sandals', 'Expecting juniors to serve seniors only', 'Avoiding housework at home']],
  ['How did Jesus respond on the Cross at Calvary toward the soldiers who crucified Him (Luke 23:34)?', 'He prayed, "Father, forgive them, for they do not know what they are doing"', ['He called down fire to destroy Jerusalem', 'He cursed Pontius Pilate', 'He refused to speak to the repentant thief']],
  ['Who offered his own new rock-cut tomb for the burial of Jesus’ body on Good Friday evening?', 'Joseph of Arimathea (assisted by Nicodemus)', ['Simon of Cyrene', 'Cleopas', 'Gamaliel']],
  ['Which man from North Africa was compelled by Roman soldiers to help carry Jesus’ heavy wooden cross to Golgotha?', 'Simon of Cyrene', ['Barabbas', 'Bartimaeus', 'Lazarus']],
  ['Which disciple doubted Jesus’ resurrection until he saw the nail marks in Jesus’ hands and side?', 'Thomas (Didymus)', ['Andrew', 'Philip', 'Bartholomew']],
  ['Who was chosen by prayer and casting lots in Acts Chapter 1 to replace Judas Iscariot among the Twelve Apostles?', 'Matthias', ['Barnabas', 'Mark', 'Luke']],
  ['Which Pharisee and member of the Jewish Sanhedrin visited Jesus secretly at night to ask how one can be born again (John 3)?', 'Nicodemus', ['Caiaphas', 'Annas', 'Herod Antipas']],
  ['Which brother of Simon Peter brought the young boy with five barley loaves and two fish to Jesus?', 'Andrew', ['Matthew', 'Jude', 'Simon the Zealot']],
  ['Which beloved physician wrote both the third Gospel and the Book of Acts of the Apostles?', 'Luke', ['Mark', 'Peter', 'James']],
  ['On which island was Apostle John exiled when he received the visions recorded in the Book of Revelation?', 'Island of Patmos', ['Island of Crete', 'Island of Cyprus', 'Island of Malta']],
  ['On which island were Paul and 276 passengers shipwrecked safely during his voyage to Rome (Acts 27–28)?', 'Malta (Melita)', ['Sicily', 'Rhodes', 'Samos']],
  ['In Philippi, who were thrown into inner prison and sang hymns at midnight until an earthquake opened the prison doors (Acts 16)?', 'Paul and Silas', ['Peter and John', 'James and Jude', 'Aquila and Apollos']],
  ['Which Ethiopian official reading Prophet Isaiah in his chariot was baptized by Philip along the Gaza road (Acts 8)?', 'The Ethiopian Eunuch (court treasurer of Candace)', ['Cornelius', 'Sergius Paulus', 'Gallio']],
  ['In Genesis Chapter 2, which river flowing out of Eden watered the garden before dividing into Pishon, Gihon, Tigris, and Euphrates?', 'The river of Eden dividing into four headwaters', ['River Jordan only', 'River Tiber', 'River Danube']],
];

const ANIMAL_HOMES_AND_YOUNG: Array<[string, string, string, string]> = [
  ['cow', 'calf', 'byre / cattle shed', 'milk and beef'],
  ['sheep', 'lamb', 'pen / fold', 'wool and mutton'],
  ['goat', 'kid', 'goat pen', 'milk and chevon (goat meat)'],
  ['hen (chicken)', 'chick', 'coop / poultry house', 'eggs and white meat'],
  ['dog', 'puppy', 'kennel', 'home security and companionship'],
  ['pig', 'piglet', 'sty / piggery', 'pork and bacon'],
  ['rabbit', 'kitten / kit', 'hutch', 'white meat and fur'],
  ['horse', 'foal / colt', 'stable', 'riding and transport'],
  ['duck', 'duckling', 'pond / duck house', 'eggs and meat'],
  ['cat', 'kitten', 'cattery / home', 'catching rats and mice in stores'],
  ['bee', 'larva / grub', 'beehive (apiary)', 'sweet honey and beeswax'],
  ['lion', 'cub', 'den', 'wildlife tourism in national parks'],
];

const KENYA_PARKS_AND_FEATURES: Array<[string, string, [string, string, string], string]> = [
  ['Which snow-capped volcanic mountain is the HIGHEST mountain in Kenya (5,199 m)?', 'Mount Kenya', ['Mount Elgon', 'Mount Longonot', 'Mount Kilimanjaro'], 'Mount Kenya (5,199 m) is the highest mountain inside Kenya; Mount Kilimanjaro is in Tanzania.'],
  ['Which is the LARGEST freshwater lake in East Africa shared by Kenya, Uganda, and Tanzania?', 'Lake Victoria', ['Lake Nakuru', 'Lake Naivasha', 'Lake Elementaita'], 'Lake Victoria is Africa’s largest freshwater lake and an important source of Nile perch and tilapia.'],
  ['Which alkaline Rift Valley lake in Kenya is world-famous for large flocks of lesser and greater flamingos?', 'Lake Nakuru (and Lake Bogoria)', ['Lake Victoria', 'Lake Jipe', 'Masinga Reservoir'], 'Flamingos feed on blue-green algae thriving in alkaline Rift Valley lakes like Nakuru and Bogoria.'],
  ['Which is the LONGEST river in Kenya, flowing from the Aberdare/Mt Kenya highlands into the Indian Ocean?', 'River Tana', ['River Nzoia', 'River Yala', 'River Mara'], 'River Tana (~1,000 km) is Kenya’s longest river and hosts the Seven Forks hydro-electric dams.'],
  ['Which National Reserve in Narok County is world-famous for the annual Wildebeest Migration across River Mara?', 'Maasai Mara National Reserve', ['Hell’s Gate National Park', 'Shimba Hills Reserve', 'Saiwa Swamp National Park'], 'The Great Wildebeest Migration between Serengeti and Maasai Mara is one of the Wonders of the World.'],
  ['Which unique National Park lies right next to Kenya’s capital city, Nairobi?', 'Nairobi National Park', ['Tsavo East National Park', 'Marsabit National Park', 'Sibiloi National Park'], 'Nairobi National Park is the only wildlife national park bordering a capital city in the world.'],
  ['Which ocean borders Kenya along its south-eastern coastline at Mombasa, Kilifi, Kwale, and Lamu?', 'The Indian Ocean', ['The Atlantic Ocean', 'The Pacific Ocean', 'The Arctic Ocean'], 'Kenya’s coastline stretches along the warm western Indian Ocean.'],
  ['Which country borders Kenya directly to the WEST?', 'Uganda', ['Somalia', 'Ethiopia', 'Tanzania'], 'Kenya’s five neighbours are Ethiopia (North), South Sudan (North-West), Uganda (West), Tanzania (South), and Somalia (East).'],
  ['Which country borders Kenya directly to the SOUTH?', 'Tanzania', ['Sudan', 'Rwanda', 'Djibouti'], 'Tanzania borders Kenya to the south, from Lake Victoria through Namanga/Taveta to Lunga Lunga on the coast.'],
  ['Which small antelope-protection park in Trans-Nzoia County conserves the rare semi-aquatic Sitatunga antelope?', 'Saiwa Swamp National Park', ['Amboseli National Park', 'Meru National Park', 'Arabuko-Sokoke'], 'Saiwa Swamp near Kitale is Kenya’s smallest national park, protecting the rare Sitatunga antelope.'],
  ['Which sense organ enables a learner to TASTE whether food is sweet, salty, sour, or bitter?', 'The tongue', ['The nose', 'The ears', 'The skin'], 'Taste buds on the tongue detect sweet, salty, sour, bitter, and umami flavours.'],
  ['Which sense organ feels whether water in a basin is hot, warm, or cold?', 'The skin', ['The eyes', 'The teeth', 'The fingernails'], 'Nerve endings in the skin detect touch, pressure, pain, heat, and cold.'],
  ['How many times a day should we brush our teeth to prevent tooth decay and bad breath?', 'At least twice a day (in the morning and before going to bed at night)', ['Once every month', 'Only on Sundays', 'Never'], 'Brushing after meals/morning and before bed removes plaque and food particles.'],
  ['If a school has no manufactured toothbrush, what clean local plant stick can be chewed safely to clean teeth?', 'A clean chewed twig (mswaki) from a safe non-poisonous tree like neem (mwarubaini)', ['A rusty iron nail', 'A sharp broken glass', 'A thorny acacia branch'], 'Clean traditional chewed sticks (miswak) clean teeth effectively when a commercial brush is unavailable.'],
  ['Why must pit latrine holes be kept covered with a lid after use?', 'To keep away houseflies that spread germs and to reduce bad odour', ['To hide toys inside', 'To trap rainwater', 'To make the floor slippery'], 'Covering squat holes prevents flies from breeding and carrying germs to food.'],
  ['Why should charcoal jikos NEVER be burned inside a closed bedroom with windows and doors shut?', 'Burning charcoal in poor ventilation produces poisonous carbon monoxide gas that can suffocate people', ['It makes the charcoal burn too slowly', 'It turns walls blue', 'It attracts mosquitoes'], 'Always use a jiko in a well-ventilated space with open windows so dangerous carbon monoxide cannot accumulate.'],
  ['Why should children NEVER take medicines at home without instructions from a doctor, nurse, or parent?', 'Wrong dosage or wrong medicine can cause poisoning or serious harm', ['Medicines taste too sweet', 'Bottles are heavy', 'Tablets melt in pockets'], 'Medicines must be stored out of reach of young children and taken strictly as prescribed.'],
  ['Where should pedestrians walk along a busy tarmac road that has no raised side footpath?', 'Along the right-hand side verge facing oncoming traffic', ['Down the middle white line of the road', 'On the left side with backs turned to close vehicles', 'Sitting on the road'], 'Walking on the right-hand side facing oncoming vehicles lets pedestrians see approaching traffic clearly.'],
  ['What are the FIVE animals famously known as "The Big Five" in Kenya’s wildlife parks?', 'Lion, Leopard, Elephant, Rhinoceros, and Cape Buffalo', ['Giraffe, Zebra, Cheetah, Hippo, and Hyena', 'Cow, Goat, Sheep, Camel, and Donkey', 'Ostrich, Flamingo, Eagle, Owl, and Crane'], 'Kenya’s Big Five attract tourists from around the world, earning foreign exchange and creating jobs.'],
  ['Which wild animal has a very long neck adapted for browsing leaves at the top of tall acacia trees?', 'The giraffe', ['The hippopotamus', 'The warthog', 'The crocodile'], 'Giraffes browse high tree canopies without competing with ground grazers.'],
  ['Which part of a flowering plant develops into a fruit containing seeds after pollination?', 'The flower', ['The root hairs', 'The tree bark', 'The dry thorns'], 'Flowers produce fruits and seeds that grow into new young plants.'],
  ['What three conditions are necessary for planted bean or maize seeds to GERMINATE in soil?', 'Water (moisture), air (oxygen), and warmth (suitable temperature)', ['Boiling oil, darkness, and ice', 'Rocks, salt, and smoke', 'Plastic bags and dry sand'], 'Viable seeds require moisture, oxygen, and warmth to sprout into seedlings.'],
  ['Which part of the sugarcane plant do we chew or crush in factories to extract sweet juice for making sugar?', 'The stem', ['The roots', 'The dry leaves', 'The flowers'], 'Sugarcane stores sucrose sugar in its juicy jointed stem.'],
  ['Beans, green grams (ndengu), peas, fish, milk, and eggs belong to which important food group?', 'Body-building foods (proteins) for growth and repair of body tissues', ['Sugary snacks only', 'Cooking oils only', 'Beverage spices'], 'Proteins build and repair body cells and prevent kwashiorkor in growing children.'],
  ['Oranges, ripe mangoes, pawpaws, pineapples, and dark green vegetables are called PROTECTIVE foods because they:', 'Provide vitamins and minerals that protect the body against diseases', ['Replace drinking water completely', 'Make teeth turn black', 'Contain no nutrients'], 'Fruits and vegetables supply essential vitamins and dietary fibre that boost immunity.'],
  ['Which natural source of light and heat warms the Earth during the day and enables green plants to make food?', 'The Sun', ['A kerosene tin lamp', 'A candle', 'A pocket torch'], 'The Sun is our primary natural source of light and heat energy.'],
  ['On a windy afternoon, which outdoor play item flies high in the sky using the moving air?', 'A kite (and a wind sock / pinwheel spins)', ['A heavy stone', 'An iron jembe', 'A clay pot'], 'Moving air is called wind; it flies kites, turns windmills, and helps winnow grains.'],
  ['How do farmers use WIND on a dry afternoon after harvesting and threshing beans or millet?', 'For winnowing—blowing away light chaff from heavy clean grains', ['For boiling milk', 'For digging deep holes', 'For sharpening pangas'], 'When poured from a basket, wind blows away lighthusks (chaff) while heavier grains fall onto the mat.'],
  ['What cleaning tool made from tied grass, coconut midribs, or soft bristles is used to sweep dust off the classroom floor?', 'A broom', ['A rake', 'A jembe (hoe)', 'A wheelbarrow'], 'Sweeping after sprinkling a little water keeps dust from rising into the air.'],
  ['Why do we sprinkle a little water on an earthen classroom floor before sweeping?', 'To settle loose dust so learners do not inhale dust and Fleas/jiggers are controlled', ['To make mud puddles for sliding', 'To spoil textbooks', 'To flood the desks'], 'Damping an earthen floor lightly prevents dust clouds that irritate eyes and lungs.'],
  ['Which weather condition is best for washing and drying school uniforms and bedsheets quickly outdoors?', 'Sunny and breezy (windy) weather', ['Heavy stormy rain', 'Thick cold fog at night', 'Hailstorm weather'], 'Warm sunshine and moving air speed up evaporation so washed clothes dry crisp and fresh.'],
  ['What happens to wet mud puddles on the playground when hot sunshine shines on them all afternoon?', 'The water evaporates into water vapour in the air', ['The water turns into stones', 'The puddles freeze into snow', 'The soil melts'], 'Heat from the sun causes liquid water to evaporate into invisible water vapour.'],
  ['When water vapour rises high into the cool sky, it condenses into tiny droplets that form:', 'Clouds', ['Rainbows only', 'Stars', 'Lightning bolts'], 'Condensation of water vapour high in the atmosphere forms clouds, which bring rain (the water cycle).'],
  ['Which basic child right is fulfilled when parents take a newborn baby to the clinic for polio and measles immunization?', 'The right to health care and survival', ['The right to own a car', 'The right to work in factories', 'The right to skip school'], 'Every child has fundamental rights to life, health care, nutrition, education, shelter, a name, and protection.'],
  ['Which emergency telephone number can citizens in Kenya dial free of charge to report a police or medical emergency?', '999 or 112', ['0000', '5555', '2468'], '999, 112, and 911 are Kenya’s toll-free national emergency response numbers.'],
  ['Which small parasitic insect burrows into feet on dusty unhygienic floors if feet and floors are not kept clean?', 'Jigger (sand flea)', ['Butterfly', 'Ladybird', 'Grasshopper'], 'Sweeping/smearing floors, wearing shoes, and washing feet with soap prevents jigger infestation.'],
  ['Before eating a raw fruit like an apple, guava, or mango picked from the market, what must you ALWAYS do first?', 'Wash the fruit thoroughly with clean safe water', ['Rub it on dusty shorts', 'Dip it in soapy detergent without rinsing', 'Eat it immediately with dirty hands'], 'Washing raw fruits removes dust, pesticide residues, and disease germs.'],
  ['Which domestic pack animal is widely used in semi-arid parts of Kenya to carry water jerrycans and farm loads?', 'The donkey (and camel in arid northern counties)', ['The rabbit', 'The cat', 'The turkey'], 'Donkeys and camels are hardy work animals and must be fed, watered, and treated humanely without overloading.'],
  ['Which floating test result is correct when objects are placed gently in a basin of water?', 'A dry wooden cork and plastic bottle cap float, while a metal coin and stone sink', ['A stone floats and a dry feather sinks', 'An iron nail floats and a dry leaf sinks', 'Everything sinks in water'], 'Objects less dense than water (dry wood, cork, hollow plastic) float, while denser objects (coins, stones) sink.'],
  ['Why is planting indigenous and fruit trees around our school and riverbanks beneficial?', 'Trees hold soil against erosion, provide shade/fruits, clean the air, and attract rainfall', ['Trees dry up all rainwater completely', 'Trees block sunshine from reaching the sky', 'Trees cause soil gullies'], 'Tree roots bind soil particles together while leaves absorb carbon(IV) oxide and release oxygen.'],
  ['What does the RED colour on a road traffic light instruct approaching motorists to do?', 'STOP completely behind the stop line', ['Drive as fast as possible', 'Sound the horn continuously', 'Turn onto the footpath'], 'Red = Stop; Amber = Prepare to stop / get ready; Green = Proceed if the junction is clear.'],
];

export function generateDeepSubjectExercise(
  domain: string,
  ctx: StrandContext,
  passIndex: number
): ExerciseItem | null {
  const v = Math.abs(passIndex);

  if (domain === 'cre') {
    if (v < TEN_COMMANDMENTS_DRILLS.length) {
      const [act, cmd, ref] = TEN_COMMANDMENTS_DRILLS[v];
      const others = TEN_COMMANDMENTS_DRILLS.filter((_, idx) => idx !== v).map((r) => r[1]);
      const p = packChoices(cmd, [others[v % others.length], others[(v + 3) % others.length], others[(v + 6) % others.length]], v + 211);
      return {
        q: `A learner practises "${act}". Which of the Ten Commandments (${ref}) is the learner obeying?`,
        options: p.options,
        ans: p.ans,
        exp: `Practising "${act}" directly fulfils the ${cmd} (${ref}).`,
        tags: ['cre', 'commandments'],
      };
    }
    const v2 = v - TEN_COMMANDMENTS_DRILLS.length;
    if (v2 < FRUITS_OF_SPIRIT_SCENARIOS.length) {
      const [scen, fruit] = FRUITS_OF_SPIRIT_SCENARIOS[v2];
      const others = FRUITS_OF_SPIRIT_SCENARIOS.filter((_, idx) => idx !== v2).map((r) => r[1]);
      const p = packChoices(fruit, [others[0], others[2], others[4]], v2 + 233);
      return {
        q: `Which Fruit of the Holy Spirit (Galatians 5:22–23) is demonstrated by: "${scen}"?`,
        options: p.options,
        ans: p.ans,
        exp: `"${scen}" is a practical Christian demonstration of ${fruit}.`,
        tags: ['cre', 'holy spirit'],
      };
    }
    const v3 = v2 - FRUITS_OF_SPIRIT_SCENARIOS.length;
    if (v3 < BIBLICAL_FIGURES_MATCH.length) {
      const [q, corr, dist] = BIBLICAL_FIGURES_MATCH[v3];
      const p = packChoices(corr, dist, v3 + 251);
      return {
        q,
        options: p.options,
        ans: p.ans,
        exp: `${corr} is the accurate Biblical answer.`,
        tags: ['cre', 'bible'],
      };
    }
  }

  if (domain === 'environmental' || domain === 'agriculture') {
    const aLen = ANIMAL_HOMES_AND_YOUNG.length;
    if (v < aLen * 3) {
      const [animal, young, shelter, product] = ANIMAL_HOMES_AND_YOUNG[v % aLen];
      const mode = Math.floor(v / aLen);
      const others = ANIMAL_HOMES_AND_YOUNG.filter((_, idx) => idx !== v % aLen);
      if (mode === 0) {
        const p = packChoices(young, [others[0][1], others[2][1], others[4][1]], v + 307);
        return {
          q: `What is the young one of a ${animal} called?`,
          options: p.options,
          ans: p.ans,
          exp: `A young ${animal} is called a ${young}.`,
          tags: ['animals', 'domestic'],
        };
      }
      if (mode === 1) {
        const p = packChoices(shelter, [others[1][2], others[3][2], others[5][2]], v + 313);
        return {
          q: `What is the proper name of the shelter/house built for a domestic ${animal}?`,
          options: p.options,
          ans: p.ans,
          exp: `A ${animal} is housed safely in a ${shelter}.`,
          tags: ['animals', 'shelter'],
        };
      }
      const p = packChoices(product, [others[2][3], others[4][3], others[6][3]], v + 331);
      return {
        q: `What main benefit or product do families get from keeping a ${animal}?`,
        options: p.options,
        ans: p.ans,
        exp: `Keeping a ${animal} provides ${product}.`,
        tags: ['animals', 'products'],
      };
    }
    const vRem = v - aLen * 3;
    if (vRem < KENYA_PARKS_AND_FEATURES.length) {
      const [q, corr, dist, exp] = KENYA_PARKS_AND_FEATURES[vRem];
      const p = packChoices(corr, dist, vRem + 353);
      return { q, options: p.options, ans: p.ans, exp, tags: ['environment', 'kenya'] };
    }
  }

  if (domain === 'social_history_geography' && v < KENYA_PARKS_AND_FEATURES.length) {
    const [q, corr, dist, exp] = KENYA_PARKS_AND_FEATURES[v];
    const p = packChoices(corr, dist, v + 379);
    return { q, options: p.options, ans: p.ans, exp, tags: ['kenya', 'physical', 'tourism'] };
  }

  // Additional Creative Arts & Sports / Business / Computer numerical & scenario drills
  if (domain === 'creative_sports') {
    const playersTable: Array<[string, string, [string, string, string], string]> = [
      ['How many players from ONE team take the pitch at kick-off in a standard eleven-a-side Football match?', '11 players (10 outfield players and 1 goalkeeper)', ['7 players', '6 players', '5 players'], 'A regulation football team fields 11 players on the pitch.'],
      ['How many players from ONE team are on the court at a time in a standard Basketball game?', '5 players per team', ['11 players per team', '9 players per team', '15 players per team'], 'Basketball is played 5-on-5 on the court.'],
      ['How many players from ONE team are on the court in a standard Handball match?', '7 players (6 court players and 1 goalkeeper)', ['11 players', '5 players', '12 players'], 'Team handball fields 7 players per side (6 court players + 1 goalie).'],
      ['How many players from ONE team take the field in standard Rugby Sevens—a sport in which Kenya’s "Shujaa" excels internationally?', '7 players per team', ['15 players per team', '11 players per team', '9 players per team'], 'Rugby Sevens features 7 players per team playing seven-minute halves.'],
      ['Before starting vigorous athletics or ball games, why must learners perform dynamic WARM-UP exercises?', 'To increase blood flow to muscles, loosen joints, and prevent muscle tears/strains', ['To make players exhausted before the match', 'To skip learning game rules', 'To cool the body down to sleep'], 'Warming up raises muscle elasticity and heart readiness, preventing sports injuries.'],
      ['After finishing a fast race, why should an athlete perform gentle jogging and stretching (COOL-DOWN) instead of sitting abruptly?', 'To prevent blood pooling/dizziness and help clear lactic acid from tired muscles', ['To run a second marathon immediately', 'To increase muscle cramps', 'To dehydrate the body'], 'Gradual cool-down normalizes heart rate safely and reduces muscle stiffness.'],
    ];
    if (v < playersTable.length) {
      const [q, corr, dist, exp] = playersTable[v];
      const p = packChoices(corr, dist, v + 401);
      return { q, options: p.options, ans: p.ans, exp, tags: ['sports', 'games'] };
    }
  }

  return null;
}
