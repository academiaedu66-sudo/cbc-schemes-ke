const SITE = 'https://www.cbcmaterials.shop';
const INDEXNOW_KEY = 'cbcmaterials2026indexnow';

const PRIORITY_URLS = [
  `${SITE}/`,
  `${SITE}/topics/cbc`,
  `${SITE}/topics/cbcmaterials`,
  `${SITE}/topics/schemes-of-work`,
  `${SITE}/topics/teachers-notes`,
  `${SITE}/topics/knec-examinations`,
  `${SITE}/topics/kjsea-exams`,
  `${SITE}/topics/kpsea-exams`,
  `${SITE}/topics/tsc-services`,
  `${SITE}/topics/tuition-and-tutors`,
  `${SITE}/topics/cbc-lesson-plans`,
  `${SITE}/topics/records-of-work`,
  `${SITE}/topics/cbc-revision-books`,
  `${SITE}/topics/senior-school-pathways`,
  `${SITE}/topics/holiday-assignments`,
  `${SITE}/grades/pp1`,
  `${SITE}/grades/pp2`,
  `${SITE}/grades/grade-1`,
  `${SITE}/grades/grade-2`,
  `${SITE}/grades/grade-3`,
  `${SITE}/grades/grade-4`,
  `${SITE}/grades/grade-5`,
  `${SITE}/grades/grade-6`,
  `${SITE}/grades/grade-7`,
  `${SITE}/grades/grade-8`,
  `${SITE}/grades/grade-9`,
  `${SITE}/grades/grade-10`,
  `${SITE}/grades/grade-11`,
  `${SITE}/grades/grade-12`,
  `${SITE}/advertise`,
];

async function main() {
  console.log('Submitting 30 high-priority CBCMaterials Kenya URLs to IndexNow...');
  for (const endpoint of [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ]) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: 'www.cbcmaterials.shop',
          key: INDEXNOW_KEY,
          keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
          urlList: PRIORITY_URLS,
        }),
      });
      console.log(`  ${endpoint} => HTTP ${res.status}`);
    } catch (err) {
      console.log(`  ${endpoint} => ${err.message}`);
    }
  }
}

main().catch(console.error);
