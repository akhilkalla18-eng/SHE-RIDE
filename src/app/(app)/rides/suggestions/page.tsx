
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { placeholderImages } from "@/lib/placeholder-images";
import { UserProfile, PickupRequest, ServiceRequest, Ride } from "@/lib/schemas";
import { ArrowRight, Bike, Search, User as UserIcon } from "lucide-react";
import React from "react";
import { collection, query, where, doc, addDoc, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
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


export default function SuggestionsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = React.useState("");

    const pickupRequestsQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
          collection(firestore, "pickupRequests"), 
          where("status", "==", "open")
        );
    }, [firestore, user]);
    const {data: pickupRequests, isLoading: arePickupsLoading} = useCollection<PickupRequest>(pickupRequestsQuery);

    const serviceRequestsQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
          collection(firestore, "serviceRequests"), 
          where("status", "==", "open")
        );
    }, [firestore, user]);
    const {data: serviceRequests, isLoading: areServicesLoading} = useCollection<ServiceRequest>(serviceRequestsQuery);

    const allSuggestions = React.useMemo(() => {
        if (!user || (!pickupRequests && !serviceRequests)) return [];
        
        const otherPickups = pickupRequests?.filter(r => r.userProfileId !== user.uid && !r.rejectedBy?.includes(user.uid)) || [];
        const otherServices = serviceRequests?.filter(r => r.userProfileId !== user.uid && !r.rejectedBy?.includes(user.uid)) || [];

        const combined: CombinedRequest[] = [
            ...(otherPickups.map(r => ({ ...r, type: 'pickup' as const }))),
            ...(otherServices.map(r => ({ ...r, type: 'service' as const })))
        ];

        return combined
            // @ts-ignore
            .sort((a, b) => new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0));

    }, [pickupRequests, serviceRequests, user]);
    
    const filteredSuggestions = React.useMemo(() => {
        if (!searchTerm.trim()) {
            return allSuggestions;
        }

        return allSuggestions.filter(ride => {
            const fromLocation = ride.type === 'pickup' ? ride.startingLocation : ride.pickupLocation;
            const toLocation = ride.destination;
            return fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   toLocation.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [allSuggestions, searchTerm]);

    const isLoading = arePickupsLoading || areServicesLoading || isUserLoading;

    return (
        <div className="container mx-auto">
            <div className="mb-8 space-y-4">
                <div>
                    <h1 className="text-3xl font-bold">Ride Suggestions</h1>
                    <p className="text-muted-foreground">Here are some ride offers and requests that match your potential routes.</p>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SuggestionSkeleton key={i} />)
                ) : filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((ride: CombinedRequest) => (
                        <SuggestionCard key={ride.id} ride={ride} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-16">
                        <Search className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h2 className="mt-4 text-2xl font-semibold">{searchTerm ? "No Matching Suggestions" : "No Suggestions Yet"}</h2>
                        <p className="mt-2 text-muted-foreground">
                            {searchTerm ? "Try broadening your search criteria." : "Check back later for new ride offers and requests in your area."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function SuggestionCard({ ride }: { ride: CombinedRequest }) {
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
    
        let newRide: Omit<Ride, 'id'>;
    
        if (ride.type === 'service') { // Current user is Driver, accepting a passenger's request
            newRide = {
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
            };
        } else { // Current user is Passenger, requesting a spot from a driver
            newRide = {
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
        }
    
        try {
            const ridesCollection = collection(firestore, "rides");
            await addDoc(ridesCollection, newRide);
    
            // Update the status of the original request to 'matched'
            const requestRef = doc(firestore, ride.type === 'service' ? 'serviceRequests' : 'pickupRequests', ride.id);
            await updateDoc(requestRef, { status: 'matched' });
    
            toast({
                title: "Success!",
                description: ride.type === 'service' ? "Ride accepted! The user will be notified." : "Request sent! You'll be notified when the driver responds.",
            });
        } catch (error) {
            console.error("Error creating ride:", error);
            const contextualError = new FirestorePermissionError({
              path: 'rides',
              operation: 'create',
              requestResourceData: newRide
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsSubmitting(false);
        }
    }

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
                        {ride.type === 'pickup' ? 'Offering' : 'Needs Ride'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold truncate">
                    <span className="truncate">{fromLocation}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{toLocation}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                   {new Date(ride.dateTime).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                    })}
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm font-medium">
                    {ride.type === 'pickup' ? <Bike className="h-4 w-4 text-muted-foreground" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                    <span>{ride.type === 'pickup' ? `Vehicle: ${ride.vehicleType}` : 'Passenger request'}</span>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button className="w-full" onClick={handleRequestOrAccept} disabled={isSubmitting || isRejecting}>
                    {isSubmitting ? "Submitting..." : (ride.type === 'pickup' ? 'Send Request' : 'Accept')}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleReject} disabled={isSubmitting || isRejecting}>
                   {isRejecting ? "Rejecting..." : "Reject"}
                </Button>
            </CardFooter>
        </Card>
    );
}

    