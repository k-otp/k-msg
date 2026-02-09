import { test, expect, describe } from 'bun:test';
import { ok, fail } from './result';

describe('Result', () => {
  test('ok should create success result', () => {
    const res = ok('success');
    expect(res.isSuccess).toBe(true);
    expect(res.isFailure).toBe(false);
    expect(res.value).toBe('success');
  });

  test('fail should create failure result', () => {
    const error = new Error('failure');
    const res = fail(error);
    expect(res.isSuccess).toBe(false);
    expect(res.isFailure).toBe(true);
    expect(res.error).toBe(error);
  });

  test('Result should be serializable', () => {
    const res = ok({ foo: 'bar' });
    const json = JSON.parse(JSON.stringify(res));
    expect(json.isSuccess).toBe(true);
    expect(json.value.foo).toBe('bar');
  });
});
