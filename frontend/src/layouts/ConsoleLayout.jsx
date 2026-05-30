import { Outlet } from "react-router-dom";
import Header from "@/components/console/Header";
import Sidebar from "@/components/console/Sidebar";
import CommandPalette from "@/components/console/CommandPalette";
import OfflineBanner from "@/components/platform/OfflineBanner";
import DemoModeBanner from "@/components/platform/DemoModeBanner";
import OnboardingChecklist from "@/components/platform/OnboardingChecklist";
import { useState, useEffect } from "react";

export default function ConsoleLayout() {
    const [paletteOpen, setPaletteOpen] = useState(false);
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
        <div className="min-h-screen flex flex-col bg-[#F5F6F8] text-[#0A0E1A]" data-testid="console-layout">
            <OfflineBanner />
            <DemoModeBanner />
            <Header onOpenPalette={() => setPaletteOpen(true)} />
            <div className="flex flex-1 min-h-0">
                <Sidebar />
                <main className="flex-1 min-w-0 overflow-y-auto bg-[#F5F6F8]" data-testid="console-main">
                    <Outlet />
                </main>
            </div>
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
            <OnboardingChecklist />
        </div>
    );
}
