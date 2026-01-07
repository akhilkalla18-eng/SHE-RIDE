"use server";

import { suggestRouteAndCost, type RouteAndCostInput, type RouteAndCostOutput } from "@/ai/flows/route-optimization-cost-suggestion";
import { z } from "zod";

const RouteAndCostFormSchema = z.object({
  startLocation: z.string().min(3, "Start location is required."),
  destination: z.string().min(3, "Destination is required."),
  vehicleType: z.enum(['Bike', 'Scooty']),
  distance: z.coerce.number().min(1, "Distance must be at least 1 km."),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  fuelCostPerLiter: z.coerce.number().min(1, "Fuel cost is required."),
  fuelEfficiency: z.coerce.number().min(1, "Fuel efficiency is required."),
  tollCost: z.coerce.number().optional(),
});

export type FormState = {
    message: string;
    fields?: Record<string, string>;
    issues?: string[];
    data?: RouteAndCostOutput;
};

export async function getRouteSuggestion(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  
  const formData = Object.fromEntries(data);
  const parsed = RouteAndCostFormSchema.safeParse(formData);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString();
    }
    return {
      message: "Invalid form data.",
      fields,
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  try {
    const result = await suggestRouteAndCost(parsed.data as RouteAndCostInput);
    return {
        message: "success",
        data: result,
    }
  } catch (e) {
    return {
        message: "An error occurred while getting suggestions from AI.",
        issues: [(e as Error).message],
    }
  }
}
