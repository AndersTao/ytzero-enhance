import { describe, expect, test } from "bun:test";
import { isSourceSiteTopPage, sourcePlayerSeconds } from "../src/handoff";

describe("YT Zero button on source-site pages", () => {
  test("only the main source site gets the button", () => {
    expect(isSourceSiteTopPage("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    expect(isSourceSiteTopPage("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe(false);
    expect(isSourceSiteTopPage("https://home.test/watch/dQw4w9WgXcQ")).toBe(false);
    expect(isSourceSiteTopPage("not a url")).toBe(false);
  });

  test("takes the player position, except for live broadcasts", () => {
    expect(sourcePlayerSeconds({ currentTime: 42.5, duration: 300 }, false)).toBe(42.5);
    expect(sourcePlayerSeconds({ currentTime: 42.5, duration: 300 }, true)).toBe(0);
    expect(sourcePlayerSeconds({ currentTime: 42.5, duration: Number.POSITIVE_INFINITY }, false)).toBe(0);
    expect(sourcePlayerSeconds(null, false)).toBe(0);
  });
});

test("the background also redirects on in-page navigation but not on Back/Forward", async () => {
  const source = await Bun.file(new URL("../src/background.ts", import.meta.url)).text();
  expect(source).toContain("onHistoryStateUpdated?.addListener(redirect, REDIRECT_FILTER)");
  expect(source).toContain('transitionQualifiers.includes("forward_back")');
});
