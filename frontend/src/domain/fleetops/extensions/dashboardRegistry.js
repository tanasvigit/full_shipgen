const dashboardWidgets = [];

export function registerDashboardWidget(widget) {
  if (!widget?.key) return;
  if (dashboardWidgets.some((item) => item.key === widget.key)) return;
  dashboardWidgets.push(widget);
  dashboardWidgets.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getDashboardWidgets() {
  return [...dashboardWidgets];
}
