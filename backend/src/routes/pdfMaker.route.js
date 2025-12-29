import express from "express";
import { pdfMakerUser } from "../controllers/pdfMaker.controller.js";
const router = express.Router();

router.post("/", pdfMakerUser);

export default router;
