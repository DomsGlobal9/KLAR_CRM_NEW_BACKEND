import { mailConfig } from '../../src/config/mail.config';
import { emailService } from '../../src/services/email.service';

describe('Email Service', () => {
  beforeAll(() => {
    jest.spyOn(mailConfig, 'sendMail').mockResolvedValue({
      success: true,
      messageId: 'abc',
      response: 'OK'
    });
  });

  it('sends email successfully', async () => {
    const result = await emailService.sendEmail({
      to: 'a@b.com',
      subject: 'Test',
      text: 'Hello'
    });

    expect(result.success).toBe(true);
    expect(mailConfig.sendMail).toHaveBeenCalled();
  });
});
