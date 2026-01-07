"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { RideRequest } from "@/lib/types";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { ArrowRight, Bike, User } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { UserProfile } from "@/lib/schemas";
import { placeholderImages } from "@/lib/placeholder-images";

type RideRequestWithUser = RideRequest & { user: UserProfile, type: 'pickup' | 'service', userId: string };

async function fetchUserForRequest(firestore: any, request: RideRequest & {type: 'pickup' | 'service'}): Promise<RideRequestWithUser> {
    const userId = request.type === 'pickup' ? (request as any).riderId : (request as any).passengerId;
    if (!userId) {
        console.warn("Request without user id", request);
        return { ...request, user: {} as UserProfile, userId: '' };
    }
    const userDocRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userDocRef);
    const user = userDoc.exists() ? userDoc.data() as UserProfile : {} as UserProfile;
    return { ...request, user, userId };
}


export default function SuggestionsPage() {
    const { firestore, user: currentUser, isUserLoading } = useFirebase();
    const [suggestions, setSuggestions] = useState<RideRequestWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!firestore || isUserLoading) return;

        const fetchAll = async () => {
            setLoading(true);
            if (!currentUser) {
                setSuggestions([]);
                setLoading(false);
                return;
            }

            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            const otherUserIds = usersSnapshot.docs.map(d => d.id).filter(id => id !== currentUser.uid);

            const allRequestsPromises: Promise<any>[] = [];

            otherUserIds.forEach(userId => {
                const pickupsRef = collection(firestore, `users/${userId}/pickup_requests`);
                allRequestsPromises.push(getDocs(pickupsRef).then(snapshot => 
                    snapshot.docs.map(doc => ({...(doc.data()), id: doc.id, type: 'pickup' as const}))
                ));

                const servicesRef = collection(firestore, `users/${userId}/service_requests`);
                allRequestsPromises.push(getDocs(servicesRef).then(snapshot => 
                    snapshot.docs.map(doc => ({...(doc.data()), id: doc.id, type: 'service' as const}))
                ));
            });

            const results = await Promise.all(allRequestsPromises);
            const allRequests = results.flat().filter(r => r.status === 'open');

            const suggestionsWithUsers = await Promise.all(
                allRequests.map(req => fetchUserForRequest(firestore, req))
            );

            setSuggestions(suggestionsWithUsers);
            setLoading(false);
        }
        fetchAll();

    }, [firestore, currentUser, isUserLoading]);


    if (loading || isUserLoading) {
        return <div>Loading suggestions...</div>
    }

    if (!currentUser) {
        return <div>Please log in to see suggestions.</div>
    }

    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Ride Suggestions</h1>
                <p className="text-muted-foreground">Here are some ride offers and requests that match your potential routes.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suggestions.length > 0 ? suggestions.map(ride => (
                    <Card key={ride.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={placeholderImages.find(p => p.id === 'avatar2')?.imageUrl} />
                                        <AvatarFallback>{ride.user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{ride.user.name}</CardTitle>
                                        <CardDescription>{ride.user.city}</CardDescription>
                                    </div>
                                </div>
                                <Badge variant={ride.type === 'pickup' ? 'secondary' : 'outline'}>
                                    {ride.type === 'pickup' ? 'Offering Ride' : 'Needs Ride'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex items-center gap-4 text-sm font-semibold">
                                <span>{ride.startLocation || (ride as any).pickupLocation}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span>{ride.destination}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                               {new Date(ride.dateTime).toLocaleString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric'
                                })}
                            </p>
                            <div className="flex items-center gap-2 mt-4 text-sm">
                                {ride.type === 'pickup' ? <Bike className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                <span>{ride.vehicleType ? `Vehicle: ${ride.vehicleType}` : 'Passenger request'}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button className="w-full">Send Request</Button>
                            <Button variant="outline" asChild>
                               <Link href="/route-optimizer">Optimize</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )) : (
                    <p>No ride suggestions found at the moment. Check back later!</p>
                )}
            </div>
        </div>
    );
}
