
"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useUser, useCollection } from '@/firebase';
import { doc, updateDoc, collection, serverTimestamp, writeBatch, arrayUnion, query, where, getDocs } from 'firebase/firestore';
import type { Ride, UserProfile, Notification, RideRequest } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Coins, User as UserIcon, Bike, Clock, Loader2, MessageSquare, Users } from 'lucide-react';
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

    const handleAcceptRequest = async (requestToAccept: RideRequest & { id: string }) => {
        if (!rideRef || !firestore || !ride || !driverProfile || !user || !isCurrentUserDriver || ride.status !== 'offering') return;
        setIsUpdating(true);
        
        try {
            const batch = writeBatch(firestore);
            
            // 1. Update the main ride document
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            batch.update(rideRef, {
                status: 'confirmed',
                passengerId: requestToAccept.passengerId,
                participantIds: arrayUnion(requestToAccept.passengerId),
                acceptedAt: serverTimestamp(),
                rideOtp: otp,
                otpVerified: false,
                riderStarted: false,
                passengerStarted: false,
                riderCompleted: false,
                passengerCompleted: false,
            });

            // 2. Get all pending requests for this ride to accept one and reject others
            const requestsQuery = query(collection(firestore, 'rideRequests'), where('rideId', '==', ride.id), where('status', '==', 'pending'));
            const requestsSnapshot = await getDocs(requestsQuery);

            requestsSnapshot.forEach(requestDoc => {
                if (requestDoc.id === requestToAccept.id) {
                    // 2a. Update the accepted request
                    batch.update(requestDoc.ref, { status: 'accepted' });
                    // 2b. Notify the accepted passenger
                    const acceptedNotifRef = doc(collection(firestore, "notifications"));
                    batch.set(acceptedNotifRef, {
                        userId: requestToAccept.passengerId,
                        rideId: ride.id,
                        message: `Your request for the ride with ${driverProfile.name} has been accepted!`,
                        type: 'ride_accepted',
                        isRead: false,
                        createdAt: serverTimestamp()
                    });
                } else {
                    // 2c. Update other pending requests to 'rejected'
                    batch.update(requestDoc.ref, { status: 'rejected' });
                     // 2d. Notify the rejected passengers
                    const rejectedNotifRef = doc(collection(firestore, "notifications"));
                    batch.set(rejectedNotifRef, {
                        userId: requestDoc.data().passengerId,
                        rideId: ride.id,
                        message: `Your request for the ride with ${driverProfile.name} was not accepted.`,
                        type: 'ride_cancelled', // Or a new 'ride_rejected' type
                        isRead: false,
                        createdAt: serverTimestamp()
                    });
                }
            });

            await batch.commit();
            
            toast({
                title: 'Ride Confirmed!',
                description: `You have accepted the request. The ride is now confirmed.`
            });
    
        } catch (error) {
            console.error("Failed to accept ride request", error);
            toast({ variant: 'destructive', title: 'Acceptance failed' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = async () => {
        if (!rideRef || !firestore || !user || !ride) return;
        setIsUpdating(true);
    
        try {
            const batch = writeBatch(firestore);
    
            // Case A: Driver cancels their own offer that has no passenger yet.
            if (isCurrentUserDriver && ride.status === 'offering') {
                batch.update(rideRef, {
                    status: 'cancelled',
                    cancelledBy: user.uid,
                    cancelledAt: serverTimestamp(),
                });
                await batch.commit();
                toast({ title: 'Ride Offer Canceled', description: 'Your offer has been removed.' });
                router.push('/dashboard');
            }
            // Case B: A participant (driver or passenger) cancels a CONFIRMED ride.
            else if (ride.status === 'confirmed' && (isCurrentUserDriver || isCurrentUserPassenger)) {
                const cancellerProfile = isCurrentUserDriver ? driverProfile : passengerProfile;
                const otherPartyId = isCurrentUserDriver ? ride.passengerId : ride.driverId;
    
                // 1. Reset the main ride document to 'offering'
                batch.update(rideRef, {
                    status: 'offering',
                    passengerId: null,
                    participantIds: [ride.driverId], // Only driver remains a participant
                    acceptedAt: null,
                    rideOtp: null,
                    otpVerified: false,
                    riderStarted: false,
                    passengerStarted: false,
                    riderCompleted: false,
                    passengerCompleted: false,
                });
    
                // 2. Find the 'accepted' request and mark it as 'rejected' or 'cancelled'
                const requestsQuery = query(
                    collection(firestore, "rideRequests"),
                    where("rideId", "==", ride.id),
                    where("status", "==", "accepted")
                );
                const requestSnapshot = await getDocs(requestsQuery);
                if (!requestSnapshot.empty) {
                    const requestToCancelRef = requestSnapshot.docs[0].ref;
                    batch.update(requestToCancelRef, { status: isCurrentUserPassenger ? 'cancelled' : 'rejected' });
                }
    
                // 3. Notify the other party
                if (otherPartyId && cancellerProfile) {
                    const newNotification = {
                        userId: otherPartyId,
                        rideId: ride.id,
                        message: `${cancellerProfile.name} has canceled the confirmed ride. The ride is now open for requests again.`,
                        type: 'ride_cancelled',
                        isRead: false,
                        createdAt: serverTimestamp()
                    };
                    const newNotifRef = doc(collection(firestore, "notifications"));
                    batch.set(newNotifRef, newNotification);
                }
    
                await batch.commit();
                toast({ title: 'Confirmed Ride Canceled', description: 'The ride is now open for requests again.' });
                router.push('/dashboard');
            }
            // Case C: A participant cancels an in-progress ride (emergency/problem).
            else if (ride.status === 'in-progress' && (isCurrentUserDriver || isCurrentUserPassenger)) {
                 batch.update(rideRef, { 
                    status: 'cancelled',
                    cancelledBy: user.uid,
                    cancelledAt: serverTimestamp(),
                });
                
                const otherUserId = isCurrentUserDriver ? ride.passengerId : ride.driverId;
                const currentUserProfile = isCurrentUserDriver ? driverProfile : passengerProfile;
    
                if (otherUserId && currentUserProfile) {
                    const newNotification = {
                        userId: otherUserId,
                        rideId: ride.id,
                        message: `${currentUserProfile.name} has canceled your ride during the trip.`,
                        type: 'ride_cancelled',
                        isRead: false,
                        createdAt: serverTimestamp()
                    };
                    const newNotifRef = doc(collection(firestore, "notifications"));
                    batch.set(newNotifRef, newNotification);
                }
                await batch.commit();
                toast({ variant: 'destructive', title: 'Ride Canceled', description: 'The in-progress ride has been canceled.' });
                router.push('/dashboard');
            }
            else {
                 toast({ variant: 'destructive', title: 'Cannot Cancel', description: 'This ride cannot be canceled at its current stage.' });
            }
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
    
    // A driver can cancel their own offer.
    const canCancel = ['confirmed', 'in-progress'].includes(ride.status) || (ride.status === 'offering' && isCurrentUserDriver);
    const cancelButtonText = ride.status === 'offering' ? 'Cancel Offer' : 'Cancel Ride';


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
                        {ride.vehicleType && <div className="flex items-center gap-2"><Bike className="h-4 w-4 text-muted-foreground"/><span>{ride.vehicleType}</span></div>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3">
                                <Avatar className="h-12 w-12"><AvatarImage src={(driverProfile as any)?.photoURL || placeholderImages.find(i=>i.id === 'avatar1')?.imageUrl}/><AvatarFallback>{driverProfile?.name?.charAt(0) || 'D'}</AvatarFallback></Avatar>
                                <div>
                                    <p className="text-xs text-muted-foreground">Provider</p>
                                    <p className="font-semibold">{driverProfile?.name || 'Awaiting provider...'}</p>
                                </div>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3">
                                <Avatar className="h-12 w-12"><AvatarImage src={(passengerProfile as any)?.photoURL || placeholderImages.find(i=>i.id === 'avatar2')?.imageUrl}/><AvatarFallback>{passengerProfile?.name?.charAt(0) || 'P'}</AvatarFallback></Avatar>
                                <div>
                                    <p className="text-xs text-muted-foreground">Passenger</p>
                                    <p className="font-semibold">{passengerProfile?.name || 'Awaiting passenger...'}</p>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    {isCurrentUserDriver && ride.status === 'offering' &&
                        <RideRequestsList rideId={ride.id} onAccept={handleAcceptRequest} isUpdating={isUpdating} />
                    }

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
                </CardFooter>
            </Card>
        </div>
    )
}

function RideRequestsList({ rideId, onAccept, isUpdating }: { rideId: string, onAccept: (request: any) => void, isUpdating: boolean }) {
    const firestore = useFirestore();
    const requestsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "rideRequests"), where("rideId", "==", rideId), where("status", "==", "pending"));
    }, [firestore, rideId]);

    const { data: requests, isLoading } = useCollection<RideRequest>(requestsQuery);

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="text-center py-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">No pending requests for this ride yet.</p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Pending Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {requests.map(req => (
                    <RequesterCard key={req.id} request={req} onAccept={onAccept} isUpdating={isUpdating} />
                ))}
            </CardContent>
        </Card>
    );
}

