import test from "node:test";
import assert from "node:assert/strict";
import { resolveAdHocSiteId } from "./ad-hoc-log.mjs";

test("ad-hoc prefers explicit site", () => {
  assert.equal(
    resolveAdHocSiteId("left-deltoid", [
      { siteId: "right-glute", timestamp: "2026-09-12T12:00:00.000Z" },
    ]),
    "left-deltoid",
  );
});

test("ad-hoc falls back to latest site", () => {
  assert.equal(
    resolveAdHocSiteId(null, [
      { siteId: "right-glute", timestamp: "2026-09-10T12:00:00.000Z" },
      { siteId: "left-deltoid", timestamp: "2026-09-12T12:00:00.000Z" },
      { siteId: "abdomen", deletedAt: "2026-09-12T13:00:00.000Z", timestamp: "2026-09-13T12:00:00.000Z" },
    ]),
    "left-deltoid",
  );
});

test("ad-hoc empty without history", () => {
  assert.equal(resolveAdHocSiteId(undefined, []), "");
});
