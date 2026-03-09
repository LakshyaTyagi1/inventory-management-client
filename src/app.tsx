import { startTransition, useEffect, useState } from "react";

import { api } from "./lib/api";
import type { DashboardSnapshot, InventoryPool, Reservation, Sku } from "./types";

const emptySnapshot: DashboardSnapshot = {
  vendors: [],
  products: [],
  plans: [],
  skus: [],
  inventoryPools: [],
  reservations: [],
  entitlements: [],
  auditLogs: []
};

const regions = ["GLOBAL", "US", "EU", "INDIA", "APAC"] as const;

const formatSkuLabel = (sku: Sku) => `${sku.code} · ${sku.region} · ${sku.billingPeriod}`;
const formatAvailable = (pool: InventoryPool) =>
  pool.totalQuantity - pool.reservedQuantity - pool.allocatedQuantity;

type StatusTone = "neutral" | "success" | "error";

export function App() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ tone: StatusTone; text: string }>({
    tone: "neutral",
    text: "Loading inventory data."
  });

  const [vendorName, setVendorName] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productVendorId, setProductVendorId] = useState("");
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState<"standard" | "enterprise">("standard");
  const [planProductId, setPlanProductId] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [skuPlanId, setSkuPlanId] = useState("");
  const [skuRegion, setSkuRegion] = useState<Sku["region"]>("US");
  const [skuBillingPeriod, setSkuBillingPeriod] = useState<Sku["billingPeriod"]>("monthly");
  const [inventorySkuId, setInventorySkuId] = useState("");
  const [inventoryQuantity, setInventoryQuantity] = useState(10);
  const [adjustmentChange, setAdjustmentChange] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState<
    "MANUAL_ADD" | "MANUAL_REMOVE" | "EXTERNAL_VENDOR_SALE" | "REFUND" | "CORRECTION"
  >("MANUAL_ADD");
  const [reservationSkuId, setReservationSkuId] = useState("");
  const [reservationQuantity, setReservationQuantity] = useState(1);
  const [reservationActor, setReservationActor] = useState("operations");
  const [reservationCustomerId, setReservationCustomerId] = useState("customer-001");

  const refresh = async (message = "Inventory view is up to date.") => {
    setLoading(true);

    try {
      const nextSnapshot = await api.getDashboard();
      startTransition(() => {
        setSnapshot(nextSnapshot);
        setStatusMessage({ tone: "success", text: message });
      });
    } catch (error) {
      setStatusMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Unable to load dashboard."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    setProductVendorId((current) => current || snapshot.vendors[0]?.id || "");
    setPlanProductId((current) => current || snapshot.products[0]?.id || "");
    setSkuPlanId((current) => current || snapshot.plans[0]?.id || "");
    setInventorySkuId((current) => current || snapshot.skus[0]?.id || "");
    setReservationSkuId((current) => current || snapshot.skus[0]?.id || "");
  }, [snapshot]);

  const submit = async (work: () => Promise<unknown>, message: string, reset?: () => void) => {
    setLoading(true);

    try {
      await work();
      reset?.();
      await refresh(message);
    } catch (error) {
      setStatusMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Request failed."
      });
      setLoading(false);
    }
  };

  const activeReservations = snapshot.reservations.filter((item) => item.status === "RESERVED");
  const navItems = [
    { label: "overview", href: "#overview" },
    { label: "catalog", href: "#catalog" },
    { label: "inventory", href: "#inventory" },
    { label: "reservations", href: "#reservations" },
    { label: "audit", href: "#audit" }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="brand-overline">inventory</p>
          <h1>Operations</h1>
          <p className="sidebar-copy">Internal workspace for license stock, reservations, and audit review.</p>
        </div>

        <nav className="sidebar-nav" aria-label="sections">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-status">
          <span className="status-pill" data-tone={statusMessage.tone}>
            {loading ? "syncing" : "live"}
          </span>
          <p>{statusMessage.text}</p>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="section-label">overview</p>
            <h2>Inventory overview</h2>
          </div>
          <div className="topbar-actions">
            <span className="quiet-meta">{activeReservations.length} active reservations</span>
            <button type="button" onClick={() => void refresh("Inventory view refreshed.")}>
              refresh
            </button>
          </div>
        </header>

        <main className="content-grid">
          <section className="metrics-row" id="overview" aria-label="overview metrics">
            <article className="metric-card">
              <span>vendors</span>
              <strong>{snapshot.vendors.length}</strong>
            </article>
            <article className="metric-card">
              <span>inventory pools</span>
              <strong>{snapshot.inventoryPools.length}</strong>
            </article>
            <article className="metric-card">
              <span>active reservations</span>
              <strong>{activeReservations.length}</strong>
            </article>
            <article className="metric-card">
              <span>audit events</span>
              <strong>{snapshot.auditLogs.length}</strong>
            </article>
          </section>

          <section className="panel" id="catalog">
            <div className="panel-head">
              <div>
                <h3>Catalog</h3>
                <p>Create vendor, product, plan, and sku records in order.</p>
              </div>
            </div>

            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void submit(() => api.createVendor({ name: vendorName }), "Vendor created.", () => setVendorName(""));
              }}
            >
              <label>
                vendor name
                <input value={vendorName} onChange={(event) => setVendorName(event.target.value)} placeholder="Atlassian" />
              </label>
              <button type="submit" disabled={!vendorName || loading}>
                add vendor
              </button>
            </form>

            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void submit(
                  () =>
                    api.createProduct({
                      vendorId: productVendorId,
                      name: productName,
                      description: productDescription
                    }),
                  "Product created.",
                  () => {
                    setProductName("");
                    setProductDescription("");
                  }
                );
              }}
            >
              <label>
                vendor
                <select value={productVendorId} onChange={(event) => setProductVendorId(event.target.value)}>
                  {snapshot.vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                product name
                <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Jira" />
              </label>
              <label className="full-span">
                description
                <input
                  value={productDescription}
                  onChange={(event) => setProductDescription(event.target.value)}
                  placeholder="Short operational description"
                />
              </label>
              <button type="submit" disabled={!productVendorId || !productName || loading}>
                add product
              </button>
            </form>

            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void submit(
                  () => api.createPlan({ productId: planProductId, name: planName, planType }),
                  "Plan created.",
                  () => setPlanName("")
                );
              }}
            >
              <label>
                product
                <select value={planProductId} onChange={(event) => setPlanProductId(event.target.value)}>
                  {snapshot.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                plan name
                <input value={planName} onChange={(event) => setPlanName(event.target.value)} placeholder="Standard" />
              </label>
              <label>
                plan type
                <select value={planType} onChange={(event) => setPlanType(event.target.value as typeof planType)}>
                  <option value="standard">standard</option>
                  <option value="enterprise">enterprise</option>
                </select>
              </label>
              <button type="submit" disabled={!planProductId || !planName || loading}>
                add plan
              </button>
            </form>

            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void submit(
                  () =>
                    api.createSku({
                      planId: skuPlanId,
                      code: skuCode,
                      billingPeriod: skuBillingPeriod,
                      region: skuRegion,
                      seatType: "seat"
                    }),
                  "Sku created.",
                  () => setSkuCode("")
                );
              }}
            >
              <label>
                plan
                <select value={skuPlanId} onChange={(event) => setSkuPlanId(event.target.value)}>
                  {snapshot.plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                sku code
                <input
                  value={skuCode}
                  onChange={(event) => setSkuCode(event.target.value)}
                  placeholder="jira-standard-monthly-us"
                />
              </label>
              <label>
                region
                <select value={skuRegion} onChange={(event) => setSkuRegion(event.target.value as Sku["region"])}>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                billing period
                <select
                  value={skuBillingPeriod}
                  onChange={(event) => setSkuBillingPeriod(event.target.value as Sku["billingPeriod"])}
                >
                  <option value="monthly">monthly</option>
                  <option value="yearly">yearly</option>
                </select>
              </label>
              <button type="submit" disabled={!skuPlanId || !skuCode || loading}>
                add sku
              </button>
            </form>
          </section>

          <section className="panel" id="inventory">
            <div className="panel-head">
              <div>
                <h3>Inventory</h3>
                <p>Pool counts stay explicit so operators do not have to calculate availability manually.</p>
              </div>
            </div>

            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                const sku = snapshot.skus.find((item) => item.id === inventorySkuId);

                void submit(
                  () =>
                    api.createInventoryPool({
                      skuId: inventorySkuId,
                      region: sku?.region ?? "US",
                      totalQuantity: inventoryQuantity
                    }),
                  "Inventory pool created."
                );
              }}
            >
              <label className="full-span">
                sku
                <select value={inventorySkuId} onChange={(event) => setInventorySkuId(event.target.value)}>
                  {snapshot.skus.map((sku) => (
                    <option key={sku.id} value={sku.id}>
                      {formatSkuLabel(sku)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                total quantity
                <input
                  type="number"
                  min={1}
                  value={inventoryQuantity}
                  onChange={(event) => setInventoryQuantity(Number(event.target.value))}
                />
              </label>
              <button type="submit" disabled={!inventorySkuId || loading}>
                create pool
              </button>
            </form>

            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                const sku = snapshot.skus.find((item) => item.id === inventorySkuId);

                void submit(
                  () =>
                    api.adjustInventory({
                      skuId: inventorySkuId,
                      region: sku?.region ?? "US",
                      change: adjustmentReason === "MANUAL_REMOVE" ? -Math.abs(adjustmentChange) : adjustmentChange,
                      reason: adjustmentReason,
                      actor: reservationActor
                    }),
                  "Inventory adjusted."
                );
              }}
            >
              <label>
                adjustment
                <input
                  type="number"
                  value={adjustmentChange}
                  onChange={(event) => setAdjustmentChange(Number(event.target.value))}
                />
              </label>
              <label>
                reason
                <select
                  value={adjustmentReason}
                  onChange={(event) => setAdjustmentReason(event.target.value as typeof adjustmentReason)}
                >
                  <option value="MANUAL_ADD">manual add</option>
                  <option value="MANUAL_REMOVE">manual remove</option>
                  <option value="EXTERNAL_VENDOR_SALE">vendor sale</option>
                  <option value="REFUND">refund</option>
                  <option value="CORRECTION">correction</option>
                </select>
              </label>
              <button type="submit" disabled={!inventorySkuId || loading}>
                adjust inventory
              </button>
            </form>

            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>sku</th>
                    <th>total</th>
                    <th>reserved</th>
                    <th>allocated</th>
                    <th>available</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.inventoryPools.map((pool) => {
                    const sku = snapshot.skus.find((item) => item.id === pool.skuId);
                    return (
                      <tr key={pool.id}>
                        <td>{sku ? formatSkuLabel(sku) : pool.skuId}</td>
                        <td>{pool.totalQuantity}</td>
                        <td>{pool.reservedQuantity}</td>
                        <td>{pool.allocatedQuantity}</td>
                        <td>{formatAvailable(pool)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" id="reservations">
            <div className="panel-head">
              <div>
                <h3>Reservations</h3>
                <p>Reserve, confirm, cancel, and sweep expiries from one place.</p>
              </div>
            </div>

            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                const sku = snapshot.skus.find((item) => item.id === reservationSkuId);

                void submit(
                  () =>
                    api.createReservation({
                      skuId: reservationSkuId,
                      region: sku?.region ?? "US",
                      quantity: reservationQuantity,
                      actor: reservationActor
                    }),
                  "Reservation created."
                );
              }}
            >
              <label className="full-span">
                sku
                <select value={reservationSkuId} onChange={(event) => setReservationSkuId(event.target.value)}>
                  {snapshot.skus.map((sku) => (
                    <option key={sku.id} value={sku.id}>
                      {formatSkuLabel(sku)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                quantity
                <input
                  type="number"
                  min={1}
                  value={reservationQuantity}
                  onChange={(event) => setReservationQuantity(Number(event.target.value))}
                />
              </label>
              <label>
                operator id
                <input value={reservationActor} onChange={(event) => setReservationActor(event.target.value)} />
              </label>
              <label>
                customer id
                <input value={reservationCustomerId} onChange={(event) => setReservationCustomerId(event.target.value)} />
              </label>
              <button type="submit" disabled={!reservationSkuId || loading}>
                reserve inventory
              </button>
            </form>

            <div className="reservation-stack">
              {snapshot.reservations.map((reservation: Reservation) => {
                const sku = snapshot.skus.find((item) => item.id === reservation.skuId);

                return (
                  <article key={reservation.id} className="reservation-row">
                    <div>
                      <p className="reservation-title">{sku ? formatSkuLabel(sku) : reservation.skuId}</p>
                      <p className="reservation-meta">
                        {reservation.quantity} seats · {reservation.status.toLowerCase()} · expires{" "}
                        {new Date(reservation.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="action-row">
                      <button
                        type="button"
                        disabled={reservation.status !== "RESERVED" || loading}
                        onClick={() =>
                          void submit(
                            () =>
                              api.confirmReservation(reservation.id, {
                                customerId: reservationCustomerId,
                                actor: reservationActor
                              }),
                            "Reservation confirmed."
                          )
                        }
                      >
                        confirm
                      </button>
                      <button
                        type="button"
                        disabled={reservation.status !== "RESERVED" || loading}
                        onClick={() =>
                          void submit(
                            () => api.cancelReservation(reservation.id, { actor: reservationActor }),
                            "Reservation cancelled."
                          )
                        }
                      >
                        cancel
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={() => void submit(() => api.processExpiredReservations(), "Expiry sweep completed.")}
            >
              process expired reservations
            </button>
          </section>

          <section className="panel" id="audit">
            <div className="panel-head">
              <div>
                <h3>Audit log</h3>
                <p>Recent inventory mutations and operators.</p>
              </div>
            </div>

            <div className="timeline">
              {snapshot.auditLogs.map((entry) => (
                <article key={entry.id} className="timeline-row">
                  <span>{entry.action}</span>
                  <span>{entry.actor}</span>
                  <time>{new Date(entry.timestamp).toLocaleString()}</time>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
