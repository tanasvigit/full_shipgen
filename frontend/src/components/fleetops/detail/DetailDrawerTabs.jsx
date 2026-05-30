import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Lazy-friendly tab shell for detail drawers.
 * @param {{ tabs: Array<{ id: string, label: string, badge?: string|number, testId?: string, content: React.ReactNode, disabled?: boolean }>, value?: string, onValueChange?: (v: string) => void, defaultValue?: string }} props
 */
export default function DetailDrawerTabs({
  tabs,
  value,
  onValueChange,
  defaultValue,
  className = "",
}) {
  const first = defaultValue || tabs[0]?.id;

  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      defaultValue={value ? undefined : first}
      className={className}
    >
      <div className="sticky top-0 z-[5] bg-[#FAFBFC] border-b border-black/[0.06] px-4 pt-2">
        <TabsList className="bg-[#F1F2F5] border border-black/[0.08] h-auto flex-wrap justify-start gap-0.5 p-1 w-full">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              data-testid={tab.testId || `detail-tab-${tab.id}`}
              className="text-xs data-[state=active]:bg-white"
            >
              {tab.label}
              {tab.badge != null && tab.badge !== "" && (
                <span className="ml-1.5 font-mono text-[10px] opacity-70">({tab.badge})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0 focus-visible:outline-none">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
