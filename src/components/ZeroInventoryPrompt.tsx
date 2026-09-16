import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ZeroInventoryPromptProps = {
  open: boolean;
  onClose: () => void;
  onAddInventory: () => void;
  onEnableNotifications: () => void;
  notificationsEnabled: boolean;
  notifMessage?: string;
};

export function ZeroInventoryPrompt({
  open,
  onClose,
  onAddInventory,
  onEnableNotifications,
  notificationsEnabled,
  notifMessage,
}: ZeroInventoryPromptProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add inventory for reminders</AlertDialogTitle>
          <AlertDialogDescription>
            Inventory is empty. You can still log an ad-hoc shot by typing any compound. Add inventory for calendar and shot-due reminders.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {notifMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {notifMessage}
          </p>
        ) : null}
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Not now</AlertDialogCancel>
          {!notificationsEnabled ? (
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted/60"
              onClick={onEnableNotifications}
            >
              Enable notifications
            </button>
          ) : (
            <p className="text-xs text-muted-foreground self-center">Shot reminders are on.</p>
          )}
          <AlertDialogAction onClick={onAddInventory}>Add inventory</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
