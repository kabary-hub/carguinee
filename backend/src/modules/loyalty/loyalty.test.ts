import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Loyalty tests ─────────────────────────────────────────────────────────

describe('Loyalty - Points calculation', () => {
  function calculateLoyaltyPoints(amount: number, multiplier: number = 1): number {
    return Math.floor(amount / 1000) * multiplier;
  }

  it('calculates points for standard purchase', () => {
    assert.strictEqual(calculateLoyaltyPoints(5000), 5);
  });

  it('truncates fractional points', () => {
    assert.strictEqual(calculateLoyaltyPoints(1500), 1);
  });

  it('returns 0 for zero amount', () => {
    assert.strictEqual(calculateLoyaltyPoints(0), 0);
  });

  it('applies multiplier', () => {
    assert.strictEqual(calculateLoyaltyPoints(5000, 2), 10);
  });

  it('handles large amounts', () => {
    assert.strictEqual(calculateLoyaltyPoints(1000000), 1000);
  });
});

describe('Loyalty - Tier calculation', () => {
  function getLoyaltyTier(points: number): string {
    if (points >= 10000) return 'PLATINUM';
    if (points >= 5000) return 'GOLD';
    if (points >= 1000) return 'SILVER';
    return 'BRONZE';
  }

  it('returns BRONZE for low points', () => assert.equal(getLoyaltyTier(0), 'BRONZE'));
  it('returns SILVER for 1000+ points', () => assert.equal(getLoyaltyTier(1000), 'SILVER'));
  it('returns GOLD for 5000+ points', () => assert.equal(getLoyaltyTier(5000), 'GOLD'));
  it('returns PLATINUM for 10000+ points', () => assert.equal(getLoyaltyTier(10000), 'PLATINUM'));
  it('returns BRONZE for 999', () => assert.equal(getLoyaltyTier(999), 'BRONZE'));
  it('returns SILVER for 4999', () => assert.equal(getLoyaltyTier(4999), 'SILVER'));
  it('returns GOLD for 9999', () => assert.equal(getLoyaltyTier(9999), 'GOLD'));
});

describe('Loyalty - Discount calculation', () => {
  function calculateDiscount(points: number, amount: number): number {
    const discountRate = {
      BRONZE: 0,
      SILVER: 0.05,
      GOLD: 0.10,
      PLATINUM: 0.20,
    };
    const tier = points >= 10000 ? 'PLATINUM' : points >= 5000 ? 'GOLD' : points >= 1000 ? 'SILVER' : 'BRONZE';
    return Math.round(amount * discountRate[tier as keyof typeof discountRate]);
  }

  it('no discount for bronze', () => assert.strictEqual(calculateDiscount(500, 100000), 0));
  it('5% discount for silver', () => assert.strictEqual(calculateDiscount(1500, 100000), 5000));
  it('10% discount for gold', () => assert.strictEqual(calculateDiscount(7000, 100000), 10000));
  it('20% discount for platinum', () => assert.strictEqual(calculateDiscount(15000, 100000), 20000));
  it('discount does not exceed amount', () => assert.ok(calculateDiscount(50000, 1000) <= 1000));
});

// ── Referrals tests ──────────────────────────────────────────────────────

describe('Referrals - Code generation', () => {
  function generateReferralCode(firstName: string): string {
    const clean = firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${clean}${suffix}`;
  }

  it('uses first 3 letters of name uppercase', () => {
    const code = generateReferralCode('Amadou');
    assert.ok(code.startsWith('AMA'));
    assert.equal(code.length, 7);
  });

  it('handles short names', () => {
    const code = generateReferralCode('Al');
    assert.ok(code.startsWith('AL'));
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateReferralCode('Moussa')));
    assert.ok(codes.size > 90);
  });
});

describe('Referrals - Discount calculation', () => {
  function calculateReferralDiscount(amount: number, referralCount: number): number {
    const rate = Math.min(0.15, 0.05 * Math.min(referralCount, 3));
    return Math.round(amount * rate);
  }

  it('no discount without referrals', () => assert.strictEqual(calculateReferralDiscount(100000, 0), 0));
  it('5% with 1 referral', () => assert.strictEqual(calculateReferralDiscount(100000, 1), 5000));
  it('10% with 2 referrals', () => assert.strictEqual(calculateReferralDiscount(100000, 2), 10000));
  it('15% max with 3+ referrals', () => assert.strictEqual(calculateReferralDiscount(100000, 5), 15000));
  it('discount does not exceed amount', () => assert.ok(calculateReferralDiscount(100, 3) <= 100));
});

describe('Referrals - Code validation', () => {
  function isValidReferralCode(code: string): boolean {
    return /^[A-Z]{2,10}[0-9A-Z]{4,10}$/.test(code);
  }

  it('valid code with letters and numbers', () => assert.ok(isValidReferralCode('MOUS5678')));
  it('valid all letters + digits', () => assert.ok(isValidReferralCode('ABCDEF12')));
  it('too short', () => assert.ok(!isValidReferralCode('AB')));
  it('contains lowercase', () => assert.ok(!isValidReferralCode('mouS5678')));
  it('empty string', () => assert.ok(!isValidReferralCode('')));
});
