export type BodySite = {
  id: string;
  label: string;
  view: "front" | "back";
  cx: number;
  cy: number;
  /** Back-view pin when the same site appears on both maps (knees, ankles). */
  backCx?: number;
  backCy?: number;
};

/** Sites shown on both front and back body map views */
export const DUAL_VIEW_SITE_IDS = ["left-knee", "right-knee", "left-ankle", "right-ankle"] as const;

/**
 * Anatomical L/R vs the artwork (figure facing the camera on front, facing away on back):
 * - Front: the figure's right is on the LEFT of the image (low cx).
 * - Back: the figure's right is on the RIGHT of the image (high cx).
 * Screen-left is not "Left" on the front map.
 */
export const bodySites: BodySite[] = [
  // Front — person's left is image-right (high cx)
  { id: "left-deltoid", label: "Left Deltoid", view: "front", cx: 63, cy: 23 },
  { id: "right-deltoid", label: "Right Deltoid", view: "front", cx: 37, cy: 23 },
  { id: "upper-left-abdomen", label: "Upper Left Abdomen", view: "front", cx: 53, cy: 33 },
  { id: "upper-right-abdomen", label: "Upper Right Abdomen", view: "front", cx: 47, cy: 33 },
  { id: "mid-left-abdomen", label: "Mid Left Abdomen", view: "front", cx: 53, cy: 38 },
  { id: "mid-right-abdomen", label: "Mid Right Abdomen", view: "front", cx: 47, cy: 38 },
  { id: "lower-left-abdomen", label: "Lower Left Abdomen", view: "front", cx: 53, cy: 42 },
  { id: "lower-right-abdomen", label: "Lower Right Abdomen", view: "front", cx: 47, cy: 42 },
  { id: "left-flank", label: "Left Flank", view: "front", cx: 60, cy: 45 },
  { id: "right-flank", label: "Right Flank", view: "front", cx: 40, cy: 45 },
  { id: "left-wrist", label: "Left Wrist", view: "front", cx: 78, cy: 45 },
  { id: "right-wrist", label: "Right Wrist", view: "front", cx: 22, cy: 45 },
  { id: "left-quadriceps", label: "Left Quadriceps", view: "front", cx: 58, cy: 53 },
  { id: "right-quadriceps", label: "Right Quadriceps", view: "front", cx: 44, cy: 53 },
  { id: "left-knee", label: "Left Knee", view: "front", cx: 58, cy: 60, backCx: 42, backCy: 64 },
  { id: "right-knee", label: "Right Knee", view: "front", cx: 42, cy: 60, backCx: 58, backCy: 64 },
  { id: "left-ankle", label: "Left Ankle", view: "front", cx: 58, cy: 82, backCx: 42, backCy: 85 },
  { id: "right-ankle", label: "Right Ankle", view: "front", cx: 42, cy: 82, backCx: 58, backCy: 85 },
  // Back — person's left is image-left (low cx)
  { id: "left-triceps", label: "Left Triceps", view: "back", cx: 35, cy: 25 },
  { id: "right-triceps", label: "Right Triceps", view: "back", cx: 65, cy: 25 },
  { id: "left-glute", label: "Left Glute", view: "back", cx: 42, cy: 46 },
  { id: "right-glute", label: "Right Glute", view: "back", cx: 57, cy: 46 },
];

export function siteLabel(siteId: string): string {
  return bodySites.find((s) => s.id === siteId)?.label ?? siteId.replace(/-/g, " ");
}

export function sitesForView(view: "front" | "back"): BodySite[] {
  if (view === "front") {
    return bodySites.filter((s) => s.view === "front");
  }
  return [
    ...bodySites.filter((s) => s.view === "back"),
    ...bodySites
      .filter((s) => DUAL_VIEW_SITE_IDS.includes(s.id as (typeof DUAL_VIEW_SITE_IDS)[number]))
      .map((s) => ({
        ...s,
        view: "back" as const,
        cx: s.backCx ?? s.cx,
        cy: s.backCy ?? s.cy,
      })),
  ];
}

/** True when a front-view site sits on the figure's actual left (image-right). */
export function isAnatomicalLeftSite(site: Pick<BodySite, "id" | "view" | "cx">): boolean {
  if (site.view === "front") return site.cx > 50;
  return site.cx < 50;
}
