
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
import { doc, collection, query, where, writeBatch, serverTimestamp, getDocs, getDoc, updateDoc } from "firebase/firestore"

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
import type { UserProfile, Ride, PickupRequest, ServiceRequest, Notification } from "@/lib/schemas"
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
    
    const activeStatuses: Ride['status'][] = ["requested", "confirmed", "start_pending", "in-progress", "completion_pending"];

    const userProfileRef = React.useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const allMyRidesQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, "rides"), where("participantIds", "array-contains", user.uid));
    }, [firestore, user]);

    const { data: allMyRides, isLoading: areAllMyRidesLoading } = useCollection<Ride>(allMyRidesQuery);

    const pickupRequestsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "pickupRequests"), where("status", "==", "open"));
    }, [firestore]);
    const {data: pickupRequests, isLoading: arePickupsLoading} = useCollection<PickupRequest>(pickupRequestsQuery);

    const serviceRequestsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "serviceRequests"), where("status", "==", "open"));
    }, [firestore]);
    const {data: serviceRequests, isLoading: areServicesLoading} = useCollection<ServiceRequest>(serviceRequestsQuery);
    
    const myOpenPickupRequestsQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, "pickupRequests"), 
            where("userProfileId", "==", user.uid),
            where("status", "==", "open")
        );
    }, [firestore, user]);
    const { data: myOpenPickupRequests, isLoading: areMyPickupsLoading } = useCollection<PickupRequest>(myOpenPickupRequestsQuery);
    
    const latestActiveOffer = React.useMemo(() => {
        if (!myOpenPickupRequests || myOpenPickupRequests.length === 0) return null;
        return myOpenPickupRequests.sort((a,b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))[0];
    }, [myOpenPickupRequests]);

    const myDrivingRidesQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, "rides"),
            where("driverId", "==", user.uid),
            where("status", "in", activeStatuses)
        );
    }, [firestore, user]);
    const { data: myDrivingRides, isLoading: areMyDrivingRidesLoading } = useCollection<Ride>(myDrivingRidesQuery);

    const latestDrivingRide = React.useMemo(() => {
        if (!myDrivingRides || myDrivingRides.length === 0) return null;
        return myDrivingRides.sort((a,b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))[0];
    }, [myDrivingRides]);

    const myRequestedRidesQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, "rides"), 
            where("passengerId", "==", user.uid),
            where("status", "in", activeStatuses)
        );
    }, [firestore, user]);
    const { data: myRequestedRides, isLoading: areMyRequestsLoading } = useCollection<Ride>(myRequestedRidesQuery);

    const latestRequestedRide = React.useMemo(() => {
        if (!myRequestedRides || myRequestedRides.length === 0) return null;
        return myRequestedRides.sort((a,b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))[0];
    }, [myRequestedRides]);

    const definitiveOfferedRide = latestDrivingRide;
    const definitiveOffer = latestDrivingRide ? null : latestActiveOffer;

    const upcomingRides = React.useMemo(() => {
        const allUpcoming = allMyRides?.filter(r => activeStatuses.includes(r.status)) || [];
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
        if(!user || (!pickupRequests && !serviceRequests)) return 0;
        const otherPickups = pickupRequests?.filter(r => r.userProfileId !== user.uid).length || 0;
        const otherServices = serviceRequests?.filter(r => r.userProfileId !== user.uid).length || 0;
        return otherPickups + otherServices;
    }, [pickupRequests, serviceRequests, user]);


    React.useEffect(() => {
        setChartData([
            { name: "Jan", total: Math.floor(Math.random() * 20) + 5 },
            { name: "Feb", total: Math.floor(Math.random() * 20) + 5 },
            { name: "Mar", total: Math.floor(Math.random() * 20) + 5 },
            { name: "Apr", total: Math.floor(Math.random() * 20) + 5 },
            { name: "May", total: Math.floor(Math.random() * 20) + 5 },
            { name: "Jun", total: Math.floor(Math.random() * 20) + 5 },
        ]);
    }, []);

    const isLoading = isUserLoading || isProfileLoading || areMyPickupsLoading || areMyDrivingRidesLoading || areMyRequestsLoading || areAllMyRidesLoading;

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
              {(arePickupsLoading || areServicesLoading) ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{newSuggestionsCount}</div> }
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
                offeredRideOffer={definitiveOffer}
                offeredRide={definitiveOfferedRide}
                requestedRide={latestRequestedRide}
                isLoading={isLoading}
            />
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="grid gap-2">
                    <CardTitle>Upcoming &amp; Requested Rides</CardTitle>
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
                        title={searchTerm ? "No Matching Rides Found" : "No Upcoming Rides"}
                        description={searchTerm ? "Your search did not match any upcoming or requested rides." : "You don't have any rides yet. Find a ride to get started!"}
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
    offeredRideOffer,
    offeredRide,
    requestedRide,
    isLoading,
}: {
    offeredRideOffer: PickupRequest | null;
    offeredRide: Ride | null;
    requestedRide: Ride | null;
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

    const hasOfferedItem = !!offeredRideOffer || !!offeredRide;

    if (!hasOfferedItem && !requestedRide) {
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

    const defaultTab = hasOfferedItem ? 'offered' : 'requested';

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Ride Status</CardTitle>
                <CardDescription>Track the progress of your offered and requested rides.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="offered" disabled={!hasOfferedItem}>Rides Offered</TabsTrigger>
                        <TabsTrigger value="requested" disabled={!requestedRide}>Rides Requested</TabsTrigger>
                    </TabsList>
                    <TabsContent value="offered" className="mt-4">
                        {hasOfferedItem ? (
                            <OfferedRideView offer={offeredRideOffer} ride={offeredRide} />
                        ) : (
                            <div className="py-8 text-center">
                                 <EmptyState
                                    title="No Rides Offered"
                                    description="You haven't offered any rides yet."
                                    icon={CircleDot}
                                />
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="requested" className="mt-4">
                        {requestedRide ? (
                            <RequestedRideView ride={requestedRide} />
                        ) : (
                             <div className="py-8 text-center">
                                <EmptyState
                                    title="No Rides Requested"
                                    description="You haven't sent any ride requests yet."
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

function OfferedRideView({ offer, ride }: { offer: PickupRequest | null, ride: Ride | null }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = React.useState(false);

    if (!offer && !ride) {
        return (
             <div className="py-8 text-center">
                 <EmptyState
                    title="No Rides Offered"
                    description="You haven't offered any rides yet."
                    icon={CircleDot}
                />
            </div>
        )
    }

    const passengerProfileRef = React.useMemo(() => {
        if (!firestore || !ride?.passengerId) return null;
        return doc(firestore, 'users', ride.passengerId);
    }, [firestore, ride]);
    const { data: passengerProfile, isLoading: isPassengerLoading } = useDoc<UserProfile>(passengerProfileRef);

    let step: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | null = null;
    let statusText = "No Active Ride";
    
    if (ride) {
        if (ride.status === 'completed') {
            step = 'completed';
            statusText = 'Ride Completed';
        } else if (ride.status === 'in-progress' || ride.status === 'completion_pending') {
            step = 'in-progress';
            statusText = 'In Progress';
        } else if (ride.status === 'confirmed' || ride.status === 'start_pending') {
            step = 'confirmed';
            statusText = 'Ride Confirmed';
        } else if (ride.status.startsWith('cancelled')) {
            step = 'cancelled';
            statusText = 'Ride Cancelled'
        }
    } else if (offer) {
         if (offer.status === 'cancelled') {
            step = 'cancelled';
            statusText = 'Ride Cancelled';
        } else if (offer.status === 'open') {
            step = 'pending';
            statusText = 'Ride Pending';
        }
    }
    
    const rideDetails = ride || offer;

    const fromLocation = ride ? ride.fromLocation : offer!.startingLocation;
    const toLocation = ride ? ride.toLocation : offer!.destination;
    const cost = ride ? ride.sharedCost : offer!.expectedCost;


    const handleCancelOffer = async () => {
        if (!offer || !firestore || !user) return;
        setIsCancelling(true);

        try {
            const batch = writeBatch(firestore);
            const pickupRequestRef = doc(firestore, 'pickupRequests', offer.id);
            batch.update(pickupRequestRef, { status: 'cancelled' });

            const ridesQuery = query(collection(firestore, "rides"), where("pickupRequestId", "==", offer.id), where("status", "==", "requested"));
            const rideRequestsSnapshot = await getDocs(ridesQuery);

            const currentUserProfileSnap = await getDoc(doc(firestore, 'users', user.uid));
            const currentUserProfile = currentUserProfileSnap.data() as UserProfile;
            const notificationsCollection = collection(firestore, "notifications");

            rideRequestsSnapshot.forEach(rideDoc => {
                const rideRef = doc(firestore, 'rides', rideDoc.id);
                batch.update(rideRef, { status: 'cancelled_by_provider' });

                const rideData = rideDoc.data() as Ride;
                const newNotification: Omit<Notification, 'id'> = {
                    userId: rideData.passengerId,
                    rideId: rideDoc.id,
                    message: `The ride offered by ${currentUserProfile.name} from ${offer.startingLocation} has been canceled.`,
                    type: 'ride_cancelled',
                    cancelledBy: 'provider',
                    isRead: false,
                    createdAt: serverTimestamp()
                };
                const newNotifRef = doc(notificationsCollection);
                batch.set(newNotifRef, newNotification);
            });

            await batch.commit();

            toast({
                title: "Ride Offer Canceled",
                description: "Your offer has been removed and any requesters have been notified.",
            });

        } catch (error) {
            console.error("Failed to cancel ride offer", error);
            toast({ variant: 'destructive', title: 'Cancellation Failed', description: "Could not cancel the ride offer. Please try again." });
        } finally {
            setIsCancelling(false);
        }
    }
    
    const canCancelOffer = step === 'pending' && !!offer;

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-start">
                <div className="text-xs text-muted-foreground p-2">
                    <span>{new Date(rideDetails.dateTime).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {' - '}
                    <span>₹{cost}</span>
                </div>
                <Badge variant={
                    step === 'completed' ? 'default' : 
                    step === 'confirmed' ? 'secondary' :
                    step === 'in-progress' ? 'default' :
                    step === 'cancelled' ? 'destructive' :
                    'outline'
                } className={cn(step==='pending' && 'bg-orange-500 text-white hover:bg-orange-500/90')}>{statusText}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted text-sm">
                <div className="font-medium truncate pr-2">{fromLocation}</div>
                <ArrowUpRight className="h-4 w-4 text-primary flex-shrink-0 mx-2"/>
                <div className="font-medium truncate pl-2 text-right">{toLocation}</div>
            </div>
            
            <RideProgressBar currentStep={step} rideStatus={ride?.status || 'open'}/>
            
            {step === 'confirmed' && ride && (
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
                                   Are you sure you want to cancel this ride offer? This will notify any passengers who have sent requests. This action cannot be undone.
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

function RequestedRideView({ ride }: { ride: Ride }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = React.useState(false);

    const driverProfileRef = React.useMemo(() => {
        if (!firestore || !ride?.driverId) return null;
        return doc(firestore, 'users', ride.driverId);
    }, [firestore, ride]);

    const { data: driverProfile, isLoading: isDriverLoading } = useDoc<UserProfile>(driverProfileRef);
    
    let step: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | null = null;
    let statusText = "Unknown Status";
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";

    switch(ride.status) {
        case 'requested':
            step = 'pending';
            statusText = 'Request Pending';
            badgeVariant = 'secondary';
            break;
        case 'confirmed':
        case 'start_pending':
            step = 'confirmed';
            statusText = 'Ride Confirmed';
            badgeVariant = 'default';
            break;
        case 'in-progress':
        case 'completion_pending':
            step = 'in-progress';
            statusText = 'In Progress';
            badgeVariant = 'default';
            break;
        case 'completed':
            step = 'completed';
            statusText = 'Ride Completed';
            badgeVariant = 'default';
            break;
        case 'cancelled_by_passenger':
            step = 'cancelled';
            statusText = 'You Cancelled';
            badgeVariant = 'destructive';
            break;
        case 'cancelled_by_provider':
        case 'cancelled':
            step = 'cancelled';
            statusText = 'Rider Cancelled';
            badgeVariant = 'destructive';
            break;
    }

    const handleCancelRequest = async () => {
        if (!ride || !firestore) return;
        setIsCancelling(true);

        try {
            const rideRef = doc(firestore, 'rides', ride.id);
            await updateDoc(rideRef, { status: 'cancelled_by_passenger' });
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
    
    const canCancelRequest = ride.status === 'requested';

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-start">
                <div className="text-xs text-muted-foreground p-2">
                    <span>{new Date(ride.dateTime).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {' - '}
                    <span>₹{ride.sharedCost}</span>
                </div>
                <Badge variant={badgeVariant} className={cn('capitalize', ride.status === 'requested' && 'bg-orange-500 text-white hover:bg-orange-500/90')}>{statusText}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted text-sm">
                <div className="font-medium truncate pr-2">{ride.fromLocation}</div>
                <ArrowUpRight className="h-4 w-4 text-primary flex-shrink-0 mx-2"/>
                <div className="font-medium truncate pl-2 text-right">{ride.toLocation}</div>
            </div>

            <RideProgressBar currentStep={step} rideStatus={ride.status} />

             {(step === 'confirmed' || step === 'in-progress' || (step === 'cancelled' && ride.driverId)) && (
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
                            ) : <p className="text-sm">Driver details loading...</p>}
                            {(step === 'confirmed' || step === 'in-progress') && (
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


function RideProgressBar({ currentStep, rideStatus }: { currentStep: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | null, rideStatus: Ride['status'] | 'open' }) {
    const steps = [
        { name: 'Pending', icon: Hourglass, key: 'pending' },
        { name: 'Confirmed', icon: LockKeyhole, key: 'confirmed' },
        { name: 'In Progress', icon: Rocket, key: 'in-progress' },
        { name: 'Completed', icon: PartyPopper, key: 'completed' },
    ];
    
    if (currentStep === 'cancelled') {
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
    
    if (!currentStep) return null;

    let currentStepIndex = -1;
    if (rideStatus === 'requested' || rideStatus === 'open') {
        currentStepIndex = 0;
    } else if (rideStatus === 'confirmed' || rideStatus === 'start_pending') {
        currentStepIndex = 1;
    } else if (rideStatus === 'in-progress' || rideStatus === 'completion_pending') {
        currentStepIndex = 2;
    } else if (rideStatus === 'completed') {
        currentStepIndex = 3;
    }


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
            {userIds.map((id, index) => {
                 const avatar = placeholderImages.find(p => p.id === `avatar${(index % 3) + 1}`)
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
