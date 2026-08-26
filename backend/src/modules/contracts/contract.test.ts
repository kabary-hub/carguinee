import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Contract status validation ────────────────────────────────────────────

function isValidContractTransition(current: string, next: string): boolean {
  const transitions: Record<string, string[]> = {
    'DRAFT': ['SENT'],
    'SENT': ['SIGNED', 'DECLINED'],
    'SIGNED': [],
    'DECLINED': [],
  };
  return transitions[current]?.includes(next) ?? false;
}

function getContractStatus(status: string): string {
  const validStatuses = ['DRAFT', 'SENT', 'SIGNED', 'DECLINED'];
  return validStatuses.includes(status) ? status : 'DRAFT';
}

function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `CTR-${year}-${random}`;
}

describe('Contract', () => {
  describe('Status transitions', () => {
    it('allows DRAFT to SENT', () => assert.ok(isValidContractTransition('DRAFT', 'SENT')));
    it('allows SENT to SIGNED', () => assert.ok(isValidContractTransition('SENT', 'SIGNED')));
    it('allows SENT to DECLINED', () => assert.ok(isValidContractTransition('SENT', 'DECLINED')));
    it('does not allow SIGNED to anything', () => assert.ok(!isValidContractTransition('SIGNED', 'DRAFT')));
    it('does not allow DECLINED to anything', () => assert.ok(!isValidContractTransition('DECLINED', 'SENT')));
    it('rejects invalid status', () => assert.ok(!isValidContractTransition('DRAFT', 'invalid')));
  });

  describe('Contract status validation', () => {
    it('returns valid status', () => assert.equal(getContractStatus('DRAFT'), 'DRAFT'));
    it('returns DRAFT for invalid', () => assert.equal(getContractStatus('invalid'), 'DRAFT'));
  });

  describe('Contract number generation', () => {
    it('starts with CTR-', () => assert.ok(generateContractNumber().startsWith('CTR-')));
    it('has 14 characters', () => assert.equal(generateContractNumber().length, 14));
    it('generates unique numbers', () => {
      const nums = new Set<string>();
      for (let i = 0; i < 100; i++) nums.add(generateContractNumber());
      assert.ok(nums.size > 99);
    });
  });
});

describe('Contract date validation', () => {
  function isStartDateBeforeEndDate(start: string, end: string): boolean {
    return new Date(start) < new Date(end);
  }

  it('valid when start is before end', () => assert.ok(isStartDateBeforeEndDate('2024-01-01', '2024-01-31')));
  it('invalid when start equals end', () => assert.ok(!isStartDateBeforeEndDate('2024-01-01', '2024-01-01')));
  it('invalid when start is after end', () => assert.ok(!isStartDateBeforeEndDate('2024-12-31', '2024-01-01')));
});
