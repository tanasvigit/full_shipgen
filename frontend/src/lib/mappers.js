export const statusLabel = (value) =>
  ({
    created: "Created",
    dispatched: "Dispatched",
    en_route: "En Route",
    delivered: "Delivered",
    canceled: "Canceled",
    online: "Online",
    offline: "Offline",
    on_break: "On Break",
    active: "Active",
    maintenance: "Maintenance",
    out_of_service: "Out of Service",
    paused: "Paused",
    invited: "Invited",
    disabled: "Disabled",
    paid: "Paid",
    pending: "Pending",
  }[value] || value || "Unknown");

/** Route/API identifier — prefer uuid for Fleetbase internal API paths. */
export const entityRouteId = (record) =>
  record?.uuid || record?.id || record?.public_id || null;

export const mapPlace = (place) => ({
  id: entityRouteId(place),
  publicId: place?.public_id || place?.id,
  name: place?.name || place?.address || "Unknown place",
  address: place?.address || place?.street1 || "N/A",
  lat: Number(place?.latitude || place?.lat || 0),
  lng: Number(place?.longitude || place?.lng || 0),
  contact: place?.contact_name || place?.contact || "N/A",
  openingHours: place?.opening_hours || "N/A",
});

export const mapDriver = (driver) => ({
  id: entityRouteId(driver),
  publicId: driver?.public_id || driver?.id,
  name: driver?.name || [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || "Driver",
  phone: driver?.phone || "",
  email: driver?.email || "",
  vehicleId: driver?.vehicle_uuid || driver?.vehicle_id || driver?.vehicle?.id || null,
  status: driver?.status || "offline",
  rating: Number(driver?.rating || 0),
  ordersCompleted: Number(driver?.orders_completed || 0),
  location: {
    lat: Number(driver?.location?.latitude || driver?.lat || 0),
    lng: Number(driver?.location?.longitude || driver?.lng || 0),
    label: driver?.location?.label || "Unknown",
  },
  skills: driver?.skills || [],
});

export const mapVehicle = (vehicle) => ({
  id: entityRouteId(vehicle),
  publicId: vehicle?.public_id || vehicle?.id,
  name: vehicle?.name || `${vehicle?.make || ""} ${vehicle?.model || ""}`.trim() || "Vehicle",
  plate: vehicle?.plate_number || vehicle?.plate || "N/A",
  status: vehicle?.status || "active",
});

export const mapOrder = (order) => ({
  id: entityRouteId(order),
  publicId: order?.public_id || order?.tracking_number || order?.id,
  internalId: order?.internal_id || order?.internalId || "",
  trackingNumber: order?.tracking_number || order?.public_id || order?.id,
  customer: {
    name: order?.customer?.name || order?.customer_name || "Customer",
    email: order?.customer?.email || order?.customer_email || "",
    phone: order?.customer?.phone || order?.customer_phone || "",
  },
  status: order?.status || "created",
  priority: order?.priority || "medium",
  driverId: order?.driver_uuid || order?.driver_id || order?.driver?.id || null,
  vehicleId: order?.vehicle_uuid || order?.vehicle_id || order?.vehicle?.id || null,
  pickup: mapPlace(order?.pickup || order?.pickup_place || {}),
  dropoff: mapPlace(order?.dropoff || order?.dropoff_place || {}),
  distance: Number(order?.distance || 0),
  eta: order?.eta || order?.estimated_arrival || "N/A",
  scheduledAt: order?.scheduled_at || order?.created_at || null,
  createdAt: order?.created_at || null,
  updatedAt: order?.updated_at || order?.updatedAt || null,
  podRequired: Boolean(order?.pod_required || order?.meta?.pod_required),
  hasProof: Boolean(order?.has_proof || (Array.isArray(order?.files) && order.files.length > 0)),
  total: Number(order?.total || order?.amount || 0),
  items: Number(order?.items || order?.item_count || 0),
  weight: order?.weight || "N/A",
  paymentStatus: order?.payment_status || "pending",
  notes: order?.notes || "",
});

export const mapUser = (user) => ({
  id: user?.id || user?.uuid || user?.public_id,
  name: user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "User",
  email: user?.email || "",
  role: user?.role?.name || user?.company_role || user?.role || "Member",
  status: user?.status || "active",
  lastLogin: user?.last_login_at || user?.last_login || "—",
  twoFa: Boolean(user?.two_factor_enabled || user?.twoFa),
  type: user?.type || "user",
});

export const mapRole = (role) => ({
  id: role?.id || role?.uuid || role?.public_id,
  name: role?.name || "Role",
  description: role?.description || "",
  users: Number(role?.users_count || role?.users || 0),
  system: Boolean(role?.is_system || role?.system),
});

export const mapPermission = (p) => ({
  id: p?.id || p?.uuid,
  slug: String(p?.slug || p?.name || p?.key || "").trim(),
  name: p?.name || p?.title || p?.slug || "Permission",
});

export const mapGroup = (g) => ({
  id: g?.id || g?.uuid || g?.public_id,
  name: g?.name || "Group",
  description: g?.description || "",
  members: Number(g?.users_count || g?.members_count || (Array.isArray(g?.members) ? g.members.length : 0)),
  roles: (g?.roles || []).map((r) => (typeof r === "string" ? r : r?.name)).filter(Boolean),
});

export const mapNotification = (notification) => ({
  id: notification?.id || notification?.uuid,
  title: notification?.title || notification?.subject || "Notification",
  body: notification?.body || notification?.message || "",
  time: notification?.created_at || notification?.createdAt || "now",
  level: notification?.level || notification?.type || "info",
  read: Boolean(notification?.read || notification?.is_read || notification?.attributes?.read),
  link: notification?.data?.link || notification?.link || "/notifications",
});

export const statusLabelExt = (v) =>
  ({
    active: "Active",
    available: "Available",
    draft: "Draft",
    archived: "Archived",
    scheduled: "Scheduled",
    expired: "Expired",
    paused: "Paused",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
    vip: "VIP",
    new: "New",
    churned: "Churned",
    paid: "Paid",
    partial: "Partial",
    viewed: "Viewed",
    cancelled: "Cancelled",
    void: "Void",
    posted: "Posted",
    unpaid: "Unpaid",
    sent: "Sent",
    overdue: "Overdue",
    succeeded: "Succeeded",
    completed: "Completed",
    failed: "Failed",
    pending: "Pending",
    in_transit: "In Transit",
    disabled: "Disabled",
  })[v] || v || "—";

const PALETTE = ["#0066FF", "#16A34A", "#7C3AED", "#EA580C", "#0891B2", "#DC2626"];

const productUiStatus = (p) => {
  const raw = p?.status;
  if (raw === "draft") return "draft";
  if (p?.is_available === false) return "out_of_stock";
  if (raw === "available") return "active";
  if (raw === "active") return "active";
  return raw || "active";
};

const moneyNum = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v?.amount != null) return Number(v.amount);
  return Number(v) || 0;
};

