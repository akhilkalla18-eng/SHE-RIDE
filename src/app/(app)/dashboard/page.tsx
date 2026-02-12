
"use client"

import Link from "next/link"
import React from "react"
import {
  Activity,
  ArrowUpRight,
  Bike,
  Users,
  Car,
  Search,
  Hourglass,
  CheckCircle,
  PartyPopper,
  CircleDot,
  MessageSquare,
  XCircle,
  Loader2,
  LockKeyhole,
  Rocket,
} from "lucide-react"
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
  } from "recharts"
import { doc, collection, query, where, writeBatch, serverTimestamp, getDocs, getDoc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase"
import type { UserProfile, Ride, Notification, RideRequest } from "@/lib/schemas"
import { placeholderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const EmptyState = ({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) => (
    <div className="text-center py-8">
        <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
);


export default function Dashboard() {
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const activeStatuses: Ride['status'][] = ["pending", "confirmed", "in-progress", "offering"];

    const userProfileRef = React.useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);
    const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    // Get all rides where the user is a participant
    const allMyRidesQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, "rides"), where("participantIds", "array-contains", user.uid));
    }, [firestore, user]);
    const { data: allMyRides, isLoading: areAllMyRidesLoading } = useCollection<Ride>(allMyRidesQuery);

    // Get all open ride offers and requests for the suggestions count
    const openRidesForSuggestionsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "rides"), where("status", "in", ["offering", "pending"]));
    }, [firestore]);
    const { data: openRidesForSuggestions, isLoading: areSuggestionsLoading } = useCollection<Ride>(openRidesForSuggestionsQuery);
    
    // The latest ride the user is driving (or has offered)
    const myDrivingRidesQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, "rides"),
            where("driverId", "==", user.uid),
            where("status", "in", ["offering", "pending", "confirmed", "in-progress"])
        );
    }, [firestore, user]);
    const { data: myDrivingRides, isLoading: areMyDrivingRidesLoading } = useCollection<Ride>(myDrivingRidesQuery);
    
    // The latest rides where user is a passenger (confirmed/active) OR it's their own open request
    const myPassengerRidesQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, "rides"), 
            where("passengerId", "==", user.uid),
            where("status", "in", ["pending", "confirmed", "in-progress"])
        );
    }, [firestore, user]);
    const { data: myPassengerRides, isLoading: areMyPassengerRidesLoading } = useCollection<Ride>(myPassengerRidesQuery);

    // The latest requests the user has SENT for other people's rides
    const mySentRequestsQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, "rideRequests"), where("passengerId", "==", user.uid), where("status", "==", "pending"));
    }, [firestore, user]);
    const { data: mySentRequests, isLoading: areMySentRequestsLoading } = useCollection<RideRequest>(mySentRequestsQuery);


    const latestDrivingRide = React.useMemo(() => {
        if (!myDrivingRides || myDrivingRides.length === 0) return null;
        return myDrivingRides.sort((a,b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))[0];
    }, [myDrivingRides]);
    
    // Combine open requests (in `rides` table) and sent requests (in `rideRequests` table)
    const latestRequestedItem = React.useMemo(() => {
        const latestPassengerRide = myPassengerRides?.sort((a,b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))[0];
        const latestSentRequest = mySentRequests?.sort((a,b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))[0];
       
        if (!latestPassengerRide && !latestSentRequest) return null;
        if (!latestPassengerRide) return latestSentRequest;
        if (!latestSentRequest) return latestPassengerRide;

        // Return whichever is newer
        const rideTime = latestPassengerRide.createdAt?.toDate?.()?.getTime() || 0;
        const requestTime = latestSentRequest.createdAt?.toDate?.()?.getTime() || 0;
        return rideTime > requestTime ? latestPassengerRide : latestSentRequest;
    }, [myPassengerRides, mySentRequests]);


    const upcomingRides = React.useMemo(() => {
        const allUpcoming = allMyRides?.filter(r => ["pending", "confirmed", "in-progress", "offering"].includes(r.status)) || [];
        if (!searchTerm.trim()) {
            return allUpcoming;
        }
        return allUpcoming.filter(ride =>
            ride.toLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ride.fromLocation.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allMyRides, searchTerm]);

    const completedRidesCount = React.useMemo(() => allMyRides?.filter(r => r.status === 'completed').length || 0, [allMyRides]);
    
    const newSuggestionsCount = React.useMemo(() => {
        if(!user || !openRidesForSuggestions) return 0;
        return openRidesForSuggestions.filter(r => !r.participantIds.includes(user.uid)).length;
    }, [openRidesForSuggestions, user]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setChartData([
                { name: "Jan", total: Math.floor(Math.random() * 20) + 5 },
                { name: "Feb", total: Math.floor(Math.random() * 20) + 5 },
                { name: "Mar", total: Math.floor(Math.random() * 20) + 5 },
                { name: "Apr", total: Math.floor(Math.random() * 20) + 5 },
                { name: "May", total: Math.floor(Math.random() * 20) + 5 },
                { name: "Jun", total: Math.floor(Math.random() * 20) + 5 },
            ]);
        }
    }, []);

    const isLoading = isUserLoading || isProfileLoading || areMyDrivingRidesLoading || areMyPassengerRidesLoading || areAllMyRidesLoading || areSuggestionsLoading || areMySentRequestsLoading;

  return (
    <div className="flex flex-col gap-4 md:gap-8">
        <div className="space-y-1.5">
            {isLoading ? (
                <>
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-80" />
                </>
            ) : (
                <>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tighter">Welcome back, {profile?.name || 'User'}!</h1>
                    <p className="text-muted-foreground">Here's what's happening on SheRide today.</p>
                </>
            )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Rides
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {areAllMyRidesLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{completedRidesCount}</div> }
              <p className="text-xs text-muted-foreground">
                completed by you
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Suggestions
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {areSuggestionsLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{newSuggestionsCount}</div> }
              <p className="text-xs text-muted-foreground">
                Potential rides waiting
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Rides</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {areAllMyRidesLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{upcomingRides.length}</div> }
              <p className="text-xs text-muted-foreground">
                Ready for your next journey
              </p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Rides</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <MyRideStatusCard 
                offeredRide={latestDrivingRide}
                requestedItem={latestRequestedItem}
                isLoading={isLoading}
            />
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="grid gap-2">
                    <CardTitle>Upcoming &amp; Active Rides</CardTitle>
                    <CardDescription>
                    Your scheduled journeys and pending requests.
                    </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1 shrink-0">
                    <Link href="/rides/suggestions">
                    Find More Rides
                    <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
              </div>
              <div className="relative mt-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Search by location..."
                      className="w-full pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
            </CardHeader>
            <CardContent>
                {areAllMyRidesLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : upcomingRides.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead className="hidden sm:table-cell">Participants</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingRides.map((ride: Ride) => (
                         <TableRow key={ride.id}>
                            <TableCell>
                                <Badge variant={ride.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">{ride.status.replace('_', ' ')}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                                {new Date(ride.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                            </TableCell>
                             <TableCell className="hidden sm:table-cell">
                                <AvatarGroup userIds={ride.participantIds} />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={`/rides/${ride.id}`}>View</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                    <EmptyState 
                        title={searchTerm ? "No Matching Rides Found" : "No Upcoming or Requested Rides."}
                        description={searchTerm ? "Your search did not match any upcoming or requested rides." : "You don't have any active rides yet. Find one to get started!"}
                        icon={searchTerm ? Search : Car}
                    />
                )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}

function MyRideStatusCard({
    offeredRide,
    requestedItem,
    isLoading,
}: {
    offeredRide: Ride | null;
    requestedItem: Ride | RideRequest | null;
    isLoading: boolean;
}) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Ride Status</CardTitle>
                    <CardDescription>Track the progress of your offered and requested rides.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full mt-4" />
                </CardContent>
            </Card>
        );
    }

    if (!offeredRide && !requestedItem) {
        return (
            <Card className="flex flex-col items-center justify-center min-h-[300px] md:min-h-full">
                <CardHeader className="text-center">
                    <CardTitle>My Ride Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        title="No Active Rides"
                        description="You haven't offered or requested any rides yet."
                        icon={CircleDot}
                    />
                </CardContent>
                 <CardFooter>
                    <Button asChild>
                        <Link href="/rides/create-pickup">Offer a Ride</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    const defaultTab = offeredRide ? 'offered' : 'requested';

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Ride Status</CardTitle>
                <CardDescription>Track the progress of your offered and requested rides.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="offered" disabled={!offeredRide}>Rides Offered</TabsTrigger>
                        <TabsTrigger value="requested" disabled={!requestedItem}>Rides Requested</TabsTrigger>
                    </TabsList>
                    <TabsContent value="offered" className="mt-4">
                        {offeredRide ? (
                            <OfferedRideView ride={offeredRide} />
                        ) : (
                            <div className="py-8 text-center">
                                 <EmptyState
                                    title="No Rides Offered"
                                    description="You haven't offered any active rides yet."
                                    icon={CircleDot}
                                />
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="requested" className="mt-4">
                        {requestedItem ? (
                            <RequestedRideView item={requestedItem} />
                        ) : (
                             <div className="py-8 text-center">
                                <EmptyState
                                    title="No Rides Requested"
                                    description="You don't have any active ride requests."
                                    icon={Search}
                                />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

function RequestCard({ request, onAccept, onReject, isProcessing }: { request: RideRequest & { id: string }, onAccept: (req: any) => void, onReject: (req: any) => void, isProcessing: boolean }) {
    const firestore = useFirestore();
    const passengerProfileRef = React.useMemo(() => doc(firestore, 'users', request.passengerId), [firestore, request.passengerId]);
    const { data: passengerProfile, isLoading } = useDoc<UserProfile>(passengerProfileRef);

    if (isLoading) {
        return <div className="flex items-center justify-between p-3 rounded-md border"><Skeleton className="h-8 w-32" /><Skeleton className="h-8 w-20" /></div>;
    }

    return (
        <div className="flex items-center justify-between p-3 rounded-md border bg-background gap-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={(passengerProfile as any)?.photoURL || placeholderImages.find(i => i.id === 'avatar2')?.imageUrl} />
                    <AvatarFallback>{passengerProfile?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm">{passengerProfile?.name}</p>
                    <p className="text-xs text-muted-foreground">{passengerProfile?.city}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onReject(request)} disabled={isProcessing}>Reject</Button>
                <Button size="sm" onClick={() => onAccept(request)} disabled={isProcessing}>Accept</Button>
            </div>
        </div>
    );
}

function IncomingRequests({ rideId, onAccept, onReject, isProcessing }: { rideId: string, onAccept: (req: any) => void, onReject: (req: any) => void, isProcessing: boolean }) {
    const firestore = useFirestore();
    const requestsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "rideRequests"), where("rideId", "==", rideId), where("status", "==", "pending"));
    }, [firestore, rideId]);

    const { data: requests, isLoading } = useCollection<RideRequest>(requestsQuery);

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-muted-foreground">
                No pending requests yet.
            </div>
        );
    }

    return (
        <div className="space-y-3 pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Incoming Requests</h4>
            {requests.map(req => (
                <RequestCard key={req.id} request={req} onAccept={onAccept} onReject={onReject} isProcessing={isProcessing} />
            ))}
        </div>
    );
}

function OfferedRideView({ ride }: { ride: Ride }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);

    if (!ride) {
        return (
             <div className="py-8 text-center">
                 <EmptyState
                    title="No Active Ride Offer"
                    description="You do not have any active ride offers."
                    icon={CircleDot}
                />
            </div>
        )
    }

    const passengerProfileRef = React.useMemo(() => {
        if (!firestore || !ride.passengerId) return null;
        return doc(firestore, 'users', ride.passengerId);
    }, [firestore, ride]);
    const { data: passengerProfile, isLoading: isPassengerLoading } = useDoc<UserProfile>(passengerProfileRef);

    const handleAcceptRequest = async (requestToAccept: RideRequest & { id: string }) => {
        if (!firestore || !ride || !user) return;
        setIsProcessing(true);
    
        try {
            const batch = writeBatch(firestore);
            const rideRef = doc(firestore, 'rides', ride.id);
            const driverProfileSnap = await getDoc(doc(firestore, 'users', user.uid));
            const driverProfile = driverProfileSnap.data() as UserProfile;

            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            batch.update(rideRef, {
                status: 'confirmed',
                passengerId: requestToAccept.passengerId,
                participantIds: arrayUnion(requestToAccept.passengerId),
                acceptedAt: serverTimestamp(),
                rideOtp: otp,
                otpVerified: false,
                riderStarted: false,
                passengerStarted: false,
                riderCompleted: false,
                passengerCompleted: false,
            });
    
            const requestsQuery = query(collection(firestore, 'rideRequests'), where('rideId', '==', ride.id), where('status', '==', 'pending'));
            const requestsSnapshot = await getDocs(requestsQuery);
    
            requestsSnapshot.forEach(requestDoc => {
                if (requestDoc.id === requestToAccept.id) {
                    batch.update(requestDoc.ref, { status: 'accepted' });
                    const acceptedNotifRef = doc(collection(firestore, "notifications"));
                    batch.set(acceptedNotifRef, {
                        userId: requestToAccept.passengerId,
                        rideId: ride.id,
                        message: `Your request for the ride with ${driverProfile.name} has been accepted!`,
                        type: 'ride_accepted',
                        isRead: false,
                        createdAt: serverTimestamp()
                    });
                } else {
                    batch.update(requestDoc.ref, { status: 'rejected' });
                    const rejectedNotifRef = doc(collection(firestore, "notifications"));
                    batch.set(rejectedNotifRef, {
                        userId: requestDoc.data().passengerId,
                        rideId: ride.id,
                        message: `Your request for the ride with ${driverProfile.name} was not accepted.`,
                        type: 'ride_cancelled',
                        isRead: false,
                        createdAt: serverTimestamp()
                    });
                }
            });
    
            await batch.commit();
            
            toast({
                title: 'Ride Confirmed!',
                description: `You have accepted the request. The ride is now confirmed.`
            });
    
        } catch (error) {
            console.error("Failed to accept ride request", error);
            toast({ variant: 'destructive', title: 'Acceptance failed' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleRejectRequest = async (requestToReject: RideRequest & { id: string }) => {
        if (!firestore) return;
        setIsProcessing(true);
        const requestRef = doc(firestore, 'rideRequests', requestToReject.id);
        try {
            await updateDoc(requestRef, { status: 'rejected' });
            toast({ title: "Request Rejected" });
        } catch (error) {
            console.error("Error rejecting request", error);
            toast({ variant: 'destructive', title: 'Error' });
        } finally {
            setIsProcessing(false);
        }
    };

    let statusText = ride.status.replace('_', ' ');

    const handleCancelOffer = async () => {
        if (!ride || !firestore || !user) return;
        setIsCancelling(true);

        try {
            const batch = writeBatch(firestore);
            const rideRef = doc(firestore, 'rides', ride.id);
            batch.update(rideRef, { 
                status: 'cancelled',
                cancelledBy: user.uid,
                cancelledAt: serverTimestamp(),
            });

            // If a passenger was involved, notify them
            if(ride.passengerId) {
                const currentUserProfileSnap = await getDoc(doc(firestore, 'users', user.uid));
                const currentUserProfile = currentUserProfileSnap.data() as UserProfile;
                const notificationsCollection = collection(firestore, "notifications");
                const newNotification: Omit<Notification, 'id'> = {
                    userId: ride.passengerId,
                    rideId: ride.id,
                    message: `The ride offered by ${currentUserProfile.name} from ${ride.fromLocation} has been canceled.`,
                    type: 'ride_cancelled',
                    cancelledBy: 'provider',
                    isRead: false,
                    createdAt: serverTimestamp()
                };
                const newNotifRef = doc(notificationsCollection);
                batch.set(newNotifRef, newNotification);
            }

            await batch.commit();

            toast({
                title: "Ride Offer Canceled",
                description: "Your offer has been removed.",
            });

        } catch (error) {
            console.error("Failed to cancel ride offer", error);
            toast({ variant: 'destructive', title: 'Cancellation Failed', description: "Could not cancel the ride offer. Please try again." });
        } finally {
            setIsCancelling(false);
        }
    }
    
    const canCancelOffer = ride.status === 'offering';

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-start">
                <div className="text-xs text-muted-foreground p-2">
                    <span>{new Date(ride.dateTime).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {' - '}
                    <span>₹{ride.sharedCost}</span>
                </div>
                <Badge variant={
                    ride.status === 'completed' ? 'default' : 
                    ride.status === 'confirmed' ? 'secondary' :
                    ride.status === 'in-progress' ? 'default' :
                    ride.status === 'cancelled' ? 'destructive' :
                    'outline'
                } className={cn('capitalize', ride.status === 'offering' && 'bg-orange-500 text-white hover:bg-orange-500/90')}>{statusText}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted text-sm">
                <div className="font-medium truncate pr-2">{ride.fromLocation}</div>
                <ArrowUpRight className="h-4 w-4 text-primary flex-shrink-0 mx-2"/>
                <div className="font-medium truncate pl-2 text-right">{ride.toLocation}</div>
            </div>
            
            <RideProgressBar ride={ride} />

            {ride.status === 'offering' && (
                 <IncomingRequests 
                    rideId={ride.id} 
                    onAccept={handleAcceptRequest} 
                    onReject={handleRejectRequest} 
                    isProcessing={isProcessing} 
                />
            )}
            
            {ride.status === 'confirmed' && ride.passengerId && (
                <Card className="bg-muted/50">
                    <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                            {isPassengerLoading ? <Skeleton className="h-8 w-40" /> : passengerProfile ? (
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={(passengerProfile as any)?.photoURL || placeholderImages.find(p => p.id === 'avatar2')?.imageUrl} />
                                        <AvatarFallback>{passengerProfile.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold">{passengerProfile.name}</p>
                                        <p className="text-xs text-muted-foreground">Your confirmed passenger</p>
                                    </div>
                                </div>
                            ) : <p className="text-sm">Passenger details loading...</p>}
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/chat/${ride.id}`}>
                                    <MessageSquare className="mr-2 h-4 w-4" /> Chat
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            )}

            {canCancelOffer && (
                 <div className="pt-2 flex justify-end">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isCancelling}>
                                {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Cancel Offer
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Ride Offer?</AlertDialogTitle>
                                <AlertDialogDescription>
                                   Are you sure you want to cancel this ride offer? This will remove it from the suggestions list. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Go Back</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancelOffer} className={buttonVariants({ variant: "destructive" })}>
                                    Confirm Cancel
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    );
}

function RequestedRideView({ item }: { item: Ride | RideRequest }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = React.useState(false);
    
    // Determine if the item is a Ride or a RideRequest and get the rideId
    const isRideRequest = 'rideId' in item;
    const rideId = isRideRequest ? item.rideId : item.id;
    
    // Fetch the main ride document
    const rideRef = React.useMemo(() => {
        if (!firestore || !rideId) return null;
        return doc(firestore, 'rides', rideId);
    }, [firestore, rideId]);
    const { data: ride, isLoading: isRideLoading } = useDoc<Ride>(rideRef);

    // If it's a RideRequest, fetch the driver's profile from the main ride doc
    const driverProfileRef = React.useMemo(() => {
        if (!firestore || !ride?.driverId) return null;
        return doc(firestore, 'users', ride.driverId);
    }, [firestore, ride]);

    const { data: driverProfile, isLoading: isDriverLoading } = useDoc<UserProfile>(driverProfileRef);
    
    if (isRideLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (!ride) {
        return <div className="py-8 text-center">This ride is no longer available.</div>;
    }

    let statusText: string;
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";

    if (isRideRequest && item.status === 'pending') {
        statusText = "Request Sent";
        badgeVariant = 'secondary';
    } else {
        statusText = ride.status.replace(/_/g, ' ');
         switch(ride.status) {
            case 'pending':
                statusText = ride.driverId ? "Request Sent" : "Pending Driver";
                badgeVariant = 'secondary';
                break;
            case 'confirmed':
            case 'in-progress':
            case 'completed':
                badgeVariant = 'default';
                break;
            case 'cancelled':
                badgeVariant = 'destructive';
                break;
        }
    }


    const handleCancelRequest = async () => {
        if (!firestore) return;
        setIsCancelling(true);

        try {
            if (isRideRequest) {
                // This is a request for a driver's offer, so delete the rideRequest
                await deleteDoc(doc(firestore, 'rideRequests', item.id));
            } else {
                // This is the user's own open request, so update the ride status
                await updateDoc(doc(firestore, 'rides', item.id), { status: 'cancelled' });
            }
             toast({
                title: "Request Canceled",
                description: "Your request for this ride has been withdrawn.",
            });
        } catch (error) {
            console.error("Error cancelling request:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not cancel your request." });
        } finally {
            setIsCancelling(false);
        }
    };
    
    const canCancelRequest = (isRideRequest && item.status === 'pending') || (!isRideRequest && ride.status === 'pending');

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-start">
                <div className="text-xs text-muted-foreground p-2">
                    <span>{new Date(ride.dateTime).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {' - '}
                    <span>₹{ride.sharedCost}</span>
                </div>
                <Badge variant={badgeVariant} className={cn('capitalize', (isRideRequest && item.status === 'pending') && 'bg-orange-500 text-white hover:bg-orange-500/90')}>{statusText}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted text-sm">
                <div className="font-medium truncate pr-2">{ride.fromLocation}</div>
                <ArrowUpRight className="h-4 w-4 text-primary flex-shrink-0 mx-2"/>
                <div className="font-medium truncate pl-2 text-right">{ride.toLocation}</div>
            </div>

            <RideProgressBar ride={ride} />

             {(ride.status === 'confirmed' || ride.status === 'in-progress' || ride.driverId) && (
                <Card className="bg-muted/50">
                    <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                            {isDriverLoading ? <Skeleton className="h-8 w-40" /> : driverProfile ? (
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={(driverProfile as any)?.photoURL || placeholderImages.find(p => p.id === 'avatar1')?.imageUrl} />
                                        <AvatarFallback>{driverProfile.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold">{driverProfile.name}</p>
                                        <p className="text-xs text-muted-foreground">Your ride provider</p>
                                    </div>
                                </div>
                            ) : <p className="text-sm">Awaiting provider...</p>}
                            {(ride.status === 'confirmed' || ride.status === 'in-progress') && (
                                 <Button asChild variant="outline" size="sm">
                                    <Link href={`/chat/${ride.id}`}>
                                        <MessageSquare className="mr-2 h-4 w-4" /> Chat
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                </Card>
            )}

            {canCancelRequest && (
                 <div className="pt-2 flex justify-end">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isCancelling}>
                                {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Cancel Request
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Ride Request?</AlertDialogTitle>
                                <AlertDialogDescription>
                                   Are you sure you want to withdraw your request for this ride?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Go Back</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancelRequest} className={buttonVariants({ variant: "destructive" })}>
                                    Confirm Cancel
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

        </div>
    );
}


function RideProgressBar({ ride }: { ride: Ride }) {
    const steps = [
        { name: 'Pending', icon: Hourglass },
        { name: 'Confirmed', icon: LockKeyhole },
        { name: 'In Progress', icon: Rocket },
        { name: 'Completed', icon: PartyPopper },
    ];
    
    if (ride.status === 'cancelled') {
        return (
             <div className="relative pt-2">
                 <div className="absolute left-0 top-1/2 w-full h-0.5 bg-destructive -translate-y-1/2" aria-hidden="true" />
                 <ol className="relative flex justify-center w-full">
                     <li className="flex flex-col items-center text-center">
                         <div className={cn(
                             'relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300',
                             'bg-destructive text-destructive-foreground'
                         )}>
                             <XCircle className="w-5 h-5" />
                         </div>
                         <span className={cn("mt-2 text-xs font-semibold", "text-destructive")}>Cancelled</span>
                     </li>
                 </ol>
             </div>
        );
    }
    
    let currentStepIndex = -1;
    if (ride.status === 'offering' || ride.status === 'pending') {
        currentStepIndex = 0;
    } else if (ride.status === 'confirmed') {
        currentStepIndex = 1;
    } else if (ride.status === 'in-progress') {
        currentStepIndex = 2;
    } else if (ride.status === 'completed') {
        currentStepIndex = 3;
    }

    if (currentStepIndex === -1) return null;

    return (
        <div className="relative pt-2">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -translate-y-1/2" aria-hidden="true">
                 <div className="absolute left-0 top-0 h-full bg-primary transition-all duration-500" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} />
            </div>
            <ol className="relative flex justify-between w-full">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                        <li key={step.name} className="flex flex-col items-center text-center w-20">
                            <div className={cn(
                                'relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300',
                                isCompleted ? 'bg-primary text-primary-foreground' :
                                isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted border-2 border-dashed'
                            )}>
                                <step.icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                                "mt-2 text-xs font-semibold",
                                (isCompleted || isCurrent) ? "text-primary" : "text-muted-foreground"
                            )}>{step.name}</span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}


function AvatarGroup({ userIds }: { userIds: string[] }) {
    const firestore = useFirestore();
    return (
        <div className="flex -space-x-2 overflow-hidden">
            {userIds.filter(id => !!id).map((id, index) => {
                 const avatar = placeholderImages.find(p => p.id === `avatar${(index % 2) + 1}`)
                 return (
                    <Avatar key={id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                         <AvatarImage src={avatar?.imageUrl} />
                        <AvatarFallback>{id.substring(0,1)}</AvatarFallback>
                    </Avatar>
                 )
            })}
        </div>
    )
}

    

    