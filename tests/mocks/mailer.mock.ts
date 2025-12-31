export const transporter = {
  sendMail: jest.fn().mockResolvedValue({
    messageId: '123',
    response: 'OK'
  })
};
