// import express from 'express';
// import { userController } from '../controllers/user.controller';
// import { authMiddleware, roleMiddleware } from '../middleware';


// const router = express.Router();

// /**
//  * Public routes
//  */
// router.post('/request-reset', userController.requestPasswordReset);
// router.post('/reset-password', userController.resetPassword);

// /**
//  * Protected routes (require authentication)
//  */
// router.use(authMiddleware);

// /**
//  * User profile routes
//  */
// router.get('/profile', userController.getProfile);
// router.put('/profile', userController.updateProfile);
// router.put('/change-password', userController.changePassword);

// /**
//  * Admin routes (admin and superadmin only)
//  */
// router.get('/users',
//     roleMiddleware(['admin', 'superadmin']),
//     userController.getAllUsers
// );

// /**
//  * Superadmin only routes
//  */
// router.post('/users',
//     roleMiddleware(['superadmin', 'admin']),
//     userController.createUser
// );

// router.put('/users/:id',
//     roleMiddleware(['superadmin']),
//     userController.updateUser
// );

// router.post('/assign-rm',
//     roleMiddleware(['superadmin', 'admin']),
//     userController.assignRM
// );

// router.post('/remove-rm',
//     roleMiddleware(['superadmin', 'admin']),
//     userController.removeRM
// );

// router.get('/admin/:adminId/rms',
//     roleMiddleware(['superadmin', 'admin']),
//     userController.getAdminRMs
// );

// /**
//  * Superadmin only statistics and logs
//  */
// router.get('/stats',
//     roleMiddleware(['superadmin']),
//     userController.getUserStats
// );

// router.get('/audit-logs',
//     roleMiddleware(['superadmin']),
//     userController.getAuditLogs
// );

// export default router;