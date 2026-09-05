import { loadSettings } from "@/features/settings/config-file";
import { messageRepository } from "@/features/chat/server/message-repository";
import { ChatInterface } from "@/features/chat/components/chat-interface";

export const dynamic = "force-dynamic";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = loadSettings();
  const session = messageRepository.getSession(id);
  const messages = messageRepository.getMessages(id);

  return (
    <ChatInterface
      initialSessionId={id}
      initialSessionTitle={session?.title}
      projectId={session?.projectId ?? undefined}
      initialMessages={messages}
      defaultModel={session?.model || settings.defaultModel}
      defaultProvider={session?.provider || settings.defaultProvider}
      activeSearchProvider={settings.activeSearchProvider}
    />
  );
}
