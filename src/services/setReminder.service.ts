// import { teamMemberRepository } from '../repositories/teamMember.repository'; 
// import { ReminderRequest } from '../interfaces/setReminder.interface';

// export const reminderService = {
//   async sendReminder(data: ReminderRequest) {
//     // 1. Verify the recipient exists
//     const recipient = await teamMemberRepository.getUserById(data.reminderForId);
//     if (!recipient) {
//       throw new Error('Recipient member not found');
//     }

//     // 2. Verify the sender exists
//     const sender = await teamMemberRepository.getUserById(data.currentMemberId);
//     if (!sender) {
//       throw new Error('Sender member not found');
//     }

//     // Since you don't want to save to DB, you would trigger your 
//     // notification logic here (Email, WhatsApp, etc.)
//     console.log(`Reminder from ${sender.email} to ${recipient.email}: ${data.title}`);

//     return {
//       success: true,
//       message: `Reminder sent successfully to ${recipient.user_metadata?.full_name || recipient.email}`,
//     };
//   }
// }; 





import { teamMemberRepository } from '../repositories/teamMember.repository';
import { pdfDeliveryService } from './pdfDelivery.service';
import { ReminderRequest } from '../interfaces/setReminder.interface';

// export const reminderService = {
//   async sendReminder(data: ReminderRequest) {
//     // 1. Fetch Recipient Data from your existing repository
//     const recipient = await teamMemberRepository.getUserById(data.reminderForId);
//     if (!recipient) {
//       throw new Error('Recipient member not found');
//     }

//     // 2. Extract contact info from Supabase metadata
//     const clientEmail = recipient.email;
//     const clientPhone = recipient.user_metadata?.phone || recipient.user_metadata?.phoneNumber;
//     const clientName = recipient.user_metadata?.full_name || recipient.user_metadata?.name || 'Member';

//     // 3. Prepare Delivery Options (Reusing your existing interface)
//     // Note: Since this is a reminder, not a PDF, we pass the content as the "URL" or message context
//     const deliveryOptions = {
//       leadId: data.reminderForId,
//       clientName: clientName,
//       clientEmail: clientEmail,
//       clientPhone: clientPhone,
//       pdfUrl: "N/A", // This is a text reminder
//       pdfFileName: "reminder.txt"
//     };

//     const results: any = {};

//     // 4. Send via Email
//     if (data.sendVia.email && clientEmail) {
//       results.email = await pdfDeliveryService.sendViaEmail(
//         clientEmail,
//         `Title: ${data.title}\nContent: ${data.content}`, // Passing content as the message
//         clientName,
//         data.reminderForId
//       );
//     }

//     // 5. Send via WhatsApp
//     if (data.sendVia.whatsapp && clientPhone) {
//       const customMessage = `*Reminder: ${data.title}*\n\n${data.content}`;
//       // We use the underlying WhatsApp service directly or a modified helper
//       results.whatsapp = await pdfDeliveryService.sendViaWhatsApp(
//         clientPhone,
//         customMessage, 
//         clientName
//       );
//     }

//     return {
//       success: !!(results.email?.success || results.whatsapp?.success),
//       details: results,
//       message: "Reminder processing complete"
//     };
//   }
// };






export const reminderService = {
  async sendReminder(data: ReminderRequest) {
    const recipient = await teamMemberRepository.getUserById(data.reminderForId);
    if (!recipient) throw new Error('Recipient not found');

    const clientEmail = recipient.email;
    const clientPhone = recipient.user_metadata?.phone;
    const clientName = recipient.user_metadata?.full_name || 'Member';

    const results: any = {};

    // 1. Send Styled Email
    if (data.sendVia.email && clientEmail) {
        results.email = await pdfDeliveryService.sendReminderEmail(
            clientEmail, 
            data.title, 
            data.content, 
            clientName
        );
    }

    // 2. Send Styled WhatsApp
    if (data.sendVia.whatsapp && clientPhone) {
        // FIXED: Call the method on pdfDeliveryService, not 'this'
        const waMessage = pdfDeliveryService.createReminderWhatsApp(clientName, data.title, data.content);
        results.whatsapp = await WhatsAppService.sendMessage(clientPhone, waMessage);
    }

    return { success: true, results };
  }
};