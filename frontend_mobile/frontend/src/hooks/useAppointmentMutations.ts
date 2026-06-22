import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelAppointment,
  createBooking,
  rescheduleAppointment,
} from "@/src/services/appointmentService";
import type { BookAppointmentForm } from "@/src/lib/appointmentActions";

export function useAppointmentMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["yard", "appointments"] });
    await queryClient.invalidateQueries({ queryKey: ["yard", "gate"] });
  };

  const book = useMutation({
    mutationFn: (form: BookAppointmentForm) => createBooking(form),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (appointmentId: string) => cancelAppointment(appointmentId),
    onSuccess: invalidate,
  });

  const reschedule = useMutation({
    mutationFn: ({
      appointmentId,
      patch,
    }: {
      appointmentId: string;
      patch: { date: string; slot: string; gate: string };
    }) => rescheduleAppointment(appointmentId, patch),
    onSuccess: invalidate,
  });

  const busy = book.isPending || cancel.isPending || reschedule.isPending;

  return { book, cancel, reschedule, busy };
}
