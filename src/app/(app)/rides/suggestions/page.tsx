import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { rideRequests } from "@/lib/data";
import { ArrowRight, Bike, User } from "lucide-react";
import Link from "next/link";

export default function SuggestionsPage() {
    const suggestions = rideRequests.filter(r => r.status === 'open');
  return (
    <div className="container mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold">Ride Suggestions</h1>
            <p className="text-muted-foreground">Here are some ride offers and requests that match your potential routes.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.map(ride => (
                <Card key={ride.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={ride.user.avatarUrl} />
                                    <AvatarFallback>{ride.user.name.charAt(0)}</AvatarFallback>
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
                            <span>{ride.startLocation}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span>{ride.destination}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                           {ride.dateTime.toLocaleString('en-US', {
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
            ))}
        </div>
    </div>
  );
}
