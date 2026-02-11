

import { type UserProfile as UserProfileSchema, type Ride as RideSchema, type Notification as NotificationSchema, type ChatMessage as ChatMessageSchema, type RideRequest as RideRequestSchema } from "./schemas";

export type UserProfile = UserProfileSchema;

export type User = UserProfile & {
    id: string;
    avatarUrl: string;
    isVerified: boolean;
};

export type Notification = NotificationSchema;
export type Ride = RideSchema;
export type RideRequest = RideRequestSchema;
export type ChatMessage = ChatMessageSchema;
