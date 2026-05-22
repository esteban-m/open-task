import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  function mockHost() {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const response = { status };
    const request = { method: 'GET', url: '/test' };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
    return { host, status, json };
  }

  it('formats HttpException response', () => {
    const { host, status, json } = mockHost();
    const exception = new HttpException('Bad input', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad input',
        path: '/test',
      }),
    );
  });
});
