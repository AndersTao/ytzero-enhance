import { instanceApiUrl, youtubeVideoId } from "./core";
import { t } from "./i18n";

/*
 * "Save for later" from the browser's right-click menu: a video link (a
 * thumbnail anywhere) or the watch page itself. The video goes to the
 * default instance's "Saved for later" playlist, which YT Zero shows as its
 * own row on Main. The request carries the instance's sign-in cookie; the
 * extension already holds host access to the paired instance.
 */
export const SAVE_FOR_LATER_LINK_MENU = "ytze-save-for-later-link";
export const SAVE_FOR_LATER_PAGE_MENU = "ytze-save-for-later-page";
export const SAVE_FOR_LATER_TARGETS = [
  "*://www.youtube.com/watch*",
  "*://m.youtube.com/watch*",
  "*://www.youtube.com/shorts/*",
  "*://www.youtube.com/live/*",
  "*://youtu.be/*",
];

export type SaveOutcome = { tone: "success" | "error"; message: string };

export function saveForLaterVideoId(info: { menuItemId?: unknown; linkUrl?: string; pageUrl?: string }): string | null {
  if (info.menuItemId === SAVE_FOR_LATER_LINK_MENU) return youtubeVideoId(info.linkUrl ?? "");
  if (info.menuItemId === SAVE_FOR_LATER_PAGE_MENU) return youtubeVideoId(info.pageUrl ?? "");
  return null;
}

/** What to tell the user about an instance's answer. */
export function saveOutcome(status: number, body: { already?: unknown; playlist?: { name?: unknown } } | null): SaveOutcome {
  if (status === 401) return { tone: "error", message: t("saveForLaterSignIn") };
  if (status < 200 || status >= 300) return { tone: "error", message: t("saveForLaterFailed") };
  const name = typeof body?.playlist?.name === "string" && body.playlist.name ? body.playlist.name : t("saveForLater");
  return { tone: "success", message: `${body?.already === true ? t("saveForLaterAlready") : t("saveForLaterSaved")} ${name}` };
}

export async function saveForLater(videoId: string | null, instanceUrl: string, fetcher: typeof fetch = fetch): Promise<SaveOutcome> {
  const endpoint = instanceApiUrl(instanceUrl, "/saved-for-later");
  if (!endpoint) return { tone: "error", message: t("saveForLaterNoInstance") };
  if (!videoId) return { tone: "error", message: t("saveForLaterFailed") };
  try {
    const response = await fetcher(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId }),
    });
    const body = await response.json().catch(() => null);
    return saveOutcome(response.status, body);
  } catch {
    return { tone: "error", message: t("saveForLaterFailed") };
  }
}
