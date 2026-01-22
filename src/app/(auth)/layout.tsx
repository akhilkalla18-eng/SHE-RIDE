"use client";

import { Logo } from "@/components/logo";
import Link from "next/link";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authImage = placeholderImages.find(p => p.id === 'hero');
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
     return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }


  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Link href="/" className="flex justify-center">
                <Logo className="h-10 w-auto" />
            </Link>
            <h1 className="text-3xl font-bold">Welcome to SheRide</h1>
            <p className="text-balance text-muted-foreground">
              Enter your details to join our community
            </p>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {authImage && (
            <Image
              src={authImage.imageUrl}
              alt={authImage.description}
              width="1920"
              height="1080"
              className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              data-ai-hint={authImage.imageHint}
            />
        )}
      </div>
    </div>
  );
}
