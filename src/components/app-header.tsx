"use client"

import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
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
import { Bell, LifeBuoy, LogOut, TriangleAlert } from "lucide-react"
import { notifications } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useUser, addDocumentNonBlocking, useFirestore } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection } from "firebase/firestore"
import { placeholderImages } from "@/lib/placeholder-images"

export function AppHeader() {
    const { toast } = useToast()
    const auth = useAuth();
    const { user } = useUser();
    const firestore = useFirestore();

    const handleSosClick = () => {
        if (!user) return;
        const alertsRef = collection(firestore, "sos_alerts");
        addDocumentNonBlocking(alertsRef, {
            userId: user.uid,
            timestamp: new Date().toISOString(),
            location: "User's current location" // This would be replaced with actual location services
        });

        toast({
            title: "SOS Alert Sent",
            description: "Your emergency contacts and our support team have been notified.",
            variant: "destructive",
        })
    }
    const handleLogout = () => {
        signOut(auth);
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
            {notifications.some(n => !n.read) && (
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
          {notifications.map(n => (
            <DropdownMenuItem key={n.id} className={`flex items-start gap-2 ${!n.read && 'font-semibold'}`}>
                <div className={`mt-1 h-2 w-2 rounded-full ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                <div>
                    <p className="text-sm leading-snug">{n.text}</p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                </div>
            </DropdownMenuItem>
          ))}
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
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || placeholderImages.find(p => p.id === 'avatar1')?.imageUrl} alt={user?.displayName || "User"} />
              <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
            </Avatar>
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
