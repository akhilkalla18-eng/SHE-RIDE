"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  PlusCircle,
  Search,
  User,
  Shield,
  Route,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { type UserProfile } from "@/lib/schemas";
import { placeholderImages } from "@/lib/placeholder-images";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/rides/create-pickup",
    label: "Offer a Ride",
    icon: PlusCircle,
  },
  {
    href: "/rides/create-service",
    label: "Request a Ride",
    icon: Search,
  },
  {
    href: "/rides/suggestions",
    label: "Ride Suggestions",
    icon: Users,
  },
  {
    href: "/route-optimizer",
    label: "Route Optimizer",
    icon: Route,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
  {
    href: "/safety",
    label: "Safety",
    icon: Shield,
  },
];

const userProfile: UserProfile = {
  id: "1",
  name: "Priya Sharma",
  email: "priya@example.com",
  city: "Mumbai",
  phoneNumber: "+91 98765 43210",
  profileVerified: true,
};

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="h-8 w-auto text-sidebar-foreground" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {userProfile && (
            <div className="flex items-center gap-3 p-2">
            <Avatar className="h-10 w-10">
                <AvatarImage src={placeholderImages.find(p => p.id === 'avatar1')?.imageUrl} alt={userProfile.name} />
                <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
                <p className="font-semibold truncate">{userProfile.name}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{userProfile.city}</p>
            </div>
            </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
