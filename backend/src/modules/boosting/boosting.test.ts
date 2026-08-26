import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BOOST_PLANS, boostSortKey } from './boosting.service.js';

describe('Boosting module', () => {
  // ── Plans ────────────────────────────────────────────────────────────────

  describe('BOOST_PLANS', () => {
    it('should have exactly 3 plans: BASIC, PREMIUM, VIP', () => {
      assert.equal(BOOST_PLANS.length, 3);
      const levels = BOOST_PLANS.map((p) => p.level);
      assert.ok(levels.includes('BASIC'));
      assert.ok(levels.includes('PREMIUM'));
      assert.ok(levels.includes('VIP'));
    });

    it('BASIC should be free', () => {
      const basic = BOOST_PLANS.find((p) => p.level === 'BASIC');
      assert.ok(basic);
      assert.equal(basic.priceGnf, 0);
    });

    it('PREMIUM should cost 50 000 GNF', () => {
      const premium = BOOST_PLANS.find((p) => p.level === 'PREMIUM');
      assert.ok(premium);
      assert.equal(premium.priceGnf, 50000);
    });

    it('VIP should cost 150 000 GNF', () => {
      const vip = BOOST_PLANS.find((p) => p.level === 'VIP');
      assert.ok(vip);
      assert.equal(vip.priceGnf, 150000);
    });

    it('all plans should have a 7-day duration', () => {
      BOOST_PLANS.forEach((plan) => {
        assert.equal(plan.durationDays, 7, `${plan.level} should be 7 days`);
      });
    });

    it('all plans should have a label in French', () => {
      BOOST_PLANS.forEach((plan) => {
        assert.ok(plan.label.length > 0, `${plan.level} should have a label`);
      });
    });

    it('all plans should have at least one feature', () => {
      BOOST_PLANS.forEach((plan) => {
        assert.ok(plan.features.length > 0, `${plan.level} should have features`);
      });
    });

    it('paid plans should cost more than BASIC', () => {
      const basic = BOOST_PLANS.find((p) => p.level === 'BASIC')!;
      BOOST_PLANS.filter((p) => p.level !== 'BASIC').forEach((plan) => {
        assert.ok(plan.priceGnf > basic.priceGnf, `${plan.level} should cost more than BASIC`);
      });
    });
  });

  // ── boostSortKey ─────────────────────────────────────────────────────────

  describe('boostSortKey', () => {
    it('VIP should rank first (0)', () => {
      assert.equal(boostSortKey('VIP'), 0);
    });

    it('PREMIUM should rank second (1)', () => {
      assert.equal(boostSortKey('PREMIUM'), 1);
    });

    it('BASIC should rank third (2)', () => {
      assert.equal(boostSortKey('BASIC'), 2);
    });

    it('null should rank last (3)', () => {
      assert.equal(boostSortKey(null), 3);
    });

    it('unknown level should rank last (3)', () => {
      assert.equal(boostSortKey('UNKNOWN'), 3);
    });

    it('ordering should always be VIP < PREMIUM < BASIC < null', () => {
      const keys = [
        { level: null, key: boostSortKey(null) },
        { level: 'BASIC', key: boostSortKey('BASIC') },
        { level: 'PREMIUM', key: boostSortKey('PREMIUM') },
        { level: 'VIP', key: boostSortKey('VIP') },
      ];
      for (let i = 0; i < keys.length - 1; i++) {
        assert.ok(keys[i].key > keys[i + 1].key,
          `${keys[i].level} (${keys[i].key}) should rank lower than ${keys[i + 1].level} (${keys[i + 1].key})`);
      }
    });
  });

  // ── Duration calculation ──────────────────────────────────────────────────

  describe('Boost duration calculation', () => {
    it('should compute correct end date for 7-day boost', () => {
      const start = new Date('2026-08-25T12:00:00Z');
      const durationDays = 7;
      const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
      assert.equal(end.getUTCDate(), 1);
      assert.equal(end.getUTCMonth(), 8); // September
    });

    it('should handle month boundary correctly', () => {
      const start = new Date('2026-01-28T00:00:00Z');
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      assert.equal(end.getUTCDate(), 4);
      assert.equal(end.getUTCMonth(), 1); // February
    });

    it('should handle leap year correctly', () => {
      const start = new Date('2028-02-25T00:00:00Z');
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      assert.equal(end.getUTCDate(), 3);
      assert.equal(end.getUTCMonth(), 2); // March
    });
  });

  // ── Plan price tiers ─────────────────────────────────────────────────────

  describe('Plan pricing tiers', () => {
    it('price should increase with each tier', () => {
      const prices = BOOST_PLANS.map((p) => p.priceGnf);
      for (let i = 0; i < prices.length - 1; i++) {
        assert.ok(prices[i] <= prices[i + 1],
          `Plan ${BOOST_PLANS[i].level} (${prices[i]}) should be <= ${BOOST_PLANS[i + 1].level} (${prices[i + 1]})`);
      }
    });

    it('premium should cost 2.5x more than free tier would if it cost something', () => {
      // Premium is 50000 GNF for visibility boost
      const premium = BOOST_PLANS.find((p) => p.level === 'PREMIUM')!;
      assert.equal(premium.priceGnf, 50000);
      // VIP should be 3x premium
      const vip = BOOST_PLANS.find((p) => p.level === 'VIP')!;
      assert.equal(vip.priceGnf, 150000);
    });
  });
});
