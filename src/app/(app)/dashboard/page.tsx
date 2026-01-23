"use client"

import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
  Bike,
  Users,
} from "lucide-react"
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
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import React, { useState, useEffect } from "react"
import { placeholderImages } from "@/lib/placeholder-images"
import { Ride, UserProfile } from "@/lib/schemas"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

const suggestionsWithUsers = [
    { id: 's1', type: 'pickup', startingLocation: 'Juhu, Mumbai', destination: 'Powai, Mumbai', dateTime: '2024-08-16T18:00:00.000Z', user: { name: 'Sunita' } },
    { id: 's2', type: 'service', pickupLocation: 'Andheri West', destination: 'Bandra Kurla Complex', dateTime: '2024-08-17T09:00:00.000Z', user: { name: 'Rani' } },
    { id: 's3', type: 'pickup', startingLocation: 'Dadar', destination: 'Lower Parel', dateTime: '2024-08-18T14:00:00.000Z', user: { name: 'Geeta' } },
];

const upcomingRides: Partial<Ride>[] = [
    { id: 'r1', participantIds: ['user1', 'user2'], dateTime: '2024-08-20T10:00:00.000Z'},
];

export default function Dashboard() {
  const [chartData, setChartData] = useState<any[]>([]);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    setChartData([
        { name: "Jan", total: Math.floor(Math.random() * 50) + 10 },
        { name: "Feb", total: Math.floor(Math.random() * 50) + 10 },
        { name: "Mar", total: Math.floor(Math.random() * 50) + 10 },
        { name: "Apr", total: Math.floor(Math.random() * 50) + 10 },
        { name: "May", total: Math.floor(Math.random() * 50) + 10 },
        { name: "Jun", total: Math.floor(Math.random() * 50) + 10 },
    ]);
  }, []);
  
  return (
    <div className="flex flex-col gap-4 md:gap-8">
        <div className="space-y-1.5">
            {isUserLoading || isProfileLoading ? (
                <Skeleton className="h-9 w-64" />
            ) : (
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter">Welcome back, {profile?.name || 'User'}!</h1>
            )}
            <p className="text-muted-foreground">Here's what's happening on SheRide today.</p>
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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +3 since last month
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
              <div className="text-2xl font-bold">+{suggestionsWithUsers.length}</div>
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
              <div className="text-2xl font-bold">{upcomingRides?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ready for your next journey
              </p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Rides</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
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
                <CardTitle>New Ride Suggestions</CardTitle>
                <CardDescription>
                  Women traveling on similar routes.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/rides/suggestions">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rider/Passenger</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead className="hidden sm:table-cell">Time</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestionsWithUsers.slice(0, 3).map((ride: any) => (
                     <TableRow key={ride.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="hidden h-9 w-9 sm:flex">
                              <AvatarImage src={(placeholderImages.find(p=>p.id === 'avatar2')?.imageUrl)} alt="Avatar" />
                              <AvatarFallback>{ride.user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{ride.user.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium truncate max-w-40">{ride.type === 'pickup' ? ride.startingLocation : ride.pickupLocation} to {ride.destination}</div>
                        </TableCell>
                         <TableCell className="hidden sm:table-cell">
                            {new Date(ride.dateTime).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/rides/suggestions">View</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Confirmed Rides</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
               {(upcomingRides && upcomingRides.length > 0) ? upcomingRides.map(ride => (
                 <div className=" flex items-center gap-4" key={ride.id}>
                    <Avatar className="hidden h-9 w-9 sm:flex">
                       <AvatarImage src={(placeholderImages.find(p=>p.id === 'avatar3')?.imageUrl)} alt="Avatar" />
                       <AvatarFallback>{ride.participantIds[0].charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">
                         Ride with a user
                      </p>
                      <p className="text-sm text-muted-foreground">
                        on {new Date(ride.dateTime).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto">
                        <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
               )) : (
                 <p className="text-sm text-muted-foreground">No upcoming rides confirmed yet.</p>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