export const mapPlaceRow = (p) => ({
  ...mapPlace(p),
  type: p?.type || p?.category || "location",
  phone: p?.phone || "",
  openingHours: p?.opening_hours || p?.openingHours || "—",
});

export const mapFleet = (f) => ({
  id: entityRouteId(f),
  publicId: f?.public_id || f?.id,
  name: f?.name || "Fleet",
  description: f?.description || "",
  driverIds: f?.drivers?.map((d) => d.id || d.uuid || d) || f?.driver_ids || [],
  vehicleIds: f?.vehicles?.map((v) => v.id || v.uuid || v) || f?.vehicle_ids || [],
  status: f?.status || "active",
  color: f?.color || "#3B82F6",
  region: f?.region || f?.service_area || "",
});

export const mapVehicleRow = (vehicle) => {
  const t = vehicle?.telematics || {};
  return {
    ...mapVehicle(vehicle),
    plate: vehicle?.plate_number || vehicle?.plate || "N/A",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    year: vehicle?.year ?? "",
    type: String(vehicle?.vehicle_type || vehicle?.type || "cargo_van").replace(/-/g, "_"),
    mileage: Number(vehicle?.mileage || vehicle?.odometer || 0),
    driverId: vehicle?.driver_uuid || vehicle?.driver_id || vehicle?.driver?.id || null,
    vin: vehicle?.vin || vehicle?.vehicle_identification_number || "—",
    fuel: Number(vehicle?.fuel_level ?? vehicle?.fuel ?? 0),
    lastService:
      vehicle?.last_serviced_at ||
      vehicle?.last_service_date ||
      vehicle?.maintenance?.last_serviced_at ||
      "—",
    nextService:
      vehicle?.next_service_due_at ||
      vehicle?.next_service_due ||
      vehicle?.maintenance?.next_service_due ||
      "—",
    telematics: {
      speed: Number(t.speed ?? vehicle?.current_speed ?? 0),
      engine: t.engine_state || t.engine || vehicle?.engine_state || "off",
      temp: Number(t.coolant_temp ?? vehicle?.coolant_temp ?? 0),
    },
  };
};

export const mapDriverRow = (driver) => ({
  ...mapDriver(driver),
  internalId: driver?.internal_id || driver?.internalId || driver?.public_id || "",
  licenseNumber: driver?.drivers_license_number || driver?.license_number || "",
});

