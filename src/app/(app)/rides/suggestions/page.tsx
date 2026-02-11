
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { placeholderImages } from "@/lib/placeholder-images";
import { UserProfile, PickupRequest, ServiceRequest, Ride } from "@/lib/schemas";
import { ArrowRight, Bike, Search, User as UserIcon, Coins } from "lucide-react";
import React from "react";
import { collection, query, where, doc, addDoc, serverTimestamp, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type CombinedRequest = (PickupRequest | ServiceRequest) & { type: 'pickup' | 'service' };

const SuggestionSkeleton = () => (
    <Card className="flex flex-col">
        <CardHeader>
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <CardFooter className="flex gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);

const EmptyState = ({ title, description }: { title: string, description: string }) => (
    <div className="col-span-full text-center py-16">
        <Search className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
);


export default function SuggestionsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = React.useState("");

    // These are RIDE OFFERS from drivers
    const pickupRequestsQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
          collection(firestore, "pickupRequests"), 
          where("status", "==", "open")
        );
    }, [firestore, user]);
    const {data: pickupRequests, isLoading: arePickupsLoading} = useCollection<PickupRequest>(pickupRequestsQuery);

    // These are RIDE REQUESTS from passengers
    const serviceRequestsQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
          collection(firestore, "serviceRequests"), 
          where("status", "==", "open")
        );
    }, [firestore, user]);
    const {data: serviceRequests, isLoading: areServicesLoading} = useCollection<ServiceRequest>(serviceRequestsQuery);

    const myRidesQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        // This query is allowed by the security rule: `where("participantIds", "array-contains", user.uid)`
        return query(
            collection(firestore, "rides"),
            where("participantIds", "array-contains", user.uid)
        );
    }, [firestore, user]);
    const { data: myRides, isLoading: areMyRidesLoading } = useCollection<Ride>(myRidesQuery);

    // From all my rides, create a Set of pickupRequestIds where I was the passenger and the status is 'requested'.
    // This allows O(1) lookup to check if I've already requested a specific ride offer.
    const myRequestedPickupIds = React.useMemo(() => {
        if (!myRides || !user) return new Set<string>();
        return new Set(
            myRides
                .filter(r => r.passengerId === user.uid && r.pickupRequestId && r.status === 'requested')
                .map(r => r.pickupRequestId!)
        );
    }, [myRides, user]);
    
    // Memoize Ride Offers (Pickups)
    const rideOffers = React.useMemo(() => {
        if (!user || !pickupRequests) return [];
        return pickupRequests
            .filter(r => r.userProfileId !== user.uid && !r.rejectedBy?.includes(user.uid))
            .map(r => ({ ...r, type: 'pickup' as const }))
            .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));
    }, [pickupRequests, user]);

    // Memoize Ride Requests (Services)
    const rideRequests = React.useMemo(() => {
        if (!user || !serviceRequests) return [];
        return serviceRequests
            .filter(r => r.userProfileId !== user.uid && !r.rejectedBy?.includes(user.uid))
            .map(r => ({ ...r, type: 'service' as const }))
            .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));
    }, [serviceRequests, user]);
    
    // Filtered lists for rendering
    const filteredRideOffers = React.useMemo(() => {
        if (!searchTerm.trim()) return rideOffers;
        return rideOffers.filter(ride => 
            ride.startingLocation.toLowerCase().includes(searchTerm.toLowerCase()) || 
            ride.destination.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rideOffers, searchTerm]);
    
    const filteredRideRequests = React.useMemo(() => {
        if (!searchTerm.trim()) return rideRequests;
        return rideRequests.filter(ride => 
            ride.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) || 
            ride.destination.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rideRequests, searchTerm]);


    const isLoading = arePickupsLoading || areServicesLoading || isUserLoading || areMyRidesLoading;

    return (
        <div className="container mx-auto">
            <div className="mb-8 space-y-4">
                <div>
                    <h1 className="text-3xl font-bold">Find a Ride</h1>
                    <p className="text-muted-foreground">Browse ride requests from passengers and offers from drivers.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by location..."
                        className="w-full max-w-sm pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="requests" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="requests">Ride Requests</TabsTrigger>
                    <TabsTrigger value="offers">Ride Offers</TabsTrigger>
                </TabsList>
                
                <TabsContent value="requests" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <SuggestionSkeleton key={i} />)
                        ) : filteredRideRequests.length > 0 ? (
                            filteredRideRequests.map((ride) => (
                                <SuggestionCard key={ride.id} ride={ride as CombinedRequest} myRequestedPickupIds={myRequestedPickupIds} />
                            ))
                        ) : (
                           <EmptyState 
                                title={searchTerm ? "No Matching Requests" : "No Ride Requests"}
                                description={searchTerm ? "Your search didn't find any passengers looking for a ride." : "There are currently no passengers looking for a ride."}
                           />
                        )}
                    </div>
                </TabsContent>
                
                <TabsContent value="offers" className="mt-6">
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <SuggestionSkeleton key={i} />)
                        ) : filteredRideOffers.length > 0 ? (
                            filteredRideOffers.map((ride) => (
                                <SuggestionCard key={ride.id} ride={ride as CombinedRequest} myRequestedPickupIds={myRequestedPickupIds} />
                            ))
                        ) : (
                           <EmptyState 
                                title={searchTerm ? "No Matching Offers" : "No Ride Offers"}
                                description={searchTerm ? "Your search didn't find any drivers offering a ride." : "There are currently no drivers offering rides."}
                           />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SuggestionCard({ ride, myRequestedPickupIds }: { ride: CombinedRequest, myRequestedPickupIds: Set<string> }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isRejecting, setIsRejecting] = React.useState(false);

    const userProfileRef = React.useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'users', ride.userProfileId);
    }, [firestore, ride.userProfileId]);

    const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

    const fromLocation = ride.type === 'pickup' ? ride.startingLocation : ride.pickupLocation;
    const toLocation = ride.destination;

    const handleReject = async () => {
        if (!user || !firestore) {
            toast({ variant: "destructive", title: "You must be logged in." });
            return;
        }
        setIsRejecting(true);
        try {
            const requestRef = doc(firestore, ride.type === 'service' ? 'serviceRequests' : 'pickupRequests', ride.id);
            await updateDoc(requestRef, {
                rejectedBy: arrayUnion(user.uid)
            });
            toast({
                title: "Suggestion Hidden",
                description: "You will no longer see this suggestion.",
            });
        } catch (error) {
            console.error("Error rejecting suggestion:", error);
            const path = `${ride.type === 'service' ? 'serviceRequests' : 'pickupRequests'}/${ride.id}`;
            const contextualError = new FirestorePermissionError({
              path: path,
              operation: 'update',
              requestResourceData: { rejectedBy: `arrayUnion('${user.uid}')` }
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsRejecting(false);
        }
    };

    const handleRequestOrAccept = async () => {
        if (!user || !firestore) {
            toast({ variant: "destructive", title: "You must be logged in." });
            return;
        }
        setIsSubmitting(true);
    
        let resourceData: any = {};
        try {
            if (ride.type === 'service') { // Current user is Driver, accepting a passenger's request
                resourceData = {
                    driverId: user.uid,
                    passengerId: ride.userProfileId,
                    participantIds: [user.uid, ride.userProfileId],
                    serviceRequestId: ride.id,
                    status: 'accepted',
                    sharedCost: ride.maxAmountWillingToPay,
                    dateTime: ride.dateTime,
                    fromLocation: ride.pickupLocation,
                    toLocation: ride.destination,
                    createdAt: serverTimestamp(),
                    acceptedAt: serverTimestamp(),
                };
                
                const ridesCollection = collection(firestore, "rides");
                await addDoc(ridesCollection, resourceData);
        
                const requestRef = doc(firestore, 'serviceRequests', ride.id);
                await updateDoc(requestRef, { status: 'matched' });
        
                toast({
                    title: "Success!",
                    description: "Ride accepted! The user will be notified.",
                });
            } else { // Current user is Passenger, requesting a spot from a driver
                const rideId = `${ride.id}_${user.uid}`;
                const rideRef = doc(firestore, 'rides', rideId);
                
                resourceData = {
                    driverId: ride.userProfileId,
                    passengerId: user.uid,
                    participantIds: [user.uid, ride.userProfileId],
                    pickupRequestId: ride.id,
                    status: 'requested',
                    sharedCost: (ride as PickupRequest).expectedCost || 0,
                    dateTime: ride.dateTime,
                    fromLocation: (ride as PickupRequest).startingLocation,
                    toLocation: ride.destination,
                    createdAt: serverTimestamp(),
                };
                
                // Using setDoc with a specific composite ID ensures a user can only request once.
                // The security rule will fail any subsequent attempts.
                await setDoc(rideRef, resourceData);
        
                toast({
                    title: "Success!",
                    description: "Request sent! You'll be notified when the driver responds.",
                });
            }
        } catch (error) {
            console.error("Error creating ride:", error);
            const contextualError = new FirestorePermissionError({
              path: 'rides',
              operation: 'create',
              requestResourceData: resourceData
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const hasRequested = ride.type === 'pickup' && myRequestedPickupIds.has(ride.id);

    const isButtonDisabled = isSubmitting || isRejecting || hasRequested;
    const buttonText = isSubmitting 
        ? "Submitting..." 
        : (ride.type === 'pickup' 
            ? (hasRequested ? 'Request Sent' : 'Send Request') 
            : 'Accept');


    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : 
                            <>
                                <AvatarImage src={(userProfile as any)?.photoURL || placeholderImages.find(p=>p.id === 'avatar2')?.imageUrl} />
                                <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
                            </>
                            }
                        </Avatar>
                        <div>
                            {isLoading ? <Skeleton className="h-5 w-24" /> : <CardTitle className="text-lg">{userProfile?.name}</CardTitle>}
                            {isLoading ? <Skeleton className="h-4 w-16 mt-1" /> : <CardDescription>{userProfile?.city}</CardDescription>}
                        </div>
                    </div>
                    <Badge variant={ride.type === 'pickup' ? 'secondary' : 'outline'}>
                        {ride.type === 'pickup' ? 'Offering Ride' : 'Needs Ride'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold truncate">
                    <span className="truncate">{fromLocation}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{toLocation}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                   {new Date(ride.dateTime).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                    })}
                </p>

                <div className="flex items-center gap-2 pt-2 text-sm font-medium">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <span>
                        {ride.type === 'pickup'
                            ? `Contribution: ₹${(ride as PickupRequest).expectedCost || 0}`
                            : `Offering: ₹${ride.maxAmountWillingToPay}`}
                    </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm font-medium">
                    {ride.type === 'pickup' ? <Bike className="h-4 w-4 text-muted-foreground" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                    <span>{ride.type === 'pickup' ? `Vehicle: ${(ride as PickupRequest).vehicleType}` : 'Passenger request'}</span>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button className="w-full" onClick={handleRequestOrAccept} disabled={isButtonDisabled}>
                    {buttonText}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleReject} disabled={isSubmitting || isRejecting}>
                   {isRejecting ? "Rejecting..." : "Reject"}
                </Button>
            </CardFooter>
        </Card>
    );
}
