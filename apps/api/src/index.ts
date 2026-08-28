import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./env.js";
import { submissionsRouter } from "./routes/submissions.js";
import { invitesRouter } from "./routes/invites.js";
import { reportRequestsRouter } from "./routes/reportRequests.js";
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
// Allow the configured web origin (comma-separated list supported) plus any
// localhost / 127.0.0.1 origin so local dev (web on :5173 → API on :3000)
// works without exposing the API to arbitrary third-party origins.
const devOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const allowedOrigins = (env.WEB_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / non-browser requests
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (devOrigin.test(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  }),
);
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
app.use("/api/invites", invitesRouter);
app.use("/api/report-requests", reportRequestsRouter);
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
