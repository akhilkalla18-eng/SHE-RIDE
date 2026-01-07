export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  city: string;
  isVerified: boolean;
};

export type RideRequest = {
  id: string;
  type: 'pickup' | 'service';
  user: User;
  startLocation: string;
  destination: string;
  dateTime: Date;
  vehicleType?: 'Bike' | 'Scooty';
  status: 'open' | 'matched';
};

export type Notification = {
  id: string;
  text: string;
  time: string;
  read: boolean;
};
