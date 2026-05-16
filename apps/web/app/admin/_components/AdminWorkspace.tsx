"use client";

import { useState } from "react";

import { ActionDraft } from "@/lib/schemas";

import { ActionImport } from "./ActionImport";
import { ActionsManager } from "./ActionsManager";
import { CitySettings } from "./CitySettings";

export function AdminWorkspace() {
  const [draft, setDraft] = useState<ActionDraft | null>(null);

  return (
    <div className="space-y-8">
      <CitySettings />
      <ActionImport onUseDraft={setDraft} />
      <ActionsManager
        initialDraft={draft}
        onDraftConsumed={() => setDraft(null)}
      />
    </div>
  );
}
