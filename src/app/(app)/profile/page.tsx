import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentUser } from "@/lib/data";
import { CheckCircle, Shield } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="grid gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-4 md:flex-row">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <h1 className="text-3xl font-bold">{currentUser.name}</h1>
                        {currentUser.isVerified && (
                             <Badge variant="secondary" className="gap-1 pl-2">
                                <CheckCircle className="h-3 w-3" /> Verified
                             </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">{currentUser.city}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Manage your account details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" defaultValue={currentUser.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" defaultValue={currentUser.city} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue="priya.sharma@email.com" disabled />
                        </div>
                        <Button className="w-full sm:w-auto ml-auto">Save Changes</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Safety &amp; Verification</CardTitle>
                    <CardDescription>Manage your emergency contacts and verification status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4">
                        <div className="rounded-lg border bg-card text-card-foreground p-4">
                            <div className="flex items-start gap-4">
                                <Shield className="h-8 w-8 text-primary mt-1" />
                                <div>
                                    <h3 className="font-semibold">Emergency Contact</h3>
                                    <p className="text-sm text-muted-foreground mb-2">This person will be notified when you use the SOS button.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="emergency-name">Contact Name</Label>
                                            <Input id="emergency-name" placeholder="e.g., Rohan Sharma" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="emergency-phone">Contact Phone</Label>
                                            <Input id="emergency-phone" type="tel" placeholder="+91 98765 12345" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {!currentUser.isVerified && (
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
                        <Button className="w-full sm:w-auto ml-auto">Update Safety Info</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
