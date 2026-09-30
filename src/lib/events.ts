export const diaryRefreshEvent = "my-diary-refresh";

export function notifyDiaryRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(diaryRefreshEvent));
}
