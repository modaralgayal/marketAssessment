import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const activityRouter = Router();

/**
 * Recent activity for the signed-in account's dashboard.
 *  - Manufacturer → events that happened to *their* cards (accountId = me):
 *    interest expressed, referrals, shares. ("Recent buyer activity")
 *  - Buyer → events the buyer *caused* (actorAccountId = me):
 *    inquiries created, interest expressed, cards saved. ("Recent activity")
 */
activityRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const isMaker = req.account!.role === "MANUFACTURER";
    // Manufacturers see events on their own cards; buyers see events they caused
    // AND events directed at them (e.g. a manufacturer sharing a card with them).
    const where = isMaker
      ? { accountId: req.account!.id }
      : { OR: [{ accountId: req.account!.id }, { actorAccountId: req.account!.id }] };
    const events = await prisma.activityEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    return res.json(
      events.map((e) => ({
        id: e.id,
        type: e.type,
        payload: e.payload,
        actorAccountId: e.actorAccountId ?? undefined,
        createdAt: e.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
});
