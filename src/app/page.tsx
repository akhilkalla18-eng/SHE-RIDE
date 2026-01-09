import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Users } from 'lucide-react';
import { Logo } from '@/components/logo';
import { placeholderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const heroImage = placeholderImages.find(p => p.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo className="h-8 w-auto" />
          <span className="sr-only">SheRide</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Login
          </Link>
          <Button asChild>
            <Link href="/signup" prefetch={false}>
              Sign Up
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full pt-24 md:pt-32 lg:pt-40 relative">
          <div className="container px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
              <div className="flex flex-col justify-center space-y-4">
                <h1 className="lg:leading-tighter text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl">
                  Travel with Confidence.
                  <br />
                  <span className="text-primary">By Women, For Women.</span>
                </h1>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  SheRide is a community-based ride-sharing platform connecting women for safer, more comfortable, and affordable travel. Share rides, not worries.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup" prefetch={false}>
                      Get Started
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#how-it-works" prefetch={false}>
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                 {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={600}
                    height={400}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                    data-ai-hint={heroImage.imageHint}
                  />
                 )}
              </div>
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">How It Works</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Simple Path to Safer Rides</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to be intuitive and secure, connecting you with fellow women travelers in just a few steps.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">1. Create Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up and complete your profile. Our verification process ensures a community of trusted women.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M12 22c-4 0-8-3-8-8 0-4.5 4-8.5 8-8.5s8 4 8 8.5c0 5-4 8-8 8Z"/><path d="M12 2a6 6 0 0 1 6 6v1H6V8a6 6 0 0 1 6-6Z"/><path d="M12 11v-1"/><path d="m15 11-1-1"/><path d="m9 11 1-1"/></svg>
                </div>
                <h3 className="text-xl font-bold">2. Find or Offer a Ride</h3>
                <p className="text-sm text-muted-foreground">
                  Request a ride for your commute or offer a seat to someone on your route. Our matching system connects you.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                   <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">3. Travel Together</h3>
                <p className="text-sm text-muted-foreground">
                  Chat with your match, confirm the details, and share your journey. Enjoy a safe and comfortable ride.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="safety" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Our Safety Promise</div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Your Safety is Our Foundation</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We've built SheRide from the ground up with features designed to create a secure and trustworthy environment for all members.
              </p>
              <ul className="grid gap-4">
                <li className="flex items-start gap-3">
                  <Shield className="mt-1 h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Women-Only Platform</h3>
                    <p className="text-sm text-muted-foreground">Strictly for users who identify as women, creating a comfortable space for all.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Profile Verification</h3>
                    <p className="text-sm text-muted-foreground">Optional ID verification for a "Verified" badge, adding an extra layer of trust.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 h-6 w-6 text-primary"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                  <div>
                    <h3 className="font-semibold">In-App Chat</h3>
                    <p className="text-sm text-muted-foreground">Communicate securely without sharing personal contact information until you're ready.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 h-6 w-6 text-primary"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <div>
                    <h3 className="font-semibold">SOS &amp; Emergency Contacts</h3>
                    <p className="text-sm text-muted-foreground">An in-ride SOS button and emergency contact feature are there for your peace of mind.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="hidden lg:block">
                {heroImage && (
                    <Image
                        src={placeholderImages.find(p => p.id === 'safety')?.imageUrl || ''}
                        alt={placeholderImages.find(p => p.id === 'safety')?.description || ''}
                        width={600}
                        height={600}
                        className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
                        data-ai-hint={placeholderImages.find(p => p.id === 'safety')?.imageHint || ''}
                    />
                )}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-muted/50">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} SheRide. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
