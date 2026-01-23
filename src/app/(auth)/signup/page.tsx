
"use client";

import Link from "next/link"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { useAuth, useFirestore, useStorage } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { UserProfile } from "@/lib/schemas";


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const [fileToUpload, setFileToUpload] = React.useState<File | null>(null);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("full-name") as string;
    const phoneNumber = formData.get("phone") as string;
    const city = formData.get("city") as string;

    if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Firebase not initialized. Please try again later.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let drivingLicenseUrl: string | undefined = undefined;
      if (fileToUpload && storage) {
        const storageRef = ref(storage, `verification-docs/${user.uid}/${fileToUpload.name}`);
        try {
            const uploadTask = await uploadBytes(storageRef, fileToUpload);
            drivingLicenseUrl = await getDownloadURL(uploadTask.ref);
        } catch (uploadError) {
            console.error("File upload failed during signup:", uploadError);
            const errorMessage = uploadError instanceof Error ? uploadError.message : "Could not upload ID.";
            toast({
                variant: "destructive",
                title: "ID Upload Failed",
                description: `Your account was created, but ID upload failed. You can add it later from your profile. Error: ${errorMessage}`,
            });
        }
      }

      const userProfile: UserProfile = {
        id: user.uid,
        name,
        email,
        phoneNumber,
        city,
        profileVerified: false,
        drivingLicenseId: drivingLicenseUrl,
        emergencyContact: "",
      };

      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, userProfile);

      toast({
        title: "Account Created!",
        description: "Welcome to SheRide. You'll be redirected.",
      });
      router.push("/dashboard");

    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred.";
      console.error("Signup failed:", error.code, errorMessage);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
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
            <Label htmlFor="id-upload">Driving License (Optional)</Label>
            <Input
              name="id-upload"
              id="id-upload"
              type="file"
              onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)}
              accept="image/*,.pdf"
            />
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
