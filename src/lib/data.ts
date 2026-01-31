
import { placeholderImages } from './placeholder-images';
import type { User, RideRequest, Notification } from './types';

// This file is now primarily for mock data that is not yet in Firestore.
// Most data should be fetched from Firebase.

export const notifications: Notification[] = [
    { id: 'n1', text: `Anjali accepted your ride request for tomorrow.`, time: '10m ago', read: false },
    { id: 'n2', text: `New ride suggestion: Sunita is going from Dadar to Lower Parel.`, time: '1h ago', read: false },
    { id: 'n4', text: `Your ride request for Thane has been confirmed by Priya!`, time: '2h ago', read: true },
    { id: 'n3', text: 'Welcome to SheRide! Complete your profile to get started.', time: '1d ago', read: true },
];
