export const siteConfig = {
  /** 本地管理门密码。只改这一处即可更换暗门口令。 */
  adminPassword: "admin888",
  title: "纸间",
  displayName: "keeuh",
  signature: "把光留在还没写完的句子里。",
  defaultBackground: "/wallpaper.svg",
} as const;

export const moods = [
  { emoji: "🌿", label: "平静" },
  { emoji: "☕️", label: "温热" },
  { emoji: "🌙", label: "夜色" },
  { emoji: "🌧", label: "下雨" },
  { emoji: "✨", label: "闪亮" },
  { emoji: "😔", label: "低落" },
] as const;

export const ambienceTracks = [
  { id: "rain", label: "细雨" },
  { id: "hearth", label: "炉边" },
  { id: "tide", label: "潮汐" },
  { id: "link", label: "外链" },
] as const;

export function isAdminPassword(input: string) {
  return input.trim() === siteConfig.adminPassword;
}
