export interface UserAddress {
  _id?: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  city: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  isDefault: boolean;
}

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  status?: string;
  avatarUrl?: string;
  addresses?: UserAddress[];
}

export interface AddAddressPayload {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  city: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  isDefault: boolean;
}
