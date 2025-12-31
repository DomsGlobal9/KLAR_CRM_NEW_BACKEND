// import { Request, Response } from 'express';
// import { userService } from '../services';
// import { userRepository } from '../repositories';
// import {
//     CreateUserInput,
//     UpdateUserInput,
//     ChangePasswordInput
// } from '../models';

// export const userController = {
//     // Get current user profile
//     async getProfile(req: Request, res: Response) {
//         try {
//             const userId = (req as any).user?.id;
//             if (!userId) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const user = await userService.getUserProfile(userId);

//             // Remove password hash from response
//             const { password_hash, ...userWithoutPassword } = user;

//             res.json({ user: userWithoutPassword });
//         } catch (error: any) {
//             res.status(500).json({ error: error.message });
//         }
//     },

//     // Create user (admin/superadmin only)
//     async createUser(req: Request, res: Response) {
//         try {
//             const createdBy = (req as any).user?.id;
//             if (!createdBy) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const userData: any = req.body;

//             // Validate required fields
//             if (!userData.username || !userData.email || !userData.password || !userData.role) {
//                 return res.status(400).json({ error: 'Missing required fields' });
//             }

//             const user = await userService.createUser(userData, createdBy);

//             // Remove password hash from response
//             const { password_hash, ...userWithoutPassword } = user;

//             res.status(201).json({
//                 message: 'User created successfully',
//                 user: userWithoutPassword
//             });
//         } catch (error: any) {
//             res.status(400).json({ error: error.message });
//         }
//     },

//     // Update user profile
//     async updateProfile(req: Request, res: Response) {
//         try {
//             const userId = (req as any).user?.id;
//             if (!userId) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const updates: UpdateUserInput = req.body;

//             // Don't allow role updates through this endpoint
//             if (updates.role) {
//                 return res.status(400).json({ error: 'Cannot update role through this endpoint' });
//             }

//             const user = await userService.updateUserProfile(userId, updates, userId);

//             const { password_hash, ...userWithoutPassword } = user;

//             res.json({
//                 message: 'Profile updated successfully',
//                 user: userWithoutPassword
//             });
//         } catch (error: any) {
//             res.status(400).json({ error: error.message });
//         }
//     },

//     // Change password
//     async changePassword(req: Request, res: Response) {
//         try {
//             const userId = (req as any).user?.id;
//             if (!userId) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const data: ChangePasswordInput = req.body;

//             if (!data.currentPassword || !data.newPassword) {
//                 return res.status(400).json({ error: 'Both current and new password are required' });
//             }

//             await userService.changePassword(userId, data);

//             res.json({ message: 'Password changed successfully' });
//         } catch (error: any) {
//             res.status(400).json({ error: error.message });
//         }
//     },

//     // Get all users (with role-based filtering)
//     async getAllUsers(req: Request, res: Response) {
//         try {
//             const requesterId = (req as any).user?.id;
//             if (!requesterId) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const role = req.query.role as string;
//             const users = await userService.getAllUsers(role, requesterId);

//             // Remove password hashes from response
//             const usersWithoutPasswords = users.map(({ password_hash, ...user }) => user);

//             res.json({ users: usersWithoutPasswords });
//         } catch (error: any) {
//             res.status(500).json({ error: error.message });
//         }
//     },

//     // Admin-RM Assignment
//     async assignRM(req: Request, res: Response) {
//         try {
//             const assignedBy = (req as any).user?.id;
//             if (!assignedBy) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const { adminId, rmId } = req.body;

//             if (!adminId || !rmId) {
//                 return res.status(400).json({ error: 'Both adminId and rmId are required' });
//             }

//             const assignment = await userService.assignRMToAdmin(adminId, rmId, assignedBy);

//             res.status(201).json({
//                 message: 'RM assigned to admin successfully',
//                 assignment
//             });
//         } catch (error: any) {
//             res.status(400).json({ error: error.message });
//         }
//     },

