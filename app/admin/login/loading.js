import AdminLoader from "../AdminLoader";
import { COPY } from "../../site.config";

export default function AdminLoginLoading() {
  return <AdminLoader message={COPY.admin.editor.loggingOut} />;
}
