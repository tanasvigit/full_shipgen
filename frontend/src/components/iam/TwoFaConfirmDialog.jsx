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

export default function TwoFaConfirmDialog({
  open,
  onOpenChange,
  enabling,
  destination,
  onConfirm,
  loading = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="two-fa-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {enabling ? "Enable two-factor authentication?" : "Disable two-factor authentication?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {enabling ? (
              <>
                Each sign-in will require a 6-digit code sent to <strong>{destination}</strong>. You will be asked
                for a code the next time you sign in.
              </>
            ) : (
              <>
                Your account will only be protected by your password. Anyone with your password can sign in without a
                verification code.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className={enabling ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}
          >
            {loading ? "Saving…" : enabling ? "Enable 2FA" : "Disable 2FA"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
