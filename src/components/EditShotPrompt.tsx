import { format } from "date-fns";
import { siteLabel } from "@/lib/body-map-data";
import type { InjectionLog } from "@/lib/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EditShotPromptProps = {
  log: InjectionLog | null;
  onEdit: (log: InjectionLog) => void;
  onLogNew: (log: InjectionLog) => void;
  onClose: () => void;
};

export function EditShotPrompt({ log, onEdit, onLogNew, onClose }: EditShotPromptProps) {
  return (
    <AlertDialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit this shot?</AlertDialogTitle>
          {log ? (
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {log.compound} · {log.dose} {log.unit}
                </p>
                <p>
                  {siteLabel(log.siteId)} · {format(new Date(log.timestamp), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription>Edit a saved injection.</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted/60"
            onClick={() => {
              if (log) onLogNew(log);
            }}
          >
            Log new
          </button>
          <AlertDialogAction
            onClick={() => {
              if (log) onEdit(log);
            }}
          >
            Edit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
