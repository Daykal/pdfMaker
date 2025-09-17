import PDFDocument from 'pdfkit';
import https from 'node:https';
import { imageSize } from 'image-size';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'output.pdf');

const doc = new PDFDocument({ size: 'A4' });
doc.pipe(fs.createWriteStream(filePath));


const pageWidth = doc.page.width;
const pageHeight = doc.page.height;

const imgUrl = 'https://c.wallhere.com/photos/e3/54/AI_art_abstract_minimalism_wide_image_ultrawide-2186061.jpg!d';

(async () => {
   try {
      const { buffer: imgBuffer, width: imgWidth, height: imgHeight } = await getImage(imgUrl);
      
      const maxWidth = pageWidth - 50;
      const maxHeight = pageHeight - 50;
      
      //Scale proportionally
      const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
      const newWidth = imgWidth * scale;
      const newHeight = imgHeight * scale;
      
      //Center of the page
      const x = (pageWidth - newWidth) / 2;
      const y = (pageHeight - newHeight) / 2;
      

      doc.fontSize(18).font('Times-Roman').text('Hello from Times Roman!', 50, 50);
      
      doc.image(imgBuffer, x, 100, { width: newWidth, height: newHeight });
      
      doc.end();
   } catch (err) {
      console.error('Error loading image:', err);
   }
})();

async function getImage(imgUrl) {
  return new Promise((resolve, reject) => {
    https.get(imgUrl, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const { width, height } = imageSize(buffer);
          resolve({ buffer, width, height });
        } catch (err) {
          reject(err);
        }
      });
      res.on('error', reject);
    });
  });
}