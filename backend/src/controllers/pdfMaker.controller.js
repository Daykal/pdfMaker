import PDFDocument from "pdfkit";
import { motifSchema } from "../schemas/motifSchema.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const motifLibrary = "https://assets.knittedforyou.com/motif/";
const logoPath = path.join(__dirname, "../assets/logo.png");

// ---------------------- User PDF ----------------------
export const pdfMakerUser = async (req, res) => {
  try {
    const { motifId, userName = "Unknown", motifName = "Untitled" } = req.body;
    if (!motifId)
      return res.status(400).json({ message: "motifId is required" });

    const response = await fetch(`${motifLibrary}${motifId}.json`);
    if (!response.ok) return res.status(404).send("Motif not found");

    const fetchedMotif = await response.json();
    const motifData = motifSchema.parse(fetchedMotif);

    const pdfBuffer = await generatePDF(motifData, { userName, motifName });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="motif-document.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid motif JSON", details: error.message || error });
  }
};

// ---------------------- Admin PDF ----------------------
export const pdfMakerAdmin = async (req, res) => {
  try {
    const { motifId } = req.body;

    if (!motifId) {
      return res.status(400).json({ message: "motifId is required" });
    }

    const { data, errors } = validateAndParseMotifInput(req.body);
    if (errors) return res.status(400).json({ errors });

    const response = await fetch(`${motifLibrary}${motifId}.json`);
    if (!response.ok)
      return res.status(404).json({ message: "Motif not found" });

    const fetchedMotif = await response.json();
    const motifData = motifSchema.parse(fetchedMotif);

    const pdfBuffer = await generatePDFAdmin(motifData, data);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="motif-document.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Failed to generate PDF",
      details: error.message || error,
    });
  }
};

// ---------------------- PDF GENERATION ----------------------
async function generatePDF(motifData, userData) {
  const { userName, motifName } = userData;

  const { width, height, colors, rows } = motifData;

  return new Promise((resolve, reject) => {
    // ---------------------- PDF Setup ----------------------
    const doc = createPDFDoc();
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.image(logoPath, 45, 20, { width: 300 });
    doc.moveDown(2);
    doc
      .fontSize(13)
      .text(`Knitting motif, ${motifName} created by ${userName} `);
    doc.moveDown(2);

    //---------------------- Chart Dimensions ----------------------
    const { boxWidth, boxHeight } = getBoxDimensions(width, height);
    const startX = 38;
    const startY = doc.y;
    const rulerYTop = startY + height * boxHeight + 2;
    const rulerYBottom = rulerYTop + 10; // 10pt below top row - gap between bottom ruler numbers

    //---------------------- Draw chart ----------------------
    drawChart(
      doc,
      rows,
      colors,
      width,
      height,
      boxWidth,
      boxHeight,
      startX,
      startY,
      rulerYTop,
      rulerYBottom
    );

    //---------------------- Footer ----------------------
    addFooter(doc);

    //---------------------- Save PDF ----------------------
    doc.end();
  });
}

