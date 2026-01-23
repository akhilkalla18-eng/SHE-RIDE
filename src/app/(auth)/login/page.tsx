"use client";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";
import Link from "next/link"
import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      if (!auth) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Firebase not initialized. Please try again later.",
        });
        setIsLoading(false);
        return;
      }

      try {
          await signInWithEmailAndPassword(auth, email, password);
          toast({
              title: "Login Successful!",
              description: "You'll be redirected to your dashboard.",
          });
          router.push("/dashboard");
      } catch (error: any) {
          const errorMessage = error.message || "Invalid credentials. Please try again.";
          console.error("Login failed:", error.code, errorMessage);
          toast({
              variant: "destructive",
              title: "Login Failed",
              description: "Invalid credentials. Please try again.",
          });
      } finally {
          setIsLoading(false);
      }
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
            defaultValue="priya@example.com"
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
          <Input id="password" name="password" type="password" required defaultValue="password" />
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
