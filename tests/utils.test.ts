import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateShortId, formatChatListTime, formatMessageTime, AVATAR_COLORS } from '../src/lib/utils';

describe('Utility Functions', () => {
  test('generateShortId produces an 8-character uppercase alphanumeric string without ambiguous characters', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateShortId();
      assert.equal(id.length, 8);
      // Valid chars only: 2-9, A-Z except 0, O, 1, I
      assert.match(id, /^[2-9A-HJ-NP-Z]{8}$/);
    }
  });

  test('generateShortId creates unique values across iterations', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateShortId());
    }
    assert.equal(ids.size, 100);
  });

  test('AVATAR_COLORS has diverse modern colors', () => {
    assert.ok(AVATAR_COLORS.length >= 8);
    for (const color of AVATAR_COLORS) {
      assert.match(color, /^#[0-9A-Fa-f]{6}$/);
    }
  });

  test('formatChatListTime handles null or invalid gracefully', () => {
    assert.equal(formatChatListTime(null), '');
    assert.equal(formatChatListTime(undefined), '');
    assert.equal(formatChatListTime('invalid-date'), '');
  });

  test('formatMessageTime handles null or invalid gracefully', () => {
    assert.equal(formatMessageTime(null), '');
    assert.equal(formatMessageTime(undefined), '');
    assert.equal(formatMessageTime('invalid-date'), '');
  });
});
