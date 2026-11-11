"use client";

import { useSyncExternalStore } from "react";

// The year is read on the client only. The server renders nothing here, so the
// HTML never contains a year that the client could disagree with during hydration.
const subscribe = () => () => {};

export default function FooterYear() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null
  );
  return <>{year}</>;
}
