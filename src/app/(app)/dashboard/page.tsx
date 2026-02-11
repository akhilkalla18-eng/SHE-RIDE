
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
} from "lucide-react"
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
  } from "recharts"
import { doc, collection, query, where, writeBatch, serverTimestamp, getDocs, getDoc } from "firebase/firestore"

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

    const userProfileRef = React.useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const ridesQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, "rides"), where("participantIds", "array-contains", user.uid));
    }, [firestore, user]);

    const { data: rides, isLoading: areRidesLoading } = useCollection<Ride>(ridesQuery);

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
    
    const myPickupRequestsQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        // Don't apply orderBy here to avoid needing a composite index. Sorting is done in latestActiveOffer.
        return query(collection(firestore, "pickupRequests"), where("userProfileId", "==", user.uid));
    }, [firestore, user]);
    const { data: myPickupRequests, isLoading: areMyPickupsLoading } = useCollection<PickupRequest>(myPickupRequestsQuery);
    
    const latestActiveOffer = React.useMemo(() => {
        if (!myPickupRequests) return null;
        const sortedRequests = [...myPickupRequests].sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return dateB - dateA;
        });
        // Find the most recent offer that isn't cancelled to track.
        // If it's matched/completed, we still want to show its final state.
        return sortedRequests[0] || null;
    }, [myPickupRequests]);

    const associatedRidesQuery = React.useMemo(() => {
        if (!firestore || !latestActiveOffer || !user?.uid) return null;
        return query(collection(firestore, "rides"), where("pickupRequestId", "==", latestActiveOffer.id), where("driverId", "==", user.uid));
    }, [firestore, latestActiveOffer, user?.uid]);
    const { data: associatedRides, isLoading: areAssociatedRidesLoading } = useCollection<Ride>(associatedRidesQuery);

    const definitiveRide = React.useMemo(() => {
        if (!associatedRides || associatedRides.length === 0) return null;
        // Find a ride that is confirmed, accepted, or completed. This is the "active" one.
        const activeRide = associatedRides.find(r => ['accepted', 'confirmed', 'completed'].includes(r.status));
        if (activeRide) return activeRide;
        
        // If no active ride, but there are pending requests, just return the first one.
        // The status card will interpret 'requested' as 'pending' anyway.
        return associatedRides[0];
    }, [associatedRides]);


    const upcomingRides = React.useMemo(() => {
        const allUpcoming = rides?.filter(r => r.status === 'confirmed' || r.status === 'accepted' || r.status === 'requested') || [];
        if (!searchTerm.trim()) {
            return allUpcoming;
        }
        return allUpcoming.filter(ride =>
            ride.toLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ride.fromLocation.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rides, searchTerm]);

    const completedRidesCount = React.useMemo(() => rides?.filter(r => r.status === 'completed').length || 0, [rides]);
    
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

    const isLoading = isUserLoading || isProfileLoading;

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
              {areRidesLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{completedRidesCount}</div> }
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
              {areRidesLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{upcomingRides.length}</div> }
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
                offer={latestActiveOffer} 
                ride={definitiveRide}
                isLoading={areMyPickupsLoading || areAssociatedRidesLoading}
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
                {areRidesLoading ? (
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
                                <Badge variant={ride.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">{ride.status}</Badge>
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

function MyRideStatusCard({ offer, ride, isLoading }: { offer: PickupRequest | null, ride: Ride | null, isLoading: boolean }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = React.useState(false);

    const passengerProfileRef = React.useMemo(() => {
        if (!firestore || !ride?.passengerId) return null;
        return doc(firestore, 'users', ride.passengerId);
    }, [firestore, ride]);

    const { data: passengerProfile, isLoading: isPassengerLoading } = useDoc<UserProfile>(passengerProfileRef);

    let step: 'pending' | 'confirmed' | 'completed' | 'cancelled' | null = null;
    let statusText = "No Active Ride";
    
    if (offer) {
        if (offer.status === 'cancelled') {
            step = 'cancelled';
            statusText = 'Ride Cancelled';
        } else if (ride && ride.status === 'completed') {
            step = 'completed';
            statusText = 'Ride Completed';
        } else if (ride && (ride.status === 'accepted' || ride.status === 'confirmed')) {
            step = 'confirmed';
            statusText = 'Ride Confirmed';
        } else {
            step = 'pending';
            statusText = 'Ride Pending';
        }
    }
    
    const rideDetails = ride || offer;

    const handleCancelOffer = async () => {
        if (!offer || !firestore || !user) return;
        setIsCancelling(true);

        try {
            const batch = writeBatch(firestore);

            // 1. Cancel the main pickup request
            const pickupRequestRef = doc(firestore, 'pickupRequests', offer.id);
            batch.update(pickupRequestRef, { status: 'cancelled' });

            // 2. Find all pending ride requests for this offer
            const ridesQuery = query(collection(firestore, "rides"), where("pickupRequestId", "==", offer.id), where("status", "==", "requested"));
            const rideRequestsSnapshot = await getDocs(ridesQuery);

            const currentUserProfileSnap = await getDoc(doc(firestore, 'users', user.uid));
            const currentUserProfile = currentUserProfileSnap.data() as UserProfile;
            const notificationsCollection = collection(firestore, "notifications");

            // 3. Cancel each pending ride and create a notification
            rideRequestsSnapshot.forEach(rideDoc => {
                const rideRef = doc(firestore, 'rides', rideDoc.id);
                batch.update(rideRef, { status: 'cancelled' });

                const rideData = rideDoc.data() as Ride;
                const newNotification: Omit<Notification, 'id'> = {
                    userId: rideData.passengerId, // Notify the passenger
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

            // 4. Commit the batch
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

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Ride Status</CardTitle>
                    <CardDescription>Track the progress of your latest offered ride.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                </CardContent>
            </Card>
        );
    }
    
    if (!step || !rideDetails) {
        return (
            <Card className="flex flex-col items-center justify-center min-h-[300px] md:min-h-full">
                <CardHeader className="text-center">
                    <CardTitle>My Ride Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        title="No Active Rides"
                        description="You haven't offered any rides yet."
                        icon={CircleDot}
                    />
                </CardContent>
            </Card>
        );
    }
    
    const canCancelOffer = step === 'pending';

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>My Ride Status</CardTitle>
                        <CardDescription>Track the progress of your latest offered ride.</CardDescription>
                    </div>
                    <Badge variant={
                        step === 'completed' ? 'default' : 
                        step === 'confirmed' ? 'secondary' :
                        step === 'cancelled' ? 'destructive' :
                        'destructive'
                    } className={cn(step==='pending' && 'bg-orange-500 text-white')}>{statusText}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted text-sm">
                        <div className="font-medium truncate pr-2">{rideDetails.fromLocation || rideDetails.startingLocation}</div>
                        <ArrowUpRight className="h-4 w-4 text-primary flex-shrink-0 mx-2"/>
                        <div className="font-medium truncate pl-2 text-right">{rideDetails.toLocation || rideDetails.destination}</div>
                    </div>
                     <div className="text-xs text-muted-foreground p-2">
                        <span>{new Date(rideDetails.dateTime).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {' - '}
                        <span>₹{rideDetails.sharedCost || rideDetails.expectedCost}</span>
                    </div>
                </div>
                <RideProgressBar currentStep={step} />
                {step === 'confirmed' && (
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
                                <Button variant="outline" size="sm">
                                    <MessageSquare className="mr-2 h-4 w-4" /> Chat
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                )}
            </CardContent>
            {canCancelOffer && (
                <CardFooter className="justify-end">
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
                </CardFooter>
            )}
        </Card>
    );
}

function RideProgressBar({ currentStep }: { currentStep: 'pending' | 'confirmed' | 'completed' | 'cancelled' | null }) {
    const steps = [
        { name: 'Pending', icon: Hourglass, key: 'pending' },
        { name: 'Confirmed', icon: CheckCircle, key: 'confirmed' },
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

    const currentStepIndex = steps.findIndex(s => s.key === currentStep);

    return (
        <div className="relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -translate-y-1/2" aria-hidden="true">
                 <div className="absolute left-0 top-0 h-full bg-primary transition-all duration-500" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} />
            </div>
            <ol className="relative flex justify-between w-full">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                        <li key={step.name} className="flex flex-col items-center text-center">
                            <div className={cn(
                                'relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300',
                                isCompleted ? 'bg-primary text-primary-foreground' :
                                isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted border-2 border-dashed'
                            )}>
                                <step.icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                                "mt-2 text-xs font-semibold",
                                isCurrent ? "text-primary" : "text-muted-foreground"
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

    