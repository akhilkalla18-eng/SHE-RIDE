
"use client"

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import type { Ride } from "@/lib/schemas";
import { Loader2 } from "lucide-react";

export default function CreateServicePage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !firestore) {
            toast({
                variant: "destructive",
                title: "Not Logged In",
                description: "You must be logged in to request a ride.",
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const date = formData.get("date") as string;
        const time = formData.get("time") as string;
        const rideDateTime = new Date(`${date}T${time}`).toISOString();
        
        const pickupLocation = formData.get("pickup-location") as string;
        const destination = formData.get("destination") as string;
        const maxAmount = Number(formData.get("max-amount")) || 0;

        const newRideRequest: Omit<Ride, "id"> = {
            driverId: null,
            passengerId: user.uid,
            participantIds: [user.uid],
            status: 'pending',
            fromLocation: pickupLocation,
            toLocation: destination,
            dateTime: rideDateTime,
            sharedCost: maxAmount,
            createdAt: serverTimestamp(),
            // Set default values for lifecycle fields
            otpVerified: false,
            riderStarted: false,
            passengerStarted: false,
            riderCompleted: false,
            passengerCompleted: false,
        };

        try {
            await addDoc(collection(firestore, "rides"), newRideRequest);
            toast({
                title: "Ride Request Created",
                description: "Your ride request has been posted and is now visible in your dashboard.",
            });
            router.push("/dashboard");
        } catch (error) {
            console.error("Error creating ride request:", error);
             const contextualError = new FirestorePermissionError({
              path: `rides`,
              operation: 'create',
              requestResourceData: newRideRequest
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Request a Ride</CardTitle>
                    <CardDescription>Find a woman traveling on the same route as you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="pickup-location">Pickup Location</Label>
                                <Input name="pickup-location" id="pickup-location" placeholder="e.g., Andheri West" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="destination">Destination</Label>
                                <Input name="destination" id="destination" placeholder="e.g., Bandra Kurla Complex" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input name="date" id="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="time">Time</Label>
                                <Input name="time" id="time" type="time" required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="max-amount">Max Amount Willing to Pay</Label>
                            <Input name="max-amount" id="max-amount" type="number" placeholder="e.g., 75" required />
                        </div>
                        <Button type="submit" className="w-full md:w-auto md:ml-auto" disabled={isSubmitting || isUserLoading}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Posting..." : "Post Ride Request"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
