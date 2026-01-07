"use client";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { initiateEmailSignIn } from "@/firebase";
import Link from "next/link"
import { useRouter } from "next/navigation";
import React from "react";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      if (!auth) {
        setIsLoading(false);
        return
      };

      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      initiateEmailSignIn(auth, email, password);
      // We don't await here. The onAuthStateChanged listener in the provider will handle the redirect.
      toast({
          title: "Login attempt in progress...",
          description: "You'll be redirected shortly.",
      });
      // A failsafe redirect in case the listener is slow
      setTimeout(() => router.push("/dashboard"), 2000); 
  };

  return (
    <>
      <form className="grid gap-4" onSubmit={handleLogin}>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="priya@example.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="ml-auto inline-block text-sm underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>
    </>
  )
}

    