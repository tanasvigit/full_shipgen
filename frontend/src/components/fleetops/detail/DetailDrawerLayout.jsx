/**
 * 12-column detail layout — primary content + insight sidebar.
 */
export default function DetailDrawerLayout({ main, sidebar, className = "" }) {
  return (
    <div className={`grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 ${className}`}>
      <div className="xl:col-span-8 space-y-4 min-w-0" data-testid="detail-main-column">
        {main}
      </div>
      <aside className="xl:col-span-4 space-y-4 min-w-0" data-testid="detail-sidebar-column">
        {sidebar}
      </aside>
    </div>
  );
}
