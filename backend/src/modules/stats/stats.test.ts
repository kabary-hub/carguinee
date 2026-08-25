import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Period parsing tests ─────────────────────────────────────────────────

function parsePeriod(raw: unknown): '7d' | '30d' | '6m' {
  if (raw === '7d' || raw === '30d' || raw === '6m') return raw;
  return '6m';
}

function sinceDate(period: '7d' | '30d' | '6m'): Date {
  const now = Date.now();
  switch (period) {
    case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case '6m': return new Date(now - 180 * 24 * 60 * 60 * 1000);
  }
}

describe('Stats period parsing', () => {
  it('defaults to 6 months for invalid input', () => {
    assert.equal(parsePeriod(undefined), '6m');
    assert.equal(parsePeriod('1y'), '6m');
    assert.equal(parsePeriod(''), '6m');
  });

  it('accepts 7d', () => {
    assert.equal(parsePeriod('7d'), '7d');
  });

  it('accepts 30d', () => {
    assert.equal(parsePeriod('30d'), '30d');
  });

  it('accepts 6m', () => {
    assert.equal(parsePeriod('6m'), '6m');
  });
});

describe('Stats since date calculation', () => {
  it('7d is approximately 7 days ago', () => {
    const now = Date.now();
    const since = sinceDate('7d');
    const diff = now - since.getTime();
    assert.ok(diff >= 7 * 24 * 60 * 60 * 1000);
    assert.ok(diff < 8 * 24 * 60 * 60 * 1000);
  });

  it('30d is approximately 30 days ago', () => {
    const now = Date.now();
    const since = sinceDate('30d');
    const diff = now - since.getTime();
    assert.ok(diff >= 30 * 24 * 60 * 60 * 1000);
    assert.ok(diff < 31 * 24 * 60 * 60 * 1000);
  });

  it('6m is approximately 180 days ago', () => {
    const now = Date.now();
    const since = sinceDate('6m');
    const diff = now - since.getTime();
    assert.ok(diff >= 180 * 24 * 60 * 60 * 1000);
    assert.ok(diff < 181 * 24 * 60 * 60 * 1000);
  });
});

describe('Occupancy rate calculation', () => {
  function calculateOccupancy(bookedDays: number, totalDays: number): number {
    return Math.min(100, Math.round((bookedDays / totalDays) * 100));
  }

  it('returns 0 for no bookings', () => {
    assert.equal(calculateOccupancy(0, 30), 0);
  });

  it('returns 100 when fully booked', () => {
    assert.equal(calculateOccupancy(30, 30), 100);
  });

  it('caps at 100% when overbooked', () => {
    assert.equal(calculateOccupancy(40, 30), 100);
  });

  it('calculates partial occupancy', () => {
    assert.equal(calculateOccupancy(15, 30), 50);
  });

  it('rounds to nearest integer', () => {
    assert.equal(calculateOccupancy(1, 3), 33);
  });
});
