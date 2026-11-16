import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import type { ContactSubmission } from "@/lib/contact-submission";

export async function createContactMessage(message: ContactSubmission) {
    const created = await getDb()
        .insert(contactMessages)
        .values({
            name: message.name,
            email: message.email,
            message: message.message,
            createdAt: new Date().toISOString()
        })
        .returning();
    return created[0];
}

export async function listContactMessages() {
    return getDb().select().from(contactMessages).orderBy(desc(contactMessages.id)).limit(200);
}

export async function deleteContactMessage(id: number) {
    const removed = await getDb().delete(contactMessages).where(eq(contactMessages.id, id)).returning();
    return removed[0] ?? null;
}
