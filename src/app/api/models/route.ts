import { NextResponse } from "next/server";
import { loadSettings } from "@/features/settings/config-file";
import { providerRegistry } from "@/features/providers/registry";

export async function GET() {
  try {
    const settings = loadSettings();
    const models = await providerRegistry.getAllModels(settings);

    return NextResponse.json({
      models,
      defaultModel: settings.defaultModel,
      defaultProvider: settings.defaultProvider,
    });
  } catch (error) {
    console.error("Failed to load models in /api/models:", error);
    return NextResponse.json(
      {
        error: "Failed to load models",
        models: [],
      },
      { status: 500 }
    );
  }
}
