import { NextRequest, NextResponse } from "next/server";
import { loadSettings, saveSettings } from "@/features/settings/config-file";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = loadSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[GET /api/settings] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = saveSettings(body);
    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("[POST /api/settings] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 500 }
    );
  }
}
