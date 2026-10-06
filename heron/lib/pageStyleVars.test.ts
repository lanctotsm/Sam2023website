import { describe, expect, it } from "vitest";
import { defaultPageStyle } from "@/lib/frontPageDefaults";
import { buildPageBgStyle, buildPageCssVars } from "./pageStyleVars";

describe("page style CSS filtering", () => {
  it("keeps safe colors and drops values that can break out of a declaration", () => {
    const vars = buildPageCssVars({
      ...defaultPageStyle,
      h1Color: "#aabbcc",
      bodyColor: "red; } body { background: url(https://evil.example)"
    }) as Record<string, string>;

    expect(vars["--page-h1-color"]).toBe("#aabbcc");
    expect(vars["--page-body-color"]).toBeUndefined();
  });

  it("keeps safe background URLs and drops CSS function breakouts", () => {
    expect(buildPageBgStyle({
      backgroundType: "image",
      backgroundColor: "",
      backgroundImage: "https://cdn.example/bg.jpg",
      gradientFrom: "",
      gradientTo: ""
    }).backgroundImage).toBe("url(https://cdn.example/bg.jpg)");

    expect(buildPageBgStyle({
      backgroundType: "image",
      backgroundColor: "",
      backgroundImage: "https://cdn.example/bg.jpg);color:red",
      gradientFrom: "",
      gradientTo: ""
    })).toEqual({});

    expect(buildPageBgStyle({
      backgroundType: "gradient",
      backgroundColor: "",
      backgroundImage: "",
      gradientFrom: "#111111",
      gradientTo: "expression(alert(1))"
    })).toEqual({});
  });
});
