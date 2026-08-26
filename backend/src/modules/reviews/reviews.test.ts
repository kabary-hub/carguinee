import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Review validation tests ──────────────────────────────────────────────

describe('Review validation', () => {
  const MIN_RATING = 1;
  const MAX_RATING = 5;
  const MAX_COMMENT_LENGTH = 1000;

  function isValidRating(rating: number): boolean {
    return Number.isInteger(rating) && rating >= MIN_RATING && rating <= MAX_RATING;
  }

  function isValidComment(comment: string): boolean {
    return typeof comment === 'string' && comment.length <= MAX_COMMENT_LENGTH;
  }

  it('accepts valid rating 1', () => assert.ok(isValidRating(1)));
  it('accepts valid rating 5', () => assert.ok(isValidRating(5)));
  it('rejects rating 0', () => assert.ok(!isValidRating(0)));
  it('rejects rating 6', () => assert.ok(!isValidRating(6)));
  it('rejects decimal rating', () => assert.ok(!isValidRating(3.5)));

  it('accepts valid comment', () => assert.ok(isValidComment('Great car!')));
  it('allows empty comment (optional field)', () => assert.ok(isValidComment('')));
  it('accepts max length comment', () => assert.ok(isValidComment('a'.repeat(1000))));
  it('rejects over length comment', () => assert.ok(!isValidComment('a'.repeat(1001))));
});

describe('Review data structure', () => {
  const mockReview = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    vehicleId: '550e8400-e29b-41d4-a716-446655440001',
    customerId: '550e8400-e29b-41d4-a716-446655440002',
    rating: 5,
    comment: 'Excellent vehicle, highly recommended!',
    createdAt: new Date('2024-01-15'),
  };

  it('has all required fields', () => {
    assert.ok(mockReview.id);
    assert.ok(mockReview.vehicleId);
    assert.ok(mockReview.customerId);
    assert.ok(typeof mockReview.rating === 'number');
  });

  it('rating is within bounds', () => {
    assert.ok(mockReview.rating >= 1 && mockReview.rating <= 5);
  });
});

describe('Review rating statistics', () => {
  function calculateAverageRating(reviews: { rating: number }[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  it('calculates average correctly', () => {
    const reviews = [
      { rating: 5 },
      { rating: 4 },
      { rating: 3 },
    ];
    assert.strictEqual(calculateAverageRating(reviews), 4);
  });

  it('returns 0 for empty array', () => {
    assert.strictEqual(calculateAverageRating([]), 0);
  });

  it('returns exact value for single review', () => {
    assert.strictEqual(calculateAverageRating([{ rating: 3 }]), 3);
  });

  it('rounds to one decimal', () => {
    const reviews = [{ rating: 1 }, { rating: 1 }, { rating: 1 }, { rating: 2 }];
    assert.strictEqual(calculateAverageRating(reviews), 1.3);
  });
});

describe('Review filtering', () => {
  const reviews = [
    { id: '1', rating: 5, vehicleId: 'v1' },
    { id: '2', rating: 3, vehicleId: 'v1' },
    { id: '3', rating: 5, vehicleId: 'v2' },
    { id: '4', rating: 2, vehicleId: 'v1' },
  ];

  it('filters by vehicle ID', () => {
    const filtered = reviews.filter(r => r.vehicleId === 'v1');
    assert.equal(filtered.length, 3);
  });

  it('filters by minimum rating', () => {
    const filtered = reviews.filter(r => r.rating >= 4);
    assert.equal(filtered.length, 2);
  });

  it('sorts by rating descending', () => {
    const sorted = [...reviews].sort((a, b) => b.rating - a.rating);
    assert.ok(sorted[0].rating >= sorted[1].rating);
  });
});
