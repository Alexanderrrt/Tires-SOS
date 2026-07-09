import { getChatSettings } from "../../../lib/chat-settings-store";
import { publicChatSettings } from "../../../lib/chat-settings-validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getChatSettings();
  return Response.json(publicChatSettings(settings));
}
