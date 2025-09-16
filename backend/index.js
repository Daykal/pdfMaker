import PDFDocument from 'pdfkit';

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "output.pdf");

const doc = new PDFDocument({
    size: "A4"
});

doc.pipe(fs.createWriteStream(filePath));

// Set the font size
doc.fontSize(18);

// Using a standard PDF font
doc.font('Times-Roman')
   .text('Hello from Times Roman!')
   .moveDown(0.5);

// Using a TrueType font (.ttf)
doc.font('Helvetica')
   .text('This is Good Dog!')
   .moveDown(0.5);

// Using a collection font (.ttc or .dfont)
doc.font('Courier')
   .text('This is Courier, not Comic Sans.');

doc.end();