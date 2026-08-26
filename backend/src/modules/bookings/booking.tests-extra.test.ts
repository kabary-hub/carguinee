import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── Booking calculations tests ────────────────────────────────────────────

function rentalDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function rentalTotalPrice(pricePerDay: number, start: string, end: string): number {
  const days = rentalDays(start, end);
  return pricePerDay * days;
}

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions: Record<string, string[]> = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['CANCELLED', 'IN_PROGRESS', 'REJECTED'],
    'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],
    'CANCELLED': [],
    'REJECTED': [],
  };
  return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
}

describe('Booking Calculations', () => {
  describe('rentalDays', () => {
    it('should return 1 for same day rental', () => {
      assert.strictEqual(rentalDays('2024-01-01', '2024-01-01'), 1);
    });

    it('should return 3 for 3-day rental', () => {
      assert.strictEqual(rentalDays('2024-01-01', '2024-01-04'), 3);
    });

    it('should handle reverse dates', () => {
      assert.strictEqual(rentalDays('2024-01-05', '2024-01-01'), 4);
    });

    it('should handle cross-month rental', () => {
      assert.strictEqual(rentalDays('2024-01-30', '2024-02-02'), 3);
    });

    it('should handle leap year', () => {
      assert.strictEqual(rentalDays('2024-02-28', '2024-03-01'), 2);
    });
  });

  describe('rentalTotalPrice', () => {
    it('should calculate price for 1 day', () => {
      assert.strictEqual(rentalTotalPrice(50000, '2024-01-01', '2024-01-02'), 50000);
    });

    it('should calculate price for 7 days', () => {
      assert.strictEqual(rentalTotalPrice(50000, '2024-01-01', '2024-01-08'), 350000);
    });

    it('should calculate price for 0 days (same day = 1 day minimum)', () => {
      assert.strictEqual(rentalTotalPrice(50000, '2024-01-01', '2024-01-01'), 50000);
    });

    it('should handle zero price per day', () => {
      assert.strictEqual(rentalTotalPrice(0, '2024-01-01', '2024-01-05'), 0);
    });

    it('should handle large amounts', () => {
      assert.strictEqual(rentalTotalPrice(500000, '2024-01-01', '2024-01-31'), 15000000);
    });
  });
});

describe('Booking Transitions', () => {
  it('should allow PENDING -> CONFIRMED', () => {
    assert.ok(isValidTransition('PENDING', 'CONFIRMED'));
  });

  it('should allow PENDING -> CANCELLED', () => {
    assert.ok(isValidTransition('PENDING', 'CANCELLED'));
  });

  it('should allow CONFIRMED -> IN_PROGRESS', () => {
    assert.ok(isValidTransition('CONFIRMED', 'IN_PROGRESS'));
  });

  it('should allow CONFIRMED -> REJECTED', () => {
    assert.ok(isValidTransition('CONFIRMED', 'REJECTED'));
  });

  it('should allow IN_PROGRESS -> COMPLETED', () => {
    assert.ok(isValidTransition('IN_PROGRESS', 'COMPLETED'));
  });

  it('should not allow COMPLETED -> anything', () => {
    assert.ok(!isValidTransition('COMPLETED', 'CONFIRMED'));
    assert.ok(!isValidTransition('COMPLETED', 'CANCELLED'));
    assert.ok(!isValidTransition('COMPLETED', 'IN_PROGRESS'));
  });

  it('should not allow CANCELLED -> anything', () => {
    assert.ok(!isValidTransition('CANCELLED', 'CONFIRMED'));
    assert.ok(!isValidTransition('CANCELLED', 'COMPLETED'));
  });

  it('should not allow REJECTED -> anything', () => {
    assert.ok(!isValidTransition('REJECTED', 'CONFIRMED'));
    assert.ok(!isValidTransition('REJECTED', 'COMPLETED'));
  });

  it('should not allow invalid status', () => {
    assert.ok(!isValidTransition('PENDING', 'INVALID'));
    assert.ok(!isValidTransition('INVALID', 'PENDING'));
  });
});

// ── Phone validation tests (used by auth module) ─────────────────────────

function normalizeGuineanPhone(input: string): string {
  const cleaned = input.replace(/[\s\-()\.]/g, '');
  if (cleaned.startsWith('+224')) return cleaned.substring(1);
  if (cleaned.startsWith('00224')) return cleaned.substring(2);
  if (cleaned.startsWith('224')) return cleaned;
  return cleaned;
}

function isValidGuineanPhone(phone: string): boolean {
  const normalized = normalizeGuineanPhone(phone);
  return /^224\d{9}$/.test(normalized);
}

describe('Guinea Phone Validation', () => {
  it('should accept standard format with +', () => {
    assert.ok(isValidGuineanPhone('+224621000001'));
  });

  it('should accept format with 00 prefix', () => {
    assert.ok(isValidGuineanPhone('00224621000001'));
  });

  it('should accept raw 9-digit format', () => {
    assert.ok(isValidGuineanPhone('224621000001'));
  });

  it('should accept phone with spaces', () => {
    assert.ok(isValidGuineanPhone('+224 621 000 001'));
  });

  it('should accept phone with dashes', () => {
    assert.ok(isValidGuineanPhone('+224-621-000-001'));
  });

  it('should reject empty string', () => {
    assert.ok(!isValidGuineanPhone(''));
  });

  it('should reject too short number', () => {
    assert.ok(!isValidGuineanPhone('12345'));
  });

  it('should reject non-numeric', () => {
    assert.ok(!isValidGuineanPhone('abcdefgh'));
  });

  it('should reject wrong country code', () => {
    assert.ok(!isValidGuineanPhone('+3361234567'));
  });
});

// ── Report date range tests ──────────────────────────────────────────────

function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;

  switch (period) {
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
    default:
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
  }

  return { start, end: now };
}

describe('Report Date Ranges', () => {
  it('should return 7 days for 7d', () => {
    const { start, end } = getDateRange('7d');
    const diff = Math.round(new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
    assert.strictEqual(diff, 7);
  });

  it('should return 30 days for 30d', () => {
    const { start, end } = getDateRange('30d');
    const diff = Math.round(new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
    assert.strictEqual(diff, 30);
  });

  it('should default to 90 days', () => {
    const { start, end } = getDateRange('unknown');
    const diff = Math.round(new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
    assert.ok(diff >= 89 && diff <= 91);
  });
});

// ── Translation cache key generation ─────────────────────────────────────

function translationCacheKey(text: string, targetLang: string): string {
  return `tr:${targetLang}:${text.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 100)}`;
}

describe('Translation cache keys', () => {
  it('includes target language', () => {
    const key = translationCacheKey('Hello World', 'fr');
    assert.ok(key.includes('fr'));
  });

  it('normalizes whitespace', () => {
    const key1 = translationCacheKey('Hello World', 'fr');
    const key2 = translationCacheKey('  Hello   World  ', 'fr');
    assert.strictEqual(key1, key2);
  });

  it('truncates long text', () => {
    const longText = 'a'.repeat(200);
    const key = translationCacheKey(longText, 'en');
    assert.ok(key.length < 120);
  });
});