const formatApiDate = (v) => {
  if (!v) return "—";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const ledgerMinor = (v) => {
  const n = moneyNum(v);
  return n / 100;
};

const customerDisplayName = (customer, fallback = "—") => {
  if (!customer) return fallback;
  if (typeof customer === "string") return customer;
  return (
    customer?.name ||
    customer?.display_name ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
    customer?.email ||
    fallback
  );
};

const accountTypeLabel = (type) => {
  if (!type) return "—";
  const t = String(type).toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const ledgerTxnUiType = (t) => {
  const raw = String(t?.type || "").toLowerCase();
  if (raw.includes("refund")) return "refund";
  if (raw.includes("payout") || raw.includes("withdraw")) return "payout";
  return "charge";
};

const paymentMethodLabel = (t) => {
  const brand = t?.payment_method_brand;
  const last4 = t?.payment_method_last4;
  const method = t?.payment_method || t?.gateway || "";
  if (brand && last4) return `${brand} ·••• ${last4}`;
  if (method) return String(method);
  return "—";
};

export const mapInvoiceItem = (item) => ({
  id: item?.uuid || item?.id || item?.public_id,
  sku: item?.meta?.sku || item?.code || item?.public_id || "—",
  description: item?.description || "—",
  qty: Number(item?.quantity ?? 1),
  unit: ledgerMinor(item?.unit_price),
  amount: ledgerMinor(item?.amount),
  taxRate: item?.tax_rate != null ? Number(item.tax_rate) : null,
});

export const mapInvoiceRow = (row) => {
  const currency = row?.currency || "USD";
  const totalMinor = moneyNum(row?.total_amount ?? row?.total);
  const paidMinor = moneyNum(row?.amount_paid ?? row?.paid);
  return {
    id: row?.uuid || row?.public_id || row?.id,
    publicId: row?.public_id || row?.id,
    number: row?.number || row?.public_id || "—",
    customer: customerDisplayName(row?.customer, row?.meta?.customer_name || "—"),
    issued: formatApiDate(row?.date || row?.created_at),
    due: formatApiDate(row?.due_date),
    amount: ledgerMinor(totalMinor),
    paid: ledgerMinor(paidMinor),
    balance: ledgerMinor(row?.balance),
    lineItems: Array.isArray(row?.items) ? row.items.length : 0,
    status: row?.status || "draft",
    currency,
    raw: row,
  };
};

/** @deprecated use mapInvoiceRow */
export const mapInvoice = mapInvoiceRow;

export const mapInvoiceDetail = (row) => {
  const base = mapInvoiceRow(row);
  const items = (row?.items || []).map(mapInvoiceItem);
  const subtotalMinor = moneyNum(row?.subtotal);
  const taxMinor = moneyNum(row?.tax);
  const totalMinor = moneyNum(row?.total_amount ?? row?.total);
  return {
    ...base,
    notes: row?.notes || "",
    terms: row?.terms || "",
    items,
    subtotal: ledgerMinor(subtotalMinor),
    tax: ledgerMinor(taxMinor),
    total: ledgerMinor(totalMinor),
    sentAt: row?.sent_at,
    paidAt: row?.paid_at,
    customerEmail: row?.customer?.email || null,
  };
};

export const mapWallet = (w) => {
  const balanceMinor = moneyNum(w?.balance);
  const owner =
    w?.name ||
    customerDisplayName(w?.subject, null) ||
    w?.description ||
    "Wallet";
  return {
    id: w?.uuid || w?.public_id || w?.id,
    publicId: w?.public_id || w?.id,
    owner,
    name: w?.name || owner,
    type: (w?.type || "internal").toLowerCase(),
    balance: ledgerMinor(balanceMinor),
    balanceFormatted: w?.formatted_balance || null,
    currency: w?.currency || "USD",
    status: w?.status || "active",
    isFrozen: Boolean(w?.is_frozen),
    lastActivity: w?.updated_at || w?.created_at,
    raw: w,
  };
};

export const mapLedgerTxn = (t) => {
  const uiType = ledgerTxnUiType(t);
  const amountMinor = moneyNum(t?.amount ?? t?.net_amount);
  return {
    id: t?.uuid || t?.public_id || t?.id,
    publicId: t?.public_id || t?.id,
    ref: t?.reference || t?.public_id || t?.id || "—",
    type: uiType,
    apiType: t?.type,
    direction: t?.direction,
    customer:
      t?.payer_name ||
      t?.payee_name ||
      customerDisplayName(t?.payer || t?.payee || t?.subject, "—"),
    method: paymentMethodLabel(t),
    amount: ledgerMinor(amountMinor),
    currency: t?.currency || "USD",
    status: t?.status || "pending",
    description: t?.description || "",
    time: t?.created_at,
    raw: t,
  };
};

export const mapAccount = (a) => {
  const typeRaw = (a?.type || a?.account_type || "").toLowerCase();
  return {
    id: a?.uuid || a?.public_id || a?.id,
    publicId: a?.public_id || a?.id,
    uuid: a?.uuid,
    code: a?.code || a?.account_code || "—",
    name: a?.name || "Account",
    type: accountTypeLabel(typeRaw),
    typeRaw,
    balance: ledgerMinor(a?.balance),
    currency: a?.currency || "USD",
    status: a?.status || "active",
    change: null,
    raw: a,
  };
};

export const mapJournalEntry = (j) => {
  const amountMinor = moneyNum(j?.amount);
  const debitAcct = j?.debit_account || j?.debitAccount;
  const creditAcct = j?.credit_account || j?.creditAccount;
  return {
    id: j?.uuid || j?.public_id || j?.id,
    number: j?.number || j?.public_id || "—",
    date: formatApiDate(j?.entry_date || j?.created_at),
    description: j?.description || j?.memo || "—",
    posted: (j?.status || "posted") === "posted",
    status: j?.status || "posted",
    amount: ledgerMinor(amountMinor),
    currency: j?.currency || "USD",
    debit: {
      code: debitAcct?.code || "—",
      name: debitAcct?.name || "—",
      uuid: j?.debit_account_uuid || debitAcct?.uuid,
      amount: ledgerMinor(amountMinor),
    },
    credit: {
      code: creditAcct?.code || "—",
      name: creditAcct?.name || "—",
      uuid: j?.credit_account_uuid || creditAcct?.uuid,
      amount: ledgerMinor(amountMinor),
    },
    raw: j,
  };
};

/** @deprecated use mapJournalEntry */
export const mapJournal = mapJournalEntry;

export const mapProduct = (p, index = 0) => {
  const stockRaw = p?.meta?.quantity ?? p?.meta?.stock ?? p?.quantity ?? p?.stock;
  const stock =
    stockRaw === undefined || stockRaw === null ? null : Number(stockRaw);
  const price = moneyNum(p?.sale_price && p?.is_on_sale ? p.sale_price : p?.price);
  const cost = moneyNum(p?.meta?.cost ?? p?.cost);
  return {
    id: p?.uuid || p?.id || p?.public_id,
    publicId: p?.public_id || p?.id,
    sku: p?.sku || p?.public_id || "—",
    name: p?.name || "Product",
    description: p?.description || "",
    price,
    cost,
    currency: p?.currency || "USD",
    stock,
    status: productUiStatus(p),
    catalogId: p?.catalog_uuid || p?.category_uuid || p?.catalog_id,
    catalogName: p?.category?.name || p?.catalog?.name || "",
    image: p?.primary_image_url || p?.image_url || null,
    rating: Number(p?.rating ?? p?.reviews_rating ?? 0),
    sold30d: Number(p?.sold_30d ?? p?.orders_count_30d ?? 0),
    isAvailable: p?.is_available !== false,
  };
};

export const mapCatalog = (c, index = 0) => ({
  id: c?.uuid || c?.id || c?.public_id,
  name: c?.name || "Catalog",
  description: c?.description || "",
  productCount: Number(c?.products_count ?? c?.product_count ?? c?.count ?? 0),
  color: c?.meta?.color || PALETTE[index % PALETTE.length],
  status: c?.status || "active",
});

export const mapStoreCustomer = (c) => {
  const name =
    c?.name ||
    `${c?.first_name || ""} ${c?.last_name || ""}`.trim() ||
    c?.email ||
    "Customer";
  const orders = Number(c?.orders_count ?? c?.customer_orders_count ?? c?.orders ?? 0);
  const ltv = moneyNum(c?.lifetime_value ?? c?.ltv ?? c?.meta?.ltv);
  return {
    id: c?.uuid || c?.id || c?.public_id,
    publicId: c?.public_id || c?.id,
    name,
    email: c?.email || "",
    phone: c?.phone || c?.phone_number || "—",
    status: c?.status || c?.meta?.tier || "active",
    orders,
    ltv,
    lastOrder: c?.last_order_at || c?.last_ordered_at || "—",
    joined: c?.created_at || "—",
  };
};

export const mapNetwork = (n, index = 0) => ({
  id: n?.uuid || n?.id || n?.public_id,
  publicId: n?.public_id || n?.id,
  name: n?.name || "Network",
  description: n?.description || "",
  type: n?.type || "b2b",
  status: n?.online === false ? "paused" : n?.status || "active",
  stores: Number(n?.stores_count ?? n?.stores ?? 0),
  customers: Number(n?.customers_count ?? n?.customers ?? 0),
  ordersMonth: Number(n?.orders_month ?? n?.orders_count ?? 0),
  color: n?.meta?.color || PALETTE[index % PALETTE.length],
  region: n?.timezone || n?.meta?.region || "—",
});

export const mapCoupon = (c) => {
  const isPct = c?.discount_type === "percentage" || c?.type === "percentage" || c?.kind === "percent";
  const amount = c?.discount_value ?? c?.discount_amount ?? c?.amount ?? c?.value;
  const discount =
    isPct && amount !== undefined
      ? `${amount}%`
      : amount !== undefined
        ? String(amount)
        : c?.discount || "—";
  return {
    id: c?.uuid || c?.id,
    code: c?.code || c?.coupon_code || "",
    description: c?.description || "",
    discount,
    usage: Number(c?.redemptions_count ?? c?.usage ?? c?.redeemed ?? 0),
    limit: c?.usage_limit ?? c?.limit ?? null,
    status: c?.status || "active",
    expires: c?.expires_at || c?.expires || "—",
  };
};

export const mapPromotion = (p) => ({
  id: p?.uuid || p?.id,
  title: p?.title || p?.name || "Campaign",
  audience: p?.audience || p?.segment || "",
  status: p?.status || "draft",
  sent: Number(p?.sent_count ?? p?.sent ?? 0),
  opened: Number(p?.opened ?? p?.open_count ?? 0),
  clicked: Number(p?.clicked ?? p?.click_count ?? 0),
  sentAt: p?.sent_at || p?.created_at || "—",
});

/** Line item from storefront cart resource. */
export const mapCartLine = (item, productLookup = {}) => {
  const productId = item?.product_id || item?.product_uuid;
  const fromProduct = productLookup[productId] || {};
  const unitPrice = moneyNum(item?.price ?? item?.unit_price ?? fromProduct.price);
  const qty = Number(item?.quantity ?? 1);
  return {
    id: item?.id || item?.line_item_id || `${productId}-${qty}`,
    productId,
    name: item?.name || fromProduct.name || "Item",
    sku: item?.sku || fromProduct.sku || productId,
    price: unitPrice,
    qty,
    image: item?.product_image_url || fromProduct.image || null,
    subtotal: moneyNum(item?.subtotal ?? unitPrice * qty),
    currency: item?.currency || fromProduct.currency || "USD",
  };
};

export const mapCart = (cart, productLookup = {}) => {
  const items = (cart?.items || []).map((line) => mapCartLine(line, productLookup));
  return {
    id: cart?.public_id || cart?.id,
    uuid: cart?.uuid,
    currency: cart?.currency || "USD",
    subtotal: moneyNum(cart?.subtotal),
    totalItems: Number(cart?.total_items ?? 0),
    discountCode: cart?.discount_code || "",
    items,
  };
};

export const statusLabelPallet = (s) =>
  ({
    active: "Active",
    low_activity: "Low Activity",
    in_stock: "In Stock",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
    draft: "Draft",
    approved: "Approved",
    in_transit: "In Transit",
    received: "Received",
    canceled: "Canceled",
    cancelled: "Canceled",
    inbound: "Inbound",
    outbound: "Outbound",
    transfer: "Transfer",
    adjustment: "Adjustment",
    pending: "Pending",
    completed: "Completed",
  })[s] || s || "—";

const palletFormatDate = (v) => {
  if (!v) return "—";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const palletCoords = (w) => {
  const lat = Number(w?.latitude ?? w?.location?.coordinates?.[1] ?? 0);
  const lng = Number(w?.longitude ?? w?.location?.coordinates?.[0] ?? 0);
  return { lat, lng };
};

const inventoryStockStatus = (qty, minQty, backendStatus) => {
  if (backendStatus === "out_of_stock" || backendStatus === "low_stock" || backendStatus === "in_stock") {
    return backendStatus;
  }
  const q = Number(qty) || 0;
  const min = Number(minQty) || 0;
  if (q <= 0) return "out_of_stock";
  if (min > 0 && q < min) return "low_stock";
  return "in_stock";
};

export const mapPalletWarehouse = (w, usage = {}) => {
  const id = w?.uuid || w?.public_id || w?.id;
  const capacity = Number(w?.meta?.capacity ?? w?.capacity ?? 0);
  const used = Number(usage.used ?? 0);
  const { lat, lng } = palletCoords(w);
  const address =
    w?.address ||
    [w?.street1, w?.city, w?.province, w?.postal_code].filter(Boolean).join(", ") ||
    "—";
  return {
    id,
    publicId: w?.public_id || w?.id,
    uuid: w?.uuid,
    name: w?.name || "Warehouse",
    address,
    lat,
    lng,
    type: (w?.type || w?.meta?.warehouse_type || "primary").toLowerCase(),
    status: w?.status || "active",
    manager: w?.meta?.manager || w?.meta?.manager_name || "—",
    capacity: capacity || null,
    used,
    skus: Number(usage.skus ?? 0),
    raw: w,
  };
};

/** @deprecated use mapPalletWarehouse */
export const mapWarehouse = mapPalletWarehouse;

export const mapInventoryRecord = (row) => {
  const product = row?.product || {};
  const qty = Number(row?.quantity ?? 0);
  const minQty = Number(row?.min_quantity ?? 0);
  return {
    id: row?.uuid || row?.public_id || row?.id,
    recordId: row?.uuid || row?.public_id || row?.id,
    productId: row?.product_uuid || product?.uuid,
    sku: product?.sku || product?.public_id || row?.public_id || "—",
    name: product?.name || product?.description || "Product",
    category: product?.category || product?.type || product?.meta?.category || "—",
    warehouseId: row?.warehouse_uuid || row?.warehouse?.uuid,
    warehouseName: row?.warehouse?.name || row?.warehouse?.address || "—",
    quantity: qty,
    minQuantity: minQty,
    cost: moneyNum(product?.meta?.cost ?? product?.cost),
    price: moneyNum(product?.price ?? product?.sale_price),
    status: inventoryStockStatus(qty, minQty, row?.status),
    lastReceived: row?.updated_at || row?.created_at,
    raw: row,
  };
};

/** Aggregate per-SKU totals across warehouse inventory rows. */
export const aggregateInventoryBySku = (rows) => {
  const map = new Map();
  for (const rec of rows.map(mapInventoryRecord)) {
    const key = rec.productId || rec.sku;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        id: key,
        sku: rec.sku,
        name: rec.name,
        category: rec.category,
        warehouses: rec.warehouseId ? { [rec.warehouseId]: rec.quantity } : {},
        total: rec.quantity,
        threshold: rec.minQuantity,
        cost: rec.cost,
        price: rec.price,
        status: rec.status,
        lastReceived: rec.lastReceived,
        records: [rec],
      });
      continue;
    }
    if (rec.warehouseId) {
      existing.warehouses[rec.warehouseId] = (existing.warehouses[rec.warehouseId] || 0) + rec.quantity;
    }
    existing.total += rec.quantity;
    existing.threshold = Math.max(existing.threshold, rec.minQuantity);
    existing.status = inventoryStockStatus(existing.total, existing.threshold);
    existing.lastReceived =
      rec.lastReceived > existing.lastReceived ? rec.lastReceived : existing.lastReceived;
    existing.records.push(rec);
  }
  return [...map.values()];
};

