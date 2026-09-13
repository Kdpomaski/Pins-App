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
          <AlertDialogTitle>Add inventory to log shots</AlertDialogTitle>
          <AlertDialogDescription>
            Inventory is empty. Add a compound so you can log shots and get AM/PM shot-due reminders.
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
