import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { CurrentUser } from './current-user.decorator';

function getParamDecoratorFactory() {
  class TestHost {
    handler(@CurrentUser() _user: unknown) {}
  }

  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestHost, 'handler');
  const factoryKey = Object.keys(metadata)[0];
  return metadata[factoryKey].factory;
}

describe('CurrentUser decorator', () => {
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: 'user-1', email: 'a@b.fr' } }),
    }),
  } as unknown as ExecutionContext;

  it('returns full user when no data key', () => {
    const factory = getParamDecoratorFactory();
    expect(factory(undefined, mockContext)).toEqual({ id: 'user-1', email: 'a@b.fr' });
  });

  it('returns user field when data key provided', () => {
    class TestHost {
      handler(@CurrentUser('id') _id: string) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestHost, 'handler');
    const factoryKey = Object.keys(metadata)[0];
    const factory = metadata[factoryKey].factory;
    expect(factory('id', mockContext)).toBe('user-1');
  });
});
