import { useEffect, useRef, useState } from "react";
import { EVENTS_FEED, VEHICLES, DOCKS } from "../data/db";

const TEMPLATES = [
  () => {
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    return { level: "info", msg: `${v.id} (${v.plate}) checked in at Gate ${v.gate}` };
  },
  () => {
    const d = DOCKS[Math.floor(Math.random() * DOCKS.length)];
    return { level: "success", msg: `${d.name} cleared — available for next vehicle` };
  },
  () => {
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    const c = 1000 + Math.floor(Math.random() * 5000);
    return { level: "warning", msg: `${v.id} detention crossed ₹${c.toLocaleString("en-IN")} threshold` };
  },
  () => ({ level: "danger", msg: `EQ-${100 + Math.floor(Math.random() * 8)} reported maintenance — equipment offline` }),
  () => ({ level: "info", msg: `AI Optimizer suggested ${1 + Math.floor(Math.random() * 4)} slot adjustments` }),
  () => {
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    const tat = 55 + Math.floor(Math.random() * 50);
    return { level: "success", msg: `${v.id} exited — TAT ${tat} min ${tat < 90 ? "(under target)" : "(over target)"}` };
  },
  () => {
    const t = ["VRL", "TCI", "Gati", "Delhivery", "Allcargo"][Math.floor(Math.random() * 5)];
    return { level: "info", msg: `APT-${4500 + Math.floor(Math.random() * 200)} confirmed by transporter ${t}` };
  },
  () => {
    const z = ["A", "B", "C", "D", "E", "F"][Math.floor(Math.random() * 6)];
    const pct = 85 + Math.floor(Math.random() * 13);
    return { level: pct > 92 ? "danger" : "warning", msg: `Zone ${z} occupancy at ${pct}%` };
  },
  () => {
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    return { level: "info", msg: `${v.plate} approaching 5 km radius — ETA ${5 + Math.floor(Math.random() * 25)} min` };
  },
  () => {
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    const dock = `D${1 + Math.floor(Math.random() * 12)}`;
    return { level: "info", msg: `${v.plate} assigned to ${dock} — loading starts in 5 min` };
  },
  () => {
    const v = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    return { level: "warning", msg: `Driver call placed to ${v.driver.split(" ")[0]} for ${v.plate}` };
  },
  () => ({ level: "success", msg: `AI Cost Optimizer applied — saved ₹${(8 + Math.floor(Math.random() * 25)) * 1000}` }),
];

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

let counter = 0;
const seed = EVENTS_FEED.map((e) => ({ ...e, id: `seed-${counter++}` }));

export const useEventFeed = ({ enabled = true, intervalMs = 3500, maxItems = 24 } = {}) => {
  const [events, setEvents] = useState(seed);
  const [newestId, setNewestId] = useState(null);
  const [isLive, setIsLive] = useState(enabled);
  const timer = useRef(null);

  useEffect(() => {
    if (!isLive) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(() => {
      const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      const evt = { ...tpl(), ts: now(), id: `evt-${Date.now()}-${counter++}` };
      setNewestId(evt.id);
      setEvents((prev) => [evt, ...prev].slice(0, maxItems));
    }, intervalMs);
    return () => clearInterval(timer.current);
  }, [isLive, intervalMs, maxItems]);

  // Clear "new" highlight after animation
  useEffect(() => {
    if (!newestId) return;
    const t = setTimeout(() => setNewestId(null), 1500);
    return () => clearTimeout(t);
  }, [newestId]);

  return { events, newestId, isLive, setIsLive };
};
