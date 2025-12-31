import request from 'supertest';
import app from '../../src/app';

describe('Email Routes', () => {
  it('POST /email/send returns 400 on invalid body', async () => {
    const res = await request(app)
  .post('/api/v1/email/send')
  .send({});

    expect(res.status).toBe(400);
  });
});
