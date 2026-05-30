import { useCallback, useState } from "react";
import { filesService } from "@/services/files";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  pdf: "application/pdf",
  docs: "image/jpeg,image/png,application/pdf",
};

export function useFileUpload({ accept = "docs", maxSizeMb = 10, onUploaded } = {}) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const validate = useCallback(
    (file) => {
      if (!file) return "No file selected";
      const max = maxSizeMb * 1024 * 1024;
      if (file.size > max) return `File must be under ${maxSizeMb}MB`;
      const acceptStr = ACCEPT[accept] || accept;
      if (typeof acceptStr === "string" && file.type) {
        const parts = acceptStr.split(",").map((s) => s.trim());
        if (parts.length && !parts.some((t) => file.type === t || t.endsWith("/*"))) {
          const wild = parts.find((t) => t.endsWith("/*"));
          if (wild && file.type.startsWith(wild.replace("/*", ""))) return null;
          if (!parts.includes(file.type)) return "File type not supported";
        }
      }
      return null;
    },
    [accept, maxSizeMb],
  );

  const upload = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return [];

      setBusy(true);
      const uploaded = [];

      for (const file of files) {
        const err = validate(file);
        const id = `up-${Date.now()}-${Math.random()}`;
        if (err) {
          setItems((prev) => [...prev, { id, name: file.name, status: "error", error: err }]);
          continue;
        }

        setItems((prev) => [...prev, { id, name: file.name, status: "uploading", progress: 0 }]);

        try {
          const raw = await filesService.upload(file, {
            onProgress: (e) => {
              const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
              setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progress: pct } : it)));
            },
          });
          const normalized = filesService.normalizeFile(raw);
          setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "done", file: normalized } : it)));
          uploaded.push(normalized);
          onUploaded?.(normalized);
        } catch (error) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === id ? { ...it, status: "error", error: parseFleetopsApiError(error) } : it,
            ),
          );
        }
      }

      setBusy(false);
      return uploaded;
    },
    [validate, onUploaded],
  );

  const retry = useCallback(
    async (id, file) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
      if (file) await upload([file]);
    },
    [upload],
  );

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return { items, busy, upload, retry, remove, setItems };
}
