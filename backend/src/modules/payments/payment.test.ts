import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Phone validation tests ─────────────────────────────────────────────────

function normalizePhone(input: string): string {
  const cleaned = input.replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('00224')) return cleaned.slice(2);
  if (cleaned.startsWith('+224')) return cleaned.slice(1);
  if (cleaned.startsWith('224')) return cleaned;
  return cleaned;
}

function isValidGuineaPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  const normalized = normalizePhone(cleaned);
  return /^224\d{7}$/.test(normalized);
}

describe('Payment - Guinea phone normalization', () => {
  it('removes leading +224', () => {
    assert.equal(normalizePhone('+224620000000'), '22462000000');
  });

  it('removes leading 00224', () => {
    assert.equal(normalizePhone('0022462000000'), '22462000000');
  });

  it('keeps 224 prefix intact', () => {
    assert.equal(normalizePhone('22462000000'), '22462000000');
  });

  it('strips spaces and dashes', () => {
    assert.equal(normalizePhone('224 62 00 00 00'), '22462000000');
    assert.equal(normalizePhone('224-620-000-00'), '22462000000');
  });

  it('detects invalid short number', () => {
    assert.ok(!isValidGuineaPhone('123'));
  });

  it('validates correct 12-digit number with country code', () => {
    assert.ok(isValidGuineaPhone('+22462000001'));
  });

  it('rejects non-numeric input', () => {
    assert.ok(!isValidGuineaPhone('abcdefghijk'));
  });
});

// ── Payment amount validation ──────────────────────────────────────────────

describe('Payment amount validation', () => {
  const VALID_MIN_AMOUNT = 100;
  const VALID_MAX_AMOUNT = 50_000_000;

  function isValidAmount(amount: number): boolean {
    return Number.isInteger(amount) && amount >= VALID_MIN_AMOUNT && amount <= VALID_MAX_AMOUNT;
  }

  it('rejects zero amount', () => {
    assert.equal(isValidAmount(0), false);
  });

  it('rejects negative amount', () => {
    assert.equal(isValidAmount(-100), false);
  });

  it('rejects fractional amount', () => {
    assert.equal(isValidAmount(1500.50), false);
  });

  it('rejects amount over max', () => {
    assert.equal(isValidAmount(50_000_001), false);
  });

  it('accepts minimum valid amount', () => {
    assert.ok(isValidAmount(100));
  });

  it('accepts maximum valid amount', () => {
    assert.ok(isValidAmount(50_000_000));
  });

  it('accepts typical daily rental', () => {
    assert.ok(isValidAmount(150000));
  });
});

// ── Phone number format validation ─────────────────────────────────────────

describe('Guinea phone number formats', () => {
  const validFormats = [
    '+22462000001',
    '22462000001',
    '0022462000001',
    '+224 620 000 01',
    '224-620-000-01',
  ];

  const invalidFormats = [
    '',
    '123',
    '1234567890',
    'abcdefghijk',
    '+33612345678', // French number
  ];

  validFormats.forEach(phone => {
    it(`validates "${phone}" as a valid Guinea number`, () => {
      assert.ok(isValidGuineaPhone(phone), `${phone} should be valid`);
    });
  });

  invalidFormats.forEach(phone => {
    it(`rejects "${phone}" as invalid`, () => {
      assert.equal(isValidGuineaPhone(phone), false);
    });
  });
});

// ── Currency formatting ─────────────────────────────────────────────────────

describe('GNF currency formatting', () => {
  function formatGNF(amount: number): string {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  it('formats zero', () => {
    const result = formatGNF(0);
    assert.ok(typeof result === 'string');
  });

  it('formats large amounts', () => {
    const result = formatGNF(1500000);
    assert.ok(result.includes('1'));
    assert.ok(result.includes('500'));
  });

  it('formats small amounts', () => {
    const result = formatGNF(5000);
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });
});

// ── Payment status validation ──────────────────────────────────────────────

describe('Payment status transitions', () => {
  const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

  function isValidStatusTransition(from: string, to: string): boolean {
    const transitions: Record<string, string[]> = {
      PENDING: ['COMPLETED', 'FAILED'],
      FAILED: ['PENDING'],
      COMPLETED: ['REFUNDED'],
      REFUNDED: [],
    };
    return transitions[from]?.includes(to) ?? false;
  }

  it('allows pending to completed', () => {
    assert.ok(isValidStatusTransition('PENDING', 'COMPLETED'));
  });

  it('allows pending to failed', () => {
    assert.ok(isValidStatusTransition('PENDING', 'FAILED'));
  });

  it('allows completed to refunded', () => {
    assert.ok(isValidStatusTransition('COMPLETED', 'REFUNDED'));
  });

  it('rejects refunded to anything', () => {
    assert.equal(isValidStatusTransition('REFUNDED', 'COMPLETED'), false);
    assert.equal(isValidStatusTransition('REFUNDED', 'PENDING'), false);
  });

  it('rejects invalid status', () => {
    assert.equal(isValidStatusTransition('INVALID', 'COMPLETED'), false);
  });
});
