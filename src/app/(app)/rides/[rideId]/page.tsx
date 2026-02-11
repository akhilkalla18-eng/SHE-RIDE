
"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc, updateDoc, collection, serverTimestamp, writeBatch, query, where, getDocs, deleteField } from 'firebase/firestore';
import type { Ride, UserProfile, Notification, PickupRequest } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Coins, User as UserIcon, Bike, Clock, Loader2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { placeholderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

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
            <CardFooter className="flex justify-end gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
            </CardFooter>
        </Card>
    </div>
);


function RideDetailPage() {
    const { rideId } = useParams();
    const router = useRouter();
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
    const isCurrentUserPassenger = user?.uid === ride?.passengerId;

    const handleAcceptRequest = async () => {
        if (!rideRef || !firestore || !ride || !driverProfile || !user || !isCurrentUserDriver || ride.status !== 'requested') return;
        setIsUpdating(true);
    
        const batch = writeBatch(firestore);
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
        try {
            // 1. Update the accepted ride request
            batch.update(rideRef, {
                status: 'confirmed',
                acceptedAt: serverTimestamp(),
                rideOtp: otp,
                otpVerified: false,
                riderStarted: false,
                passengerStarted: false,
                riderCompleted: false,
                passengerCompleted: false,
            });
    
            // This handles acceptances for service requests, which are simpler
            if (ride.serviceRequestId) {
                const serviceRequestRef = doc(firestore, 'serviceRequests', ride.serviceRequestId);
                batch.update(serviceRequestRef, { status: 'matched', matchedDriverId: ride.driverId });
            }
            
            // This handles the more complex case of accepting one offer among many requests
            if (ride.pickupRequestId) {
                const pickupRequestRef = doc(firestore, 'pickupRequests', ride.pickupRequestId);
                batch.update(pickupRequestRef, { status: 'matched', matchedPassengerId: ride.passengerId });
                
                const otherRequestsQuery = query(
                    collection(firestore, "rides"),
                    where("pickupRequestId", "==", ride.pickupRequestId),
                    where("status", "==", "requested")
                );
                const otherRequestsSnapshot = await getDocs(otherRequestsQuery);
                const notificationsCollection = collection(firestore, "notifications");
                
                const rejectedPassengerIds: string[] = [];
    
                otherRequestsSnapshot.forEach(rideDoc => {
                    if (rideDoc.id === ride.id) return; 
    
                    const otherRideRef = doc(firestore, 'rides', rideDoc.id);
                    batch.update(otherRideRef, { status: 'cancelled' });
                    
                    const rideData = rideDoc.data() as Ride;
                    rejectedPassengerIds.push(rideData.passengerId);

                    const newNotification: Omit<Notification, 'id'> = {
                        userId: rideData.passengerId, 
                        rideId: rideDoc.id,
                        message: `${driverProfile.name} has accepted another request for the ride you requested.`,
                        type: 'ride_cancelled',
                        cancelledBy: 'provider',
                        isRead: false,
                        createdAt: serverTimestamp()
                    };
                    const newNotifRef = doc(notificationsCollection);
                    batch.set(newNotifRef, newNotification);
                });

                 if (rejectedPassengerIds.length > 0) {
                     batch.update(pickupRequestRef, { rejectedBy: rejectedPassengerIds });
                }
            }
            
            await batch.commit();
            
            toast({
                title: 'Ride Accepted!',
                description: `The ride has been confirmed. Please verify with the OTP to start.`
            });
    
        } catch (error) {
            console.error("Failed to accept ride request", error);
            toast({ variant: 'destructive', title: 'Acceptance failed' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = async () => {
        if (!rideRef || !firestore || !user || !ride || !driverProfile || !passengerProfile) return;
        
        setIsUpdating(true);
        const batch = writeBatch(firestore);
    
        try {
            const newStatus = 'cancelled';
            
            batch.update(rideRef, { 
                status: newStatus,
                cancelledBy: user.uid,
                cancelledAt: serverTimestamp(),
            });
    
            if (ride.pickupRequestId) {
                const pickupRequestRef = doc(firestore, 'pickupRequests', ride.pickupRequestId);
                batch.update(pickupRequestRef, { 
                    status: 'open',
                    matchedPassengerId: deleteField()
                });
            }
            if (ride.serviceRequestId) {
                const serviceRequestRef = doc(firestore, 'serviceRequests', ride.serviceRequestId);
                batch.update(serviceRequestRef, {
                    status: 'open',
                    matchedDriverId: deleteField()
                });
            }
            
            const isCancellingPendingRequest = ride.status === 'requested' && isCurrentUserPassenger;
            if (!isCancellingPendingRequest) {
                const otherUserId = isCurrentUserDriver ? ride.passengerId : ride.driverId;
                const currentUserProfile = isCurrentUserDriver ? driverProfile : passengerProfile;
                
                const newNotification: Omit<Notification, 'id'> = {
                    userId: otherUserId,
                    rideId: ride.id,
                    message: `${currentUserProfile.name} has canceled your ride.`,
                    type: 'ride_cancelled',
                    cancelledBy: isCurrentUserDriver ? 'provider' : 'passenger',
                    isRead: false,
                    createdAt: serverTimestamp()
                };
                const newNotifRef = doc(collection(firestore, "notifications"));
                batch.set(newNotifRef, newNotification);
            }
    
            await batch.commit();
    
            toast({
                title: 'Ride Canceled',
                description: 'The ride has been successfully canceled.'
            });
            router.push('/dashboard');
    
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
    const canCancel = (ride.status === 'requested' && isCurrentUserPassenger) || ['confirmed', 'in-progress'].includes(ride.status);
    const cancelButtonText = ride.status === 'requested' && isCurrentUserPassenger ? 'Cancel Request' : 'Cancel Ride';


    const statusText = ride.status.replace(/_/g, ' ');
    let badgeVariant: "default" | "secondary" | "destructive" = "secondary";
    if (['confirmed', 'in-progress', 'completed'].includes(ride.status)) {
        badgeVariant = "default";
    } else if (ride.status.startsWith('cancelled')) {
        badgeVariant = "destructive";
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
                                    <p className="font-semibold">{driverProfile?.name || 'Awaiting rider...'}</p>
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

                    <RideLifecycleManager
                        ride={ride}
                        rideRef={rideRef!}
                        isCurrentUserDriver={!!isCurrentUserDriver}
                        isCurrentUserPassenger={!!isCurrentUserPassenger}
                    />

                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 justify-end pt-4">
                    {canCancel && <Button variant="destructive" onClick={handleCancel} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {cancelButtonText}
                    </Button>}
                    {canAccept && <Button onClick={handleAcceptRequest} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Accept Request
                    </Button>}
                </CardFooter>
            </Card>
        </div>
    )
}

function RideLifecycleManager({ ride, rideRef, isCurrentUserDriver, isCurrentUserPassenger }: { ride: Ride, rideRef: any, isCurrentUserDriver: boolean, isCurrentUserPassenger: boolean }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [otpInput, setOtpInput] = React.useState("");

    const handleVerifyOtp = async () => {
        if (otpInput !== ride.rideOtp) {
            toast({ variant: 'destructive', title: 'Invalid OTP', description: 'The OTP you entered is incorrect.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await updateDoc(rideRef, {
                otpVerified: true,
            });
            toast({ title: 'OTP Verified!', description: 'You can now start the ride.' });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not verify OTP.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartRide = async () => {
        setIsSubmitting(true);
        try {
            if (isCurrentUserDriver) {
                await updateDoc(rideRef, { riderStarted: true });
                toast({ title: 'You confirmed start.', description: 'Waiting for passenger to confirm.' });
            } else if (isCurrentUserPassenger && ride.riderStarted) {
                await updateDoc(rideRef, { 
                    passengerStarted: true,
                    status: 'in-progress'
                });
                toast({ title: 'Ride Started!', description: 'Enjoy your journey.' });
            }
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not confirm ride start.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCompleteRide = async () => {
        setIsSubmitting(true);
        try {
            if (isCurrentUserDriver) {
                await updateDoc(rideRef, { 
                    riderCompleted: true,
                });
                toast({ title: 'You confirmed completion.', description: 'Waiting for passenger to confirm.' });
            } else if (isCurrentUserPassenger && ride.riderCompleted) {
                const batch = writeBatch(firestore);
                batch.update(rideRef, { 
                    passengerCompleted: true,
                    status: 'completed',
                    completedAt: serverTimestamp()
                });
                
                // Add notifications
                const notificationsCollection = collection(firestore, "notifications");
                const riderNotifRef = doc(notificationsCollection);
                const passengerNotifRef = doc(notificationsCollection);

                const completionMessage = `Your ride from ${ride.fromLocation} to ${ride.toLocation} is complete.`;
                
                batch.set(riderNotifRef, {
                    userId: ride.driverId,
                    rideId: ride.id,
                    message: completionMessage,
                    type: 'ride_completed',
                    isRead: false,
                    createdAt: serverTimestamp()
                });

                 batch.set(passengerNotifRef, {
                    userId: ride.passengerId,
                    rideId: ride.id,
                    message: completionMessage,
                    type: 'ride_completed',
                    isRead: false,
                    createdAt: serverTimestamp()
                });

                await batch.commit();

                toast({ title: 'Ride Completed!', description: 'Thank you for using SheRide.' });
            }
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not confirm ride completion.' });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (ride.status === 'confirmed' && !ride.otpVerified) {
        if (isCurrentUserPassenger) {
            return (
                <Card className="bg-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle>Your Ride OTP</CardTitle>
                        <CardDescription>Share this OTP with your rider to start the trip.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold tracking-widest text-center text-primary bg-background/50 rounded-lg py-4">{ride.rideOtp}</p>
                    </CardContent>
                </Card>
            );
        }
        if (isCurrentUserDriver) {
            return (
                 <Card>
                    <CardHeader>
                        <CardTitle>Start Ride Verification</CardTitle>
                        <CardDescription>Enter the OTP from the passenger to begin the ride.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Input 
                            placeholder="4-digit OTP"
                            maxLength={4}
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <Button onClick={handleVerifyOtp} disabled={isSubmitting || otpInput.length !== 4}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Verify OTP
                        </Button>
                    </CardContent>
                </Card>
            );
        }
    }
    
    if (ride.status === 'confirmed' && ride.otpVerified) {
        const canDriverStart = isCurrentUserDriver && !ride.riderStarted;
        const canPassengerStart = isCurrentUserPassenger && ride.riderStarted && !ride.passengerStarted;
        
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ready to Go?</CardTitle>
                    <CardDescription>Both rider and passenger must confirm to start the ride.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex justify-around items-center text-sm">
                        <div className="flex flex-col items-center gap-2">
                            <span className="font-semibold">Rider Start</span>
                            {ride.riderStarted ? <Badge variant="default">Confirmed</Badge> : <Badge variant="outline">Pending</Badge>}
                        </div>
                         <div className="flex flex-col items-center gap-2">
                            <span className="font-semibold">Passenger Start</span>
                            {ride.passengerStarted ? <Badge variant="default">Confirmed</Badge> : <Badge variant="outline">Pending</Badge>}
                        </div>
                    </div>
                     <Button onClick={handleStartRide} disabled={isSubmitting || (!canDriverStart && !canPassengerStart)} className="w-full">
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                         Confirm Start
                     </Button>
                </CardContent>
            </Card>
        )
    }

     if (ride.status === 'in-progress') {
        const canDriverComplete = isCurrentUserDriver && !ride.riderCompleted;
        const canPassengerComplete = isCurrentUserPassenger && ride.riderCompleted && !ride.passengerCompleted;
        
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Complete the Ride?</CardTitle>
                    <CardDescription>Both rider and passenger must confirm ride completion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex justify-around items-center text-sm">
                        <div className="flex flex-col items-center gap-2">
                            <span className="font-semibold">Rider Complete</span>
                            {ride.riderCompleted ? <Badge variant="default">Confirmed</Badge> : <Badge variant="outline">Pending</Badge>}
                        </div>
                         <div className="flex flex-col items-center gap-2">
                            <span className="font-semibold">Passenger Complete</span>
                            {ride.passengerCompleted ? <Badge variant="default">Confirmed</Badge> : <Badge variant="outline">Pending</Badge>}
                        </div>
                    </div>
                     <Button onClick={handleCompleteRide} disabled={isSubmitting || (!canDriverComplete && !canPassengerComplete)} className="w-full">
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                         Confirm Completion
                     </Button>
                </CardContent>
            </Card>
        )
    }

    if (ride.status === 'completed') {
        return (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200">Ride Completed!</CardTitle>
                    <CardDescription className="text-green-700 dark:text-green-300">This journey is complete. Thank you for using SheRide.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    if (ride.status === 'cancelled') {
         return (
            <Card className="bg-destructive/10 border-destructive/20">
                <CardHeader>
                    <CardTitle className="text-destructive">Ride Canceled</CardTitle>
                    <CardDescription className="text-destructive/80">This ride has been canceled.</CardDescription>
                </CardHeader>
            </Card>
        );
    }


    return null;
}


export default RideDetailPage;
