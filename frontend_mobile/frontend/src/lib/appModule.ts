import { storage } from "@/src/utils/storage";

export type AppModule = "driver" | "yard";

const MODULE_KEY = "shipgen.active_module";

export async function getActiveModule(): Promise<AppModule | null> {
  return storage.getItem<AppModule | null>(MODULE_KEY, null);
}

export async function setActiveModule(module: AppModule | null) {
  if (!module) {
    await storage.removeItem(MODULE_KEY);
    return;
  }
  await storage.setItem(MODULE_KEY, module);
}
