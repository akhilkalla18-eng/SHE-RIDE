
"use client"

import React from "react"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Bell, LifeBuoy, LogOut, TriangleAlert, User, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useUser, useAuth, useDoc, useFirestore, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, collection, query, where, updateDoc, writeBatch } from "firebase/firestore";
import type { UserProfile, Notification } from "@/lib/schemas";
import { Skeleton } from "./ui/skeleton"
import { formatDistanceToNow } from "date-fns"

export function AppHeader() {
    const { toast } = useToast()
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const [isClearing, setIsClearing] = React.useState(false);

    const userProfileRef = React.useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const notificationsQuery = React.useMemo(() => {
        if (!user || !firestore) return null;
        // The orderBy clause was removed to prevent an error that requires a composite index.
        // Sorting will be handled on the client.
        return query(
            collection(firestore, "notifications"),
            where("userId", "==", user.uid)
        );
    }, [firestore, user]);

    const { data: rawNotifications, isLoading: areNotificationsLoading } = useCollection<Notification>(notificationsQuery);

    const notifications = React.useMemo(() => {
        if (!rawNotifications) return null;
        // Sort notifications on the client-side in descending order of creation time.
        return [...rawNotifications].sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return dateB - dateA;
        });
    }, [rawNotifications]);

    const unreadNotifications = React.useMemo(() => notifications?.filter(n => !n.isRead) || [], [notifications]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!firestore) return;
        const notifRef = doc(firestore, 'notifications', notification.id);
        
        try {
            if (!notification.isRead) {
                await updateDoc(notifRef, { isRead: true });
            }
            if (notification.rideId) {
                router.push(`/rides/${notification.rideId}`);
            }
        } catch(error) {
            console.error("Error handling notification click", error);
            toast({variant: "destructive", title: "Error", description: "Could not process notification."})
        }
    };

    const handleClearAllNotifications = async () => {
        if (!firestore || !user || !notifications || notifications.length === 0) return;
        setIsClearing(true);

        try {
            const batch = writeBatch(firestore);
            
            notifications.forEach(notif => {
                const notifRef = doc(firestore, 'notifications', notif.id);
                batch.delete(notifRef);
            });

            await batch.commit();

            toast({
                title: "Notifications Cleared",
                description: "Your notification list is now empty.",
            });

        } catch (error) {
            console.error("Failed to clear notifications:", error);
            toast({
                variant: "destructive",
                title: "Clear Failed",
                description: "Could not clear your notifications. Please try again."
            });
        } finally {
            setIsClearing(false);
        }
    }


    const handleSosClick = () => {
        toast({
            title: "SOS Alert Sent",
            description: "Your emergency contacts and our support team have been notified.",
            variant: "destructive",
        })
    }

    const handleLogout = () => {
        if (!auth) return;
        signOut(auth).then(() => {
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out.",
            });
            router.push("/login");
        });
    }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 bg-background/80 backdrop-blur-sm">
      <SidebarTrigger className="md:hidden" />
      <div className="w-full flex-1">
        {/* Can add breadcrumbs or page title here */}
      </div>

       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/90"></span>
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {areNotificationsLoading ? (
            <DropdownMenuItem>Loading...</DropdownMenuItem>
          ) : notifications && notifications.length > 0 ? (
            <>
                {notifications.map(n => (
                    <DropdownMenuItem key={n.id} className={`flex items-start gap-2 cursor-pointer ${!n.isRead && 'font-semibold'}`} onClick={() => handleNotificationClick(n)}>
                        <div className={`mt-1 h-2 w-2 rounded-full ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                        <div>
                            <p className="text-sm leading-snug whitespace-normal">{n.message}</p>
                            <p className="text-xs text-muted-foreground">
                                {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                            </p>
                        </div>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="p-1 focus:bg-transparent">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm" className="w-full" disabled={isClearing}>
                             {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                             Clear All
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Clear All Notifications?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete all your notifications.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleClearAllNotifications}
                                    className={buttonVariants({ variant: "destructive" })}
                                >
                                    Confirm
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuItem>
             </>
          ) : (
            <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={!user}>
            <TriangleAlert className="mr-2 h-4 w-4" /> SOS
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate SOS?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately send an alert with your current location to your emergency contacts and the SheRide support team. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSosClick}>Confirm SOS</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            {(isUserLoading || isProfileLoading) ? (
                <Skeleton className="h-8 w-8 rounded-full" />
            ) : (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} alt={userProfile?.name || "User"} />
                  <AvatarFallback>{userProfile?.name?.charAt(0) || user?.email?.charAt(0) || <User />}</AvatarFallback>
                </Avatar>
            )}
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/safety">Safety Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Support</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
