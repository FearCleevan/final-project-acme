"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/admin/utils";
import {
  FulfillmentEvent,
  FulfillmentEventStatus,
  OrderStatus,
} from "@/lib/admin/types";
import PageHeader from "@/components/admin/shared/PageHeader";
import SectionCard from "@/components/admin/shared/SectionCard";
import DataTable, { Column } from "@/components/admin/shared/DataTable";
import Badge, {
  BadgeVariant,
  orderStatusVariant,
  paymentStatusVariant,
} from "@/components/admin/shared/Badge";
import SearchInput from "@/components/admin/shared/SearchInput";
import Pagination from "@/components/admin/shared/Pagination";
import { cn } from "@/lib/utils";
import { AdminOrder } from "@/lib/admin/types";
import {
  BiExport,
  BiCheckCircle,
  BiCheck,
  BiBox,
  BiCopy,
} from "react-icons/bi";
import { TbTruckDelivery } from "react-icons/tb";

const CSV_HEADERS = [
  "Order #",
  "Customer Name",
  "Customer Email",
  "Date",
  "Items",
  "Subtotal",
  "Shipping",
  "Tax",
  "Total",
  "Payment Status",
  "Fulfillment Status",
  "Tracking Ref",
];

function escapeCSV(val: unknown): string {
  const s = (val == null ? "" : String(val)).replace(/^[=+\-@\t\r]/, "'$&");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function exportOrdersCSV(orders: AdminOrder[]) {
  const rows = orders.map((o) =>
    [
      o.id,
      o.customer.name,
      o.customer.email,
      o.date,
      o.items.length,
      o.subtotal,
      o.shipping,
      o.tax,
      o.total,
      o.paymentStatus,
      o.fulfillmentStatus,
      o.trackingRef ?? "",
    ]
      .map(escapeCSV)
      .join(","),
  );
  const csv = [CSV_HEADERS.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `orders-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type TabFilter = "all" | OrderStatus;

const TABS: { label: string; value: TabFilter }[] = [
  { label: "All", value: "all" },
  { label: "Unfulfilled", value: "unfulfilled" },
  { label: "Fulfilled", value: "fulfilled" },
  { label: "Cancelled", value: "cancelled" },
];

const PAGE_SIZE = 20;

export interface Carrier {
  name: string;
  shopifyCode: string;
  trackingUrl: string;
}

export const CARRIERS: Carrier[] = [
  {
    name: "Canada Post",
    shopifyCode: "Canada Post",
    trackingUrl:
      "https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=",
  },
  {
    name: "UPS",
    shopifyCode: "UPS",
    trackingUrl: "https://www.ups.com/track?tracknum=",
  },
  {
    name: "FedEx",
    shopifyCode: "FedEx",
    trackingUrl: "https://www.fedex.com/apps/fedextrack/?tracknumbers=",
  },
  {
    name: "Purolator",
    shopifyCode: "Purolator",
    trackingUrl:
      "https://www.purolator.com/en/ship-track/tracking-details.page?pin=",
  },
  {
    name: "DHL Express",
    shopifyCode: "DHL Express",
    trackingUrl: "https://www.dhl.com/en/express/tracking.html?AWB=",
  },
  {
    name: "Canpar",
    shopifyCode: "Canpar",
    trackingUrl:
      "https://www.canpar.com/en/manage/tracking/trackingBarcodes.do?barcode=",
  },
  {
    name: "USPS",
    shopifyCode: "USPS",
    trackingUrl: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
  },
  {
    name: "Amazon Logistics",
    shopifyCode: "Amazon Logistics",
    trackingUrl: "https://track.amazon.ca/tracking/",
  },
  { name: "Other", shopifyCode: "Other", trackingUrl: "" },
];

const deliveryStatusLabels: Record<FulfillmentEventStatus, string> = {
  confirmed: "Confirmed",
  label_printed: "Label printed",
  in_transit: "In transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  attempted_delivery: "Attempted Delivery",
  failure: "Failure",
};

const deliveryStatusVariants: Record<FulfillmentEventStatus, BadgeVariant> = {
  confirmed: "neutral",
  label_printed: "neutral",
  in_transit: "blue",
  out_for_delivery: "blue",
  delivered: "neutral",
  attempted_delivery: "amber",
  failure: "red",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const getCarrierUrl = (carrierName: string, trackingNum: string) => {
    const found = CARRIERS.find(
      (c) => c.name === carrierName || c.shopifyCode === carrierName,
    );
    return found?.trackingUrl ? `${found.trackingUrl}${trackingNum}` : null;
  };

  const handleCopyTracking = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLatestFulfillmentEvent = (
    order: AdminOrder,
  ): FulfillmentEvent | null => {
    if (!order.fulfillmentEvents || order.fulfillmentEvents.length === 0)
      return null;

    const sorted = [...order.fulfillmentEvents].sort(
      (a, b) =>
        new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime(),
    );
    return sorted[0];
  };

  const COLUMNS: Column<AdminOrder>[] = [
    {
      key: "id",
      label: "Order",
      sortable: true,
      render: (row) => (
        <span
          onClick={() =>
            router.push(`/admin/orders/${row.id.replace("#", "")}`)
          }
          className="text-[12px] font-medium text-(--admin-text) hover:underline cursor-pointer"
        >
          {row.id}
        </span>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (row) => (
        <div
          onClick={() =>
            router.push(`/admin/orders/${row.id.replace("#", "")}`)
          }
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <p className="text-[13px] text-(--admin-text)">{row.customer.name}</p>
          <p className="text-[11px] text-(--admin-text-muted)">
            {row.customer.email}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-(--admin-text-soft)">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (row) => (
        <span className="text-[12px] text-(--admin-text-soft)">
          {row.items.length}
        </span>
      ),
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (row) => (
        <span className="text-[13px] font-semibold text-(--admin-text)">
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (row) => (
        <Badge
          label={row.paymentStatus}
          variant={paymentStatusVariant(row.paymentStatus)}
        />
      ),
    },
    {
      key: "fulfillmentStatus",
      label: "Fulfillment",
      render: (row) => (
        <Badge
          label={row.fulfillmentStatus}
          variant={orderStatusVariant(row.fulfillmentStatus)}
        />
      ),
    },
    {
      key: "deliveryStatus",
      label: "Delivery Status",
      render: (row) => {
        const latestEvent = getLatestFulfillmentEvent(row);
        const status = latestEvent?.status;
        const isOpen = openDropdownId === row.id;

        if (!status)
          return (
            <span className="text-[12px] text-(--admin-text-muted)">-</span>
          );

        let icon = null;
        if (status === "in_transit" || status === "out_for_delivery") {
          icon = <TbTruckDelivery />;
        } else if (status === "delivered") {
          icon = <BiCheckCircle />;
        }

        const trackingNum = latestEvent?.trackingNumber || row.trackingRef;

        if (!trackingNum) {
          return (
            <Badge
              label={deliveryStatusLabels[status] || status.replace(/_/g, "")}
              variant={deliveryStatusVariants[status] || "neutral"}
              icon={icon}
            />
          );
        }

        return (
          <div
            ref={isOpen ? dropdownRef : null}
            className="relative inline-block"
          >
            <div
              onClick={() => setOpenDropdownId(isOpen ? null : row.id)}
              className="cursor-pointer"
            >
              <Badge
                label={
                  deliveryStatusLabels[status] || status.replace(/_/g, " ")
                }
                variant={deliveryStatusVariants[status] || "neutral"}
                icon={icon}
              />

              {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10 w-70 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <Badge
                      label={
                        deliveryStatusLabels[status] ||
                        status.replace(/_/g, " ")
                      }
                      variant={deliveryStatusVariants[status] || "neutral"}
                      icon={icon}
                    />
                    <span className="text-[11px] font-medium text-(--admin-text-muted)">
                      {row.id}
                    </span>
                  </div>

                  {/* --- UPDATED INTERNAL BOX --- */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-md p-2 border border-gray-100">
                    <div className="flex items-center gap-2 text-[12px] text-gray-700 truncate max-w-50">
                      <BiBox size={14} className="text-gray-500 shrink-0" />
                      <span className="font-medium shrink-0">
                        {latestEvent?.carrier || "Carrier"}:
                      </span>
                      {/* Tracking Number Link */}
                      {getCarrierUrl(
                        latestEvent?.carrier || "",
                        trackingNum,
                      ) ? (
                        <a
                          href={
                            getCarrierUrl(
                              latestEvent?.carrier || "",
                              trackingNum,
                            )!
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono truncate hover:underline text-blue-600 transition-colors"
                        >
                          {trackingNum}
                        </a>
                      ) : (
                        <span className="font-mono truncate">
                          {trackingNum}
                        </span>
                      )}
                    </div>

                    {/* Copy Button with Feedback */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyTracking(row.id, trackingNum);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors shrink-0"
                      title={
                        copiedId === row.id ? "Copied!" : "Copy tracking number"
                      }
                    >
                      {copiedId === row.id ? (
                        <BiCheck size={14} className="text-green-600" />
                      ) : (
                        <BiCopy size={14} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                  {/* -------------------------- */}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const filtered = useMemo(() => {
    let list = orders;
    if (tab !== "all") list = list.filter((o) => o.fulfillmentStatus === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tab, search, orders]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabCount = (v: TabFilter) =>
    v === "all"
      ? orders.length
      : orders.filter((o) => o.fulfillmentStatus === v).length;

  const handleTabChange = (v: TabFilter) => {
    setTab(v);
    setPage(1);
  };
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={loading ? "Loading…" : `${orders.length} total orders`}
        actions={
          <button
            onClick={() => exportOrdersCSV(filtered)}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
          >
            <BiExport size={13} />{" "}
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        }
      />

      <SectionCard noPadding>
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-(--admin-border)">
          <div className="flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTabChange(t.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors",
                  tab === t.value
                    ? "bg-(--admin-accent) text-(--admin-accent-text)"
                    : "text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    tab === t.value
                      ? "bg-white/20 text-(--admin-accent-text)"
                      : "bg-(--admin-border) text-(--admin-text-muted)",
                  )}
                >
                  {tabCount(t.value)}
                </span>
              </button>
            ))}
          </div>
          <div className="sm:ml-auto">
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Search order # or customer…"
              className="w-full sm:w-64"
            />
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="divide-y divide-(--admin-border)">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-(--admin-border) rounded animate-pulse" />
                  <div className="h-2.5 w-40 bg-(--admin-border) rounded animate-pulse" />
                </div>
                <div className="h-3 w-16 bg-(--admin-border) rounded animate-pulse hidden sm:block" />
                <div className="h-5 w-14 bg-(--admin-border) rounded-full animate-pulse hidden sm:block" />
              </div>
            ))}
          </div>
        )}

        {/* Mobile card list */}
        {!loading && (
          <div className="sm:hidden divide-y divide-(--admin-border)">
            {paginated.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-[13px] text-(--admin-text-soft)">
                  No orders found
                </p>
                <p className="text-[11px] text-(--admin-text-muted) mt-1">
                  Try adjusting your filters or search.
                </p>
              </div>
            ) : (
              paginated.map((o) => (
                <div
                  key={o.id}
                  onClick={() =>
                    router.push(`/admin/orders/${o.id.replace("#", "")}`)
                  }
                  className="flex items-start gap-3 px-4 py-3 hover:bg-(--admin-surface-2) cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[12px] font-medium text-(--admin-text)">
                        {o.id}
                      </span>
                      <span className="text-[13px] font-semibold text-(--admin-text)">
                        {formatCurrency(o.total)}
                      </span>
                    </div>
                    <p className="text-[12px] text-(--admin-text-soft) truncate">
                      {o.customer.name}
                    </p>
                    <p className="text-[11px] text-(--admin-text-muted) mb-1.5">
                      {formatDate(o.date)} · {o.items.length} item
                      {o.items.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        label={o.paymentStatus}
                        variant={paymentStatusVariant(o.paymentStatus)}
                      />
                      <Badge
                        label={o.fulfillmentStatus}
                        variant={orderStatusVariant(o.fulfillmentStatus)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Desktop table */}
        {!loading && (
          <div className="hidden sm:block">
            <DataTable
              columns={COLUMNS as unknown as Column<Record<string, unknown>>[]}
              data={paginated as unknown as Record<string, unknown>[]}
              keyField="id"
              emptyMessage="No orders found"
              emptyDescription="Try adjusting your filters or search."
            />
          </div>
        )}

        {/* Pagination */}
        <div className="px-5 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      </SectionCard>
    </div>
  );
}
