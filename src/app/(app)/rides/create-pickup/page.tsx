"use client"

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { PickupRequest } from "@/lib/schemas";
import { Loader2 } from "lucide-react";


export default function CreatePickupPage() {
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
                description: "You must be logged in to offer a ride.",
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const date = formData.get("date") as string;
        const time = formData.get("time") as string;

        const newRequest: Omit<PickupRequest, "id"> = {
            userProfileId: user.uid,
            startingLocation: formData.get("start-location") as string,
            destination: formData.get("destination") as string,
            dateTime: new Date(`${date}T${time}`).toISOString(),
            vehicleType: formData.get("vehicle-type") as 'Bike' | 'Scooty',
            seatsAvailable: 1,
            expectedCost: Number(formData.get("cost")) || 0,
            routePreference: formData.get("route") as string || '',
            status: 'open',
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(firestore, "pickupRequests"), newRequest);
            toast({
                title: "Pickup Request Created",
                description: "Your ride offer has been posted. We'll notify you about matching requests.",
            });
            router.push("/dashboard");
        } catch (error) {
            console.error("Error creating pickup request:", error);
            const contextualError = new FirestorePermissionError({
              path: 'pickupRequests',
              operation: 'create',
              requestResourceData: newRequest
            });
            errorEmitter.emit('permission-error', contextualError);
            // A toast is not required here because the FirebaseErrorListener
            // will catch the emitted error and display a detailed overlay.
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
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
                                <Label htmlFor="seats">Seats Available</Label>
                                <Input id="seats" type="number" defaultValue={1} disabled />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cost">Expected Contribution (Optional)</Label>
                            <Input name="cost" id="cost" type="number" placeholder="e.g., 50 for fuel" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="route">Route Preference (Optional)</Label>
                            <Input name="route" id="route" placeholder="e.g., Via Western Express Highway" />
                        </div>
                        <Button type="submit" className="w-full md:w-auto md:ml-auto" disabled={isSubmitting || isUserLoading}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Posting..." : "Create Pickup Request"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
