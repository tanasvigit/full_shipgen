import type { Page, TestInfo } from "@playwright/test";

export type RuntimeDiagnosticDump = {
  url: string;
  overlays: Array<{
    testId: string | null;
    interactive: boolean;
    opacity: number;
    display: string;
    pointerEvents: string;
    rect: { width: number; height: number };
  }>;
  dialogs: number;
  bodyPointerEvents: string;
  bodyOverflow: string;
  scrollLocked: boolean;
  domNodeCount: number;
  loadingTokens?: {
    globalLoaderVisible: boolean;
    interactiveViewportOverlays: number;
  };
};

export async function collectRuntimeDiagnostics(page: Page): Promise<RuntimeDiagnosticDump> {
  return page.evaluate(() => {
    const overlays = [...document.querySelectorAll(".fleetbase-loader-viewport, [data-testid$='-loader-overlay']")].map(
      (el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          testId: el.getAttribute("data-testid"),
          interactive: el.classList.contains("fleetbase-loader-viewport--interactive"),
          opacity: Number.parseFloat(style.opacity) || 0,
          display: style.display,
          pointerEvents: style.pointerEvents,
          rect: { width: rect.width, height: rect.height },
        };
      },
    );

    const bodyStyle = getComputedStyle(document.body);
    return {
      url: location.href,
      overlays,
      dialogs: document.querySelectorAll('[role="dialog"]').length,
      bodyPointerEvents: bodyStyle.pointerEvents,
      bodyOverflow: bodyStyle.overflow,
      scrollLocked: document.body.hasAttribute("data-scroll-locked"),
      domNodeCount: document.querySelectorAll("*").length,
      loadingTokens: {
        globalLoaderVisible: !!document.querySelector('[data-testid="global-loader"]:not([hidden])'),
        interactiveViewportOverlays: overlays.filter(
          (o) => o.interactive && o.opacity > 0.05 && o.display !== "none",
        ).length,
      },
    };
  });
}

export async function attachRuntimeDiagnosticsOnFailure(page: Page, testInfo: TestInfo) {
  if (testInfo.status === testInfo.expectedStatus) return;
  try {
    const dump = await collectRuntimeDiagnostics(page);
    await testInfo.attach("runtime-diagnostics.json", {
      body: JSON.stringify(dump, null, 2),
      contentType: "application/json",
    });
    testInfo.annotations.push({
      type: "runtime-diagnostics",
      description: JSON.stringify(dump, null, 2),
    });
  } catch {
    /* page may already be closed */
  }
}
