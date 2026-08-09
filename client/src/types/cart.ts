export interface CartMenuItem {
    _id: string;
    name: string;
    imageUrl?: string;
}

export interface CartItem {
    _id: string;
    menuItemId: CartMenuItem;
    quantity: number;
    price: number;
}

export interface CartRestaurantInfo {
    _id: string;
    name: string;
    slug: string;
    address: {
        line1: string;
        ward: string;
        district: string;
        city: string;
    };
    delivery: {
        fee: number;
    };
}

export interface CartCoupon {
    _id: string;
    code: string;
}

export interface Cart {
    _id: string;
    userId: string;
    restaurantId: CartRestaurantInfo;
    items: CartItem[];
    subtotal: number;
    discountAmount: number;
    grandTotal: number;
    couponId?: CartCoupon | null;
}

// API Payloads
export interface AddToCartPayload {
    menuItemId: string;
    quantity: number;
    restaurantId: string;
    replace?: boolean;
}

export interface UserAddress {
    _id?: string;
    label: string;
    recipientName: string;
    phone: string;
    line1: string;
    ward: string;
    district: string;
    city: string;
    isDefault: boolean;
}
