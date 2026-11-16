"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDialog } from "@/components/ui/DialogProvider";
import { apiFetch } from "@/lib/api";
import {
    adminBtnAdd,
    adminBtnDanger,
    adminCardClass,
    adminCompactInputClass,
    adminCompactLabelClass
} from "@/lib/admin-ui";
import type { ContactNotifyView } from "@/lib/contact-notify";

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

const saveButtonClass =
    "rounded-lg bg-chestnut px-4 py-2 text-sm font-semibold text-desert-tan transition-colors hover:bg-chestnut-light disabled:opacity-50 dark:bg-caramel dark:text-chestnut-dark";

export default function AdminMessageList({
    mail,
    messages
}: {
    mail: ContactNotifyView;
    messages: AdminContactMessage[];
}) {
    const { confirm } = useDialog();
    const [rows, setRows] = useState(messages);
    const [email, setEmail] = useState(mail.email);
    const [notify, setNotify] = useState(mail);
    const [saving, setSaving] = useState(false);

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

    const saveMail = async (nextEmail: string, resend: boolean) => {
        setSaving(true);
        try {
            const saved = await apiFetch<ContactNotifyView>("/admin/contact-mail", {
                method: "PUT",
                body: JSON.stringify({ email: nextEmail, resend })
            });
            setEmail(saved.email);
            setNotify(saved);
            if (saved.status === "unavailable") toast.error(saved.notice);
            else if (saved.status === "verified") toast.success("Email notification is on.");
            else toast.success(saved.notice);
        } catch (err) {
            const text = err instanceof Error ? err.message : "Failed to save email settings";
            toast.error(text);
        } finally {
            setSaving(false);
        }
    };

    const dirty = email.trim() !== notify.email;
    const waiting = notify.status === "pending" || notify.status === "failed" || notify.status === "unavailable";

    return (
        <div className="grid gap-4">
            <section className={adminCardClass}>
                <h2 className="m-0 text-chestnut dark:text-dark-text">Messages</h2>
                <p className="mt-2 text-sm text-chestnut-dark dark:text-dark-muted">
                    {notify.notifiesByEmail
                        ? "New messages are saved here and a copy is emailed."
                        : "New messages are saved here. Email notification is off."}
                </p>
            </section>

            <section className={adminCardClass}>
                <h2 className="m-0 text-base text-chestnut dark:text-dark-text">Email notification</h2>
                <p className="mt-2 text-sm text-chestnut-dark dark:text-dark-muted">
                    Amazon SES in {notify.region} emails a confirmation link to this address. After you click it, the
                    form sends a copy here and uses the visitor&apos;s address for replies.
                </p>
                <p id="contact-mail-notice" className="mt-2 text-sm text-chestnut dark:text-dark-text">
                    {notify.notice}
                </p>
                <label className="mt-4 block max-w-md">
                    <span className={adminCompactLabelClass}>Your email</span>
                    <input
                        id="contact-mail-email"
                        type="email"
                        autoComplete="off"
                        className={adminCompactInputClass}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                    {notify.status === "verified" && !dirty ? (
                        <button
                            id="contact-mail-off"
                            type="button"
                            onClick={() => saveMail("", false)}
                            disabled={saving}
                            className={adminBtnAdd}
                        >
                            {saving ? "Saving…" : "Turn off"}
                        </button>
                    ) : (
                        <button
                            id="contact-mail-save"
                            type="button"
                            onClick={() => saveMail(email, false)}
                            disabled={saving}
                            className={saveButtonClass}
                        >
                            {saving ? "Saving…" : dirty || notify.status === "off" ? "Send confirmation link" : "Check again"}
                        </button>
                    )}
                    {waiting && !dirty ? (
                        <button
                            id="contact-mail-resend"
                            type="button"
                            onClick={() => saveMail(email, true)}
                            disabled={saving}
                            className={adminBtnAdd}
                        >
                            Send the link again
                        </button>
                    ) : null}
                </div>
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
