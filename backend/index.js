import fs from 'fs';
import PDFDocument from 'pdfkit';

// ---------------------- Load JSON ----------------------
const motifJsonPath = './motif.json'; // your JSON file path
const motifData = JSON.parse(fs.readFileSync(motifJsonPath, 'utf8'));

const { width, height, colors, rows } = motifData;

if (!width || !height || !Array.isArray(rows)) {
  throw new Error('Invalid motif.json: width, height and rows are required');
}

// ---------------------- PDF Setup ----------------------
const doc = new PDFDocument({
  size: [650, 850], // width, height in points
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
});
doc.pipe(fs.createWriteStream('knitting_chart.pdf'));

// Header
// doc.image('./img/KfYlogo.jpg', 50, 20, { width: 100 });
doc.fontSize(14).text(`Knitting motif chart`, 200, 30);
doc.moveDown(2);

// Page font
doc.fontSize(12);

// ---------------------- Chart Dimensions ----------------------
const pageWidth = 620;
const pageHeight = 720;

let boxWidth = Math.floor(pageWidth / width);
let boxHeight = Math.floor(pageHeight / height);

if (boxWidth > 25) boxWidth = 25;
if (boxHeight > boxWidth) boxHeight = boxWidth;
else boxWidth = boxHeight;


// ---------------------- Draw chart ----------------------
const startX = 37;
let startY = 100;
const rulerYTop = startY + height * boxHeight + 2;
const rulerYBottom = rulerYTop + 10; // 10pt below top row
// Draw rows
rows.forEach((row) => {
  let x = startX;
  const y = startY + row.index * boxHeight;

  row.pixels.forEach((pixel) => {
    const colorIndex = pixel.color;
    const count = pixel.count;
    let fillColor = '#ffffff'; // default empty
    if (colorIndex !== false && colors[colorIndex]) fillColor = colors[colorIndex];

    // Draw each pixel block
    for (let i = 0; i < count; i++) {
      doc
        .rect(x, y, boxWidth, boxHeight)
        .fillAndStroke(fillColor, '#ccc'); // default border
      x += boxWidth;
    }
  });

  
  
  // ---------------------- Draw bottom 2-row ruler ----------------------
  
  doc
    .fillColor('black')
    .fontSize(10)
    .text(height - row.index, x + 2, y + boxHeight / 4);
});

for (let col = 0; col < width; col++) {
  const number = width - col;
  const x = startX + col * boxWidth;

  if (number < 10) {
    // For numbers 1-9, show on top row only
    doc.text(number, x, rulerYTop, { width: boxWidth, align: 'center' });
  } else {
    // For numbers 10+, split tens and units
    const tens = Math.floor(number / 10);
    const units = number % 10;

    // Top row: tens
    doc.text(tens, x, rulerYTop, { width: boxWidth, align: 'center' });

    // Bottom row: units
    doc.text(units, x, rulerYBottom, { width: boxWidth, align: 'center' });
  }
}



// ---------------------- Footer ----------------------
// doc.fontSize(fontSizeDefault);
// doc.moveDown(2);
// doc.text(
//   'The chart was created on https://motif.knittedforyou.com. The ultimate website to use for knitting with more colors.',
//   { align: 'center' }
// );

// ---------------------- Save PDF ----------------------
doc.end();
console.log('PDF generated: knitting_chart.pdf');
