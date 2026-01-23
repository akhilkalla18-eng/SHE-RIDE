import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Shield, Users, MessageSquare, Star } from 'lucide-react';
import { Logo } from '@/components/logo';
import { placeholderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const heroImage = placeholderImages.find(p => p.id === 'hero');
  const safetyImage = placeholderImages.find(p => p.id === 'safety');
  const avatar1 = placeholderImages.find(p => p.id === 'avatar1');
  const avatar2 = placeholderImages.find(p => p.id === 'avatar2');
  const avatar3 = placeholderImages.find(p => p.id === 'avatar3');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo className="h-8 w-auto" />
          <span className="sr-only">SheRide</span>
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4">
           <Button variant="ghost" asChild>
              <Link href="#safety" prefetch={false}>
                Safety
              </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login" prefetch={false}>
              Login
            </Link>
          </Button>
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
            <div className="grid max-w-[1300px] mx-auto gap-8 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <h1 className="lg:leading-tighter text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl !leading-[1.2]">
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
                      Join the Community
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#how-it-works" prefetch={false}>
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center">
                 {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={600}
                    height={400}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover shadow-2xl"
                    data-ai-hint={heroImage.imageHint}
                    priority
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
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium">How It Works</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Simple Path to Safer Rides</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to be intuitive and secure, connecting you with fellow women travelers in just a few steps.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
              <div className="grid gap-2 text-center p-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">1. Create Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up and complete your profile. Our verification process helps build a community of trusted women.
                </p>
              </div>
              <div className="grid gap-2 text-center p-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M12 22c-4 0-8-3-8-8 0-4.5 4-8.5 8-8.5s8 4 8 8.5c0 5-4 8-8 8Z"/><path d="M12 2a6 6 0 0 1 6 6v1H6V8a6 6 0 0 1 6-6Z"/><path d="M12 11v-1"/><path d="m15 11-1-1"/><path d="m9 11 1-1"/></svg>
                </div>
                <h3 className="text-xl font-bold">2. Find or Offer a Ride</h3>
                <p className="text-sm text-muted-foreground">
                  Request a ride for your commute or offer a seat to someone on your route. Our system helps you find matches.
                </p>
              </div>
              <div className="grid gap-2 text-center p-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
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
          <div className="container grid items-center gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium">Our Safety Promise</div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Your Safety is Our Foundation</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We've built SheRide from the ground up with features designed to create a secure and trustworthy environment for all members.
              </p>
              <ul className="grid gap-6 mt-6">
                <li className="flex items-start gap-4">
                  <Shield className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">Women-Only Platform</h3>
                    <p className="text-sm text-muted-foreground">Strictly for users who identify as women, creating a comfortable space for all.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">Profile Verification</h3>
                    <p className="text-sm text-muted-foreground">Optional ID verification for a "Verified" badge, adding an extra layer of trust.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                   <MessageSquare className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">In-App Chat</h3>
                    <p className="text-sm text-muted-foreground">Communicate securely without sharing personal contact information until you're ready.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 h-6 w-6 flex-shrink-0 text-primary"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <div>
                    <h3 className="font-semibold">SOS &amp; Emergency Contacts</h3>
                    <p className="text-sm text-muted-foreground">An in-ride SOS button and emergency contact feature are there for your peace of mind.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="hidden lg:flex items-center justify-center">
                {safetyImage && (
                    <Image
                        src={safetyImage.imageUrl}
                        alt={safetyImage.description}
                        width={550}
                        height={550}
                        className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
                        data-ai-hint={safetyImage.imageHint}
                    />
                )}
            </div>
          </div>
        </section>

         <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium">Community Voices</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Members Are Saying</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Real stories from women who travel with SheRide.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-1 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  {avatar1 && <Image src={avatar1.imageUrl} alt={avatar1.description} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />}
                  <div>
                    <CardTitle>Priya S.</CardTitle>
                    <CardDescription>Daily Commuter</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">"SheRide has been a game-changer for my daily office travel. I feel so much safer and have met some wonderful women along the way. It's more than just a ride; it's a community."</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  {avatar2 && <Image src={avatar2.imageUrl} alt={avatar2.description} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />}
                  <div>
                    <CardTitle>Anika J.</CardTitle>
                    <CardDescription>Occasional Traveler</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">"I use SheRide for my weekend classes. It's affordable, reliable, and I love the peace of mind that comes with knowing I'm riding with another woman. Highly recommend!"</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  {avatar3 && <Image src={avatar3.imageUrl} alt={avatar3.description} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />}
                  <div>
                    <CardTitle>Rhea M.</CardTitle>
                    <CardDescription>New to the City</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">"As someone new to Mumbai, SheRide helped me navigate the city with confidence. It's comforting to have a network of women looking out for each other. A brilliant concept!"</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
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
