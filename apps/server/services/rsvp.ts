import { eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../_core/db";
import { rsvps } from "../db/schema";

export const PRIMARY_EMAIL = "syammanoharkvkl@gmail.com";
export const SECONDARY_EMAILS = [
  "vipv7357@gmail.com",
  "anandhumarch7@gmail.com"
];
export const ALL_NOTIFICATION_EMAILS = [
  PRIMARY_EMAIL,
  ...SECONDARY_EMAILS
];

export class DuplicateRsvpError extends Error {
  constructor(message = "An RSVP has already been submitted with this email or phone number.") {
    super(message);
    this.name = "DuplicateRsvpError";
  }
}

export interface RsvpInput {
  name: string;
  contact: string;
  attending: string;
  guests: number;
  meal: string;
  message?: string;
}

export interface StoredRsvp extends RsvpInput {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// In-memory store of RSVPs keyed by normalized contact
const memoryRsvps = new Map<string, StoredRsvp>();

/**
 * Normalizes contact string (phone or email) for accurate matching:
 * - Emails: lowercased and trimmed.
 * - Phone numbers: non-digit characters removed, handles (+91, 0).
 */
export function normalizeContact(contact: string): string {
  const trimmed = contact.trim().toLowerCase();

  // Email normalization
  if (trimmed.includes("@")) {
    return trimmed;
  }

  // Phone number normalization
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }

  return digits || trimmed;
}

/**
 * Normalizes guest name for comparison
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Check if a name loosely matches (handles partial names or single word names)
 */
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (n1 === n2) return true;
  // If either contains the other (e.g. "Rahul" matches "Rahul Sharma")
  if (n1.includes(n2) || n2.includes(n1)) return true;
  return false;
}

export async function checkIsDuplicate(contact: string): Promise<boolean> {
  const normalized = normalizeContact(contact);

  if (memoryRsvps.has(normalized)) {
    return true;
  }

  if (isDatabaseConfigured()) {
    try {
      const existing = await getDb()
        .select({ contact: rsvps.contact })
        .from(rsvps)
        .where(eq(rsvps.contact, contact))
        .limit(1);

      if (existing.length > 0) {
        return true;
      }

      const allRows = await getDb()
        .select({ contact: rsvps.contact })
        .from(rsvps)
        .limit(500);

      for (const row of allRows) {
        if (normalizeContact(row.contact) === normalized) {
          return true;
        }
      }
    } catch (err) {
      console.warn("Database duplicate check error (skipped):", err);
    }
  }

  return false;
}

/**
 * Find an existing RSVP by Name (username) and Contact (password/key)
 */
export async function findRsvp(name: string, contact: string): Promise<StoredRsvp | null> {
  const normalizedContact = normalizeContact(contact);

  // 1. Check memory cache first
  const cached = memoryRsvps.get(normalizedContact);
  if (cached && namesMatch(cached.name, name)) {
    return cached;
  }

  // 2. Check database if configured
  if (isDatabaseConfigured()) {
    try {
      const allRows = await getDb().select().from(rsvps).limit(500);
      for (const row of allRows) {
        if (normalizeContact(row.contact) === normalizedContact) {
          if (namesMatch(row.name, name)) {
            const result: StoredRsvp = {
              id: row.id,
              name: row.name,
              contact: row.contact,
              attending: row.attending,
              guests: row.guests,
              meal: row.meal,
              message: row.message || ""
            };
            memoryRsvps.set(normalizedContact, result);
            return result;
          }
        }
      }
    } catch (err) {
      console.warn("Database find RSVP error:", err);
    }
  }

  return null;
}

