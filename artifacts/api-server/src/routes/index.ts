import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionRouter from "./session";
import brokerhubRouter from "./brokerhub";
import privacyRouter from "./privacy";
import portalRouter from "./portal";
import documentsRouter from "./documents";
import billingRouter from "./billing";
import { invitesAcceptRouter, invitesAdminRouter } from "./invites";
import {
  requireActiveSubscription,
  requireAuth,
  requireConsent,
  requireTenant,
} from "../middlewares/access";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionRouter);
router.use(invitesAcceptRouter);

const gated = Router();
gated.use(requireAuth);
gated.use(requireConsent);
gated.use(requireTenant);
gated.use(requireActiveSubscription);
gated.use(brokerhubRouter);
gated.use(privacyRouter);
gated.use(invitesAdminRouter);
gated.use(portalRouter);
gated.use(documentsRouter);
gated.use(billingRouter);

router.use(gated);

export default router;
