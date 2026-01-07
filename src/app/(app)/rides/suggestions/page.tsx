"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, doc, getDoc, query, where, limit } from "firebase/firestore";
import { ArrowRight, Bike, User } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { UserProfile, PickupRequest, ServiceRequest } from "@/lib/schemas";
import { placeholderImages } from "@/lib/placeholder-images";

type Suggestion = (PickupRequest | ServiceRequest) & { user: UserProfile; type: 'pickup' | 'service' };

export default function SuggestionsPage() {
    const { firestore, user: currentUser, isUserLoading } = useFirebase();

    // Fetch ride suggestions from public collections
    const pickupSuggestionsQuery = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return query(
            collection(firestore, "pickupRequests"),
            where("status", "==", "open"),
            where("riderId", "!=", currentUser.uid)
        );
    }, [currentUser, firestore]);
    const { data: pickupSuggestions, isLoading: pickupLoading } = useCollection<PickupRequest>(pickupSuggestionsQuery);

    const serviceSuggestionsQuery = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return query(
            collection(firestore, "serviceRequests"),
            where("status", "==", "open"),
            where("passengerId", "!=", currentUser.uid)
        );
    }, [currentUser, firestore]);
    const { data: serviceSuggestions, isLoading: serviceLoading } = useCollection<ServiceRequest>(serviceSuggestionsQuery);

    const [suggestionsWithUsers, setSuggestionsWithUsers] = useState<Suggestion[]>([]);

    // Effect to combine suggestions and fetch user data
    useEffect(() => {
        if (pickupLoading || serviceLoading || !firestore) return;

        const fetchUsers = async () => {
            const allSuggestions = [
                ...(pickupSuggestions || []).map(r => ({ ...r, type: 'pickup' as const })),
                ...(serviceSuggestions || []).map(r => ({ ...r, type: 'service' as const }))
            ];

            const populatedSuggestions = await Promise.all(
                allSuggestions.map(async (req) => {
                    const userId = req.type === 'pickup' ? req.riderId : req.passengerId;
                    const userDocRef = doc(firestore, "users", userId);
                    const userDoc = await getDoc(userDocRef);
                    const user = userDoc.exists() ? userDoc.data() as UserProfile : {} as UserProfile;
                    return { ...req, user };
                })
            );
            setSuggestionsWithUsers(populatedSuggestions as Suggestion[]);
        };

        fetchUsers();
    }, [pickupSuggestions, serviceSuggestions, firestore, pickupLoading, serviceLoading]);

    if (isUserLoading || pickupLoading || serviceLoading) {
        return <div className="flex items-center justify-center h-full"><p>Loading suggestions...</p></div>
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
                {suggestionsWithUsers.length > 0 ? suggestionsWithUsers.map(ride => (
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
                                <span>{ride.type === 'pickup' ? ride.startingLocation : (ride as ServiceRequest).pickupLocation}</span>
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
                                <span>{ride.type === 'pickup' ? `Vehicle: ${(ride as PickupRequest).vehicleType}` : 'Passenger request'}</span>
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
