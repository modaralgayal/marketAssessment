import { Router } from "express";
import { scoreApplication } from "../lib/claudeScore";

export const scoreRouter = Router();

scoreRouter.post("/", async (req, res, next) => {
  try {
    const application = req.body;
    if (!application || typeof application !== "object") {
      return res.status(400).json({ error: "Invalid application payload" });
    }
    const result = await scoreApplication(application);
    res.json(result);
  } catch (err) {
    next(err);
  }
});