export interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: Address[];
}
