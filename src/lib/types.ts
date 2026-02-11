
import { type PickupRequest as PickupRequestSchema, type ServiceRequest as ServiceRequestSchema, type UserProfile, type Ride as RideSchema, type Notification as NotificationSchema, type ChatMessage as ChatMessageSchema } from "./schemas";


export type User = UserProfile & {
    id: string;
    avatarUrl: string;
    isVerified: boolean;
};

// Combining Pickup and Service requests for easier handling in some UI components
export type RideRequest = (PickupRequestSchema | ServiceRequestSchema) & {
  id: string;
  user: UserProfile;
  userId: string;
  status: 'open' | 'matched' | 'confirmed';
};

export type Notification = NotificationSchema;
export type Ride = RideSchema;
export type PickupRequest = PickupRequestSchema;
export type ServiceRequest = ServiceRequestSchema;
export type ChatMessage = ChatMessageSchema;
