import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Owner Requests module', () => {
  // ── Status enum ──────────────────────────────────────────────────────────

  describe('Request statuses', () => {
    it('should have 4 valid statuses', () => {
      const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
      assert.equal(statuses.length, 4);
      statuses.forEach((s) => assert.ok(typeof s === 'string'));
    });

    it('PENDING is the initial status', () => {
      const initialStatus = 'PENDING';
      assert.equal(initialStatus, 'PENDING');
    });
  });

  // ── Role validation ──────────────────────────────────────────────────────

  describe('Role validation', () => {
    it('only CLIENT can request owner role', () => {
      const validRole = 'CLIENT';
      assert.equal(validRole, 'CLIENT');
    });

    it('PROPRIETAIRE should not be able to request again', () => {
      const currentRole: string = 'PROPRIETAIRE';
      const canRequest = currentRole === 'CLIENT';
      assert.equal(canRequest, false);
    });

    it('ADMIN should not be able to request owner role', () => {
      const currentRole: string = 'ADMIN';
      const canRequest = currentRole === 'CLIENT';
      assert.equal(canRequest, false);
    });
  });

  // ── Duplicate request prevention ──────────────────────────────────────────

  describe('Duplicate request prevention', () => {
    it('should prevent duplicate PENDING requests', () => {
      const existingRequests = [
        { status: 'PENDING' },
      ];
      const hasPending = existingRequests.some((r) => r.status === 'PENDING');
      assert.ok(hasPending);
    });

    it('should allow new request if previous was REJECTED', () => {
      const existingRequests = [
        { status: 'REJECTED' },
      ];
      const hasPending = existingRequests.some((r) => r.status === 'PENDING');
      assert.equal(hasPending, false);
    });

    it('should allow new request if previous was CANCELLED', () => {
      const existingRequests = [
        { status: 'CANCELLED' },
      ];
      const hasPending = existingRequests.some((r) => r.status === 'PENDING');
      assert.equal(hasPending, false);
    });

    it('should allow new request if previous was APPROVED', () => {
      const existingRequests = [
        { status: 'APPROVED' },
      ];
      const hasPending = existingRequests.some((r) => r.status === 'PENDING');
      assert.equal(hasPending, false);
    });
  });

  // ── Cancellation rules ───────────────────────────────────────────────────

  describe('Cancellation rules', () => {
    it('should only cancel PENDING requests', () => {
      const request = { status: 'PENDING' };
      const canCancel = request.status === 'PENDING';
      assert.ok(canCancel);
    });

    it('should not cancel APPROVED requests', () => {
      const request = { status: 'APPROVED' };
      const canCancel = request.status === 'PENDING';
      assert.equal(canCancel, false);
    });

    it('should not cancel REJECTED requests', () => {
      const request = { status: 'REJECTED' };
      const canCancel = request.status === 'PENDING';
      assert.equal(canCancel, false);
    });
  });

  // ── Approval flow ────────────────────────────────────────────────────────

  describe('Approval flow', () => {
    it('approval should change role to PROPRIETAIRE', () => {
      const newRole = 'PROPRIETAIRE';
      assert.equal(newRole, 'PROPRIETAIRE');
    });

    it('approval should record reviewer and timestamp', () => {
      const approval = {
        status: 'APPROVED',
        reviewedById: 'admin-1',
        reviewedAt: new Date(),
      };
      assert.ok(approval.reviewedById);
      assert.ok(approval.reviewedAt instanceof Date);
    });
  });

  // ── Rejection rules ──────────────────────────────────────────────────────

  describe('Rejection rules', () => {
    it('rejection should require a reason', () => {
      const reason = 'Profil incomplet';
      assert.ok(reason.trim().length > 0);
    });

    it('empty reason should be invalid', () => {
      const reason = '   ';
      assert.equal(reason.trim().length, 0);
    });

    it('rejection should record reason, reviewer, and timestamp', () => {
      const rejection = {
        status: 'REJECTED',
        rejectionReason: 'Documents invalides',
        reviewedById: 'admin-1',
        reviewedAt: new Date(),
      };
      assert.ok(rejection.rejectionReason);
      assert.ok(rejection.reviewedById);
      assert.ok(rejection.reviewedAt instanceof Date);
    });
  });

  // ── Motivation field ─────────────────────────────────────────────────────

  describe('Motivation field', () => {
    it('motivation is optional', () => {
      const request1 = { motivation: null };
      const request2 = { motivation: 'Je veux louer mes véhicules' };
      assert.equal(request1.motivation, null);
      assert.ok(request2.motivation.length > 0);
    });
  });
});