export async function saveRsvp(input: RsvpInput) {
  const normalized = normalizeContact(input.contact);

  // Check duplicate
  const isDuplicate = await checkIsDuplicate(input.contact);
  if (isDuplicate) {
    throw new DuplicateRsvpError(
      "An RSVP has already been submitted with this phone number or email. You can use 'Update RSVP' with your name and phone/email to make changes."
    );
  }

  let savedId = crypto.randomUUID();

  if (isDatabaseConfigured()) {
    try {
      const rows = await getDb()
        .insert(rsvps)
        .values({
          id: savedId,
          name: input.name,
          contact: input.contact,
          attending: input.attending,
          guests: input.guests,
          meal: input.meal,
          message: input.message || ""
        })
        .returning();
      if (rows[0]) {
        savedId = rows[0].id;
      }
    } catch (dbErr) {
      console.warn("Database insert skipped or failed:", dbErr);
    }
  }

  const storedRecord: StoredRsvp = {
    id: savedId,
    name: input.name,
    contact: input.contact,
    attending: input.attending,
    guests: input.guests,
    meal: input.meal,
    message: input.message || ""
  };
  memoryRsvps.set(normalized, storedRecord);

  // Dispatch initial confirmation email
  const emailResults = await dispatchRsvpEmail(input, false);

  return {
    id: savedId,
    emailDispatched: emailResults.success,
    primaryRecipient: PRIMARY_EMAIL,
    secondaryRecipients: SECONDARY_EMAILS,
    allRecipients: ALL_NOTIFICATION_EMAILS
  };
}

export async function updateRsvp(input: RsvpInput & { id?: string }) {
  const normalized = normalizeContact(input.contact);

  const updatedId = input.id || crypto.randomUUID();

  if (isDatabaseConfigured()) {
    try {
      if (input.id) {
        await getDb()
          .update(rsvps)
          .set({
            name: input.name,
            contact: input.contact,
            attending: input.attending,
            guests: input.guests,
            meal: input.meal,
            message: input.message || ""
          })
          .where(eq(rsvps.id, input.id));
      }
    } catch (dbErr) {
      console.warn("Database update error:", dbErr);
    }
  }

  const updatedRecord: StoredRsvp = {
    id: updatedId,
    name: input.name,
    contact: input.contact,
    attending: input.attending,
    guests: input.guests,
    meal: input.meal,
    message: input.message || ""
  };
  memoryRsvps.set(normalized, updatedRecord);

  // Dispatch email notification flagged as [UPDATED RSVP]
  const emailResults = await dispatchRsvpEmail(input, true);

  return {
    id: updatedId,
    emailDispatched: emailResults.success,
    primaryRecipient: PRIMARY_EMAIL,
    secondaryRecipients: SECONDARY_EMAILS,
    allRecipients: ALL_NOTIFICATION_EMAILS,
    updatedRsvp: updatedRecord
  };
}

export async function dispatchRsvpEmail(data: RsvpInput, isUpdate = false) {
  const isAttending = data.attending.toLowerCase() === "yes";
  const prefix = isUpdate ? "🔄 [UPDATED RSVP]" : "💍 New Wedding RSVP";
  const subject = `${prefix}: ${data.name} (${isAttending ? `Attending with ${data.guests} guest(s) ✅` : "Not Attending ❌"})`;

  const payload = {
    _subject: subject,
    _cc: SECONDARY_EMAILS.join(","),
    _template: "table",
    "Status": isUpdate ? "UPDATED RESPONSE" : "FIRST-TIME RSVP",
    "Guest Name": data.name,
    "Contact (Phone/Email)": data.contact,
    "Will Attend": isAttending ? `Yes, I'll be there! 🎉 (${data.guests} guest${data.guests > 1 ? "s" : ""})` : "Sadly, cannot make it",
    "Number of Guests": data.guests,
    "Meal Preference": data.meal,
    "Personal Message": data.message?.trim() || "No message attached",
    "Submitted At": new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  };

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${PRIMARY_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: "https://anandhu-vishnupriya.wedding",
        Origin: "https://anandhu-vishnupriya.wedding"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => null);
    return { success: response.ok, result };
  } catch (error) {
    console.error("Failed to dispatch RSVP email:", error);
    return { success: false, error: String(error) };
  }
}
