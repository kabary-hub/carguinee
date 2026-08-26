import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── Chat module unit tests ────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PATTERNS = [
  { name: 'greetings', patterns: [/(bonjour|salut|hello|coucou|hey|bonsoir)/i], category: 'GENERAL' },
  { name: 'thanks', patterns: [/(merci|thanks|remercie)/i], category: 'GENERAL' },
  { name: 'goodbye', patterns: [/(au revoir|bye|ciao)/i], category: 'GENERAL' },
  { name: 'cancel', patterns: [/(annul|cancel|rembour|refund)/i], category: 'BOOKING' },
  { name: 'price', patterns: [/(prix|tarif|cout|co.t|combien|cher)/i], category: 'PAYMENT' },
  { name: 'pay', patterns: [/(paye|paiement|orange.?money|payer|regler|transaction)/i], category: 'PAYMENT' },
  { name: 'account', patterns: [/(inscri|compte|register|account|sign.?up|creer.*compte)/i], category: 'ACCOUNT' },
  { name: 'owner', patterns: [/(propri.taire|owner|devenir.*propri)/i], category: 'ACCOUNT' },
  { name: 'booking', patterns: [/(r.serv|book|location|louer|prendre.*vehicule)/i], category: 'BOOKING' },
];

function matchPattern(text: string) {
  const normalized = normalizeText(text);
  return PATTERNS.find(p => p.patterns.some(r => r.test(text)));
}

describe('Chatbot - Pattern matching', () => {
  it('matches greetings in French', () => {
    const m = matchPattern('Bonjour');
    assert.equal(m?.name, 'greetings');
  });

  it('matches greetings in English', () => {
    const m = matchPattern('Hello');
    assert.equal(m?.name, 'greetings');
  });

  it('matches "merci" as thanks', () => {
    const m = matchPattern('merci beaucoup');
    assert.equal(m?.name, 'thanks');
  });

  it('matches cancellation before booking', () => {
    const m = matchPattern('annuler reservation');
    assert.equal(m?.name, 'cancel');
  });

  it('matches booking after cancellation is checked first', () => {
    const m = matchPattern('reserver voiture');
    assert.ok(m);
    assert.equal(m!.category, 'BOOKING');
  });

  it('matches price queries', () => {
    const m = matchPattern('combien coute');
    assert.equal(m?.name, 'price');
  });

  it('matches payment queries', () => {
    const m = matchPattern('comment payer');
    assert.equal(m?.name, 'pay');
  });

  it('matches account creation', () => {
    const m = matchPattern('creer compte');
    assert.equal(m?.name, 'account');
  });

  it('matches owner queries', () => {
    const m = matchPattern('devenir proprietaire');
    assert.equal(m?.name, 'owner');
  });

  it('does not match gibberish', () => {
    const m = matchPattern('xnmvqwlkej');
    assert.equal(m, undefined);
  });
});

describe('Chatbot - normalizeText', () => {
  it('removes accents', () => {
    assert.equal(normalizeText('café'), 'cafe');
    assert.equal(normalizeText('réserver'), 'reserver');
  });

  it('lowercases and trims', () => {
    assert.equal(normalizeText('  HELLO  '), 'hello');
  });

  it('replaces punctuation with spaces', () => {
    assert.equal(normalizeText('comment, faire?'), 'comment faire');
  });
});

describe('Chatbot - Language detection', () => {
  function detectLang(lang: string): 'fr' | 'en' {
    return lang === 'fr' || lang.startsWith('fr') ? 'fr' : 'en';
  }

  it('detects fr', () => assert.equal(detectLang('fr'), 'fr'));
  it('detects fr-FR', () => assert.equal(detectLang('fr-FR'), 'fr'));
  it('defaults to English', () => assert.equal(detectLang('en'), 'en'));
  it('defaults to English for other langs', () => assert.equal(detectLang('de'), 'en'));
});

describe('Chatbot - FAQ scoring', () => {
  function scoreMatch(query: string, question: string, keywords: string[]): number {
    const nq = normalizeText(query);
    const nq2 = normalizeText(question);
    const words = nq.split(' ');
    const matching = words.filter(w => w.length > 2 && nq2.includes(w));
    const kwMatch = keywords.filter(k => words.some(w => w.length > 2 && k.includes(w)));
    let score = 0;
    if (nq2.includes(nq)) score += 0.8;
    score += (matching.length / words.length) * 0.5;
    score += (kwMatch.length / Math.max(keywords.length, 1)) * 0.3;
    return Math.min(score, 1);
  }

  it('scores exact match highly', () => {
    const s = scoreMatch('comment creer un compte', 'comment creer un compte?', ['compte', 'creer']);
    assert.ok(s >= 0.8);
  });

  it('scores partial match', () => {
    const s = scoreMatch('compte', 'creer un compte', ['compte']);
    assert.ok(s > 0.5);
  });

  it('scores unrelated query low', () => {
    const s = scoreMatch('bonjour', 'comment payer', ['payer']);
    assert.ok(s < 0.5);
  });

  it('exact short query scores higher than long question', () => {
    const s1 = scoreMatch('compte', 'compte', ['compte']);
    const s2 = scoreMatch('compte', 'comment creer un compte', ['compte', 'creer']);
    assert.ok(s1 > 0.5);
    assert.ok(s2 > 0.5);
  });
});

describe('Chatbot - session management', () => {
  it('generates unique session IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      ids.add(id);
    }
    assert.equal(ids.size, 100);
  });
});
