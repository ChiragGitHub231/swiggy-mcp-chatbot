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
          bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
          label: "Order Confirmed",
        };
      case "PREPARING_FOOD":
        return {
          bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
          label: "Preparing Food",
        };
      case "OUT_FOR_DELIVERY":
        return {
          bg: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
          label: "Out for Delivery",
        };
      case "DELIVERED":
        return {
          bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
          label: "Delivered",
        };
      case "CANCELLED":
        return {
          bg: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
          label: "Cancelled",
        };
    }
  };

  const badge = getStatusBadge(order.status);

  return (
    <div className="w-full max-w-lg mt-3 rounded-2xl border border-orange-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍔</span>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
              {order.restaurantName}
            </h4>
          </div>
          {order.restaurantAddress && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {order.restaurantAddress}
            </p>
          )}
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Order #{order.orderId} • Placed at {order.placedAt}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 ${badge.bg}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Real-time Delivery Status / ETA */}
      {order.estimatedDeliveryMinutes && (
        <div className="my-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛵</span>
            <div>
              <p className="text-xs font-medium text-orange-900 dark:text-orange-200">
                Estimated Delivery
              </p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {order.estimatedDeliveryMinutes} mins
              </p>
            </div>
          </div>
          {order.deliveryPartnerName && (
            <div className="text-right">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Partner</p>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {order.deliveryPartnerName}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Order Items
        </p>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm py-1 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-sm border ${
                  item.isVeg
                    ? "border-green-600 bg-green-500"
                    : "border-red-600 bg-red-500"
                }`}
                title={item.isVeg ? "Veg" : "Non-Veg"}
              />
              <span className="text-zinc-700 dark:text-zinc-300">
                {item.quantity} × {item.name}
              </span>
            </div>
            <span className="font-medium text-zinc-900 dark:text-zinc-200">
              ₹{item.price * item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* Total Amount */}
      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
        <span>Total Bill</span>
        <span className="text-orange-600 dark:text-orange-400 text-base">
          ₹{order.totalAmount}
        </span>
      </div>
    </div>
  );
}

export default OrderStatusCard;

