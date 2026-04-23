import { clearAdminSession } from "../../../lib/auth.js";
import { redirect } from "../../../lib/http.js";

export async function POST(context) {
  clearAdminSession(context);
  return redirect("/admin");
}
