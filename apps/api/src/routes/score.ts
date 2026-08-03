import { Router } from "express";
import rateLimit from "express-rate-limit";
import { scoreApplication } from "../lib/claudeScore";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { auditLog } from "../middleware/auditLog.js";

export const scoreRouter = Router();

// All score routes require admin authentication
scoreRouter.use(requireAdmin);
scoreRouter.use(auditLog);

const scoreLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many evaluation requests, please try again later." },
});

scoreRouter.post("/", scoreLimiter, async (req, res, next) => {
  try {
    const { submissionId } = req.body;

    if (!submissionId || typeof submissionId !== "string") {
      return res.status(400).json({ error: "submissionId is required and must be a string" });
    }

    // Fetch the submission from the database
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Score the application using our Claude service
    const result = await scoreApplication(submission);

    // Update the submission with the evaluation results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: result.score,
        explanation: result.explanation,
        decision: result.decision || null,
        evaluatedAt: new Date(),
      },
    });

    // Return the updated submission data (matching the API response format)
    res.json({
      score: updatedSubmission.score,
      explanation: updatedSubmission.explanation,
      decision: updatedSubmission.decision,
    });
  } catch (err) {
    next(err);
  }
});