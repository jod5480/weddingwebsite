import { Hono, type Context } from "hono";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@repo/shared/http";
import { DuplicateRsvpError, findRsvp, saveRsvp, updateRsvp } from "../services/rsvp";

export const isPublic = true;
export const rsvpRouter = new Hono();

const RsvpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  contact: z.string().trim().min(1, "Phone or email is required").max(100),
  attending: z.string().default("yes"),
  guests: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) || num < 1 ? 1 : Math.min(num, 20);
    }),
  meal: z.string().default("non-vegetarian"),
  message: z.string().optional().default("")
});

const LookupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contact: z.string().trim().min(1, "Phone or email is required")
});

const UpdateRsvpSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(100),
  contact: z.string().trim().min(1, "Phone or email is required").max(100),
  attending: z.string().default("yes"),
  guests: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) || num < 1 ? 1 : Math.min(num, 20);
    }),
  meal: z.string().default("non-vegetarian"),
  message: z.string().optional().default("")
});

const submitHandler = async (c: Context) => {
  const body = await c.req.json().catch(() => null);
  const parsed = RsvpSchema.safeParse(body);

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid input";
    return c.json(apiFailure("INVALID_INPUT", errorMsg), 400);
  }

  try {
    const result = await saveRsvp(parsed.data);
    return c.json(
      apiSuccess({
        message: "RSVP recorded and sent to Anandhu & Vishnupriya",
        ...result
      }),
      200
    );
  } catch (error) {
    if (error instanceof DuplicateRsvpError) {
      return c.json(apiFailure("DUPLICATE_RSVP", error.message), 409);
    }
    console.error("Error processing RSVP:", error);
    return c.json(apiFailure("SERVER_ERROR", "Failed to process RSVP"), 500);
  }
};

const lookupHandler = async (c: Context) => {
  const body = await c.req.json().catch(() => null);
  const parsed = LookupSchema.safeParse(body);

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Name and contact are required";
    return c.json(apiFailure("INVALID_INPUT", errorMsg), 400);
  }

  const found = await findRsvp(parsed.data.name, parsed.data.contact);
  if (!found) {
    return c.json(
      apiFailure(
        "NOT_FOUND",
        "No existing RSVP found matching this Name and Phone/Email. Please check your spelling or submit a new RSVP."
      ),
      404
    );
  }

  return c.json(apiSuccess({ rsvp: found }), 200);
};

const updateHandler = async (c: Context) => {
  const body = await c.req.json().catch(() => null);
  const parsed = UpdateRsvpSchema.safeParse(body);

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid input";
    return c.json(apiFailure("INVALID_INPUT", errorMsg), 400);
  }

  try {
    const result = await updateRsvp(parsed.data);
    return c.json(
      apiSuccess({
        message: "Your RSVP has been updated and the couple has been notified",
        ...result
      }),
      200
    );
  } catch (error) {
    console.error("Error updating RSVP:", error);
    return c.json(apiFailure("SERVER_ERROR", "Failed to update RSVP"), 500);
  }
};

const statusHandler = async (c: Context) => {
  return c.json(
    apiSuccess({
      service: "rsvp",
      status: "active",
      primaryRecipient: "syammanoharkvkl@gmail.com",
      secondaryRecipients: ["vipv7357@gmail.com", "anandhumarch7@gmail.com"],
      allRecipients: [
        "syammanoharkvkl@gmail.com",
        "vipv7357@gmail.com",
        "anandhumarch7@gmail.com"
      ]
    }),
    200
  );
};

rsvpRouter.post("", submitHandler);
rsvpRouter.post("/", submitHandler);
rsvpRouter.post("/lookup", lookupHandler);
rsvpRouter.post("/update", updateHandler);
rsvpRouter.put("", updateHandler);
rsvpRouter.put("/", updateHandler);
rsvpRouter.get("", statusHandler);
rsvpRouter.get("/", statusHandler);
