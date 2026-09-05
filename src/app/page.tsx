import { loadSettings } from "@/features/settings/config-file";
import { ChatInterface } from "@/features/chat/components/chat-interface";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const settings = loadSettings();

  return (
    <ChatInterface
      defaultModel={settings.defaultModel}
      defaultProvider={settings.defaultProvider}
      activeSearchProvider={settings.activeSearchProvider}
    />
  );
}
