
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/lib/schemas";
import { CheckCircle, Shield } from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useStorage } from "@/firebase";
import { doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();

    const [fileToUpload, setFileToUpload] = React.useState<File | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userProfileRef) return;
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const updatedData = {
            name: formData.get("name") as string,
            city: formData.get("city") as string,
        };
        
        updateDocumentNonBlocking(userProfileRef, updatedData);
        
        toast({ title: "Profile update request sent!" });
        setTimeout(() => setIsSaving(false), 1000);
    }

    const handleSafetyUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userProfileRef) return;
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const emergencyName = formData.get("emergency-name") as string;
        const emergencyPhone = formData.get("emergency-phone") as string;
        
        const updatedData = {
            emergencyContact: `${emergencyName} (${emergencyPhone})`,
        };

        updateDocumentNonBlocking(userProfileRef, updatedData);

        toast({ title: "Safety info update request sent!" });
        setTimeout(() => setIsSaving(false), 1000);
    }

    const handleVerificationUpload = async () => {
        if (!fileToUpload || !user || !storage || !userProfileRef) return;

        setIsUploading(true);
        const storageRef = ref(storage, `verification-docs/${user.uid}/${fileToUpload.name}`);

        try {
            const uploadTask = await uploadBytes(storageRef, fileToUpload);
            const downloadURL = await getDownloadURL(uploadTask.ref);

            const updatedData = {
                drivingLicenseId: downloadURL,
            };
            updateDocumentNonBlocking(userProfileRef, updatedData);

            toast({
                title: "ID Uploaded Successfully",
                description: "Your document has been submitted for verification.",
            });
            setFileToUpload(null);

        } catch (error) {
            console.error("File upload error:", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: "There was an error uploading your document. Please try again.",
            });
        } finally {
            setIsUploading(false);
        }
    };


    if (isUserLoading || isProfileLoading) {
        return (
            <div className="grid gap-6 max-w-4xl mx-auto animate-pulse">
                <div className="flex flex-col items-center gap-4 md:flex-row">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2 text-center md:text-left">
                        <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                        <Skeleton className="h-5 w-24 mx-auto md:mx-0" />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Manage your account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-24 ml-auto" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Safety &amp; Verification</CardTitle>
                        <CardDescription>Manage your emergency contacts and verification status.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                       <Skeleton className="h-24 w-full" />
                       <Skeleton className="h-10 w-36 ml-auto" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!profile) return (
        <div className="text-center py-10">
            <h2 className="text-2xl font-semibold">Profile Not Found</h2>
            <p className="text-muted-foreground mt-2">We couldn't find your profile data. Please try logging out and back in.</p>
        </div>
    )

    return (
        <div className="grid gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-4 md:flex-row">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.photoURL || undefined} alt={profile.name} />
                    <AvatarFallback>{profile.name?.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <h1 className="text-3xl font-bold">{profile.name}</h1>
                        {profile.profileVerified && (
                             <Badge variant="secondary" className="gap-1 pl-2">
                                <CheckCircle className="h-3 w-3" /> Verified
                             </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">{profile.city}</p>
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
                                <Input id="name" name="name" defaultValue={profile.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" name="city" defaultValue={profile.city} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={profile.email} disabled />
                        </div>
                        <Button className="w-full sm:w-auto ml-auto" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Safety</CardTitle>
                    <CardDescription>Manage your emergency contacts.</CardDescription>
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
                                            <Input name="emergency-name" id="emergency-name" placeholder="e.g., Rohan Sharma" defaultValue={profile.emergencyContact?.split(' (')[0] || ''}/>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="emergency-phone">Contact Phone</Label>
                                            <Input name="emergency-phone" id="emergency-phone" type="tel" placeholder="+91 98765 12345" defaultValue={profile.emergencyContact?.split(' (')[1]?.replace(')','') || ''} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button className="w-full sm:w-auto ml-auto" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Update Safety Info"}</Button>
                    </form>
                </CardContent>
            </Card>

            {!profile.profileVerified && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Get Verified</CardTitle>
                        <CardDescription>Upload an ID to get a 'Verified' badge on your profile for extra trust.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="id-upload">Aadhaar / Driving License</Label>
                            <Input
                                id="id-upload"
                                type="file"
                                onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                                accept="image/*,.pdf"
                            />
                        </div>
                        <Button
                            className="w-full sm:w-auto ml-auto"
                            onClick={handleVerificationUpload}
                            disabled={isUploading || !fileToUpload}
                        >
                            {isUploading ? "Uploading..." : "Upload for Verification"}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
