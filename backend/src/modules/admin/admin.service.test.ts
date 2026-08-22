import assert from "node:assert/strict";
import { test } from "node:test";
import { getAdminStats, type StatsPrismaClient } from "./admin.service.js";

function fakeClient(): StatsPrismaClient {
  return {
    vehicle: {
      count: async (args) => {
        if (args?.where?.publicationStatus === "EN_ATTENTE_VALIDATION") return 3;
        if (args?.where?.publicationStatus === "PUBLIEE") return 10;
        return 12;
      },
      groupBy: async () => [
        { publicationStatus: "PUBLIEE", _count: { _all: 6 } },
        { publicationStatus: "EN_ATTENTE_VALIDATION", _count: { _all: 3 } },
        { publicationStatus: "BROUILLON", _count: { _all: 3 } },
      ],
    },
    user: {
      count: async (args) => {
        if (args?.where?.identityVerified) return 15;
        return 40;
      },
      groupBy: async () => [
        { role: "CLIENT", _count: { _all: 30 } },
        { role: "PROPRIETAIRE", _count: { _all: 8 } },
        { role: "ADMIN", _count: { _all: 2 } },
      ],
    },
    rentalBooking: {
      count: async () => 25,
      findMany: async () => [
        { totalAmountGnf: 500000 },
        { totalAmountGnf: 300000 },
      ],
      groupBy: async (args) => {
        if (args.by.includes("vehicleId")) {
          return [
            { vehicleId: "v1", _count: { _all: 10 } },
            { vehicleId: "v2", _count: { _all: 7 } },
          ];
        }
        return [
          { status: "EN_ATTENTE", _count: { _all: 5 } },
          { status: "CONFIRMEE", _count: { _all: 4 } },
          { status: "ANNULEE", _count: { _all: 2 } },
        ];
      },
    },
    favorite: { count: async () => 120 },
    review: { count: async () => 45 },
    report: { count: async () => 3 },
  };
}

test("agrège les statistiques d'administration sans données fictives", async () => {
  const stats = await getAdminStats(fakeClient());

  assert.equal(stats.totalVehicles, 12);
  assert.equal(stats.pendingVehicles, 3);
  assert.equal(stats.totalUsers, 40);
  assert.equal(stats.totalBookings, 25);
  assert.equal(stats.totalRevenue, 800000);
  assert.equal(stats.activeVehicles, 10);
  assert.equal(stats.verifiedUsers, 15);
  assert.equal(stats.totalFavorites, 120);
  assert.equal(stats.totalReviews, 45);
  assert.equal(stats.pendingReports, 3);
  assert.deepEqual(stats.vehiclesByStatus, {
    PUBLIEE: 6,
    EN_ATTENTE_VALIDATION: 3,
    BROUILLON: 3,
  });
  assert.deepEqual(stats.usersByRole, {
    CLIENT: 30,
    PROPRIETAIRE: 8,
    ADMIN: 2,
  });
  assert.deepEqual(stats.bookingsByStatus, {
    EN_ATTENTE: 5,
    CONFIRMEE: 4,
    ANNULEE: 2,
  });
});
