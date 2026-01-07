import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function SignupPage() {
  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="full-name">Full Name</Label>
          <Input id="full-name" placeholder="Priya Sharma" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="priya@example.com"
            required
          />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="+91 98765 43210" required />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Mumbai" required />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="id-upload">Aadhaar / College ID (Optional)</Label>
            <Input id="id-upload" type="file" />
            <p className="text-xs text-muted-foreground">Recommended for a 'Verified' badge.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" />
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
        <Button type="submit" className="w-full" asChild>
           <Link href="/dashboard">Create an account</Link>
        </Button>
      </div>
      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Login
        </Link>
      </div>
    </>
  )
}
