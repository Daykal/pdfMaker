import fs from "fs";
import PDFDocument from "pdfkit";
// ---------------------- Load JSON ----------------------
const motifJsonPath = "./src/motif.json"; // your JSON file path
const motifData = JSON.parse(fs.readFileSync(motifJsonPath, "utf8"));

const { userName, motifName, motifImage } = {
  userName: "Your Name",
  motifName: "Your Motif Name",
  motifImage: "./src/assets/image.png",
  motifLinkAddress: "https://motif.knittedforyou.com/root/1237-bunny-with-bow.html",
};
const { width, height, colors, rows } = motifData;

if (!width || !height || !Array.isArray(rows)) {
  throw new Error("Invalid motif.json: width, height and rows are required");
}

// ---------------------- PDF Setup ----------------------
const doc = new PDFDocument({
  size: [650, 850], // width, height in points
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
});
const pageWidth = 620;
const pageHeight = 720;


doc.pipe(fs.createWriteStream("knitting_chart.pdf"));


// Header
doc.image("./src/assets/logo.png", 45, 20, { width: 300 });

doc.moveDown(8);
doc.fontSize(24).font("Helvetica-Bold").text(motifName, {
  align: "center",
});

doc.moveDown(0.5);
doc.fontSize(14).font("Helvetica").text("PDF Download", {align: "center"});

doc.moveDown(8);
doc.image(motifImage,( doc.page.width - 250) / 2, doc.y, { width: 250 });
addPageNumber(doc, 1);

doc.addPage();
doc.font("Helvetica-Bold").text("Motif description");
doc.moveDown(0.5);
doc.font("Helvetica").text("Knitted for You makes it even easier — see how the motif fits on a sweater and get size calculations based on your yarn tension. Simple. Modern. Joyful.");
doc.fillColor("blue").text("https://motif.knittedforyou.com/root/1237-bunny-with-bow.html", {
  link: "https://motif.knittedforyou.com/root/1237-bunny-with-bow.html",
  underline: true,
});
doc.moveDown(2);
doc.fillColor("black").font("Helvetica-Bold").text("Details");
doc.moveDown(0.5);
doc.font("Helvetica").text(`${width} x ${height} snitches (width x height)`);
doc.text("Colors used: " + colors.join(", "));
addPageNumber(doc, 2);

doc.addPage();

doc.image("./src/assets/logo.png", 45, 20, { width: 300 });
doc.moveDown(2);
doc.fontSize(13).text(`Knitting motif, ${motifName} created by ${userName} `);
doc.moveDown(2);
// ---------------------- Chart Dimensions ----------------------

let boxWidth = Math.floor(pageWidth / width);
let boxHeight = Math.floor(pageHeight / height);

if (boxWidth > 25) boxWidth = 25;
if (boxHeight > boxWidth) boxHeight = boxWidth;
else boxWidth = boxHeight;

const startX = 38;
let startY = doc.y;
const rulerYTop = startY + height * boxHeight + 2;
const rulerYBottom = rulerYTop + 10; // 10pt below top row - gap between bottom ruler numbers
// ---------------------- Draw chart ----------------------
// Draw rows
rows.forEach((row) => {
  let x = startX;
  const y = startY + row.index * boxHeight;

  row.pixels.forEach((pixel) => {
    const colorIndex = pixel.color;
    const count = pixel.count;
    let fillColor = "#ffffff"; // default empty color
    if (colorIndex !== false && colors[colorIndex])
      fillColor = colors[colorIndex];
    // Draw each pixel block
    for (let i = 0; i < count; i++) {
      doc.rect(x, y, boxWidth, boxHeight).fillAndStroke(fillColor, "#ccc"); // default border color
      x += boxWidth;
    }
  });
  // ---------------------- Draw 2 rulers ----------------------
  doc
    .fillColor("black")
    .fontSize(10)
    .text(height - row.index, x + 2, y + boxHeight / 4);
});

for (let col = 0; col < width; col++) {
  const number = width - col;
  const x = startX + col * boxWidth;

  if (number < 10) {
    // For numbers 1-9, show on top row only
    doc.text(number, x, rulerYTop, { width: boxWidth, align: "center" });
  } else {
    // For numbers 10+, split tens and units
    const tens = Math.floor(number / 10);
    const units = number % 10;

    doc.text(tens, x, rulerYTop, { width: boxWidth, align: "center" });

    doc.text(units, x, rulerYBottom, { width: boxWidth, align: "center" });
  }
}

// ---------------------- Footer ----------------------
doc.moveDown(4);
doc.fontSize(10.5);
doc.text("The chart was created on ", (doc.x = 50), doc.y, { continued: true });
doc.fillColor("blue").text("https://motif.knittedforyou.com", {
  link: "https://motif.knittedforyou.com",
  underline: true,
  continued: true,
});
doc.fillColor("black").text(". The ultimate website to use for knitting with more colors.", {
  underline: false,
  link: null,
});
addPageNumber(doc, 3);
// ---------------------- Save PDF ----------------------
doc.end();





function addPageNumber(doc, currentPage) {
  const text = `${currentPage} / 3`;
  const y = doc.page.height - 80; // 30pt from bottom
  doc.fontSize(10)                   // small text
     .text(text, 0, y, { 
       width: doc.page.width,       // span entire width
       align: 'center'              // center horizontally
     });
}
