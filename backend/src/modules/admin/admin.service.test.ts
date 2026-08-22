import assert from "node:assert/strict";
import { test } from "node:test";
import { getAdminStats, type StatsPrismaClient } from "./admin.service.js";

function fakeClient(): StatsPrismaClient {
  return {
    vehicle: {
      count: async (args) => {
        if (args?.where?.publicationStatus === "EN_ATTENTE_VALIDATION") return 3;
        return 12;
      },
      groupBy: async () => [
        { publicationStatus: "PUBLIEE", _count: { _all: 6 } },
        { publicationStatus: "EN_ATTENTE_VALIDATION", _count: { _all: 3 } },
        { publicationStatus: "BROUILLON", _count: { _all: 3 } },
      ],
    },
    user: {
      count: async () => 40,
      groupBy: async () => [
        { role: "CLIENT", _count: { _all: 30 } },
        { role: "PROPRIETAIRE", _count: { _all: 8 } },
        { role: "ADMIN", _count: { _all: 2 } },
      ],
    },
    rentalBooking: {
      groupBy: async () => [
        { status: "EN_ATTENTE", _count: { _all: 5 } },
        { status: "CONFIRMEE", _count: { _all: 4 } },
        { status: "ANNULEE", _count: { _all: 2 } },
      ],
    },
  };
}

test("agrège les statistiques d'administration sans données fictives", async () => {
  const stats = await getAdminStats(fakeClient());

  assert.equal(stats.totalVehicles, 12);
  assert.equal(stats.pendingVehicles, 3);
  assert.equal(stats.totalUsers, 40);
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
