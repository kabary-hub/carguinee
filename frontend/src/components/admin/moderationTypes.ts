export type ReactivationRequest = {
  id: string;
  userId: string;
  phone: string;
  firstName: string;
  lastName: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    phone: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    isBanned: boolean;
    createdAt: string;
  };
  reviewedBy: { firstName: string; lastName: string } | null;
};

export type ModerationUser = {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  _count: { vehicles: number; rentalBookings: number };
};
