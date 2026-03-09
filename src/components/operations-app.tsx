import { startTransition, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  ArchiveIcon,
  ArrowUpRightIcon,
  BadgeCheckIcon,
  BoxesIcon,
  ClipboardListIcon,
  PackagePlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon
} from "lucide-react";

import { api } from "@/lib/api";
import type { AuditLog, DashboardSnapshot, InventoryPool, Reservation, Sku } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { OverviewPage } from "@/pages/overview-page";
import { CatalogPage } from "@/pages/catalog-page";
import { InventoryPage } from "@/pages/inventory-page";
import { ReservationsPage } from "@/pages/reservations-page";
import { AuditPage } from "@/pages/audit-page";

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

export type ActionRunner = (work: () => Promise<unknown>, message: string) => Promise<boolean>;

const navigationItems = [
  { href: "/", label: "Overview", icon: BoxesIcon, subtitle: "status and queues" },
  { href: "/catalog", label: "Catalog", icon: PackagePlusIcon, subtitle: "vendors and skus" },
  { href: "/inventory", label: "Inventory", icon: ArchiveIcon, subtitle: "stock and adjustments" },
  { href: "/reservations", label: "Reservations", icon: ClipboardListIcon, subtitle: "holds and confirmation" },
  { href: "/audit", label: "Audit", icon: ShieldCheckIcon, subtitle: "change history" }
] as const;

type RouteMeta = {
  label: string;
  title: string;
  description: string;
};

const routeMeta: Record<string, RouteMeta> = {
  "/": {
    label: "overview",
    title: "Inventory overview",
    description: "A quick operational read on stock, reservations, and recent activity."
  },
  "/catalog": {
    label: "catalog",
    title: "Catalog setup",
    description: "Create vendors, products, plans, and skus with explicit step-by-step actions."
  },
  "/inventory": {
    label: "inventory",
    title: "Inventory control",
    description: "Create pools, apply adjustments, and review available inventory."
  },
  "/reservations": {
    label: "reservations",
    title: "Reservation desk",
    description: "Create holds, confirm fulfilled requests, and release stock safely."
  },
  "/audit": {
    label: "audit",
    title: "Audit history",
    description: "Review the latest inventory-affecting events and actors."
  }
};

function getRouteMeta(pathname: string): RouteMeta {
  return routeMeta[pathname] ?? {
    label: "overview",
    title: "Inventory overview",
    description: "A quick operational read on stock, reservations, and recent activity."
  };
}

export function OperationsApp() {
  const location = useLocation();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ tone: "neutral" | "success" | "error"; text: string }>({
    tone: "neutral",
    text: "Loading inventory data."
  });

  const activeReservations = useMemo(
    () => snapshot.reservations.filter((item) => item.status === "RESERVED"),
    [snapshot.reservations]
  );

  const refresh = async (message = "Inventory data is up to date.") => {
    setLoading(true);

    try {
      const nextSnapshot = await api.getDashboard();
      startTransition(() => {
        setSnapshot(nextSnapshot);
        setStatus({ tone: "success", text: message });
      });
    } catch (error) {
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "Unable to load inventory data."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const runAction: ActionRunner = async (work, message) => {
    setLoading(true);

    try {
      await work();
      await refresh(message);
      return true;
    } catch (error) {
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "Request failed."
      });
      setLoading(false);
      return false;
    }
  };

  const currentMeta = getRouteMeta(location.pathname);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset" className="border-r shadow-none">
        <SidebarHeader className="gap-3 border-b">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
              <BoxesIcon />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Inventory</p>
              <p className="truncate text-xs text-muted-foreground">Operations workspace</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.href} tooltip={item.label}>
                      <NavLink to={item.href}>
                        <item.icon />
                        <div className="flex min-w-0 flex-col">
                          <span>{item.label}</span>
                          <span className="truncate text-[11px] text-muted-foreground">{item.subtitle}</span>
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <Card size="sm" className="m-2 shadow-none">
            <CardHeader className="border-b">
              <CardTitle className="text-sm">Status</CardTitle>
              <CardDescription>{loading ? "Syncing data" : status.text}</CardDescription>
              <CardAction>
                <Badge variant={status.tone === "error" ? "destructive" : "outline"}>
                  {loading ? "Syncing" : status.tone === "error" ? "Issue" : "Live"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Active holds</span>
                <span>{activeReservations.length}</span>
              </div>
            </CardContent>
          </Card>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="shadow-none" />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{currentMeta.label}</span>
              <h1 className="text-lg font-semibold">{currentMeta.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline">{activeReservations.length} active reservations</Badge>
            <Button variant="outline" onClick={() => void refresh("Inventory data refreshed.")}>
              <RefreshCwIcon data-icon="inline-start" />
              Refresh data
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>{currentMeta.title}</CardTitle>
              <CardDescription>{currentMeta.description}</CardDescription>
            </CardHeader>
          </Card>

          <Routes>
            <Route
              path="/"
              element={
                <OverviewPage
                  snapshot={snapshot}
                  loading={loading}
                  activeReservations={activeReservations}
                />
              }
            />
            <Route
              path="/catalog"
              element={<CatalogPage snapshot={snapshot} loading={loading} runAction={runAction} />}
            />
            <Route
              path="/inventory"
              element={<InventoryPage snapshot={snapshot} loading={loading} runAction={runAction} />}
            />
            <Route
              path="/reservations"
              element={<ReservationsPage snapshot={snapshot} loading={loading} runAction={runAction} />}
            />
            <Route path="/audit" element={<AuditPage auditLogs={snapshot.auditLogs} loading={loading} />} />
            <Route path="*" element={<NavigateToOverview />} />
          </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function NavigateToOverview() {
  return (
    <Card className="shadow-none">
      <CardContent className="pt-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowUpRightIcon />
            </EmptyMedia>
            <EmptyTitle>Page not found</EmptyTitle>
            <EmptyDescription>Use the sidebar to move back to a valid workspace page.</EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline">
            <Link to="/">Go to overview</Link>
          </Button>
        </Empty>
      </CardContent>
    </Card>
  );
}
