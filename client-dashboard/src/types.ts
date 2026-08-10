export type UserRole = "customer" | "restaurant_owner" | "admin";
export type UserStatus = "active" | "locked" | "pending_verification";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type OperationStatus = "open" | "temporarily_closed" | "suspended";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type ReviewVisibility = "visible" | "hidden" | "flagged";

export interface ListMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  restaurantCount?: number;
  orderCount?: number;
}

export interface Cuisine {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  restaurantCount?: number;
}

export interface OpeningSlot {
  open: string;
  close: string;
}

export interface OpeningHours {
  dayOfWeek: number;
  isClosed: boolean;
  slots: OpeningSlot[];
}

export interface Restaurant {
  _id: string;
  ownerId: User | string;
  cuisineCategoryIds: Cuisine[];
  name: string;
  slug: string;
  description: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  galleryUrls: string[];
  phone: string;
  address: {
    line1: string;
    ward: string;
    district: string;
    city: string;
    location?: { type: "Point"; coordinates: [number, number] };
  };
  openingHours: OpeningHours[];
  delivery: {
    fee: number;
    minMinutes: number;
    maxMinutes: number;
    maxDistanceKm?: number | null;
  };
  priceRange: "budget" | "mid" | "premium";
  approvalStatus: ApprovalStatus;
  operationStatus: OperationStatus;
  rejectionReason?: string | null;
  ratingSummary: {
    average: number;
    count: number;
    distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  };
  stats: { completedOrderCount: number; totalItemSold: number };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  baseUnitPrice: number;
  selectedOptions: Array<{
    groupName: string;
    optionName: string;
    priceDelta: number;
  }>;
  finalUnitPrice: number;
  lineTotal: number;
  note?: string | null;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  customerSnapshot: { fullName: string; email: string; phone: string };
  restaurantSnapshot: { name: string; phone: string; logoUrl?: string | null; addressText: string };
  recipient: {
    fullName: string;
    phone: string;
    addressText: string;
    ward: string;
    district: string;
    city: string;
    note?: string | null;
  };
  items: OrderItem[];
  couponSnapshot?: { code: string; name: string; discountType: string; discountValue: number } | null;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    discountAmount: number;
    grandTotal: number;
    currency: "VND";
  };
  paymentMethod: "cod" | "vnpay" | "momo" | "stripe" | "mock";
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: Array<{
    from?: string | null;
    to: string;
    changedBy: string;
    changedByRole: UserRole | "system";
    reason?: string | null;
    note?: string | null;
    changedAt: string;
  }>;
  cancellation?: { reason: string; cancelledAt: string } | null;
  placedAt: string;
  createdAt: string;
}

export interface MenuCategory {
  _id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isVisible: boolean;
  itemCount?: number;
}

export interface MenuOption {
  _id?: string;
  name: string;
  priceDelta: number;
  isAvailable: boolean;
}

export interface MenuOptionGroup {
  _id?: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: MenuOption[];
}

export interface MenuItem {
  _id: string;
  restaurantId: string;
  menuCategoryId: MenuCategory | string;
  name: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string;
  ingredients: string[];
  imageUrls: string[];
  basePrice?: number;
  salePrice?: number | null;
  isAvailable: boolean;
  isVisible: boolean;
  soldCount: number;
  optionGroups: MenuOptionGroup[];
  createdAt: string;
}

export interface Review {
  _id: string;
  orderId: string | { _id: string; orderNumber: string };
  customerId: User | string;
  restaurantId: Restaurant | string;
  rating: number;
  content: string;
  imageUrls: string[];
  ownerReply?: { content: string; createdAt: string } | null;
  visibilityStatus: ReviewVisibility;
  createdAt: string;
}

export interface DashboardMetric {
  current: number;
  previous: number;
  changePercent: number | null;
}

export interface OwnerDashboard {
  range: { from: string; to: string };
  metrics: {
    revenue: DashboardMetric;
    orders: DashboardMetric;
    averageOrderValue: DashboardMetric;
    cancellationRate: DashboardMetric;
  };
  attention: { pendingOrders: number; unavailableItems: number; unansweredReviews: number };
  chart: Array<{ date: string; revenue: number; orders: number }>;
  orderStatus: Array<{ status: OrderStatus; count: number }>;
  topItems: Array<{ itemId: string; name: string; quantity: number; revenue: number }>;
  recentOrders: Order[];
}

export interface AdminDashboard {
  range: { from: string; to: string };
  metrics: {
    gmv: DashboardMetric;
    orders: DashboardMetric;
    activeUsers: number;
    approvedRestaurants: number;
  };
  attention: { pendingRestaurants: number; flaggedReviews: number; lockedUsers: number };
  chart: Array<{ date: string; gmv: number; orders: number }>;
  orderStatus: Array<{ status: OrderStatus; count: number }>;
  topRestaurants: Array<{ restaurantId: string; name: string; orders: number; gmv: number; cancellationRate: number }>;
  recentRestaurants: Restaurant[];
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startsAt: string;
  endsAt: string;
  status: "active" | "expired" | "disabled";
  usageCount?: number;
  totalDiscount?: number;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actorId: User | string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}
