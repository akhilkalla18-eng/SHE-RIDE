
"use client"

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Ride } from "@/lib/schemas";
import { Loader2 } from "lucide-react";
import { placeholderImages } from "@/lib/placeholder-images";


export default function CreatePickupPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const heroImage = placeholderImages.find(p => p.id === 'create-pickup-hero');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !firestore) {
            toast({
                variant: "destructive",
                title: "Not Logged In",
                description: "You must be logged in to offer a ride.",
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const date = formData.get("date") as string;
        const time = formData.get("time") as string;

        const newRideOffer: Omit<Ride, "id"> = {
            driverId: user.uid,
            passengerId: null,
            participantIds: [user.uid],
            status: 'offering',
            fromLocation: formData.get("start-location") as string,
            toLocation: formData.get("destination") as string,
            dateTime: new Date(`${date}T${time}`).toISOString(),
            vehicleType: formData.get("vehicle-type") as 'Bike' | 'Scooty',
            sharedCost: Number(formData.get("cost")) || 0,
            createdAt: serverTimestamp(),
            otpVerified: false,
            riderStarted: false,
            passengerStarted: false,
            riderCompleted: false,
            passengerCompleted: false,
        };

        try {
            await addDoc(collection(firestore, "rides"), newRideOffer);
            toast({
                title: "Ride Offer Created",
                description: "Your ride offer has been posted. We'll notify you about matching requests.",
            });
            router.push("/dashboard");
        } catch (error) {
            console.error("Error creating ride offer:", error);
            const contextualError = new FirestorePermissionError({
              path: 'rides',
              operation: 'create',
              requestResourceData: newRideOffer
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Offer a Ride</CardTitle>
                        <CardDescription>Let others know your travel plans and share the journey.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start-location">Starting Location</Label>
                                    <Input name="start-location" id="start-location" placeholder="e.g., Juhu, Mumbai" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="destination">Destination</Label>
                                    <Input name="destination" id="destination" placeholder="e.g., Powai, Mumbai" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input name="date" id="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="time">Time</Label>
                                    <Input name="time" id="time" type="time" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="grid gap-2">
                                    <Label htmlFor="vehicle-type">Vehicle Type</Label>
                                    <Select name="vehicle-type" required>
                                        <SelectTrigger id="vehicle-type">
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bike">Bike</SelectItem>
                                            <SelectItem value="Scooty">Scooty</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="cost">Expected Contribution (Optional)</Label>
                                    <Input name="cost" id="cost" type="number" placeholder="e.g., 50 for fuel" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full md:w-auto md:ml-auto" disabled={isSubmitting || isUserLoading}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? "Posting..." : "Create Ride Offer"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
             <div className="hidden md:flex items-center justify-center p-8">
                {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        width={400}
                        height={400}
                        className="rounded-xl object-cover shadow-2xl aspect-square"
                        data-ai-hint={heroImage.imageHint}
                    />
                )}
            </div>
        </div>
    );
}
