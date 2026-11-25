import { handoffWatchUrl } from "./core";
import { t } from "./i18n";

/*
 * A YT Zero button next to the subscribe button on a source-site watch page.
 * It pauses the source player and opens the same video in the default
 * instance at the position reached; Ctrl/Cmd-click opens it in a new tab.
 */
export const HANDOFF_BUTTON_ID = "ytze-handoff-button";
const HANDOFF_STYLE_ID = "ytze-handoff-style";
const ANCHOR_SELECTOR = "ytd-watch-metadata #subscribe-button";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const PLAY_PATH = "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z";

const STYLE = `
#${HANDOFF_BUTTON_ID}{display:inline-flex;align-items:center;gap:6px;flex:none;box-sizing:border-box;height:36px;margin-left:8px;padding:0 16px 0 10px;border:0;border-radius:18px;background:#0a5fff;color:#fff;font:500 14px/36px "Roboto","Arial",sans-serif;white-space:nowrap;cursor:pointer}
#${HANDOFF_BUTTON_ID}:hover{background:#004fe0}
#${HANDOFF_BUTTON_ID}:focus-visible{outline:2px solid currentColor;outline-offset:2px}
#${HANDOFF_BUTTON_ID} svg{width:18px;height:18px;fill:#fff;stroke:#fff;stroke-width:2;stroke-linejoin:round}
`;

export function isSourceSiteTopPage(input: string): boolean {
  try {
    return new URL(input).hostname === "www.youtube.com";
  } catch { return false; }
}

/** Where the source player is now, or 0 for a live broadcast or no player. */
export function sourcePlayerSeconds(video: { currentTime: number; duration: number } | null, live: boolean): number {
  if (!video || live || !Number.isFinite(video.duration)) return 0;
  return video.currentTime;
}

function mainVideo() {
  return document.querySelector<HTMLVideoElement>("video.html5-main-video");
}

function createButton(instanceUrl: () => string) {
  const button = document.createElement("button");
  button.id = HANDOFF_BUTTON_ID;
  button.type = "button";
  button.setAttribute("aria-label", t("watchInYtZero"));
  const icon = document.createElementNS(SVG_NAMESPACE, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NAMESPACE, "path");
  path.setAttribute("d", PLAY_PATH);
  icon.append(path);
  button.append(icon, document.createTextNode("YT Zero"));
  button.addEventListener("click", (event) => {
    const video = mainVideo();
    const live = Boolean(document.querySelector(".html5-video-player")?.classList.contains("ytp-live"));
    const destination = handoffWatchUrl(location.href, instanceUrl(), sourcePlayerSeconds(video, live));
    if (!destination) return;
    video?.pause();
    if (event.metaKey || event.ctrlKey) window.open(destination, "_blank", "noopener");
    else location.assign(destination);
  });
  return button;
}

function ensureStyle() {
  if (document.getElementById(HANDOFF_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HANDOFF_STYLE_ID;
  style.textContent = STYLE;
  (document.head ?? document.documentElement).append(style);
}

/** Keep the button in place across in-page navigation. Returns a teardown. */
export function installHandoffButton(instanceUrl: () => string): () => void {
  let pending = 0;
  const render = () => {
    pending = 0;
    const existing = document.getElementById(HANDOFF_BUTTON_ID);
    const url = instanceUrl();
    const anchor = url && handoffWatchUrl(location.href, url, 0) ? document.querySelector(ANCHOR_SELECTOR) : null;
    if (!anchor) {
      existing?.remove();
      return;
    }
    if (existing && existing.previousElementSibling === anchor) return;
    existing?.remove();
    ensureStyle();
    anchor.after(createButton(instanceUrl));
  };
  const schedule = () => {
    if (!pending) pending = window.setTimeout(render, 200);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("yt-navigate-finish", schedule);
  render();
  return () => {
    observer.disconnect();
    document.removeEventListener("yt-navigate-finish", schedule);
    if (pending) window.clearTimeout(pending);
    document.getElementById(HANDOFF_BUTTON_ID)?.remove();
    document.getElementById(HANDOFF_STYLE_ID)?.remove();
  };
}
