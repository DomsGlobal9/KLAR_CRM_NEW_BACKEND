import { Router } from 'express';
import emailRoutes from './email.routes';
import emailResponseRoutes from './emailResponse.routes';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import rolesRoutes from './role.routes';
import teamRoutes from './team.route';
import teamMemberRoutes from './teamMembers.routes';
import leadRoutes from './lead.routes';
import stageRoutes from './stage.routes';
import invoiceRoutes from './invoice.routes';
import quoteRoutes from './quote.routes';
import serviceRoutes from './service.routes';
import itenaryRoutes from './itinerary.routes';
import itenaryUserPreference from "./itinerary-preferences.routes";
import inquirySourcesRoutes from './inquirySources.routes';
import teamLead from "./teamLead.routes";
import travelPlanRoutes from "./travelplan.routes"
import whatsappRoutes from './whatsapp.routes';
import setReminder from "./setReminder.routes"
import flight from "./flight.routes"

const router = Router();

/**
 * Base API routes
 */
router.use('/email', emailRoutes);
router.use('/email-response', emailResponseRoutes);
router.use('/role', rolesRoutes);
router.use('/user', userRoutes);
router.use('/team', teamRoutes);
router.use('/team-member', teamMemberRoutes);
router.use('/stage', stageRoutes);
router.use('/lead', leadRoutes); 
router.use('/inquiry-sources', inquirySourcesRoutes);
router.use(authRoutes);
router.use('/invoice', invoiceRoutes);
router.use('/quote', quoteRoutes);
router.use('/service', serviceRoutes);
router.use('/itenary', itenaryRoutes);
router.use('/itinerary-preferences', itenaryUserPreference);
router.use("/team-lead", teamLead);
router.use('/travel-plans', travelPlanRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use("/set-reminder", setReminder)


router.use("/flights", flight)

export default router;