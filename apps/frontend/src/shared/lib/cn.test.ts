import { describe, expect, it } from 'vitest';
import cn from './cn';

describe('cn', () => {
  it('joins strings, arrays, numbers, and conditional records', () => {
    expect(cn('base', ['nested', 1], { enabled: true, disabled: false }, null, undefined)).toBe(
      'base nested 1 enabled'
    );
  });
});
