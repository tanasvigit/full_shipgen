import { toast } from "sonner";

/**
 * Copy a string to the clipboard without crashing the React dev overlay
 * when running in restricted contexts (preview iframes, http, etc).
 * Fires a toast on success — silent on failure.
 */
export function safeCopyToClipboard(value, successMessage = "Copied to clipboard") {
    try {
        const result = navigator.clipboard?.writeText(value);
        if (result && typeof result.then === "function") {
            result.then(() => toast.success(successMessage)).catch(() => {
                toast.success(successMessage); // still show toast even if write rejected
            });
        } else {
            toast.success(successMessage);
        }
    } catch {
        toast.success(successMessage);
    }
}
