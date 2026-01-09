"use client"

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { getRouteSuggestion, type FormState } from "@/app/actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bot, Coins, Info, Loader2, Route } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full md:w-auto ml-auto">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
            Get Suggestion
        </Button>
    );
}

export default function RouteOptimizerPage() {
    const initialState: FormState = {
        message: "",
    };
    const [state, formAction] = useActionState(getRouteSuggestion, initialState);

    return (
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>AI Route &amp; Cost Optimizer</CardTitle>
                        <CardDescription>
                            Get an AI-powered suggestion for the best route and a fair cost split for your ride.
                        </CardDescription>
                    </CardHeader>
                    <form action={formAction}>
                        <CardContent className="grid gap-4">
                            {state.issues && (
                                <Alert variant="destructive">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        <ul>
                                            {state.issues.map((issue) => (
                                                <li key={issue}>- {issue}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startLocation">Start Location</Label>
                                    <Input id="startLocation" name="startLocation" defaultValue="Andheri West" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="destination">Destination</Label>
                                    <Input id="destination" name="destination" defaultValue="Bandra Kurla Complex" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="distance">Distance (km)</Label>
                                    <Input id="distance" name="distance" type="number" defaultValue="12" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duration (mins)</Label>
                                    <Input id="duration" name="duration" type="number" defaultValue="45" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                                    <Select name="vehicleType" defaultValue="Scooty" required>
                                        <SelectTrigger id="vehicleType">
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bike">Bike</SelectItem>
                                            <SelectItem value="Scooty">Scooty</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="fuelEfficiency">Fuel Efficiency (km/L)</Label>
                                    <Input id="fuelEfficiency" name="fuelEfficiency" type="number" defaultValue="40" required />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fuelCostPerLiter">Fuel Cost (per Liter)</Label>
                                    <Input id="fuelCostPerLiter" name="fuelCostPerLiter" type="number" defaultValue="105" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tollCost">Toll Cost (Optional)</Label>
                                    <Input id="tollCost" name="tollCost" type="number" defaultValue="0" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <SubmitButton />
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">AI Suggestion</h2>
                {state.message === "success" && state.data ? (
                     <div className="space-y-6">
                        <Card>
                             <CardHeader className="flex flex-row items-start gap-4">
                                 <Coins className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                                <div>
                                    <CardTitle>Suggested Cost Split</CardTitle>
                                    <p className="text-4xl font-bold mt-2">₹{state.data.suggestedCostSplit.toFixed(2)}</p>
                                    <CardDescription>per person</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                 <h4 className="font-semibold mb-2">Reasoning:</h4>
                                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.data.reasons}</p>
                            </CardContent>
                        </Card>
                         <Card>
                             <CardHeader className="flex flex-row items-start gap-4">
                                <Route className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                                <div>
                                    <CardTitle>Optimized Route</CardTitle>
                                    <CardDescription>A suggested route for your journey.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.data.optimizedRouteDescription}</p>
                            </CardContent>
                        </Card>
                     </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center bg-muted/50 rounded-lg p-8">
                        <Bot className="h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Waiting for Input</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Fill out the form to get your personalized route and cost suggestion.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
