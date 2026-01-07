import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MessageCircle, Shield, UserCheck } from "lucide-react";

const guidelines = [
  {
    icon: UserCheck,
    title: "Verify Profiles",
    description: "Look for the 'Verified' badge. We encourage users to complete verification for added trust. Always review a user's profile and ratings before accepting a ride."
  },
  {
    icon: MessageCircle,
    title: "Communicate In-App",
    description: "Use the in-app chat to discuss ride details. Avoid sharing personal contact information like your phone number until you feel comfortable and the ride is confirmed."
  },
  {
    icon: Shield,
    title: "Share Your Trip Details",
    description: "Before starting your ride, share your trip details with a friend or family member. Our platform will allow sharing a live tracking link in a future update."
  },
  {
    icon: CheckCircle,
    title: "Meet in Public Places",
    description: "Arrange to meet your ride partner in a well-lit, public, and familiar location. Avoid meeting at secluded or poorly lit areas."
  },
  {
    icon: UserCheck,
    title: "Confirm Your Ride",
    description: "Before getting on a bike/scooty, confirm the rider/passenger's name and destination. Ensure the vehicle and person match the details in the app."
  },
  {
    icon: Shield,
    title: "Trust Your Instincts",
    description: "If a situation or a user makes you feel uncomfortable, you have the right to cancel the ride at any time. Your safety is the top priority."
  },
];

export default function SafetyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Safety &amp; Guidelines</h1>
        <p className="text-muted-foreground">Your guide to a safe and comfortable ride-sharing experience on SheRide.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Community Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-6">
            {guidelines.map((item, index) => (
              <li key={index} className="flex items-start gap-4">
                <item.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
       <Card className="mt-6 border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">In Case of Emergency</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-destructive/80 dark:text-destructive/90">
                Use the <span className="font-bold">SOS button</span> in the app to immediately alert your emergency contacts and our support team. If you are in immediate danger, please contact local law enforcement (dial 100 or 112) first.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
