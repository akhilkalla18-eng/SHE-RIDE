
"use client"

import Link from "next/link"
import React from "react"
import {
  Activity,
  ArrowUpRight,
  Bike,
  Users,
  Car,
} from "lucide-react"
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
  } from "recharts"
import { doc, collection, query, where } from "firebase/firestore"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase"
import type { UserProfile, Ride, PickupRequest, ServiceRequest } from "@/lib/schemas"
import { placeholderImages } from "@/lib/placeholder-images"

const EmptyState = ({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) => (
    <div className="text-center py-8">
        <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
);


export default function Dashboard() {
    const [chartData, setChartData] = React.useState<any[]>([]);
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
    
    const upcomingRides = React.useMemo(() => rides?.filter(r => r.status === 'confirmed' || r.status === 'accepted' || r.status === 'requested') || [], [rides]);
    const completedRidesCount = React.useMemo(() => rides?.filter(r => r.status === 'completed').length || 0, [rides]);
    
    const newSuggestionsCount = React.useMemo(() => {
        if(!user || (!pickupRequests && !serviceRequests)) return 0;
        const otherPickups = pickupRequests?.filter(r => r.userProfileId !== user.uid).length || 0;
        const otherServices = serviceRequests?.filter(r => r.userProfileId !== user.uid).length || 0;
        return otherPickups + otherServices;
    }, [pickupRequests, serviceRequests, user]);


    React.useEffect(() => {
        // This should only run on the client to avoid hydration mismatch errors.
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
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Upcoming &amp; Requested Rides</CardTitle>
                <CardDescription>
                  Your scheduled journeys and pending requests.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/rides/suggestions">
                  Find More Rides
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
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
                        title="No Upcoming Rides"
                        description="You don't have any confirmed rides yet. Find a ride to get started!"
                        icon={Car}
                    />
                )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Community Activity</CardTitle>
              <CardDescription>What's happening in your city.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={placeholderImages.find(p => p.id === 'avatar1')?.imageUrl} alt="Avatar" />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1 text-sm">
                      <p className="leading-none">
                          <span className="font-semibold">Anjali</span> posted a new ride offer.
                      </p>
                      <p className="text-xs text-muted-foreground">
                          Juhu to BKC
                      </p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={placeholderImages.find(p => p.id === 'avatar2')?.imageUrl} alt="Avatar" />
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1 text-sm">
                      <p className="leading-none">
                         <span className="font-semibold">Sunita</span> is looking for a ride.
                      </p>
                      <p className="text-xs text-muted-foreground">
                          Thane to Andheri
                      </p>
                  </div>
              </div>
               <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={placeholderImages.find(p => p.id === 'avatar3')?.imageUrl} alt="Avatar" />
                    <AvatarFallback>G</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1 text-sm">
                      <p className="leading-none">
                         <span className="font-semibold">Geeta</span> completed a ride with Priya.
                      </p>
                       <p className="text-xs text-muted-foreground">
                          Dadar to Powai
                      </p>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}

function AvatarGroup({ userIds }: { userIds: string[] }) {
    const firestore = useFirestore();
    // In a real app, you'd fetch user profiles for these IDs
    // For this example, we'll just show placeholders
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

    
