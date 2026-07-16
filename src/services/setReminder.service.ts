import { teamMemberRepository } from '../repositories/teamMember.repository';
import { pdfDeliveryService } from './pdfDelivery.service';
import { ReminderRequest } from '../interfaces/setReminder.interface';
import getWhatsAppService from '../services/whatsapp.service';

export const reminderService = {

  async sendReminder(data: ReminderRequest) {

    const messageService = getWhatsAppService();
    const recipient = await teamMemberRepository.getUserById(data.reminderForId);
    if (!recipient) throw new Error('Recipient not found');

    const clientEmail = recipient.email;
    const clientPhone = recipient.user_metadata?.phone;
    const clientName = recipient.user_metadata?.full_name || 'Member';

    const results: any = {};

    
    if (data.sendVia.email && clientEmail) {
      results.email = await pdfDeliveryService.sendReminderEmail(
        clientEmail,
        data.title,
        data.content,
        clientName
      );
    }

    
    if (data.sendVia.whatsapp && clientPhone) {
      if (!messageService) {
        console.log('❌ WhatsApp service not configured');
        results.whatsapp = { success: false, error: 'WhatsApp service not configured' };
      } else {
        const waMessage = pdfDeliveryService.createReminderWhatsApp(clientName, data.title, data.content);
        results.whatsapp = await messageService.sendMessage(clientPhone, waMessage);
      }
    }

    return { success: true, results };
  }
};