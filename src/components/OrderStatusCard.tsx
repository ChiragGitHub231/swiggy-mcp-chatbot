import React from "react";
import type { SwiggyOrder } from "@/lib/swiggy-mcp";

interface OrderStatusCardProps {
  order: SwiggyOrder;
}

export function OrderStatusCard({ order }: OrderStatusCardProps) {
  const getStatusBadge = (status: SwiggyOrder["status"]) => {
    switch (status) {
      case "ORDER_CONFIRMED":
        return {
          bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50",
          dot: "bg-blue-500",
          label: "Order Confirmed",
        };
      case "PREPARING_FOOD":
        return {
          bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50",
          dot: "bg-amber-500",
          label: "Preparing Food",
        };
      case "OUT_FOR_DELIVERY":
        return {
          bg: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50",
          dot: "bg-orange-500",
          label: "Out for Delivery",
        };
      case "DELIVERED":
        return {
          bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50",
          dot: "bg-emerald-500",
          label: "Delivered",
        };
      case "CANCELLED":
        return {
          bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50",
          dot: "bg-rose-500",
          label: "Cancelled",
        };
    }
  };

  const badge = getStatusBadge(order.status);

  return (
    <div className="w-full max-w-lg mt-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center text-sm shrink-0">
              🍔
            </span>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-tight">
              {order.restaurantName}
            </h4>
          </div>
          {order.restaurantAddress && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 pl-10">
              {order.restaurantAddress}
            </p>
          )}
          <p className="text-[11px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500 mt-1 pl-10">
            Order #{order.orderId} • {order.placedAt}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 inline-flex items-center gap-1.5 ${badge.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          <span>{badge.label}</span>
        </span>
      </div>

      {/* Real-time Delivery Status / ETA */}
      {order.estimatedDeliveryMinutes && (
        <div className="my-3.5 p-3.5 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
              🛵
            </span>
            <div>
              <p className="text-xs font-medium text-orange-900 dark:text-orange-200">
                Estimated Delivery
              </p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400 tabular-nums leading-tight">
                {order.estimatedDeliveryMinutes} mins
              </p>
            </div>
          </div>
          {order.deliveryPartnerName && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">Delivery Partner</p>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {order.deliveryPartnerName}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      <div className="mt-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Order Items
        </p>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm py-1 border-b border-zinc-100 dark:border-zinc-800/40 last:border-0"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center justify-center w-3.5 h-3.5 border rounded-xs shrink-0 ${
                  item.isVeg
                    ? "border-emerald-600 bg-white dark:bg-zinc-800"
                    : "border-rose-600 bg-white dark:bg-zinc-800"
                }`}
                title={item.isVeg ? "Veg" : "Non-Veg"}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isVeg ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                />
              </span>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                <span className="tabular-nums font-mono text-xs text-zinc-500 mr-1">{item.quantity}×</span> {item.name}
              </span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200 tabular-nums">
              ₹{item.price * item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* Total Amount */}
      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
        <span>Total Bill</span>
        <span className="text-orange-600 dark:text-orange-400 text-lg tabular-nums">
          ₹{order.totalAmount}
        </span>
      </div>
    </div>
  );
}

export default OrderStatusCard;

