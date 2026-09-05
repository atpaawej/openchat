import { notFound, redirect } from "next/navigation";
import { projectRepository } from "@/features/projects/server/project-repository";
import { messageRepository } from "@/features/chat/server/message-repository";
import { loadSettings } from "@/features/settings/config-file";
import { ProjectWorkspaceView } from "@/features/projects/components/project-workspace-view";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projectRepository.getProject(id);
  if (!project) {
    redirect("/");
  }

  const files = projectRepository.listProjectFiles(id);
  const sessions = messageRepository.listSessions(id);
  const settings = loadSettings();

  return (
    <ProjectWorkspaceView
      initialProject={project}
      initialFiles={files}
      initialSessions={sessions}
      defaultModel={settings.defaultModel}
      defaultProvider={settings.defaultProvider}
    />
  );
}
