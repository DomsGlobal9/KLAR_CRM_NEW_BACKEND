// import { Router } from 'express';
// import { setReminder } from '../controllers/setReminder.controller';
// import { authenticate } from '../middleware/auth.middleware';

// const router = Router();

// // Endpoint: POST /api/reminders/set
// router.post('/', authenticate, setReminder);
// // router.post('/', authenticate, reminderController.setReminder);

// export default router;


import { Router } from 'express';
import { reminderController } from '../controllers/setReminder.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/reminders/send
router.post('/', authenticate, reminderController.setReminder);

export default router;