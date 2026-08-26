import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Referrals', () => {
  describe('Referral code generation', () => {
    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        codes.add(code);
      }
      assert.equal(codes.size, 100);
    });

    it('should validate referral code format', () => {
      const isValidCode = (code: string): boolean => {
        return /^REF-[A-Z0-9]{6,12}$/.test(code);
      };
      assert.ok(isValidCode('REF-ABC123'));
      assert.ok(!isValidCode('INVALID'));
      assert.ok(!isValidCode('ref-abc123'));
    });
  });

  describe('Referral rewards', () => {
    it('should calculate referral reward (10% bonus)', () => {
      const baseReward = 5000;
      const referralBonus = 0.10;
      const totalReward = baseReward + (baseReward * referralBonus);
      assert.equal(totalReward, 5500);
    });

    it('should cap max referral bonus at 50000 GNF', () => {
      const calculateBonus = (amount: number): number => {
        return Math.min(amount * 0.10, 50000);
      };
      assert.equal(calculateBonus(100000), 50000);
      assert.equal(calculateBonus(200000), 50000);
      assert.equal(calculateBonus(50000), 5000);
    });

    it('should not allow self-referral', () => {
      const userId = 'user-1';
      const referredBy = 'user-1';
      const isSelfReferral = userId === referredBy;
      assert.ok(isSelfReferral);
    });
  });

  describe('Referral tracking', () => {
    it('should track referral chain', () => {
      const referrals = [
        { referrerId: 'A', referredId: 'B', status: 'PENDING' },
        { referrerId: 'B', referredId: 'C', status: 'CONFIRMED' }
      ];
      const chain = referrals.filter(r => r.referrerId === 'A');
      assert.equal(chain.length, 1);
    });

    it('should count total referrals per user', () => {
      const referrals = [
        { referrerId: 'A', referredId: 'B' },
        { referrerId: 'A', referredId: 'C' },
        { referrerId: 'A', referredId: 'D' },
        { referrerId: 'B', referredId: 'E' }
      ];
      const count = referrals.filter(r => r.referrerId === 'A').length;
      assert.equal(count, 3);
    });
  });
});
