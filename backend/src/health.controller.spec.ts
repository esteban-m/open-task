import { HealthController } from './health.controller';

describe('HealthController', () => {
  const controller = new HealthController();

  it('returns ok status', () => {
    expect(controller.health()).toEqual({ status: 'ok' });
  });
});
