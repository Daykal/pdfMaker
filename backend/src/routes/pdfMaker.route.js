import express from "express";
import { pdfMakerAdmin, pdfMakerUser } from "../controllers/pdfMaker.controller.js";
const router = express.Router();

router.post("/", pdfMakerUser);
router.post("/admin", pdfMakerAdmin);

export default router;
