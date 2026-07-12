import AdminLoader from "./AdminLoader";
import { COPY } from "../site.config";

export default function AdminLoading() {
  return <AdminLoader message={COPY.admin.editor.openingEditor} />;
}