/** @deprecated use mapInventoryRecord */
export const mapInventoryRow = mapInventoryRecord;

export const mapStockMovement = (adj, warehouseLookup = {}) => {
  const product = adj?.product || {};
  const delta = Number(adj?.quantity ?? 0);
  const whId = adj?.warehouse_uuid || adj?.meta?.warehouse_uuid;
  const whLabel = whId ? warehouseLookup[whId]?.name || whId : "—";
  return {
    id: adj?.uuid || adj?.public_id || adj?.id,
    time: adj?.created_at,
    type: (adj?.type || "adjustment").toLowerCase(),
    sku: product?.sku || product?.public_id || "—",
    units: delta,
    warehouse: whLabel,
    reference: adj?.reason || adj?.public_id || "—",
    raw: adj,
  };
};

const parseAuditValues = (v) => {
  if (!v) return {};
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return {};
  }
};

/** Map inventory audit rows where warehouse_uuid changed (best-effort inter-warehouse activity). */
export const mapAuditTransfer = (audit, warehouseLookup = {}) => {
  const oldV = parseAuditValues(audit?.old_values);
  const newV = parseAuditValues(audit?.new_values);
  const fromId = oldV?.warehouse_uuid;
  const toId = newV?.warehouse_uuid;
  if (!fromId || !toId || fromId === toId) return null;
  const units = Math.abs(Number(newV?.quantity ?? 0) - Number(oldV?.quantity ?? 0)) || Number(newV?.quantity ?? 0);
  return {
    id: audit?.uuid || audit?.id,
    number: audit?.public_id || `AUD-${String(audit?.uuid || "").slice(0, 8)}`,
    from: fromId,
    to: toId,
    skuCount: 1,
    units,
    status: "received",
    initiated: audit?.created_at,
    eta: "—",
    initiatedBy: audit?.user?.name || audit?.user?.email || "System",
    raw: audit,
  };
};

