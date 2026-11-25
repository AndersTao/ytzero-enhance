import { describe, expect, test } from "bun:test";
import { instanceApiUrl } from "../src/core";
import { SAVE_FOR_LATER_LINK_MENU, SAVE_FOR_LATER_PAGE_MENU, saveForLater, saveForLaterVideoId, saveOutcome } from "../src/saveForLater";

describe("save for later from the right-click menu", () => {
  test("takes the video from the link or from the page", () => {
    expect(saveForLaterVideoId({ menuItemId: SAVE_FOR_LATER_LINK_MENU, linkUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890" })).toBe("dQw4w9WgXcQ");
    expect(saveForLaterVideoId({ menuItemId: SAVE_FOR_LATER_LINK_MENU, linkUrl: "https://youtu.be/dQw4w9WgXcQ" })).toBe("dQw4w9WgXcQ");
    expect(saveForLaterVideoId({ menuItemId: SAVE_FOR_LATER_PAGE_MENU, pageUrl: "https://www.youtube.com/shorts/dQw4w9WgXcQ" })).toBe("dQw4w9WgXcQ");
    expect(saveForLaterVideoId({ menuItemId: SAVE_FOR_LATER_LINK_MENU, linkUrl: "https://www.youtube.com/@channel" })).toBeNull();
    expect(saveForLaterVideoId({ menuItemId: "other", linkUrl: "https://youtu.be/dQw4w9WgXcQ" })).toBeNull();
  });

  test("posts to the instance API below its base path, with the sign-in cookie", async () => {
    expect(instanceApiUrl("https://home.test/apps/ytzero/", "/saved-for-later")).toBe("https://home.test/apps/ytzero/api/saved-for-later");
    const calls: Array<[string, RequestInit]> = [];
    const fetcher = (async (url: string, init: RequestInit) => {
      calls.push([url, init]);
      return new Response(JSON.stringify({ ok: true, already: false, playlist: { name: "Gemt til senere" } }), { status: 200 });
    }) as unknown as typeof fetch;
    const outcome = await saveForLater("dQw4w9WgXcQ", "https://home.test", fetcher);
    expect(outcome).toEqual({ tone: "success", message: "Saved to Gemt til senere" });
    expect(calls[0][0]).toBe("https://home.test/api/saved-for-later");
    expect(calls[0][1].method).toBe("POST");
    expect(calls[0][1].credentials).toBe("include");
    expect(JSON.parse(String(calls[0][1].body))).toEqual({ video_id: "dQw4w9WgXcQ" });
  });

  test("explains sign-in, failure, a repeat and a missing instance", async () => {
    expect(saveOutcome(401, null).tone).toBe("error");
    expect(saveOutcome(401, null).message).toContain("Sign in");
    expect(saveOutcome(502, { playlist: { name: "x" } }).tone).toBe("error");
    expect(saveOutcome(200, { already: true, playlist: { name: "Saved for later" } }).message).toBe("Already saved, moved to the front of Saved for later");
    expect((await saveForLater("dQw4w9WgXcQ", "")).message).toContain("Connect");
    const offline = (async () => { throw new TypeError("offline"); }) as unknown as typeof fetch;
    expect((await saveForLater("dQw4w9WgXcQ", "https://home.test", offline)).tone).toBe("error");
  });

  test("every manifest asks for the context-menu permission", async () => {
    for (const target of ["chromium", "firefox", "safari"]) {
      const manifest = await Bun.file(new URL(`../manifests/${target}.json`, import.meta.url)).json();
      expect(manifest.permissions).toContain("contextMenus");
    }
  });
});
