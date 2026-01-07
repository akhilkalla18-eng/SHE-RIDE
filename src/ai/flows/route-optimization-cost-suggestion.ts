'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal routes and fair cost splits for ride-sharing within the SheRide platform.
 *
 * - `suggestRouteAndCost` - A function that takes in a starting location, destination, and other relevant ride details, and returns an optimized route and suggested cost split.
 * - `RouteAndCostInput` - The input type for the `suggestRouteAndCost` function.
 * - `RouteAndCostOutput` - The return type for the `suggestRouteAndCost` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RouteAndCostInputSchema = z.object({
  startLocation: z.string().describe('The starting location of the ride.'),
  destination: z.string().describe('The destination of the ride.'),
  vehicleType: z.enum(['Bike', 'Scooty']).describe('The type of vehicle being used.'),
  distance: z.number().describe('The total distance of the route in kilometers.'),
  duration: z.number().describe('The estimated duration of the ride in minutes.'),
  fuelCostPerLiter: z.number().describe('The cost of fuel per liter in the current city.'),
  fuelEfficiency: z.number().describe('The fuel efficiency of the vehicle in kilometers per liter.'),
  tollCost: z.number().optional().describe('The estimated toll cost for the route, if any.'),
});

export type RouteAndCostInput = z.infer<typeof RouteAndCostInputSchema>;

const RouteAndCostOutputSchema = z.object({
  optimizedRouteDescription: z.string().describe('A textual description of the optimized route.'),
  suggestedCostSplit: z.number().describe('The suggested cost split between the rider and passenger.'),
  reasons: z.string().describe('Reasons behind the cost split.'),
});

export type RouteAndCostOutput = z.infer<typeof RouteAndCostOutputSchema>;

export async function suggestRouteAndCost(input: RouteAndCostInput): Promise<RouteAndCostOutput> {
  return suggestRouteAndCostFlow(input);
}

const routeAndCostPrompt = ai.definePrompt({
  name: 'routeAndCostPrompt',
  input: {schema: RouteAndCostInputSchema},
  output: {schema: RouteAndCostOutputSchema},
  prompt: `You are an AI assistant designed to suggest optimal routes and fair cost splits for rides shared by women on the SheRide platform. Consider the following ride details:

Start Location: {{{startLocation}}}
Destination: {{{destination}}}
Vehicle Type: {{{vehicleType}}}
Total Distance: {{{distance}}} kilometers
Estimated Duration: {{{duration}}} minutes
Fuel Cost Per Liter: {{{fuelCostPerLiter}}}
Vehicle Fuel Efficiency: {{{fuelEfficiency}}} kilometers per liter
Toll Cost: {{{tollCost}}}

Based on these details, provide:
1.  An optimized route description.
2.  A suggested cost split between the rider and passenger, taking into account fuel costs, vehicle wear and tear, and toll costs (if any).
3. Give detailed reasons for your cost split suggestion.

Ensure the cost split is fair and transparent, promoting a positive ride-sharing experience for both women.

Consider that the rider is offering the ride as a service, but this is a non-commercial community platform and the rider is not trying to make a profit.
`,
});

const suggestRouteAndCostFlow = ai.defineFlow(
  {
    name: 'suggestRouteAndCostFlow',
    inputSchema: RouteAndCostInputSchema,
    outputSchema: RouteAndCostOutputSchema,
  },
  async input => {
    const {output} = await routeAndCostPrompt(input);
    return output!;
  }
);
