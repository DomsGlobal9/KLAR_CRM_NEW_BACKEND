// import { Request, Response } from 'express';
// import { reminderService } from '../services/setReminder.service';
// import { ReminderRequest } from '../interfaces/setReminder.interface';

// export const setReminder = async (req: Request, res: Response) => {
//   try {
//     const reminderData: ReminderRequest = req.body;

//     // Basic validation
//     if (!reminderData.currentMemberId || !reminderData.reminderForId || !reminderData.title || !reminderData.content) {
//        return res.status(400).json({ message: "Missing required fields" });
//     }

//     const result = await reminderService.sendReminder(reminderData);
//     res.status(200).json(result);
//   } catch (error: any) {
//     res.status(404).json({ 
//       success: false, 
//       message: error.message || "Failed to process reminder" 
//     });
//   }
// };










import { Request, Response } from 'express';
import { reminderService } from '../services/setReminder.service';
import { sendErrorResponse } from '../helpers/response.helper';

export const reminderController = {
  async setReminder(req: Request, res: Response) {
    try {
      console.log("The set reminder data we get", JSON.stringify(req.body, null, 2));
      const { lead_id, assigned_to, title, message, sendVia } = req.body;

      // Validation
      if (!assigned_to || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "Recipient, Title, and Content are required"
        });
      }

      const hasChannel = sendVia && (sendVia.email === true || sendVia.whatsapp === true);

      if (!hasChannel) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one delivery method (WhatsApp or Email)."
        });
      }

      const result = await reminderService.sendReminder({
        currentMemberId: lead_id,
        reminderForId: assigned_to,
        title,
        content: message,
        sendVia: sendVia || { email: true, whatsapp: true } 
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Reminder Controller Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error"
      });
    }
  }
};