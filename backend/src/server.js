import express from "express";
import pdfMakerRouter from "./routes/pdfMaker.route.js";
const app = express();

app.use(express.json());
app.use(pdfMakerRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
