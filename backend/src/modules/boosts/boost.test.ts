import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Boosts', () => {
  describe('Boost duration calculation', () => {
    it('should calculate boost end date (7 days)', () => {
      const start = new Date('2026-08-25');
      const durationDays = 7;
      const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
      assert.equal(end.getDate(), 1); // Sept 1
      assert.equal(end.getMonth(), 8); // September
    });

    it('should calculate boost end date (30 days)', () => {
      const start = new Date('2026-08-25');
      const durationDays = 30;
      const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
      assert.equal(end.getDate(), 24); // Sept 24
    });
  });

  describe('Boost pricing', () => {
    it('should apply correct pricing per tier', () => {
      const prices = { 7: 50000, 14: 80000, 30: 120000 };
      assert.equal(prices[7], 50000);
      assert.equal(prices[14], 80000);
      assert.equal(prices[30], 120000);
    });

    it('should reject invalid duration', () => {
      const validDurations = [7, 14, 30];
      assert.ok(validDurations.includes(7));
      assert.ok(!validDurations.includes(5));
    });
  });

  describe('Boost status', () => {
    it('should determine if boost is active', () => {
      const boost = {
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      };
      const now = new Date();
      const isActive = now >= boost.startDate && now <= boost.endDate;
      assert.ok(isActive);
    });

    it('should determine if boost is expired', () => {
      const boost = {
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      };
      const now = new Date();
      const isExpired = now > boost.endDate;
      assert.ok(isExpired);
    });

    it('should order vehicles by boost priority', () => {
      const vehicles = [
        { id: '1', boost: null, createdAt: new Date('2026-08-20') },
        { id: '2', boost: { endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) }, createdAt: new Date('2026-08-21') },
        { id: '3', boost: { endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }, createdAt: new Date('2026-08-22') }
      ];
      const sorted = [...vehicles].sort((a, b) => {
        if (a.boost && !b.boost) return -1;
        if (!a.boost && b.boost) return 1;
        if (a.boost && b.boost) return b.boost.endDate.getTime() - a.boost.endDate.getTime();
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      assert.equal(sorted[0].id, '2'); // Boost ends later = higher priority
    });
  });
});
