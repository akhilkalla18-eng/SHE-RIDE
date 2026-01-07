"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UserProfile } from "@/lib/schemas";
import { CheckCircle, Shield } from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { placeholderImages } from "@/lib/placeholder-images";

const userProfile: UserProfile = {
    id: "1",
    name: "Priya Sharma",
    email: "priya@example.com",
    city: "Mumbai",
    phoneNumber: "+91 98765 43210",
    profileVerified: true,
    emergencyContact: "Rohan Sharma (+91 98765 12345)"
};

export default function ProfilePage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        toast({ title: "Profile update request sent!" });
        setTimeout(() => setIsLoading(false), 1000);
    }

    const handleSafetyUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        toast({ title: "Safety info update request sent!" });
        setTimeout(() => setIsLoading(false), 1000);
    }

    return (
        <div className="grid gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-4 md:flex-row">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={placeholderImages.find(p => p.id === 'avatar1')?.imageUrl} alt={userProfile.name} />
                    <AvatarFallback>{userProfile.name?.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <h1 className="text-3xl font-bold">{userProfile.name}</h1>
                        {userProfile.profileVerified && (
                             <Badge variant="secondary" className="gap-1 pl-2">
                                <CheckCircle className="h-3 w-3" /> Verified
                             </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">{userProfile.city}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Manage your account details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4" onSubmit={handleProfileUpdate}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" name="name" defaultValue={userProfile.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" name="city" defaultValue={userProfile.city} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={userProfile.email} disabled />
                        </div>
                        <Button className="w-full sm:w-auto ml-auto" type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Safety &amp; Verification</CardTitle>
                    <CardDescription>Manage your emergency contacts and verification status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4" onSubmit={handleSafetyUpdate}>
                        <div className="rounded-lg border bg-card text-card-foreground p-4">
                            <div className="flex items-start gap-4">
                                <Shield className="h-8 w-8 text-primary mt-1" />
                                <div>
                                    <h3 className="font-semibold">Emergency Contact</h3>
                                    <p className="text-sm text-muted-foreground mb-2">This person will be notified when you use the SOS button.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="emergency-name">Contact Name</Label>
                                            <Input name="emergency-name" id="emergency-name" placeholder="e.g., Rohan Sharma" defaultValue={userProfile.emergencyContact?.split(' (')[0] || ''}/>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="emergency-phone">Contact Phone</Label>
                                            <Input name="emergency-phone" id="emergency-phone" type="tel" placeholder="+91 98765 12345" defaultValue={userProfile.emergencyContact?.split(' (')[1]?.replace(')','') || ''} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {!userProfile.profileVerified && (
                             <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950 p-4">
                                <div className="flex items-start gap-4">
                                    <CheckCircle className="h-6 w-6 text-amber-600 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-amber-800 dark:text-amber-200">Get Verified</h3>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">Upload an ID to get a 'Verified' badge on your profile for extra trust.</p>
                                        <div className="grid gap-2">
                                            <Label htmlFor="id-upload">Aadhaar / College ID</Label>
                                            <Input id="id-upload" type="file" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <Button className="w-full sm:w-auto ml-auto" type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Update Safety Info"}</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
