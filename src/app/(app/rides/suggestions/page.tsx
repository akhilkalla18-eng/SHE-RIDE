
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
import { UserProfile, Ride } from "@/lib/schemas";
import { ArrowRight, Bike, Search, User as UserIcon, Coins } from "lucide-react";
import React from "react";
import { collection, query, where, doc, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


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

    // Query for ride offers from other drivers
    const rideOffersQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
          collection(firestore, "rides"), 
          where("status", "==", "offering")
        );
    }, [firestore, user]);
    const {data: rideOffers, isLoading: areOffersLoading} = useCollection<Ride>(rideOffersQuery);

    // Query for ride requests from other passengers
    const rideRequestsQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
          collection(firestore, "rides"), 
          where("status", "==", "pending"),
          where("driverId", "==", null) // Only show requests that haven't been picked up
        );
    }, [firestore, user]);
    const {data: rideRequests, isLoading: areRequestsLoading} = useCollection<Ride>(rideRequestsQuery);
    
    // Filtered lists for rendering
    const filteredRideOffers = React.useMemo(() => {
        if (!rideOffers || !user) return [];
        const offers = rideOffers.filter(ride => ride.driverId !== user.uid);
        if (!searchTerm.trim()) return offers;
        return offers.filter(ride => 
            ride.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) || 
            ride.toLocation.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rideOffers, searchTerm, user]);
    
    const filteredRideRequests = React.useMemo(() => {
        if (!rideRequests || !user) return [];
        const requests = rideRequests.filter(ride => ride.passengerId !== user.uid);
        if (!searchTerm.trim()) return requests;
        return requests.filter(ride => 
            ride.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) || 
            ride.toLocation.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rideRequests, searchTerm, user]);

    const isLoading = areOffersLoading || areRequestsLoading || isUserLoading;

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
                    <TabsTrigger value="requests">Passengers Seeking Rides</TabsTrigger>
                    <TabsTrigger value="offers">Drivers Offering Rides</TabsTrigger>
                </TabsList>
                
                <TabsContent value="requests" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => <SuggestionSkeleton key={i} />)
                        ) : filteredRideRequests.length > 0 ? (
                            filteredRideRequests.map((ride) => (
                                <SuggestionCard key={ride.id} ride={ride} type="request" />
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
                                <SuggestionCard key={ride.id} ride={ride} type="offer" />
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

function SuggestionCard({ ride, type }: { ride: Ride, type: 'offer' | 'request' }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const userProfileId = type === 'offer' ? ride.driverId : ride.passengerId;
    const userProfileRef = React.useMemo(() => {
        if (!firestore || !userProfileId) return null;
        return doc(firestore, 'users', userProfileId);
    }, [firestore, userProfileId]);

    const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

    const handleAction = async () => {
        if (!user || !firestore) {
            toast({ variant: "destructive", title: "You must be logged in." });
            return;
        }
        setIsSubmitting(true);
    
        const rideRef = doc(firestore, 'rides', ride.id);
    
        try {
            if (type === 'request') { // Current user is Driver, accepting a passenger's request
                const otp = Math.floor(1000 + Math.random() * 9000).toString();
                await updateDoc(rideRef, {
                    driverId: user.uid,
                    participantIds: arrayUnion(user.uid),
                    status: 'confirmed',
                    acceptedAt: serverTimestamp(),
                    rideOtp: otp,
                });
                toast({ title: "Ride Accepted!", description: "The ride is now confirmed. Please contact the passenger." });
            } else { // Current user is Passenger, requesting a spot from a driver
                await updateDoc(rideRef, {
                    passengerId: user.uid,
                    participantIds: arrayUnion(user.uid),
                    status: 'pending',
                });
                toast({ title: "Request Sent!", description: "The driver has been notified of your request." });
            }
            router.push('/dashboard');
        } catch (error) {
            console.error("Error handling suggestion action:", error);
            const contextualError = new FirestorePermissionError({
              path: `rides/${ride.id}`,
              operation: 'update',
              requestResourceData: { status: type === 'request' ? 'confirmed' : 'pending' }
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    // A passenger can't request a ride they've already requested.
    const hasRequested = type === 'offer' && ride.participantIds.includes(user?.uid || '');

    const isButtonDisabled = isSubmitting || hasRequested;
    const buttonText = isSubmitting 
        ? "Submitting..." 
        : (type === 'offer' 
            ? (hasRequested ? 'Request Sent' : 'Request Ride') 
            : 'Accept Ride');

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
                    <Badge variant={type === 'offer' ? 'secondary' : 'outline'}>
                        {type === 'offer' ? 'Offering Ride' : 'Needs Ride'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold truncate">
                    <span className="truncate">{ride.fromLocation}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{ride.toLocation}</span>
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
                        {type === 'offer'
                            ? `Contribution: ₹${ride.sharedCost || 0}`
                            : `Offering: ₹${ride.sharedCost}`}
                    </span>
                </div>
                {type === 'offer' && ride.vehicleType && (
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Bike className="h-4 w-4 text-muted-foreground" />
                        <span>Vehicle: {ride.vehicleType}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button className="w-full" onClick={handleAction} disabled={isButtonDisabled}>
                    {buttonText}
                </Button>
            </CardFooter>
        </Card>
    );
}
