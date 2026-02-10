
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { Ride, UserProfile, Notification } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Coins, User as UserIcon, Bike, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { placeholderImages } from '@/lib/placeholder-images';

const DetailSkeleton = () => (
    <div className="max-w-4xl mx-auto grid gap-6">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-16 w-full" />
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Skeleton className="h-10 w-28" />
            </CardFooter>
        </Card>
    </div>
);


function RideDetailPage() {
    const { rideId } = useParams();
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState(false);

    const rideRef = React.useMemo(() => {
        if (!firestore || !rideId) return null;
        return doc(firestore, 'rides', rideId as string);
    }, [firestore, rideId]);

    const { data: ride, isLoading: isRideLoading } = useDoc<Ride>(rideRef);

    const driverRef = React.useMemo(() => {
        if (!firestore || !ride?.driverId) return null;
        return doc(firestore, 'users', ride.driverId);
    }, [firestore, ride]);
    const { data: driverProfile, isLoading: isDriverLoading } = useDoc<UserProfile>(driverRef);

    const passengerRef = React.useMemo(() => {
        if (!firestore || !ride?.passengerId) return null;
        return doc(firestore, 'users', ride.passengerId);
    }, [firestore, ride]);
    const { data: passengerProfile, isLoading: isPassengerLoading } = useDoc<UserProfile>(passengerRef);
    
    const isCurrentUserDriver = user?.uid === ride?.driverId;

    const handleUpdateStatus = async (newStatus: 'accepted') => {
        if (!rideRef || !firestore || !ride) return;
        setIsUpdating(true);
        try {
            await updateDoc(rideRef, { 
                status: newStatus,
                acceptedAt: serverTimestamp()
            });

            // If this ride came from a pickup request, mark that request as 'matched'
            if (ride.pickupRequestId) {
                const pickupRequestRef = doc(firestore, 'pickupRequests', ride.pickupRequestId);
                await updateDoc(pickupRequestRef, { status: 'matched' });
            }

            toast({
                title: 'Ride Updated!',
                description: `The ride status is now '${newStatus}'.`
            });
        } catch (error) {
            console.error("Failed to update ride status", error);
            toast({ variant: 'destructive', title: 'Update failed' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleCancel = async () => {
        if (!rideRef || !firestore || !user || !ride || !driverProfile || !passengerProfile) return;
        setIsUpdating(true);
        try {
            const newStatus = isCurrentUserDriver ? 'cancelled_by_provider' : 'cancelled_by_passenger';
            await updateDoc(rideRef, { status: newStatus });

            const otherUserId = isCurrentUserDriver ? ride.passengerId : ride.driverId;
            const currentUserProfile = isCurrentUserDriver ? driverProfile : passengerProfile;
            
            const notificationsCollection = collection(firestore, "notifications");
            const newNotification: Omit<Notification, 'id'> = {
                userId: otherUserId,
                rideId: ride.id,
                message: `${currentUserProfile.name} has canceled the ride.`,
                type: 'ride_cancelled',
                cancelledBy: isCurrentUserDriver ? 'provider' : 'passenger',
                isRead: false,
                createdAt: serverTimestamp()
            };
            await addDoc(notificationsCollection, newNotification);

            toast({
                title: 'Ride Canceled',
                description: 'The ride has been successfully canceled. The other user will be notified.'
            });
        } catch (error) {
            console.error("Failed to cancel ride", error);
            toast({ variant: 'destructive', title: 'Cancellation Failed', description: 'Could not update the ride status.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const isLoading = isRideLoading || isDriverLoading || isPassengerLoading;

    if (isLoading) {
        return <DetailSkeleton />;
    }

    if (!ride) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-semibold">Ride Not Found</h2>
                <p className="text-muted-foreground mt-2">The ride you are looking for does not exist or has been deleted.</p>
            </div>
        );
    }

    const canAccept = ride.status === 'requested' && isCurrentUserDriver;
    const canCancel = ['requested', 'accepted', 'confirmed'].includes(ride.status);

    const statusText = ride.status.replace(/_/g, ' ');
    let badgeVariant: "default" | "secondary" | "destructive" = "secondary";
    if (['accepted', 'confirmed', 'completed'].includes(ride.status)) {
        badgeVariant = "default";
    } else if (ride.status.startsWith('cancelled')) {
        badgeVariant = "destructive";
    }

    const renderActionButtons = () => {
        if (!canAccept && !canCancel) return null;
        if (ride.status.startsWith('cancelled') || ride.status === 'completed') return null;

        return (
             <CardFooter className="flex gap-2 justify-end">
                {canCancel && <Button variant="destructive" onClick={handleCancel} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Cancel Ride
                </Button>}
                {canAccept && <Button onClick={() => handleUpdateStatus('accepted')} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Accept Request
                </Button>}
            </CardFooter>
        );
    }

    return (
        <div className="max-w-4xl mx-auto grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">Ride Details</CardTitle>
                            <CardDescription>
                                {new Date(ride.dateTime).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </CardDescription>
                        </div>
                        <Badge variant={badgeVariant} className="capitalize">{statusText}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <div className="font-semibold text-lg truncate pr-4">{ride.fromLocation}</div>
                        <ArrowRight className="h-6 w-6 text-primary flex-shrink-0"/>
                        <div className="font-semibold text-lg truncate pl-4 text-right">{ride.toLocation}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/><span>{new Date(ride.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
                        <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-muted-foreground"/><span>₹{ride.sharedCost} (agreed cost)</span></div>
                        <div className="flex items-center gap-2"><Bike className="h-4 w-4 text-muted-foreground"/><span>Ride ID: {ride.id.substring(0, 6)}...</span></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3">
                                <Avatar className="h-12 w-12"><AvatarImage src={(driverProfile as any)?.photoURL || placeholderImages.find(i=>i.id === 'avatar1')?.imageUrl}/><AvatarFallback>{driverProfile?.name?.charAt(0)}</AvatarFallback></Avatar>
                                <div>
                                    <p className="text-xs text-muted-foreground">Provider</p>
                                    <p className="font-semibold">{driverProfile?.name}</p>
                                </div>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3">
                                <Avatar className="h-12 w-12"><AvatarImage src={(passengerProfile as any)?.photoURL || placeholderImages.find(i=>i.id === 'avatar2')?.imageUrl}/><AvatarFallback>{passengerProfile?.name?.charAt(0)}</AvatarFallback></Avatar>
                                <div>
                                    <p className="text-xs text-muted-foreground">Passenger</p>
                                    <p className="font-semibold">{passengerProfile?.name}</p>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>
                </CardContent>
                {renderActionButtons()}
            </Card>
        </div>
    )
}

export default RideDetailPage;
