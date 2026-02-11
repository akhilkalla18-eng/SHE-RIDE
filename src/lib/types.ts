
import { type UserProfile as UserProfileSchema, type Ride as RideSchema, type Notification as NotificationSchema, type ChatMessage as ChatMessageSchema } from "./schemas";

export type UserProfile = UserProfileSchema;

export type User = UserProfile & {
    id: string;
    avatarUrl: string;
    isVerified: boolean;
};

export type Notification = NotificationSchema;
export type Ride = RideSchema;
export type ChatMessage = ChatMessageSchema;
