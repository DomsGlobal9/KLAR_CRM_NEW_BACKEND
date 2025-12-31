import { validateEnv } from '../../src/config/env.config';

describe('Env validation', () => {
  it('throws when SMTP_HOST is missing', () => {
    const original = process.env.SMTP_HOST;

    delete process.env.SMTP_HOST;

    expect(() => validateEnv()).toThrow();

    process.env.SMTP_HOST = original;
  });
});
