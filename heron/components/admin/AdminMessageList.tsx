"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDialog } from "@/components/ui/DialogProvider";
import { apiFetch } from "@/lib/api";
import { adminBtnDanger, adminCardClass } from "@/lib/admin-ui";

export type AdminContactMessage = {
    id: number;
    name: string;
    email: string;
    message: string;
    created_at: string;
};

function formatWhen(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

export default function AdminMessageList({
    notifiesByEmail,
    messages
}: {
    notifiesByEmail: boolean;
    messages: AdminContactMessage[];
}) {
    const { confirm } = useDialog();
    const [rows, setRows] = useState(messages);

    const remove = async (message: AdminContactMessage) => {
        const confirmed = await confirm({
            title: "Delete message",
            message: `Delete the message from ${message.name}?`,
            confirmLabel: "Delete",
            cancelLabel: "Cancel",
            variant: "danger"
        });
        if (!confirmed) return;
        try {
            await apiFetch(`/admin/contact-messages/${message.id}`, { method: "DELETE" });
            setRows((prev) => prev.filter((row) => row.id !== message.id));
            toast.success("Message deleted.");
        } catch (err) {
            const text = err instanceof Error ? err.message : "Failed to delete message";
            toast.error(text);
        }
    };

    return (
        <div className="grid gap-4">
            <section className={adminCardClass}>
                <h2 className="m-0 text-chestnut dark:text-dark-text">Messages</h2>
                <p className="mt-2 text-sm text-chestnut-dark dark:text-dark-muted">
                    {notifiesByEmail
                        ? "New messages are saved here and a copy is emailed to the inbox configured on the server."
                        : "New messages are saved here. Email notification is off until Amazon SES is configured on the server."}
                </p>
            </section>

            {rows.length === 0 ? (
                <p className={`${adminCardClass} text-olive dark:text-dark-muted`}>No messages yet.</p>
            ) : (
                <div className="grid gap-3">
                    {rows.map((message) => (
                        <article key={message.id} className={adminCardClass}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="m-0 text-base text-chestnut dark:text-dark-text">{message.name}</h3>
                                    <p className="m-0 mt-1 text-sm text-olive-dark dark:text-dark-muted">
                                        <a className="underline" href={`mailto:${message.email}`}>
                                            {message.email}
                                        </a>
                                        <span className="mx-2">·</span>
                                        <time dateTime={message.created_at}>{formatWhen(message.created_at)}</time>
                                    </p>
                                </div>
                                <button type="button" onClick={() => remove(message)} className={adminBtnDanger}>
                                    Delete
                                </button>
                            </div>
                            <p className="mb-0 mt-3 whitespace-pre-wrap text-sm text-chestnut-dark dark:text-dark-text">
                                {message.message}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
