
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { placeholderImages } from "@/lib/placeholder-images";
import { UserProfile, PickupRequest, ServiceRequest } from "@/lib/schemas";
import { ArrowRight, Bike, Search, User } from "lucide-react";
import Link from "next/link";
import React from "react";
import { collection, query, where, doc } from "firebase/firestore";

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

    const pickupRequestsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "pickupRequests"), where("status", "==", "open"));
    }, [firestore]);
    const {data: pickupRequests, isLoading: arePickupsLoading} = useCollection<PickupRequest>(pickupRequestsQuery);

    const serviceRequestsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "serviceRequests"), where("status", "==", "open"));
    }, [firestore]);
    const {data: serviceRequests, isLoading: areServicesLoading} = useCollection<ServiceRequest>(serviceRequestsQuery);

    const suggestions = React.useMemo(() => {
        if (!user || (!pickupRequests && !serviceRequests)) return [];
        
        const otherPickups = pickupRequests?.filter(r => r.userProfileId !== user.uid) || [];
        const otherServices = serviceRequests?.filter(r => r.userProfileId !== user.uid) || [];

        const combined: CombinedRequest[] = [
            ...(otherPickups.map(r => ({ ...r, type: 'pickup' as const }))),
            ...(otherServices.map(r => ({ ...r, type: 'service' as const })))
        ];

        return combined
            // @ts-ignore
            .sort((a, b) => new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0));

    }, [pickupRequests, serviceRequests, user]);

    const isLoading = arePickupsLoading || areServicesLoading || isUserLoading;

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Ride Suggestions</h1>
                <p className="text-muted-foreground">Here are some ride offers and requests that match your potential routes.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SuggestionSkeleton key={i} />)
                ) : suggestions.length > 0 ? (
                    suggestions.map((ride: CombinedRequest) => (
                        <SuggestionCard key={ride.id} ride={ride} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-16">
                        <Search className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h2 className="mt-4 text-2xl font-semibold">No Suggestions Yet</h2>
                        <p className="mt-2 text-muted-foreground">Check back later for new ride offers and requests in your area.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function SuggestionCard({ ride }: { ride: CombinedRequest }) {
    const firestore = useFirestore();
    const userProfileRef = React.useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'users', ride.userProfileId);
    }, [firestore, ride.userProfileId]);

    const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

    const fromLocation = ride.type === 'pickup' ? ride.startingLocation : ride.pickupLocation;
    const toLocation = ride.destination;

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
                    {ride.type === 'pickup' ? <Bike className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                    <span>{ride.type === 'pickup' ? `Vehicle: ${ride.vehicleType}` : 'Passenger request'}</span>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button className="w-full">Send Request</Button>
                <Button variant="outline" asChild>
                   <Link href="/route-optimizer">Optimize</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

    