export const mapTransfer = (t, warehouseLookup = {}) => ({
  id: t?.id || t?.uuid,
  number: t?.number || t?.public_id || t?.ref || "—",
  from: t?.from || t?.from_warehouse_uuid,
  to: t?.to || t?.to_warehouse_uuid,
  fromName: warehouseLookup[t?.from]?.name || t?.from_warehouse_name || t?.from?.name,
  toName: warehouseLookup[t?.to]?.name || t?.to_warehouse_name || t?.to?.name,
  skuCount: Number(t?.skuCount ?? t?.sku_count ?? 1),
  units: Number(t?.units ?? t?.quantity ?? 0),
  status: t?.status || "pending",
  initiated: t?.initiated || t?.created_at,
  eta: t?.eta || t?.expected_at || "—",
  initiatedBy: t?.initiatedBy || t?.initiated_by || "—",
  raw: t,
});

export const mapPalletSupplier = (s, openPoCount = 0) => ({
  id: s?.uuid || s?.public_id || s?.id,
  publicId: s?.public_id || s?.id,
  uuid: s?.uuid,
  name: s?.name || "Supplier",
  category: s?.type || s?.meta?.category || "General",
  contact: s?.email || s?.contact_email || "—",
  phone: s?.phone || "—",
  terms: s?.meta?.payment_terms || s?.meta?.terms || "—",
  leadTime: s?.meta?.lead_time || s?.meta?.lead_time_days ? `${s.meta.lead_time_days} days` : "—",
  onTime: s?.meta?.on_time_pct != null ? Number(s.meta.on_time_pct) : null,
  qualityScore: s?.meta?.quality_score != null ? Number(s.meta.quality_score) : null,
  openPOs: openPoCount,
  status: s?.status || "active",
  raw: s,
});

