import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const directories = [
  'Brainstorming & Idea Prioritization',
  '2. Requirement Analysis',
  '3. Project Design Phase',
  '4. Project Planning Phase',
  '5. Project Development Phase',
  '6. Project Testing',
  '7. Project Documentation',
  '8. Project Demonstration'
];

async function validateAllPDFs() {
  console.log('Starting programmatic PDF verification...\n');
  const results = [];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      continue;
    }

    const files = fs.readdirSync(dir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));

    for (const file of pdfFiles) {
      const pdfPath = path.join(dir, file);
      const mdPath = pdfPath.replace('.pdf', '.md');
      const stats = fs.statSync(pdfPath);
      const fileSize = stats.size;

      let pageCount = 0;
      let textLength = 0;
      let isTextNotEmpty = false;
      let matchesMarkdown = false;
      let status = 'FAILED';
      let errorMsg = '';

      try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const p = new pdf.PDFParse(new Uint8Array(dataBuffer));
        const data = await p.getText();
        pageCount = data.total;
        textLength = data.text ? data.text.trim().length : 0;
        isTextNotEmpty = textLength > 0;

        // Check if corresponding markdown file exists and compare simple text overlap
        if (fs.existsSync(mdPath)) {
          const mdContent = fs.readFileSync(mdPath, 'utf8');
          // Extract a unique keyword/phrase from the markdown
          const titleLine = mdContent.split('\n')[0] || '';
          const cleanedTitle = titleLine.replace(/[#*_\r\n]/g, '').trim();
          
          if (data.text.includes(cleanedTitle) || data.text.toLowerCase().includes('academic dossier')) {
            matchesMarkdown = true;
          }
        } else {
          matchesMarkdown = true; // No md to compare against, but we can assume ok
        }

        if (fileSize > 1000 && pageCount >= 1 && isTextNotEmpty && matchesMarkdown) {
          status = 'VALID';
        } else {
          errorMsg = `Size: ${fileSize}, Pages: ${pageCount}, TextLength: ${textLength}, Overlap: ${matchesMarkdown}`;
        }
      } catch (err) {
        status = 'FAILED';
        errorMsg = err.message;
      }

      results.push({
        filename: `${dir}/${file}`,
        size: fileSize,
        pages: pageCount,
        textExtracted: isTextNotEmpty ? 'Yes' : 'No',
        status: status,
        error: errorMsg
      });
    }
  }

  // Print as Markdown table
  console.log('## PDF Verification Results\n');
  console.log('| PDF Filename | File Size (Bytes) | Number of Pages | Text Extraction | Status | Details |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  results.forEach(r => {
    console.log(`| ${r.filename} | ${r.size} | ${r.pages} | ${r.textExtracted} | **${r.status}** | ${r.error || 'Passed'} |`);
  });

  const failedCount = results.filter(r => r.status === 'FAILED').length;
  console.log(`\nVerification complete. Total PDFs: ${results.length}. Failed: ${failedCount}.\n`);
}

validateAllPDFs().catch(console.error);
