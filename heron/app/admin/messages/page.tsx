import AdminMessageList from "@/components/admin/AdminMessageList";
import { getAuthUser } from "@/lib/api-utils";
import { loadContactNotifyView } from "@/lib/contact-mail";
import { listContactMessages } from "@/services/contact-messages";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function AdminMessagesPage() {
    const user = await getAuthUser();
    if (!user) return null;

    const rows = await listContactMessages();
    return (
        <AdminMessageList
            mail={await loadContactNotifyView()}
            messages={rows.map((row) => ({
                id: row.id,
                name: row.name,
                email: row.email,
                message: row.message,
                created_at: row.createdAt
            }))}
        />
    );
}