/** @deprecated use mapPalletSupplier */
export const mapSupplier = mapPalletSupplier;

export const mapPurchaseOrderRow = (p) => ({
  id: p?.uuid || p?.public_id || p?.id,
  number: p?.reference_code || p?.public_id || p?.customer_reference_code || "—",
  supplier: p?.supplier?.name || p?.supplier_name || "—",
  supplierId: p?.supplier_uuid,
  warehouse: p?.warehouse_uuid || p?.meta?.warehouse_uuid || null,
  warehouseName: p?.warehouse?.name || p?.meta?.warehouse_name || null,
  items: Number(p?.meta?.items_count ?? p?.meta?.line_items ?? 0),
  total: moneyNum(p?.meta?.total ?? p?.meta?.total_amount),
  status: (p?.status || "draft").toLowerCase(),
  issued: palletFormatDate(p?.order_created_at || p?.order_date_at || p?.created_at),
  expected: palletFormatDate(p?.expected_delivery_at),
  received: palletFormatDate(p?.meta?.received_at),
  description: p?.description || "",
  raw: p,
});

/** @deprecated use mapPurchaseOrderRow */
export const mapPurchaseOrder = mapPurchaseOrderRow;

/** Compute warehouse utilization from inventory rows. */
export const warehouseUsageFromInventory = (inventoryRows, warehouses) => {
  const usage = {};
  for (const w of warehouses) {
    usage[w.id] = { used: 0, skus: new Set() };
  }
  for (const rec of inventoryRows.map(mapInventoryRecord)) {
    const wh = rec.warehouseId;
    if (!wh || !usage[wh]) continue;
    usage[wh].used += rec.quantity;
    usage[wh].skus.add(rec.productId || rec.sku);
  }
  const result = {};
  for (const [whId, u] of Object.entries(usage)) {
    result[whId] = { used: u.used, skus: u.skus.size };
  }
  return result;
};

