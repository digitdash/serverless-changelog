import { clearViewerAccess } from "../../../lib/auth.js";
import { redirect } from "../../../lib/http.js";

export async function POST(context) {
  clearViewerAccess(context);
  return redirect("/");
}
