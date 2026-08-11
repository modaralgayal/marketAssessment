import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./env.js";
import { submissionsRouter } from "./routes/submissions.js";
import { filesRouter } from "./routes/files.js";
import { scoreRouter } from "./routes/score.js";
import { distributorsRouter } from "./routes/distributors.js";
import { matchesRouter } from "./routes/matches.js";
import { catalogueRouter } from "./routes/catalogue.js";
import { customersRouter } from "./routes/customers.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1); // behind Render's proxy — needed for rate-limit IP detection
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // needed for file downloads
    contentSecurityPolicy: false, // disabled for now — the web frontend is a separate SPA
  }),
);
app.use(cors({ origin: env.WEB_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Lightweight admin check used by the SPA to bounce non-admins after sign-in.
app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.json({ email: req.admin!.email });
});

app.use("/api/score", scoreRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/submissions", matchesRouter);
app.use("/api/files", filesRouter);
app.use("/api/distributors", distributorsRouter);
app.use("/api", catalogueRouter);
app.use("/api/customers", customersRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(
    `API listening on http://localhost:${env.PORT} (origin: ${env.WEB_ORIGIN})`,
  );
});
