export type BodySite = {
  id: string;
  label: string;
  view: "front" | "back";
  cx: number;
  cy: number;
};

/** Sites shown on both front and back body map views */
export const DUAL_VIEW_SITE_IDS = ["left-knee", "right-knee", "left-ankle", "right-ankle"] as const;

export const bodySites: BodySite[] = [
  // Front
  { id: "left-deltoid", label: "Left Deltoid", view: "front", cx: 40, cy: 21 },
  { id: "right-deltoid", label: "Right Deltoid", view: "front", cx: 60, cy: 21 },
  { id: "upper-left-abdomen", label: "Upper Left Abdomen", view: "front", cx: 47, cy: 33 },
  { id: "upper-right-abdomen", label: "Upper Right Abdomen", view: "front", cx: 53, cy: 33 },
  { id: "mid-left-abdomen", label: "Mid Left Abdomen", view: "front", cx: 47, cy: 39 },
  { id: "mid-right-abdomen", label: "Mid Right Abdomen", view: "front", cx: 53, cy: 39 },
  { id: "lower-left-abdomen", label: "Lower Left Abdomen", view: "front", cx: 47, cy: 45 },
  { id: "lower-right-abdomen", label: "Lower Right Abdomen", view: "front", cx: 53, cy: 45 },
  { id: "left-flank", label: "Left Flank", view: "front", cx: 40, cy: 45 },
  { id: "right-flank", label: "Right Flank", view: "front", cx: 60, cy: 45 },
  { id: "left-wrist", label: "Left Wrist", view: "front", cx: 30, cy: 45 },
  { id: "right-wrist", label: "Right Wrist", view: "front", cx: 70, cy: 45 },
  { id: "left-quadriceps", label: "Left Quadriceps", view: "front", cx: 37, cy: 42 },
  { id: "right-quadriceps", label: "Right Quadriceps", view: "front", cx: 63, cy: 42 },
  { id: "left-knee", label: "Left Knee", view: "front", cx: 42, cy: 78 },
  { id: "right-knee", label: "Right Knee", view: "front", cx: 58, cy: 78 },
  { id: "left-ankle", label: "Left Ankle", view: "front", cx: 42, cy: 92 },
  { id: "right-ankle", label: "Right Ankle", view: "front", cx: 58, cy: 92 },
  // Back
  { id: "left-triceps", label: "Left Triceps", view: "back", cx: 35, cy: 25 },
  { id: "right-triceps", label: "Right Triceps", view: "back", cx: 65, cy: 25 },
  { id: "left-glute", label: "Left Glute", view: "back", cx: 38, cy: 49 },
  { id: "right-glute", label: "Right Glute", view: "back", cx: 62, cy: 49 },
];

export function sitesForView(view: "front" | "back"): BodySite[] {
  if (view === "front") {
    return bodySites.filter((s) => s.view === "front");
  }
  return [
    ...bodySites.filter((s) => s.view === "back"),
    ...bodySites.filter((s) => DUAL_VIEW_SITE_IDS.includes(s.id as (typeof DUAL_VIEW_SITE_IDS)[number])),
  ];
}