//     // Remove RM from admin
//     async removeRM(req: Request, res: Response) {
//         try {
//             const removedBy = (req as any).user?.id;
//             if (!removedBy) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const { adminId, rmId } = req.body;

//             if (!adminId || !rmId) {
//                 return res.status(400).json({ error: 'Both adminId and rmId are required' });
//             }

//             await userService.removeRMFromAdmin(adminId, rmId, removedBy);

//             res.json({ message: 'RM removed from admin successfully' });
//         } catch (error: any) {
//             res.status(400).json({ error: error.message });
//         }
//     },

//     // Get admin's assigned RMs
//     async getAdminRMs(req: Request, res: Response) {
//         try {
//             const adminId = req.params.adminId || (req as any).user?.id;
//             if (!adminId) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const assignments = await userService.getAdminAssignments(adminId);

//             res.json({ assignments });
//         } catch (error: any) {
//             res.status(500).json({ error: error.message });
//         }
//     },

//     // Password reset request
//     async requestPasswordReset(req: Request, res: Response) {
//         try {
//             const { email } = req.body;

//             if (!email) {
//                 return res.status(400).json({ error: 'Email is required' });
//             }

//             const token = await userService.initiatePasswordReset(email);

//             // In production, send email with reset link
//             res.json({
//                 message: 'Password reset email sent',
//                 token // Only for development - remove in production
//             });
//         } catch (error: any) {
//             res.status(400).json({ error: error.message });
//         }
//     },

//     // Reset password with token
//     async resetPassword(req: Request, res: Response) {
//         try {
//             const { token, newPassword } = req.body;

//             if (!token || !newPassword) {
//                 return res.status(400).json({ error: 'Token and new password are required' });
//             }

//             await userService.resetPassword(token, newPassword);

//             res.json({ message: 'Password reset successfully' });
//         } catch (error: any) {
//             res.status(400).json({ error: error.message });
//         }
//     },

//     // Get user statistics
//     async getUserStats(req: Request, res: Response) {
//         try {
//             const requesterId = (req as any).user?.id;
//             if (!requesterId) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const requester = await userService.getUserProfile(requesterId);
//             if (requester.role !== 'superadmin') {
//                 return res.status(403).json({ error: 'Only superadmins can view statistics' });
//             }

//             const stats = await userService.getUserStats();

//             res.json({ stats });
//         } catch (error: any) {
//             res.status(500).json({ error: error.message });
//         }
//     },

//     // Get audit logs (superadmin only)
//     async getAuditLogs(req: Request, res: Response) {
//         try {
//             const requesterId = (req as any).user?.id;
//             if (!requesterId) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const requester = await userService.getUserProfile(requesterId);
//             if (requester.role !== 'superadmin') {
//                 return res.status(403).json({ error: 'Only superadmins can view audit logs' });
//             }

//             const userId = req.query.userId as string;
//             const limit = parseInt(req.query.limit as string) || 100;

//             const logs = await userRepository.getAuditLogs(userId, limit);

//             res.json({ logs });
//         } catch (error: any) {
//             res.status(500).json({ error: error.message });
//         }
//     },

//     // Update user by admin/superadmin
//     async updateUser(req: Request, res: Response) {
//         try {
//             const updaterId = (req as any).user?.id;
//             if (!updaterId) {
//                 return res.status(401).json({ error: 'Unauthorized' });
//             }

//             const userId = req.params.id;
//             const updates: UpdateUserInput = req.body;

//             // Don't allow role updates through this endpoint
//             if (updates.role) {
//                 return res.status(400).json({ error: 'Cannot update role through this endpoint' });
//             }

//             const user = await userService.updateUserProfile(userId, updates, updaterId);

//             const { password_hash, ...userWithoutPassword } = user;

//             res.json({
//                 message: 'User updated successfully',
//                 user: userWithoutPassword
//             });
//         } catch (error: any) {
//             res.status(400).json({ error: error.message });
//         }
//     }
// };