export const mapApiCredential = (k) => ({
  id: k?.id || k?.uuid,
  name: k?.name || "API key",
  publicId: k?.key || k?.public_id || k?.token || "••••••••",
  scope: Array.isArray(k?.permissions)
    ? k.permissions.join(", ")
    : k?.scope
      ? String(k.scope)
      : k?.test_mode
        ? "test"
        : k?.environment || "default",
  type: k?.test_mode ? "test" : "live",
  status: k?.status || (k?.revoked_at ? "revoked" : "active"),
  calls7d: Number(k?.requests_7d || k?.usage_7d || 0),
  lastUsed: k?.last_used_at || k?.last_used || "—",
});

export const mapWebhook = (w) => {
  const rawEvents = w?.events;
  const eventsList = Array.isArray(rawEvents)
    ? rawEvents
    : typeof rawEvents === "string"
      ? rawEvents
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  return {
    id: w?.id || w?.uuid,
    name: w?.name || w?.url || "Webhook",
    url: w?.url || "",
    description: w?.description || "",
    status: w?.status || (w?.enabled === false ? "disabled" : "active"),
    events: eventsList.length ? eventsList.join(", ") : w?.event || "all",
    eventsList,
    failures24h: Number(w?.failures_24h || 0),
    createdAt: w?.created_at,
    deliveries24h: Number(w?.deliveries_24h ?? w?.deliveries_count ?? w?.delivery_count ?? 0),
    successRate: Number(
      w?.success_rate ?? w?.success_rate_pct ?? (w?.success_pct != null ? w.success_pct : 100),
    ),
    avgLatency: Number(w?.avg_latency_ms ?? w?.latency_ms ?? w?.p50_latency_ms ?? 0),
    lastDelivery: w?.last_delivery_at ? String(w?.last_delivery_at) : w?.last_success_at || "—",
    signingSecretPreview:
      w?.signing_secret_preview || w?.secret_preview || w?.webhook_secret_preview || null,
  };
};

export const mapApiLog = (l) => ({
  id: l?.id || l?.uuid,
  method: (l?.method || "GET").toUpperCase(),
  path: l?.path || l?.uri || l?.url || "",
  status: Number(l?.status_code || l?.status || 0),
  latency: Number(l?.duration_ms || l?.duration || 0),
  ms: Number(l?.duration_ms || l?.duration || 0),
  at: l?.created_at,
  key: l?.api_credential_public_id || l?.credential?.name || l?.api_key_name || "—",
  ip: l?.ip_address || l?.ip || l?.client_ip || "—",
});

