"use client";

import Link from "next/link"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/firebase/provider";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import React from "react";

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("full-name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const city = formData.get("city") as string;
    const password = formData.get("password") as string;

    if (!auth || !firestore) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        id: user.uid,
        name: fullName,
        email: email,
        phoneNumber: phone,
        city: city,
        profileVerified: false,
        isRider: false,
        isPassenger: false,
      });
      
      toast({
        title: "Account Created!",
        description: "Welcome to SheRide. Please login.",
      });
      router.push("/login");

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <form className="grid gap-4" onSubmit={handleSignup}>
        <div className="grid gap-2">
          <Label htmlFor="full-name">Full Name</Label>
          <Input name="full-name" id="full-name" placeholder="Priya Sharma" required />
        </div>
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
            <Label htmlFor="phone">Phone Number</Label>
            <Input name="phone" id="phone" type="tel" placeholder="+91 98765 43210" required />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input name="city" id="city" placeholder="Mumbai" required />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="id-upload">Aadhaar / College ID (Optional)</Label>
            <Input name="id-upload" id="id-upload" type="file" />
            <p className="text-xs text-muted-foreground">Recommended for a 'Verified' badge.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input name="password" id="password" type="password" required/>
        </div>
        <div className="flex items-start space-x-2">
            <Checkbox id="terms" required />
            <div className="grid gap-1.5 leading-none">
                <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                I confirm I am a woman and agree to the community guidelines.
                </label>
            </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
           {isLoading ? "Creating Account..." : "Create an account"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Login
        </Link>
      </div>
    </>
  )
}
