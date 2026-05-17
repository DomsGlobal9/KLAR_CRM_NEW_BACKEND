export interface ReminderRequest {
  currentMemberId: string;       // Sender ID
  reminderForId: string;  // Recipient ID
  title: string;
  content: string;
  sendVia: {
    whatsapp?: boolean;
    email?: boolean;
  };
}