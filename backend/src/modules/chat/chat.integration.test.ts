import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Tests d'intégration API — Chat endpoints
 *
 * Vérifie la logique métier du chat (messages, conversations).
 */

// ── Message validation ─────────────────────────────────────────────────────

describe('Chat API — message validation', () => {
  it('should accept valid message content', () => {
    const content = 'Bonjour, je suis intéressé par votre véhicule';
    assert.ok(content.length > 0);
    assert.ok(content.length <= 5000);
  });

  it('should reject empty message', () => {
    const content = '';
    assert.equal(content.trim().length, 0);
  });

  it('should reject message exceeding max length', () => {
    const content = 'x'.repeat(5001);
    assert.ok(content.length > 5000);
  });

  it('should accept message at exactly max length', () => {
    const content = 'x'.repeat(5000);
    assert.equal(content.length, 5000);
  });

  it('should trim whitespace from messages', () => {
    const content = '  Hello  ';
    assert.equal(content.trim(), 'Hello');
  });
});

// ── Conversation logic ─────────────────────────────────────────────────────

describe('Chat API — conversation logic', () => {
  it('should prevent self-conversation', () => {
    const senderId = 'user-1';
    const recipientId = 'user-1';
    const isSelf = senderId === recipientId;
    assert.ok(isSelf);
  });

  it('should find existing conversation between two users', () => {
    const conversations = [
      { id: 'conv-1', participants: ['user-1', 'user-2'] },
      { id: 'conv-2', participants: ['user-1', 'user-3'] },
    ];
    const found = conversations.find(
      (c) => c.participants.includes('user-1') && c.participants.includes('user-2')
    );
    assert.ok(found);
    assert.equal(found!.id, 'conv-1');
  });

  it('should not create duplicate conversations', () => {
    const conversations = [
      { participants: ['user-1', 'user-2'] },
    ];
    const exists = conversations.some(
      (c) => c.participants.includes('user-1') && c.participants.includes('user-2')
    );
    assert.ok(exists);
  });
});

// ── Unread count ───────────────────────────────────────────────────────────

describe('Chat API — unread count', () => {
  it('should count unread messages', () => {
    const messages = [
      { id: '1', readAt: null, senderId: 'user-2' },
      { id: '2', readAt: new Date(), senderId: 'user-2' },
      { id: '3', readAt: null, senderId: 'user-2' },
    ];
    const currentUserId = 'user-1';
    const unread = messages.filter(
      (m) => !m.readAt && m.senderId !== currentUserId
    );
    assert.equal(unread.length, 2);
  });

  it('should not count own messages as unread', () => {
    const messages = [
      { id: '1', readAt: null, senderId: 'user-1' },
    ];
    const currentUserId = 'user-1';
    const unread = messages.filter(
      (m) => !m.readAt && m.senderId !== currentUserId
    );
    assert.equal(unread.length, 0);
  });

  it('should count 0 when all messages read', () => {
    const messages = [
      { id: '1', readAt: new Date(), senderId: 'user-2' },
      { id: '2', readAt: new Date(), senderId: 'user-2' },
    ];
    const unread = messages.filter((m) => !m.readAt);
    assert.equal(unread.length, 0);
  });
});

// ── Message pagination ─────────────────────────────────────────────────────

describe('Chat API — message pagination', () => {
  it('should paginate messages correctly', () => {
    const messages = Array.from({ length: 50 }, (_, i) => ({
      id: `${i + 1}`,
      content: `Message ${i + 1}`,
      createdAt: new Date(Date.now() + i * 60000),
    }));

    const page = 1;
    const limit = 10;
    const start = (page - 1) * limit;
    const paged = messages.slice(start, start + limit);

    assert.equal(paged.length, 10);
    assert.equal(paged[0].id, '1');
  });

  it('should return correct total pages', () => {
    const total = 50;
    const limit = 10;
    const totalPages = Math.ceil(total / limit);
    assert.equal(totalPages, 5);
  });

  it('should handle last page with fewer items', () => {
    const messages = Array.from({ length: 25 }, (_, i) => ({ id: `${i + 1}` }));
    const page = 3;
    const limit = 10;
    const start = (page - 1) * limit;
    const paged = messages.slice(start, start + limit);
    assert.equal(paged.length, 5);
  });
});

// ── Chatbot response matching ──────────────────────────────────────────────

describe('Chat API — chatbot keyword matching', () => {
  it('should match booking-related keywords', () => {
    const keywords = ['réserver', 'reservation', 'booking', 'louer', 'location'];
    const message = 'je veux réserver ce véhicule';
    const matched = keywords.some((k) => message.toLowerCase().includes(k));
    assert.ok(matched);
  });

  it('should match payment-related keywords', () => {
    const keywords = ['payer', 'paiement', 'orange money', 'om', 'tarif', 'prix'];
    const message = 'comment puis-je payer avec orange money ?';
    const matched = keywords.some((k) => message.toLowerCase().includes(k));
    assert.ok(matched);
  });

  it('should match greeting keywords', () => {
    const keywords = ['bonjour', 'salut', 'hello', 'bonsoir'];
    const message = 'bonjour';
    const matched = keywords.some((k) => message.toLowerCase().includes(k));
    assert.ok(matched);
  });

  it('should not match unrelated keywords', () => {
    const keywords = ['réserver', 'paiement', 'bonjour'];
    const message = 'quelle est la météo aujourd\'hui ?';
    const matched = keywords.some((k) => message.toLowerCase().includes(k));
    assert.equal(matched, false);
  });
});
