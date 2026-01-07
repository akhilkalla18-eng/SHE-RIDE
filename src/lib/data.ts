import { placeholderImages } from './placeholder-images';
import type { User, RideRequest, Notification } from './types';

export const users: User[] = [
  { id: 'u1', name: 'Priya Sharma', avatarUrl: placeholderImages.find(p => p.id === 'avatar1')?.imageUrl || '', city: 'Mumbai', isVerified: true },
  { id: 'u2', name: 'Anjali Mehta', avatarUrl: placeholderImages.find(p => p.id === 'avatar2')?.imageUrl || '', city: 'Mumbai', isVerified: false },
  { id: 'u3', name: 'Sunita Rao', avatarUrl: placeholderImages.find(p => p.id === 'avatar3')?.imageUrl || '', city: 'Mumbai', isVerified: true },
];

export const currentUser: User = users[0];

export const rideRequests: RideRequest[] = [
  {
    id: 'rr1',
    type: 'pickup',
    user: users[1],
    startLocation: 'Andheri West',
    destination: 'Bandra Kurla Complex',
    dateTime: new Date(new Date().setDate(new Date().getDate() + 1)),
    vehicleType: 'Scooty',
    status: 'open',
  },
  {
    id: 'rr2',
    type: 'service',
    user: users[2],
    startLocation: 'Dadar East',
    destination: 'Lower Parel',
    dateTime: new Date(new Date().setHours(new Date().getHours() + 2)),
    status: 'open',
  },
  {
    id: 'rr3',
    type: 'pickup',
    user: currentUser,
    startLocation: 'Juhu',
    destination: 'Powai',
    dateTime: new Date(new Date().setDate(new Date().getDate() + 2)),
    vehicleType: 'Bike',
    status: 'matched',
  },
];

export const notifications: Notification[] = [
    { id: 'n1', text: `Anjali accepted your ride request for tomorrow.`, time: '10m ago', read: false },
    { id: 'n2', text: `New ride suggestion: Sunita is going from Dadar to Lower Parel.`, time: '1h ago', read: false },
    { id: 'n3', text: 'Welcome to SheRide! Complete your profile to get started.', time: '1d ago', read: true },
];
