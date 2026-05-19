"use client";

import { useState } from "react";

import { ActionImport } from "@/features/actions/components/ActionImport";
import { ActionsManager } from "@/features/actions/components/ActionsManager";
import { CitySettings } from "@/features/cities/components/CitySettings";
import { ActionDraft } from "@/lib/schemas";

export function AdminWorkspace() {
  const [draft, setDraft] = useState<ActionDraft | null>(null);

  return (
    <div className="space-y-2">
      <CitySettings />
      <ActionImport onUseDraft={setDraft} />
      <ActionsManager
        initialDraft={draft}
        onDraftConsumed={() => setDraft(null)}
      />
    </div>
  );
}
