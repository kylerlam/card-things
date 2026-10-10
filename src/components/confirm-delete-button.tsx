"use client";

import { Button } from "@/components/ui/button";

export function ConfirmDeleteButton({ label = "刪除" }: { label?: string }) {
  return (
    <Button
      type="submit"
      variant="destructive"
      onClick={(event) => {
        if (!window.confirm("確定要刪除？這項操作無法復原。")) {
          event.preventDefault();
        }
      }}
    >
      {label}
    </Button>
  );
}