async function generatePDFAdmin(motifData, userData) {
  const { width, height, colors, rows } = motifData;
  const { userName, motifName, motifLinkAddress, motifColors } = userData;

  return new Promise((resolve, reject) => {
    //---------------------- PDF Setup ----------------------
    const doc = createPDFDoc();
    const pageWidth = 620;
    const pageHeight = 720;
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    //Header
    doc.image(logoPath, 45, 20, { width: 300 });
    doc.moveDown(8);
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(motifName, { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .font("Helvetica")
      .text("PDF Download", { align: "center" });

    doc.moveDown(8);
    addPageNumber(doc, 1);
    doc.addPage();

    doc.image(logoPath, 45, 20, { width: 300 });
    doc.moveDown(2);
    doc.font("Helvetica-Bold").text("Motif description");
    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .text(
        "Knitted for You makes it even easier — see how the motif fits on a sweater and get size calculations based on your yarn tension. Simple. Modern. Joyful."
      );
    doc
      .fillColor("blue")
      .text(motifLinkAddress, { link: motifLinkAddress, underline: true });
    doc.moveDown(2);
    doc.fillColor("black").font("Helvetica-Bold").text("Details");
    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .text(`${width} x ${height} snitches (width x height)`);
    doc.text("Colors used: " + motifColors.join(", "));
    doc.moveDown(8);
    doc.text(
      "Created with love by Knitters design with tools from Knitted for You."
    );
    addPageNumber(doc, 2);
    doc.addPage();

    doc.image(logoPath, 45, 20, { width: 300 });
    doc.moveDown(2);
    doc
      .fontSize(13)
      .text(`Knitting motif, ${motifName} created by ${userName} `);
    doc.moveDown(2);

    //---------------------- Chart Dimensions ----------------------
    const { boxWidth, boxHeight } = getBoxDimensions(width, height);
    const startX = 38;
    const startY = doc.y;
    const rulerYTop = startY + height * boxHeight + 2;
    const rulerYBottom = rulerYTop + 10;

    //---------------------- Draw chart ----------------------
    drawChart(
      doc,
      rows,
      colors,
      width,
      height,
      boxWidth,
      boxHeight,
      startX,
      startY,
      rulerYTop,
      rulerYBottom
    );

    //---------------------- Footer ----------------------
    addFooter(doc);
    addPageNumber(doc, 3);
    doc.addPage();

    doc.image(logoPath, 45, 20, { width: 300 });
    doc.moveDown(2);
    doc.fontSize(13).text(`The chart in stitches: ${width} x ${height}`);
    doc.moveDown(2);

    //---------------------- Draw textual stitch chart ----------------------
    drawStitchChart(doc, motifData.rows, motifColors);

    addPageNumber(doc, 4);

    //---------------------- Save PDF ----------------------
    doc.end();
  });
}

// ---------------------- HELPERS ----------------------
function createPDFDoc() {
  return new PDFDocument({
    size: [650, 850], // width, height in points
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });
}

function getBoxDimensions(width, height) {
  const pageWidth = 620;
  const pageHeight = 720;
  let boxWidth = Math.floor(pageWidth / width);
  let boxHeight = Math.floor(pageHeight / height);

  if (boxWidth > 25) boxWidth = 25;
  if (boxHeight > boxWidth) boxHeight = boxWidth;
  else boxWidth = boxHeight;

  return { boxWidth, boxHeight };
}

function drawChart(
  doc,
  rows,
  colors,
  width,
  height,
  boxWidth,
  boxHeight,
  startX,
  startY,
  rulerYTop,
  rulerYBottom
) {
  //---------------------- Draw rows ----------------------
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

    //---------------------- Draw row ruler ----------------------
    doc
      .fillColor("black")
      .fontSize(10)
      .text(height - row.index, x + 2, y + boxHeight / 4);
  });

  //---------------------- Draw column rulers ----------------------
  for (let col = 0; col < width; col++) {
    const number = width - col;
    const x = startX + col * boxWidth;

    if (number < 10) {
      doc.text(number, x, rulerYTop, { width: boxWidth, align: "center" });
    } else {
      const tens = Math.floor(number / 10);
      const units = number % 10;
      doc.text(tens, x, rulerYTop, { width: boxWidth, align: "center" });
      doc.text(units, x, rulerYBottom, { width: boxWidth, align: "center" });
    }
  }
}

function drawStitchChart(doc, rows, motifColors) {
  const numRows = rows.length;
  const reversedRows = [...rows].reverse();

  for (let row = 0; row < numRows; row++) {
    const lineNumber = row + 1;
    const outputParts = [];
    const reversedPixels = [...reversedRows[row].pixels].reverse();

    for (const pixel of reversedPixels) {
      const colorName = motifColors[pixel.color];
      outputParts.push(`${pixel.count} ${colorName}`);
    }

    const prefix = lineNumber % 2 === 1 ? "<--" : "";
    if (lineNumber % 2 === 0) outputParts.reverse();

    doc.text(`${lineNumber}. ${prefix} ${outputParts.join(", ")}`);
  }
}

function addFooter(doc) {
  doc.moveDown(4);
  doc.fontSize(10.5);
  doc.text("The chart was created on ", (doc.x = 50), doc.y, {
    continued: true,
  });
  doc.fillColor("blue").text("https://motif.knittedforyou.com", {
    link: "https://motif.knittedforyou.com",
    underline: true,
    continued: true,
  });
  doc
    .fillColor("black")
    .text(". The ultimate website to use for knitting with more colors.", {
      underline: false,
      link: null,
    });
}

function addPageNumber(doc, currentPage) {
  const text = `${currentPage} / 4`;
  const y = doc.page.height - 80;
  doc.fontSize(10).text(text, 0, y, { width: doc.page.width, align: "center" });
}

// ---------------------- VALIDATION ----------------------
function validateAndParseMotifInput(body) {
  const { userName, motifName, colors, motifLink } = body;
  const errors = [];

  // Existence checks
  if (!userName) errors.push("'userName': required");
  if (!motifName) errors.push("'motifName': required");
  if (!colors) errors.push("'colors': Colors are required.");
  if (!motifLink) errors.push("'motifLink': Motif link address is required.");
  if (errors.length > 0) return { errors };

  // Normalize
  const motifColors = colors
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const motifLinkAddress = motifLink.trim();

  if (motifColors.length === 0)
    errors.push("At least one color must be provided.");
  if (errors.length > 0) return { errors };

  return { data: { userName, motifName, motifColors, motifLinkAddress } };
}
