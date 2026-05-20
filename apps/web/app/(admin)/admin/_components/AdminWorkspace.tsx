"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button, ErrorMessage } from "@/components/ui";
import { ActionImport } from "@/features/actions/components/ActionImport";
import { ActionsManager } from "@/features/actions/components/ActionsManager";
import { ArchiveCityButton } from "@/features/cities/components/ArchiveCityButton";
import { CitySelector } from "@/features/cities/components/CitySelector";
import { CitySettings } from "@/features/cities/components/CitySettings";
import { NewCityModal } from "@/features/cities/components/NewCityModal";
import { useAdminCities, useCities } from "@/features/cities/hooks";
import { clearAdminToken } from "@/lib/auth";
import { ActionDraft, City } from "@/lib/schemas";

export function AdminWorkspace() {
  const router = useRouter();
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  const activeQuery = useCities();
  const allQuery = useAdminCities();
  const source = showArchived ? allQuery : activeQuery;
  const cities = source.data ?? [];

  useEffect(() => {
    if (cities.length === 0) return;
    if (!selectedId || !cities.some((c) => c.id === selectedId)) {
      setSelectedId(cities[0].id);
    }
  }, [cities, selectedId]);

  const selected: City | null = useMemo(
    () => cities.find((c) => c.id === selectedId) ?? null,
    [cities, selectedId],
  );

  function handleLogout() {
    clearAdminToken();
    router.replace("/admin/login");
    router.refresh();
  }

  function refreshCities() {
    activeQuery.mutate();
    allQuery.mutate();
  }

  if (source.isLoading) {
    return <p className="text-sm text-ink-mute">Loading admin…</p>;
  }

  if (source.error) {
    return <ErrorMessage>Could not load cities.</ErrorMessage>;
  }

  if (cities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
        <ErrorMessage>No cities available. Create one to begin.</ErrorMessage>
        <Button onClick={() => setShowNewModal(true)}>New city</Button>
        <NewCityModal
          open={showNewModal}
          onClose={() => setShowNewModal(false)}
          onCreated={(c) => {
            setSelectedId(c.id);
            refreshCities();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <CitySelector
          cities={cities}
          value={selectedId}
          onChange={setSelectedId}
          showArchivedBadge={showArchived}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "Hide archived" : "View archived"}
          </Button>
          <Button size="sm" onClick={() => setShowNewModal(true)}>
            New city
          </Button>
          {selected && (
            <ArchiveCityButton
              city={selected}
              onChanged={(updated) => {
                refreshCities();
                if (updated.deleted_at && !showArchived) {
                  const next = cities.find(
                    (c) => c.id !== updated.id && !c.deleted_at,
                  );
                  setSelectedId(next?.id ?? null);
                }
              }}
            />
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>

      {selected && <CitySettings city={selected} />}
      {selected && !selected.deleted_at && (
        <>
          <ActionImport onUseDraft={setDraft} />
          <ActionsManager
            city={selected}
            initialDraft={draft}
            onDraftConsumed={() => setDraft(null)}
          />
        </>
      )}

      <NewCityModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(c) => {
          setSelectedId(c.id);
          refreshCities();
        }}
      />
    </div>
  );
}
