import { useDemoMode } from "@/contexts/DemoModeContext";
import { Button } from "@/components/ui/button";

export default function DemoModeBanner() {
  const { isDemoMode, setDemoMode } = useDemoMode();
  if (!isDemoMode) return null;

  return (
    <div
      className="bg-violet-600 text-white text-xs font-medium flex items-center justify-center gap-3 py-1.5 px-4 z-[120]"
      data-testid="demo-mode-banner"
    >
      <span>Demo mode — sample data only. No changes are sent to the API.</span>
      <Button
        size="sm"
        variant="secondary"
        className="h-6 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
        onClick={() => setDemoMode(false)}
      >
        Exit demo
      </Button>
    </div>
  );
}
