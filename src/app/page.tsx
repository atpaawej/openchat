import { loadSettings } from "@/features/settings/config-file";
import { getDb } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { StarterView } from "./starter-view";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const settings = loadSettings();

  let sessionCount = 0;
  let dbStatus = "Connected";

  try {
    const db = getDb();
    const allSessions = db.select().from(sessions).all();
    sessionCount = allSessions.length;
  } catch (err) {
    dbStatus = `Error: ${err instanceof Error ? err.message : String(err)}`;
  }

  const configuredProviders = Object.entries(settings.providers)
    .filter(([_, config]) => config.enabled || Boolean(config.apiKey))
    .map(([name]) => name);

  return (
    <StarterView
      defaultModel={settings.defaultModel}
      activeSearchProvider={settings.activeSearchProvider}
      configuredProviders={configuredProviders}
      sessionCount={sessionCount}
      dbStatus={dbStatus}
      theme={settings.theme}
    />
  );
}
