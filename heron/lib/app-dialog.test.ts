import { describe, expect, it } from "vitest";
import { normalizeAlertInput, normalizeConfirmInput } from "./app-dialog";

describe("normalizeAlertInput", () => {
  it("accepts a plain string message", () => {
    expect(normalizeAlertInput("Something went wrong.")).toEqual({
      title: "Notice",
      message: "Something went wrong.",
      confirmLabel: "OK"
    });
  });

  it("applies defaults for partial options", () => {
    expect(
      normalizeAlertInput({
        message: "Saved.",
        title: "Done"
      })
    ).toEqual({
      title: "Done",
      message: "Saved.",
      confirmLabel: "OK"
    });
  });

  it("keeps a custom confirm label", () => {
    expect(
      normalizeAlertInput({
        message: "Heads up",
        confirmLabel: "Got it"
      })
    ).toEqual({
      title: "Notice",
      message: "Heads up",
      confirmLabel: "Got it"
    });
  });
});

describe("normalizeConfirmInput", () => {
  it("accepts a plain string message with safe defaults", () => {
    expect(normalizeConfirmInput("Delete this item?")).toEqual({
      title: "Please confirm",
      message: "Delete this item?",
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      variant: "default"
    });
  });

  it("supports danger variant and custom labels", () => {
    expect(
      normalizeConfirmInput({
        title: "Delete album",
        message: "This cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Keep",
        variant: "danger"
      })
    ).toEqual({
      title: "Delete album",
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      variant: "danger"
    });
  });
});
