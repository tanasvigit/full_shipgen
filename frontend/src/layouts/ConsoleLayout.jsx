import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/console/Header";
import Sidebar from "@/components/console/Sidebar";
import CommandPalette from "@/components/console/CommandPalette";
import SettingsModuleBackLink from "@/components/console/SettingsModuleBackLink";
import OfflineBanner from "@/components/platform/OfflineBanner";
import DemoModeBanner from "@/components/platform/DemoModeBanner";
import EngineScopeGuard from "@/components/auth/EngineScopeGuard";
import { isSettingsModulePath } from "@/lib/settingsNavigation";
import { useState, useEffect } from "react";

export default function ConsoleLayout() {
    const [paletteOpen, setPaletteOpen] = useState(false);
    const location = useLocation();
    const showSettingsModuleBack = isSettingsModulePath(location.pathname);
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPaletteOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <EngineScopeGuard>
        <div className="h-dvh flex flex-col overflow-hidden bg-[#F5F6F8] text-[#0A0E1A]" data-testid="console-layout">
            <OfflineBanner />
            <DemoModeBanner />
            <Header onOpenPalette={() => setPaletteOpen(true)} />
            <div className="flex flex-1 min-h-0 min-w-0">
                <Sidebar />
                <main
                    className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain bg-[#F5F6F8]"
                    data-testid="console-main"
                >
                    {showSettingsModuleBack ? (
                        <div
                            className="xl:hidden sticky top-0 z-10 border-b border-black/[0.06] bg-[#FAFBFC]/95 backdrop-blur-sm px-4 py-3"
                            data-testid="settings-module-back-mobile"
                        >
                            <SettingsModuleBackLink compact fullWidth />
                        </div>
                    ) : null}
                    <Outlet />
                </main>
            </div>
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </div>
        </EngineScopeGuard>
    );
}
