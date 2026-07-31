// Deliberately renders NOTHING.
//
// Celebrate is a client component with zero server fetches — it reads its
// payload from sessionStorage in an effect. There is no data delay here to
// represent, so any skeleton is a lie about what the screen is waiting for.
//
// But it still needs this file. Two things were happening:
//
// 1. `use(params)` in page.tsx suspends. `params` is a Promise in Next 16, so
//    even a fetch-free route hits a Suspense boundary for a frame or two.
// 2. Celebrate is a SIBLING of /log/[assignmentId], not a child of it — so the
//    nearest boundary was /student/[token]/loading.tsx, the STUDENT HOME
//    skeleton. Logging a rep flashed a mini logo, a name block, a New/Archive
//    tab bar and three assignment cards, and then replaced all of it with a 🔥
//    and one line of text.
//
// Returning null gives the bare page background for that frame instead: the
// "instant same-background flash with zero visible shape". It also matches how
// celebrate already handles its own unknown state — CLAUDE.md notes the loading
// phase renders no headline at all, precisely so the screen never asserts an
// outcome it hasn't read yet. A skeleton here would have broken that rule from
// the outside.
//
// ⚠️ Do not "improve" this by adding a spinner or a shape. The absence is the
// feature.
export default function Loading() {
  return null;
}
