"use client";

import { useState, type FormEvent } from "react";
import { homeBodyStyle } from "@/components/home/homeSectionStyles";

const fieldClass =
    "w-full rounded-lg border border-desert-tan-dark bg-white px-3 py-2.5 text-chestnut-dark outline-none transition placeholder:text-olive/70 focus:border-chestnut focus:ring-2 focus:ring-chestnut/20 dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-muted/60 dark:focus:border-caramel";

const labelClass = "mb-1 block text-left text-sm font-semibold text-chestnut-dark dark:text-dark-text";

type Status = { type: "idle" } | { type: "sending" } | { type: "sent" } | { type: "error"; message: string };

export function ContactForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [trap, setTrap] = useState("");
    const [status, setStatus] = useState<Status>({ type: "idle" });

    const sendAnother = () => {
        setName("");
        setEmail("");
        setMessage("");
        setTrap("");
        setStatus({ type: "idle" });
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (status.type === "sending") return;
        setStatus({ type: "sending" });
        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message, hp_token: trap })
            });
            const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
            if (!response.ok) {
                const messageText =
                    payload && typeof payload.error === "string" && payload.error.trim()
                        ? payload.error
                        : "Something went wrong. Please try again.";
                setStatus({ type: "error", message: messageText });
                return;
            }
            setStatus({ type: "sent" });
        } catch {
            setStatus({ type: "error", message: "Something went wrong. Please try again." });
        }
    };

    if (status.type === "sent") {
        return (
            <div className="mx-auto max-w-xl text-center" style={homeBodyStyle} role="status">
                <p className="m-0 text-[1.05rem] text-chestnut-dark dark:text-dark-text">
                    Thanks. Your message was received.
                </p>
                <button
                    type="button"
                    onClick={sendAnother}
                    className="mt-4 rounded-lg border border-chestnut px-5 py-2.5 text-sm font-semibold text-chestnut transition hover:bg-chestnut/10 dark:border-caramel dark:text-caramel"
                >
                    Send another
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="relative mx-auto grid max-w-xl gap-4 text-left" style={homeBodyStyle} noValidate>
            <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="contact-hp">Leave this field empty</label>
                <input
                    id="contact-hp"
                    name="hp_token"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={trap}
                    onChange={(event) => setTrap(event.target.value)}
                />
            </div>
            <div>
                <label htmlFor="contact-name" className={labelClass}>
                    Name
                </label>
                <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={fieldClass}
                />
            </div>
            <div>
                <label htmlFor="contact-email" className={labelClass}>
                    Email
                </label>
                <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={fieldClass}
                />
            </div>
            <div>
                <label htmlFor="contact-message" className={labelClass}>
                    Message
                </label>
                <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    maxLength={4000}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className={fieldClass}
                />
            </div>
            {status.type === "error" && (
                <p className="m-0 text-sm text-copper" role="alert">
                    {status.message}
                </p>
            )}
            <button
                type="submit"
                disabled={status.type === "sending"}
                className="rounded-lg bg-chestnut px-6 py-3 font-semibold text-desert-tan transition hover:bg-chestnut-light disabled:cursor-not-allowed disabled:opacity-60 dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"
            >
                {status.type === "sending" ? "Sending..." : "Send message"}
            </button>
        </form>
    );
}
