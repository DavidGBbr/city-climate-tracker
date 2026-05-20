"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";
import { ActionImport } from "@/features/actions/components/ActionImport";
import { ActionsManager } from "@/features/actions/components/ActionsManager";
import { CitySettings } from "@/features/cities/components/CitySettings";
import { clearAdminToken } from "@/lib/auth";
import { ActionDraft } from "@/lib/schemas";

export function AdminWorkspace() {
  const router = useRouter();
  const [draft, setDraft] = useState<ActionDraft | null>(null);

  function handleLogout() {
    clearAdminToken();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
      <CitySettings />
      <ActionImport onUseDraft={setDraft} />
      <ActionsManager
        initialDraft={draft}
        onDraftConsumed={() => setDraft(null)}
      />
    </div>
  );
}
