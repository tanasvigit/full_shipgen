import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function SchedulingConflictDialog({ open, onOpenChange, conflicts = [], onProceed }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="scheduling-conflict-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Schedule conflict detected</AlertDialogTitle>
          <AlertDialogDescription>
            {conflicts.length
              ? conflicts.map((c) => c.message || c.reason).join(" · ")
              : "The selected window overlaps an existing shift."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Adjust schedule</AlertDialogCancel>
          {onProceed && (
            <Button
              variant="outline"
              onClick={() => {
                onProceed();
                onOpenChange(false);
              }}
            >
              Proceed anyway
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
