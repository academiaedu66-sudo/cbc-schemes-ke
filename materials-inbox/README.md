# CBC Materials Inbox (Bulk Import Folder)

Drop any `.docx`, `.doc`, or `.pdf` CBC curriculum documents into this folder and run:

```bash
npm run materials:sync
```

## How Filename Auto-Detection Works
The sync script reads each filename to automatically detect:
- **Grade**: `Grade 1` through `Grade 12` (or `Form 1`–`Form 4`, `KPSEA` -> Grade 6, `KJSEA` -> Grade 9, `KCSE` -> Grade 12)
- **Term**: `Term 1`, `Term 2`, or `Term 3`
- **Category & Default Price**:
  - `Schemes` -> **Schemes of Work** (KES 50)
  - `Lesson Plan` -> **Lesson Plans** (KES 70)
  - `Notes` / `Booklet` -> **Teachers' Notes** (KES 100)
  - `Exam` / `Mock` / `Prediction` / `KPSEA` / `KJSEA` -> **Revision Papers & Exams** (KES 100)
- **Subject**: Mathematics, Integrated Science, Science & Technology, English, Kiswahili, Pre-Technical Studies, Agriculture & Nutrition, Creative Arts & Sports, Biology, etc.

**Example clean filenames:**
- `Grade_7_Term_2_Integrated_Science_Schemes_of_Work.docx`
- `Grade_6_Term_1_Agriculture_and_Nutrition_Notes.pdf`
- `Grade_8_Term_3_Mathematics_End_Term_Exam.pdf`
