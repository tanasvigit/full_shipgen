export type E2eSeed = ReturnType<typeof e2eUnique>;

/** Unique labels for E2E runs — avoids collisions across parallel reruns. */
export function e2eUnique(prefix: string) {
  const unique = Date.now();
  const slug = String(unique).slice(-8);
  return {
    unique,
    slug,
    name: `E2E ${prefix} ${slug}`,
    label: `E2E ${prefix} ${slug}`,
    email: `e2e.${prefix.toLowerCase().replace(/\s+/g, ".")}.${slug}@fleetbase-e2e.test`,
    phone: `+1555${String(unique).slice(-7)}`,
    internalId: `E2E-${prefix.toUpperCase()}-${slug}`,
    plate: `E2E${slug}`,
    vin: `VIN${unique}`,
    street: `${unique} Test Avenue`,
    city: "E2E City",
    notes: `Automated CRUD test ${unique}`,
  };
}
