import { readFileSync } from 'fs';
import { resolve } from 'path';

const configPath = resolve(__dirname, '../../../config/open-task.e2e.json');
const stack = JSON.parse(readFileSync(configPath, 'utf8')) as {
  testUser: { password: string; emailDomain: string };
};

export const TEST_USER_PASSWORD = stack.testUser.password;

export function testEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@${stack.testUser.emailDomain}`;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