function RequesterCard({ request, onAccept, isUpdating }: { request: RideRequest & {id: string}, onAccept: (request: any) => void, isUpdating: boolean }) {
    const firestore = useFirestore();
    const passengerProfileRef = React.useMemo(() => doc(firestore, 'users', request.passengerId), [firestore, request.passengerId]);
    const { data: passengerProfile, isLoading } = useDoc<UserProfile>(passengerProfileRef);

    if (isLoading) {
        return <div className="flex items-center justify-between p-3 rounded-md border"><Skeleton className="h-8 w-32" /><Skeleton className="h-8 w-20" /></div>;
    }

    return (
        <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={(passengerProfile as any)?.photoURL || placeholderImages.find(i=>i.id === 'avatar2')?.imageUrl} />
                    <AvatarFallback>{passengerProfile?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{passengerProfile?.name}</p>
                    <p className="text-xs text-muted-foreground">{passengerProfile?.city}</p>
                </div>
            </div>
            <Button size="sm" onClick={() => onAccept(request)} disabled={isUpdating}>Accept</Button>
        </div>
    );
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
            } else if (isCurrentUserPassenger) {
                await updateDoc(rideRef, { passengerStarted: true });
                toast({ title: 'You confirmed start.', description: 'Waiting for driver to confirm.' });
            }
            
            // Check if both have confirmed to update status
            if ((isCurrentUserDriver && ride.passengerStarted) || (isCurrentUserPassenger && ride.riderStarted)) {
                 await updateDoc(rideRef, { status: 'in-progress' });
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
                await updateDoc(rideRef, { riderCompleted: true, });
                toast({ title: 'You confirmed completion.', description: 'Waiting for passenger to confirm.' });
            } else if (isCurrentUserPassenger) {
                await updateDoc(rideRef, { passengerCompleted: true });
                toast({ title: 'You confirmed completion.', description: 'Waiting for driver to confirm.' });
            }

            if ((isCurrentUserDriver && ride.passengerCompleted) || (isCurrentUserPassenger && ride.riderCompleted)) {
                 const batch = writeBatch(firestore);
                batch.update(rideRef, { 
                    status: 'completed',
                    completedAt: serverTimestamp()
                });
                
                const notificationsCollection = collection(firestore, "notifications");
                const riderNotifRef = doc(notificationsCollection);
                const passengerNotifRef = doc(notificationsCollection);
                const completionMessage = `Your ride from ${ride.fromLocation} to ${ride.toLocation} is complete.`;
                
                batch.set(riderNotifRef, { userId: ride.driverId, rideId: ride.id, message: completionMessage, type: 'ride_completed', isRead: false, createdAt: serverTimestamp() });
                batch.set(passengerNotifRef, { userId: ride.passengerId, rideId: ride.id, message: completionMessage, type: 'ride_completed', isRead: false, createdAt: serverTimestamp() });
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
        const canPassengerStart = isCurrentUserPassenger && !ride.passengerStarted;
        
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
        const canPassengerComplete = isCurrentUserPassenger && !ride.passengerCompleted;
        
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
