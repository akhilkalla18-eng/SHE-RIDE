"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function CreatePickupPage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        toast({
            title: "Pickup Request Created",
            description: "Your ride offer has been posted. We'll notify you about matching requests.",
        });
        router.push("/dashboard");
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
                                        <SelectItem value="bike">Bike</SelectItem>
                                        <SelectItem value="scooty">Scooty</SelectItem>
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
                        <Button type="submit" className="w-full md:w-auto md:ml-auto">Create Pickup Request</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
