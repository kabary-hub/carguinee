// Mock responses for all API endpoints used by page components
export const mockApiResponses: Record<string, unknown> = {
  "/api/vehicles": {
    status: "ok",
    data: {
      items: [
        {
          id: "v1", brand: "Toyota", model: "Corolla", type: "BERLINE",
          condition: "BON", commune: "KALOUM", quartier: "Dixinn", secteur: "Centre",
          supportsRental: true, supportsSale: false,
          dailyRentalPriceGnf: 200000, publicationStatus: "PUBLIEE",
          photos: [{ id: "p1", url: "/demo-vehicles/toyota.jpg", sortOrder: 0 }],
          owner: { id: "o1", firstName: "Amadou", lastName: "Diallo" },
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    },
  },
  "/api/admin/stats": {
    status: "ok",
    data: {
      totalUsers: 100, totalVehicles: 50, totalBookings: 200,
      pendingValidation: 5, pendingReports: 3,
      revenue: { total: 5000000, monthly: 500000 },
      recentBookings: [], recentUsers: [],
    },
  },
  "/api/admin/users": {
    status: "ok",
    data: {
      items: [{ id: "u1", phone: "+22412345678", firstName: "Test", lastName: "User", role: "CLIENT", isActive: true, isBanned: false, createdAt: "2024-01-01" }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    },
  },
  "/api/admin/bookings": {
    status: "ok",
    data: {
      items: [{ id: "b1", startDate: "2024-06-15", endDate: "2024-06-20", dailyRateGnf: 200000, totalAmountGnf: 1000000, depositAmountGnf: 200000, depositStatus: "HELD", status: "CONFIRMEE", vehicle: { id: "v1", brand: "Toyota", model: "Corolla", type: "BERLINE", commune: "KALOUM" } }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    },
  },
  "/api/admin/moderation": {
    status: "ok",
    data: {
      items: [{ id: "m1", phone: "+22412345678", firstName: "Banned", lastName: "User", role: "CLIENT", isActive: false, isBanned: true, createdAt: "2024-01-01" }],
      pagination: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    },
  },
  "/api/admin/reactivation-requests": {
    status: "ok",
    data: {
      items: [{ id: "r1", userId: "u1", phone: "+22412345678", firstName: "Test", lastName: "User", status: "PENDING", createdAt: "2024-01-01", updatedAt: "2024-01-01" }],
      pagination: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    },
  },
  "/api/admin/reviews": {
    status: "ok",
    data: {
      items: [{ id: "rev1", rating: 5, comment: "Super vehicle", reviewer: { firstName: "Test", lastName: "User" }, vehicle: { brand: "Toyota", model: "Corolla" }, createdAt: "2024-01-01" }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    },
  },
  "/api/admin/favorites": {
    status: "ok",
    data: { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
  },
  "/api/messages/admin/conversations": {
    status: "ok",
    data: { items: [] },
  },
  "/api/favorites": {
    status: "ok",
    data: { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
  },
  "/api/notifications": {
    status: "ok",
    data: { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
  },
  "/api/bookings/mine": {
    status: "ok",
    data: [],
  },
  "/api/reviews/vehicle/": {
    status: "ok",
    data: { items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } },
  },
  "/api/owner/stats": {
    status: "ok",
    data: { totalVehicles: 5, totalBookings: 10, totalRevenue: 2000000, averageRating: 4.5 },
  },
  "/api/owner/vehicles": {
    status: "ok",
    data: { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
  },
  "/api/messages/conversations": {
    status: "ok",
    data: { items: [] },
  },
};

// Default response for unknown endpoints
const defaultResponse = { status: "ok", data: {} };

/**
 * Setup mock for global fetch that routes to mockApiResponses.
 * Call this in beforeEach, restore in afterEach.
 */
export function setupFetchMock() {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = vi.fn().mockImplementation(async (url: string | Request, _init?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    // Find matching response — sort by longest key first for best match
    const sorted = Object.entries(mockApiResponses).sort((a, b) => b[0].length - a[0].length);
    for (const [key, value] of sorted) {
      if (urlStr.includes(key)) {
        return { ok: true, json: () => Promise.resolve(value) };
      }
    }
    // Fallback: return ok with empty data
    return { ok: true, json: () => Promise.resolve(defaultResponse) };
  });

  return () => {
    globalThis.fetch = originalFetch;
  };
}
