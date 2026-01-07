"use client"

import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
  Bike,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { currentUser, rideRequests } from "@/lib/data"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import React from "react"

const chartData = [
    { name: "Jan", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Feb", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Mar", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Apr", total: Math.floor(Math.random() * 50) + 10 },
    { name: "May", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Jun", total: Math.floor(Math.random() * 50) + 10 },
]

export default function Dashboard() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (currentUser && rideRequests) {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>
  }

  const upcomingRides = rideRequests.filter(r => r.user.id === currentUser.id && r.status === 'matched');
  const suggestions = rideRequests.filter(r => r.user.id !== currentUser.id);

  return (
    <div className="flex flex-col gap-4 md:gap-8">
        <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
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
              <div className="text-2xl font-bold">+{suggestions.length}</div>
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
              <div className="text-2xl font-bold">{upcomingRides.length}</div>
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
                  {suggestions.slice(0, 3).map(ride => (
                     <TableRow key={ride.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="hidden h-9 w-9 sm:flex">
                              <AvatarImage src={ride.user.avatarUrl} alt="Avatar" />
                              <AvatarFallback>{ride.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{ride.user.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium truncate max-w-40">{ride.startLocation} to {ride.destination}</div>
                        </TableCell>
                         <TableCell className="hidden sm:table-cell">
                            {ride.dateTime.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric' })}
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
               {upcomingRides.length > 0 ? upcomingRides.map(ride => (
                 <div className=" flex items-center gap-4" key={ride.id}>
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage src={ride.user.avatarUrl} alt="Avatar" />
                      <AvatarFallback>{ride.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">
                        {ride.startLocation} &rarr; {ride.destination}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        with {ride.user.name} on {ride.dateTime.toLocaleDateString()}
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
