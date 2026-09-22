import { cookies } from "next/headers";

// "View as tester": an admin's own look at what a tester gets — the
// released scenarios only, no administration link — without giving up
// admin. A cookie on the admin's browser, honoured only where the
// account is a real admin; a tester's browser carrying it changes
// nothing. Set and cleared by the action in app/actions/view-as.ts.

export const VIEW_AS_COOKIE = "twr_view_as";

export async function viewingAsTester(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(VIEW_AS_COOKIE)?.value === "tester";
}
