import { type UserProfile } from "./schemas";

export type User = UserProfile & {
    id: string;
    avatarUrl: string;
    isVerified: boolean;
};

export type RideRequest = {
  id: string;
  type: 'pickup' | 'service';
  user: User; // This might be simplified to just userId
  userId: string;
  startLocation: string;
  destination: string;
  dateTime: string; // Storing as ISO string or timestamp number
  vehicleType?: 'Bike' | 'Scooty';
  status: 'open' | 'matched' | 'confirmed';
  expectedCost?: number;
};

export type Notification = {
  id: string;
  text: string;
  time: string;
  read: boolean;
};
