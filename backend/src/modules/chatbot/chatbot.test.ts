import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Test the regex patterns used for direct replies ────────────────────────

const PATTERNS = [
  { name: 'greeting', pattern: /(bonjour|salut|hello|coucou|hey|bonsoir|good morning|good evening)/i, lang: 'fr', en: 'Hello! 👋 How can I help you?' },
  { name: 'thanks', pattern: /(merci|thanks|thank you|remercie|super merci)/i, lang: 'fr', en: 'You are welcome!' },
  { name: 'goodbye', pattern: /(au revoir|bye|a bientot|goodbye|see you|ciao)/i, lang: 'fr', en: 'Goodbye! 👋 Have a great day!' },
  { name: 'cancel', pattern: /(annul|cancel|rembour|refund)/i, lang: 'fr', en: 'To cancel a booking...' },
  { name: 'price', pattern: /(prix|tarif|price|rate|cout|co.t|combien|cher)/i, lang: 'fr', en: 'Prices are set by the owner...' },
  { name: 'pay', pattern: /(paye|paiement|orange.?money|payer|regler|transaction)/i, lang: 'fr', en: 'Orange Money payment:' },
  { name: 'account', pattern: /(inscri|compte|register|account|sign.?up|creer.*compte)/i, lang: 'fr', en: 'To create an account:' },
  { name: 'owner', pattern: /(propri.taire|owner|devenir.*propri|louer.*voiture.*cot)/i, lang: 'fr', en: 'To become an owner:' },
  { name: 'booking', pattern: /(r.serv|book|location|louer|prendre.*vehicule)/i, lang: 'fr', en: 'To book a vehicle:' },
];

function matchPattern(text: string): typeof PATTERNS[0] | undefined {
  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return PATTERNS.find(p => p.pattern.test(normalized));
}

describe('Chatbot pattern matching', () => {
  describe('Greetings', () => {
    const cases = [
      'bonjour',
      'salut',
      'hello',
      'coucou',
      'hey',
      'bonsoir',
      'Bonjour!',
      'SALUT comment ca va',
    ];

    cases.forEach(text => {
      it(`matches greeting: "${text}"`, () => {
        const result = matchPattern(text);
        assert.ok(result, `Expected match for "${text}"`);
        assert.equal(result!.lang, 'fr');
      });
    });
  });

  describe('Thanks', () => {
    const cases = ['merci', 'thanks', 'thank you', 'MERCI BEAUCOUP'];

    cases.forEach(text => {
      it(`matches thanks: "${text}"`, () => {
        const match = matchPattern(text);
        assert.ok(match);
        assert.equal(match!.name, 'thanks');
      });
    });
  });

  describe('Cancellation', () => {
    const cases = [
      'annuler reservation',
      'cancel booking',
      'je veux annuler',
    ];

    cases.forEach(text => {
      it(`matches cancellation: "${text}"`, () => {
        const match = matchPattern(text);
        assert.ok(match, `Expected match for "${text}"`);
        assert.equal(match!.name, 'cancel');
      });
    });
  });

  describe('Booking', () => {
    const cases = [
      'je veux reserver une voiture',
      'comment book a car',
      'prendre une voiture',
      'comment louer une voiture',
    ];

    cases.forEach(text => {
      it(`matches booking: "${text}"`, () => {
        const match = matchPattern(text);
        assert.ok(match, `Expected match for "${text}"`);
        assert.equal(match!.name, 'booking');
      });
    });
  });

  describe('Price', () => {
    const cases = [
      'combien coute la location',
      'quel est le prix',
      'tarif journalier',
    ];

    cases.forEach(text => {
      it(`matches price: "${text}"`, () => {
        const match = matchPattern(text);
        assert.ok(match, `Expected match for "${text}"`);
        assert.equal(match!.name, 'price');
      });
    });
  });

  describe('Payment', () => {
    const cases = [
      'comment payer',
      'payer avec orange money',
      'je veux payer',
    ];

    cases.forEach(text => {
      it(`matches payment: "${text}"`, () => {
        const match = matchPattern(text);
        assert.ok(match, `Expected match for "${text}"`);
        assert.equal(match!.name, 'pay');
      });
    });
  });

  describe('No match for gibberish', () => {
    const gibberish = [
      'asjdhjkashd',
      'xnmwcvqlk',
      'Random text 12345',
    ];

    gibberish.forEach(text => {
      it(`returns undefined for "${text}"`, () => {
        const match = matchPattern(text);
        assert.equal(match, undefined);
      });
    });
  });
});

// ── Language detection tests ──────────────────────────────────────────────

describe('Language detection from i18n', () => {
  function detectLang(lang: string): 'fr' | 'en' {
    if (lang === 'fr' || lang.startsWith('fr-')) return 'fr';
    return 'en';
  }

  it('detects French from "fr"', () => {
    assert.equal(detectLang('fr'), 'fr');
  });

  it('detects French from locale "fr-FR"', () => {
    assert.equal(detectLang('fr-FR'), 'fr');
  });

  it('defaults to English for other languages', () => {
    assert.equal(detectLang('en'), 'en');
    assert.equal(detectLang('en-US'), 'en');
    assert.equal(detectLang('de'), 'en');
  });
});

// ── FAQ scoring ──────────────────────────────────────────────────────────

describe('FAQ scoring algorithm', () => {
  function scoreMatch(query: string, keywords: string[]): number {
    const normalized = query.toLowerCase().trim();
    const words = normalized.split(' ');
    const matchingWords = words.filter(w => w.length > 2 && keywords.some(kw => kw.includes(w)));
    return matchingWords.length / words.length;
  }

  it('scores exact match highly', () => {
    const score = scoreMatch('comment creer un compte', ['compte', 'creer', 'inscription']);
    assert.ok(score > 0.3, 'Expected score > 0.3 for good match');
  });

  it('scores partial match moderately', () => {
    const score = scoreMatch('compte', ['compte', 'inscription', 'profil']);
    assert.ok(score >= 1.0, 'Expected full score for exact keyword match');
  });

  it('scores unrelated terms lowly', () => {
    const score = scoreMatch('bonjour', ['compte', 'reservation']);
    assert.ok(score < 0.5, 'Expected low score for unrelated terms');
  });
});
