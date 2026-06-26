import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { submissionsRouter } from "./routes/submissions.js";
import { filesRouter } from "./routes/files.js";
import { scoreRouter } from "./routes/score.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1); // behind Render's proxy — needed for rate-limit IP detection
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/score", scoreRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/files", filesRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(
    `API listening on http://localhost:${env.PORT} (origin: ${env.WEB_ORIGIN})`,
  );
});
