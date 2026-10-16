import { redirect } from "next/navigation";

// Parked for the Pre-Alpha: the reference library is not in this build.
// The view and the fleet directory stay in the tree (the dev harness
// still renders them) for when it returns; anyone following an old link
// lands on the operator guide, which carries the reference chapter.
export default function GlossaryPage() {
  redirect("/menu?view=guide");
}
