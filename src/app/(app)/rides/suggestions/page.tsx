"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Bike, User } from "lucide-react";
import Link from "next/link";
import React from "react";
import { UserProfile, PickupRequest, ServiceRequest } from "@/lib/schemas";
import { placeholderImages } from "@/lib/placeholder-images";

const suggestionsWithUsers = [
    { id: 's1', type: 'pickup', startingLocation: 'Juhu, Mumbai', destination: 'Powai, Mumbai', dateTime: '2024-08-16T18:00:00.000Z', user: { name: 'Sunita', city: 'Mumbai' }, vehicleType: 'Scooty' },
    { id: 's2', type: 'service', pickupLocation: 'Andheri West', destination: 'Bandra Kurla Complex', dateTime: '2024-08-17T09:00:00.000Z', user: { name: 'Rani', city: 'Mumbai' } },
    { id: 's3', type: 'pickup', startingLocation: 'Dadar', destination: 'Lower Parel', dateTime: '2024-08-18T14:00:00.000Z', user: { name: 'Geeta', city: 'Mumbai' }, vehicleType: 'Bike' },
    { id: 's4', type: 'service', pickupLocation: 'Thane', destination: 'Vashi', dateTime: '2024-08-19T11:00:00.000Z', user: { name: 'Pooja', city: 'Thane' } },
];


export default function SuggestionsPage() {
    
    return (
        <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Ride Suggestions</h1>
                <p className="text-muted-foreground">Here are some ride offers and requests that match your potential routes.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suggestionsWithUsers.length > 0 ? suggestionsWithUsers.map((ride: any) => (
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
                                <span>{ride.type === 'pickup' ? ride.startingLocation : ride.pickupLocation}</span>
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
                )) : (
                    <p>No ride suggestions found at the moment. Check back later!</p>
                )}
            </div>
        </div>
    );
}
