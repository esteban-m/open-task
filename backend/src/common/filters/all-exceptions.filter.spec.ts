import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

beforeAll(() => {
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
});

afterAll(() => {
  jest.restoreAllMocks();
});

function mockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const request = { method: 'GET', url: '/test' };
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost,
    json,
    status,
  };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('formats HttpException responses', () => {
    const { host, json, status } = mockHost();
    filter.catch(new HttpException('Bad input', HttpStatus.BAD_REQUEST), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: 'Bad input', path: '/test' }),
    );
  });

  it('hides generic Error details in production', () => {
    process.env.NODE_ENV = 'production';
    const { host, json } = mockHost();
    filter.catch(new Error('db down'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Erreur interne du serveur' }),
    );
  });

  it('handles unknown non-Error throwables', () => {
    const { host, json } = mockHost();
    filter.catch({ code: 'WEIRD' }, host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Erreur interne du serveur', statusCode: 500 }),
    );
  });

  it('exposes Error message outside production', () => {
    process.env.NODE_ENV = 'development';
    const { host, json } = mockHost();
    filter.catch(new Error('db down'), host);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: 'db down' }));
  });
});
