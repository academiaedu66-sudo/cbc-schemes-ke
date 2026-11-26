This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!


## Ongoing SEO & Ranking Tasks

**IndexNow / Daily SEO** – The daily `/api/seo/sensor?cron=daily` continues to submit all hub URLs to IndexNow. Check the log output in Vercel’s dashboard for a `200 OK` response.

**Google Search Console Monitoring** –
1. Open Search Console → *URL Inspection* for each hub page (e.g., `/topics/tsc-tpad-portal`).
2. Verify the status reads **“URL is on Google”**. If it says *“Not indexed”*, click *Request Indexing*.
3. Use the *Coverage* report to watch for any crawl errors.

**Rank Tracking** – You can use a free online rank‑checker (e.g., https://www.serpwoo.com/ or https://rankchecker.org) and enter the target keywords (see the extensive `keywords` list in `layout.tsx`). Record the position weekly.

**Backlink Building** –
- Reach out to Kenyan teacher forums, education blogs, and curriculum sites.
- Offer to provide a free downloadable sample (e.g., a CBC scheme PDF) in exchange for a link.
- Submit the site to relevant education directories.

**Content Expansion** –
- Create a `/blog` section for articles such as “How to Use CBC Lesson Plans”, “TSC TPAD Walk‑through”, or “KNEC Exam Preparation Tips”.
- Each post should target a long‑tail keyword from the list and include internal links to the hub pages.

**Performance & Lighthouse** –
- Run `npx lighthouse https://www.cbcmaterials.shop --only-categories=performance,seo --output=json --output-path=./lighthouse-report.json` locally.
- Review the JSON report for Core Web Vitals, TTI, and SEO scores. Aim for **90+** in each category.
- Fix any reported issues (e.g., large image sizes, render‑blocking JS) and re‑run until the score improves.

**Cron Schedule Recap** – see `vercel.json` for the active cron jobs (daily SEO, hourly backup, social autopost, etc.).

**Next Steps** – After you set up the above, let me know if you’d like me to:
- Scaffold the `/blog` page structure.
- Generate a starter blog post.
- Create a GitHub Action to run Lighthouse on every push.
- Automate backlink outreach reminders.

---


The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---
## SEO Hubs Added
- **TSC / TPAD Portal** – `/topics/tsc-tpad-portal`
- **Schemes** – `/topics/schemes`
- **Lesson Plans Templates** – `/topics/lesson-plans-templates`
- **CBC** – `/topics/cbc`
- **CBCMaterials** – `/topics/cbcmaterials`
- **KNEC Exams** – `/topics/knec-exams`

These pages are now indexed via the daily SEO cron job and submitted to IndexNow.

## Public `llms.txt`
A plain‑text file exposing our LLM usage policy is available at `/llms.txt`. It is served from the `public/` directory.

## Vercel Pro Cron Schedule
- **Daily SEO sensor** – `0 5 * * *` (runs `/api/seo/sensor?cron=daily`)
- **Hourly WhatsApp status** – `35 * * * *`
- **Hourly backup** – `48 * * * *`
- **Omnichannel social autopost** – `18 */2 * * *`

For more details see `vercel.json`.

