/**
 * Types partagés pour les sous-composants AdminDashboard
 */

export type AdminStats = {
  totalVehicles: number;
  pendingVehicles: number;
  totalUsers: number;
  vehiclesByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
  bookingsByStatus: Record<string, number>;
  totalBookings?: number;
  totalRevenue?: number;
  activeVehicles?: number;
  verifiedUsers?: number;
  totalFavorites?: number;
  totalReviews?: number;
  pendingReports?: number;
  topVehicles?: { vehicleId: string; _count: { _all: number } }[];
};

export type AdminUser = {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { vehicles: number; rentalBookings: number };
};

export type OwnerRequest = {
  id: string;
  motivation?: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; phone: string; email?: string | null };
};

export type PendingAction = {
  type: "vehicle-approve" | "vehicle-reject" | "owner-approve" | "owner-reject";
  id: string;
};

export type ReportItem = {
  id: string;
  reason: string;
  description?: string | null;
  targetType: string;
  targetId: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  reporter: { id: string; firstName: string; lastName: string; phone?: string };
};
