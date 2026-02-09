import { beforeAll, afterAll } from 'bun:test';

beforeAll(() => {
  console.log('--- Starting Integration Tests ---');
  if (!process.env.IWINV_API_KEY) {
    process.env.IWINV_API_KEY = 'test-api-key';
  }
});

afterAll(() => {
  console.log('--- Integration Tests Completed ---');
});
