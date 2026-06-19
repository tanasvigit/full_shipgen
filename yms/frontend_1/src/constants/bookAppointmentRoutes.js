/** Routes where the global Book Appointment action should not appear. */
export const BOOK_APPOINTMENT_HIDDEN_ROUTES = [
  "/admin/users",
  "/admin/roles",
  "/settings",
];

export function shouldShowBookAppointment(pathname) {
  return !BOOK_APPOINTMENT_HIDDEN_ROUTES.includes(pathname);
}
