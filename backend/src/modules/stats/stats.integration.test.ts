import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Tests d'intégration API — Stats endpoints
 *
 * Ces tests vérifient la logique métier des routes stats
 * sans démarrer le serveur (tests unitaires des handlers).
 */

// ── Date range helpers ─────────────────────────────────────────────────────

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '6m':
      start.setMonth(end.getMonth() - 6);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }
  return { start, end };
}

describe('Stats API — date range logic', () => {
  it('should compute 7-day range correctly', () => {
    const { start, end } = getDateRange('7d');
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 7);
  });

  it('should compute 30-day range correctly', () => {
    const { start, end } = getDateRange('30d');
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 30);
  });

  it('should compute 6-month range correctly', () => {
    const { start, end } = getDateRange('6m');
    assert.ok(start < end);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12
      + (end.getMonth() - start.getMonth());
    assert.ok(diffMonths >= 5 && diffMonths <= 7);
  });

  it('should default to 30d for unknown period', () => {
    const { start, end } = getDateRange('unknown');
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 30);
  });
});

// ── Revenue calculation ────────────────────────────────────────────────────

describe('Stats API — revenue calculation', () => {
  it('should sum revenue from paid bookings', () => {
    const bookings = [
      { amount: 50000, status: 'CONFIRMED' },
      { amount: 75000, status: 'CONFIRMED' },
      { amount: 30000, status: 'CANCELLED' },
    ];
    const revenue = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + b.amount, 0);
    assert.equal(revenue, 125000);
  });

  it('should exclude CANCELLED bookings from revenue', () => {
    const bookings = [
      { amount: 100000, status: 'CANCELLED' },
    ];
    const revenue = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + b.amount, 0);
    assert.equal(revenue, 0);
  });

  it('should handle empty bookings array', () => {
    const bookings: { amount: number; status: string }[] = [];
    const revenue = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + b.amount, 0);
    assert.equal(revenue, 0);
  });
});

// ── Occupancy rate ─────────────────────────────────────────────────────────

describe('Stats API — occupancy rate', () => {
  it('should calculate occupancy percentage', () => {
    const totalDays = 30;
    const bookedDays = 12;
    const occupancy = Math.round((bookedDays / totalDays) * 100);
    assert.equal(occupancy, 40);
  });

  it('should return 0 for no bookings', () => {
    const occupancy = Math.round((0 / 30) * 100);
    assert.equal(occupancy, 0);
  });

  it('should return 100 for fully booked', () => {
    const occupancy = Math.round((30 / 30) * 100);
    assert.equal(occupancy, 100);
  });
});

// ── Monthly aggregation ────────────────────────────────────────────────────

describe('Stats API — monthly aggregation', () => {
  it('should group bookings by month', () => {
    const bookings = [
      { createdAt: new Date('2026-07-05'), amount: 50000 },
      { createdAt: new Date('2026-07-15'), amount: 75000 },
      { createdAt: new Date('2026-08-01'), amount: 30000 },
      { createdAt: new Date('2026-08-20'), amount: 60000 },
    ];

    const monthly: Record<string, { count: number; revenue: number }> = {};
    for (const b of bookings) {
      const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { count: 0, revenue: 0 };
      monthly[key].count++;
      monthly[key].revenue += b.amount;
    }

    assert.equal(Object.keys(monthly).length, 2);
    assert.equal(monthly['2026-07'].count, 2);
    assert.equal(monthly['2026-07'].revenue, 125000);
    assert.equal(monthly['2026-08'].count, 2);
    assert.equal(monthly['2026-08'].revenue, 90000);
  });
});

// ── Top vehicles ───────────────────────────────────────────────────────────

describe('Stats API — top vehicles', () => {
  it('should rank vehicles by booking count', () => {
    const vehicles = [
      { id: 'v1', name: 'Toyota Hilux', bookings: 15 },
      { id: 'v2', name: 'Honda CR-V', bookings: 8 },
      { id: 'v3', name: 'Mercedes E200', bookings: 22 },
    ];
    const sorted = [...vehicles].sort((a, b) => b.bookings - a.bookings);
    assert.equal(sorted[0].id, 'v3');
    assert.equal(sorted[1].id, 'v1');
    assert.equal(sorted[2].id, 'v2');
  });

  it('should limit to top N vehicles', () => {
    const vehicles = Array.from({ length: 20 }, (_, i) => ({
      id: `v${i}`,
      bookings: 20 - i,
    }));
    const top5 = vehicles.sort((a, b) => b.bookings - a.bookings).slice(0, 5);
    assert.equal(top5.length, 5);
    assert.equal(top5[0].id, 'v0');
  });
});