/** Delivery attempt / webhook request log row. */
export const mapWebhookRequestLog = (l) => ({
  id: l?.id || l?.uuid,
  webhookEndpointId: l?.webhook_endpoint_uuid || l?.webhook_endpoint_id,
  event: l?.event || l?.event_type || l?.type || l?.name || "—",
  payload:
    l?.payload_summary ||
    l?.subject_uuid ||
    l?.resource_id ||
    l?.related_id ||
    (l?.payload && typeof l?.payload === "object" ? l?.payload?.id : null) ||
    "—",
  status: Number(l?.status_code || l?.response_code || l?.response_status || l?.http_status || l?.status || 0),
  attempt: Number(l?.attempt ?? l?.attempts ?? 1),
  latency: Number(l?.duration_ms || l?.latency_ms || l?.latency || 0),
  time: l?.created_at,
});

/** Console chat channel (used as a visibility surface for realtime / company channels). */
export const mapChatChannel = (c) => ({
  id: c?.id || c?.uuid,
  name: c?.name || c?.slug || "channel",
  description: c?.description || c?.subject_type || "",
  subscribers: Number(c?.participants_count ?? c?.participant_count ?? c?.subscribers ?? 0),
  messagesPerMin: Number(c?.messages_per_minute ?? c?.message_rate ?? 0),
});

/** Developer event catalog entry (webhook-endpoints/events or api-events list). */
export const mapDeveloperEventType = (e) => {
  const id =
    e?.name ||
    e?.event ||
    e?.id ||
    e?.type ||
    e?.key ||
    (typeof e === "string" ? e : "");
  let sample = e?.sample;
  if (sample == null && e?.example_payload != null) {
    try {
      sample =
        typeof e.example_payload === "string"
          ? e.example_payload
          : JSON.stringify(e.example_payload, null, 2);
    } catch {
      sample = "";
    }
  }
  if (sample == null && e?.payload_example != null) {
    try {
      sample =
        typeof e.payload_example === "string"
          ? e.payload_example
          : JSON.stringify(e.payload_example, null, 2);
    } catch {
      sample = "";
    }
  }
  return {
    id: String(id || "event"),
    category: e?.category || e?.namespace || e?.group || "Platform",
    description: e?.description || e?.summary || "",
    volume24h: Number(e?.volume_24h ?? e?.count_24h ?? e?.volume ?? e?.count ?? 0),
    sample: typeof sample === "string" ? sample : "{}",
  };
};

export const mapApiEvent = (e) => ({
  id: e?.id || e?.uuid,
  name: e?.name || e?.type || "event",
  description: e?.description || "",
  category: e?.category || "integration",
});

const formatExtensionPrice = (x) => {
  if (!x?.payment_required && (x?.price == null || x?.price === 0)) return "Free";
  const amount = x?.on_sale && x?.sale_price != null ? x.sale_price : x?.price;
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return "Free";
  const cur = x?.currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(n);
  } catch {
    return `$${n}`;
  }
};

const extensionCategoryName = (x) => {
  if (typeof x?.category === "string") return x.category;
  return x?.category?.name || "General";
};

/** Marketplace card shape for RegistryHome. */
export const mapRegistryExtension = (x, { installed = false } = {}) => {
  const category = extensionCategoryName(x);
  return {
    id: x?.public_id || x?.uuid || x?.id,
    publicId: x?.public_id || x?.id,
    uuid: x?.uuid,
    name: x?.name || "Extension",
    author: x?.publisher?.name || x?.company?.name || "—",
    category,
    description: x?.description || x?.promotional_text || x?.subtitle || "",
    color: x?.category?.icon_color || "#0066FF",
    iconUrl: x?.icon_url || null,
    verified: x?.status === "published" || Boolean(x?.core_extension),
    rating: x?.meta?.rating != null ? Number(x.meta.rating) : null,
    installs: Number(x?.installs_count ?? x?.install_count ?? 0),
    price: formatExtensionPrice(x),
    installed: Boolean(installed),
    status: x?.status || "draft",
    raw: x,
  };
};

/** @deprecated use mapRegistryExtension */
export const mapExtension = (x) => mapRegistryExtension(x);

export const mapSchedule = (s) => ({
  id: s?.id || s?.uuid,
  name: s?.name || "Schedule",
  subjectType: s?.subject_type,
  subjectId: s?.subject_uuid || s?.subject_id,
  status: s?.status || "active",
});

export const mapScheduleItem = (i) => ({
  id: i?.id || i?.uuid,
  title: i?.title || i?.name || "Shift",
  start: i?.start_time || i?.starts_at,
  end: i?.end_time || i?.ends_at,
  driverId: i?.driver_uuid || i?.driver_id,
});

