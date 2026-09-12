/** Resolve site for ad-hoc (Plus / Schedule) opens — prefer explicit site, else last used. */
export function resolveAdHocSiteId(defaultSiteId, logs) {
  if (defaultSiteId) return defaultSiteId;
  const latest = logs
    .filter((log) => !log.deletedAt && log.siteId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  return latest?.siteId ?? "";
}
