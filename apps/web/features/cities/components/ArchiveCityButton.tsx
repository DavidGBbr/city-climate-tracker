"use client";

import { useState } from "react";

import { Button, ConfirmDialog, ErrorMessage } from "@/components/ui";
import { ApiError } from "@/lib/api";
import type { City } from "@/lib/schemas";

import { archiveCity, restoreCity } from "../hooks";

type Props = {
  city: City;
  onChanged: (city: City) => void;
};

export function ArchiveCityButton({ city, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isArchived = !!city.deleted_at;

  async function performArchive() {
    try {
      setBusy(true);
      setError(null);
      const updated = await archiveCity(city.id);
      onChanged(updated);
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to archive city.");
    } finally {
      setBusy(false);
    }
  }

  async function performRestore() {
    try {
      setBusy(true);
      setError(null);
      const updated = await restoreCity(city.id);
      onChanged(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to restore city.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {isArchived ? (
        <Button variant="ghost" size="sm" onClick={performRestore} disabled={busy}>
          {busy ? "Restoring…" : "Restore city"}
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} disabled={busy}>
          Archive city
        </Button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={performArchive}
        title={`Archive ${city.name}?`}
        description="It will be hidden from the public dashboard. You can restore it later from the View archived list."
        confirmLabel="Archive city"
        destructive
        busy={busy}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
