import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFleetopsSettings } from "@/hooks/fleetops/useFleetopsSettings";
import { fleetopsService } from "@/services/fleetops";
import { createNotificationKey } from "@/lib/fleetops/createNotificationKey";
import NotificationNotifiableMultiSelect from "@/components/fleetops/settings/NotificationNotifiableMultiSelect";

const NOTIFICATION_TRANSPORT_METHODS = ["email", "sms"];

function titleize(str) {
  return String(str || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NotificationsSettingsPage() {
  const { value, loading, save, reload } = useFleetopsSettings("notifications");
  const [notificationSettings, setNotificationSettings] = useState({});
  const [registry, setRegistry] = useState([]);
  const [notifiables, setNotifiables] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setNotificationSettings(value && typeof value === "object" ? { ...value } : {});
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);
    setLoadError(null);
    Promise.all([
      fleetopsService.getNotificationRegistry(),
      fleetopsService.getNotificationNotifiables(),
    ])
      .then(([reg, notifs]) => {
        if (cancelled) return;
        setRegistry(Array.isArray(reg) ? reg : []);
        setNotifiables(Array.isArray(notifs) ? notifs : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.friendlyMessage || "Failed to load notification registry");
          setRegistry([]);
          setNotifiables([]);
        }
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelectNotifiable = useCallback((notification, selected) => {
    const notificationKey = createNotificationKey(notification.definition, notification.name);
    setNotificationSettings((prev) => {
      const next = { ...prev };
      next[notificationKey] = {
        ...(next[notificationKey] || {}),
        notifiables: selected,
        definition: notification.definition,
        via: selected.map((notifiable) => ({
          identifier: notifiable.value,
          methods: NOTIFICATION_TRANSPORT_METHODS,
        })),
      };
      return next;
    });
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      await save(notificationSettings);
      await reload();
      toast.success("Notification settings saved");
    } catch (err) {
      toast.error(err?.friendlyMessage || err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const busy = loading || metaLoading || saving;

  return (
    <div className="p-6" data-testid="fleetops-settings-notifications-page">
      <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4 max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold text-[#0A0E1A]">Configure notifications</h2>
          <Button
            onClick={onSave}
            disabled={busy}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white"
            data-testid="fleetops-settings-notifications-save"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        {loadError && (
          <p className="text-sm text-red-600" data-testid="fleetops-settings-notifications-load-error">
            {loadError}
          </p>
        )}

        {registry.length === 0 && !metaLoading && !loadError && (
          <p className="text-sm text-[#4B5563]" data-testid="fleetops-settings-notifications-empty-registry">
            No notification types registered for FleetOps.
          </p>
        )}

        <div className="space-y-6">
          {registry.map((notification) => {
            const key = createNotificationKey(notification.definition, notification.name);
            const selected = notificationSettings[key]?.notifiables || [];
            return (
              <div
                key={key}
                className="space-y-1.5 border-b border-black/[0.06] pb-4 last:border-0"
                data-testid={`fleetops-settings-notifications-row-${key}`}
              >
                <div>
                  <p className="text-sm font-medium text-[#0A0E1A]">{titleize(notification.name)}</p>
                  {notification.description && (
                    <p className="text-xs text-[#4B5563] mt-0.5">{notification.description}</p>
                  )}
                </div>
                <NotificationNotifiableMultiSelect
                  options={notifiables}
                  value={selected}
                  onChange={(next) => onSelectNotifiable(notification, next)}
                  disabled={busy}
                  placeholder="Select notifiables…"
                  testId={`fleetops-settings-notifications-notifiables-${key}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
