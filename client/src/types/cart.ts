export interface CartItemOption {
    optionGroupId: string;
    optionId: string;
    optionName: string;
    priceDelta: number;
}

export interface CartItem {
    _id: string;
    menuItemId: string;
    quantity: number;
    displaySnapshot: {
        name: string;
        imageUrl?: string;
        unitPrice: number;
    };
    selectedOptions: CartItemOption[];
    note?: string;
}

export interface Cart {
    _id: string;
    restaurantId: string;
    customerId: string;
    items: CartItem[];
}

export interface AddToCartPayload {
    menuItemId: string;
    quantity: number;
    options?: { optionGroupId: string; optionId: string }[];
}

export interface Restaurant {
    _id: string;
    name: string;
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

export interface Coupon {
    _id: string;
    code: string;
    name: string;
    description?: string;
    discountType: "fixed" | "percentage";
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount: number;
}

export interface User {
    _id: string;
    fullName: string;
    email: string;
    role: string;
}

export interface Address {
    _id: string;
    recipientName: string;
    phone: string;
    line1: string;
    ward: string;
    district: string;
    city: string;
}
