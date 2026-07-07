export type BodySite = {
  id: string;
  label: string;
  view: "front" | "back";
  cx: number; // dot marker center x — viewBox 0 0 100 150
  cy: number; // dot marker center y
};

export const bodySites: BodySite[] = [
  // ── FRONT ──────────────────────────────────────────────────────────────────
  { id: "right-deltoid",        label: "Right Deltoid",        view: "front", cx: 77, cy: 34 },
  { id: "left-deltoid",         label: "Left Deltoid",         view: "front", cx: 23, cy: 34 },
  { id: "upper-right-abdomen",  label: "Upper Right Abdomen",  view: "front", cx: 56, cy: 56 },
  { id: "upper-left-abdomen",   label: "Upper Left Abdomen",   view: "front", cx: 44, cy: 56 },
  { id: "mid-right-abdomen",    label: "Mid Right Abdomen",    view: "front", cx: 56, cy: 69 },
  { id: "mid-left-abdomen",     label: "Mid Left Abdomen",     view: "front", cx: 44, cy: 69 },
  { id: "lower-right-abdomen",  label: "Lower Right Abdomen",  view: "front", cx: 56, cy: 81 },
  { id: "lower-left-abdomen",   label: "Lower Left Abdomen",   view: "front", cx: 44, cy: 81 },
  { id: "right-quadriceps",     label: "Right Quadriceps",     view: "front", cx: 58, cy: 113 },
  { id: "left-quadriceps",      label: "Left Quadriceps",      view: "front", cx: 42, cy: 113 },
  // ── BACK ───────────────────────────────────────────────────────────────────
  { id: "right-triceps",        label: "Right Triceps",        view: "back",  cx: 76, cy: 57 },
  { id: "left-triceps",         label: "Left Triceps",         view: "back",  cx: 24, cy: 57 },
  { id: "right-glute",          label: "Right Glute",          view: "back",  cx: 59, cy: 108 },
  { id: "left-glute",           label: "Left Glute",           view: "back",  cx: 41, cy: 108 },
  { id: "right-hamstrings",     label: "Right Hamstrings",     view: "back",  cx: 57, cy: 133 },
  { id: "left-hamstrings",      label: "Left Hamstrings",      view: "back",  cx: 43, cy: 133 },
];
