import Order from "../../../models/Order";
import Wishlist from "../../../models/Wishlist";
import { IWhatsAppSession } from "../../../models/WhatsAppSession";
import { NormalizedInput } from "../types";
import { sendButtons, sendList, sendText } from "../api";
import { patchSessionData, updateSession } from "../session";
import { sendMainMenu } from "./main";
import { promptLogin } from "./login";

const ORDERS_PER_PAGE = 5;

const STATUS_EMOJI: Record<string, string> = {
  placed: "🕐",
  confirmed: "✅",
  processing: "⚙️",
  shipped: "🚚",
  delivered: "📦",
  cancelled: "❌",
};

export async function handleTrackOrderInput(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  if (input.value === "back" || input.value === "menu") {
    return sendMainMenu(to, session);
  }

  const rawOrderNum = input.value.toUpperCase().trim();
  return showOrderTracking(to, session, rawOrderNum);
}

export async function showOrderTracking(
  to: string,
  session: IWhatsAppSession,
  orderNumber: string,
): Promise<void> {
  const order = await Order.findOne({
    orderNumber: { $regex: new RegExp(`^${orderNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    ...(session.userId ? { user: session.userId } : {}),
  }).lean();

  if (!order) {
    await sendButtons(
      to,
      `Order *${orderNumber}* not found.\n\nPlease check the order number and try again.`,
      [
        { id: "retry_track", title: "Try Again" },
        { id: "menu", title: "Main Menu" },
      ],
    );
    return updateSession(session, "track_input", session.data);
  }

  const statusEmoji = STATUS_EMOJI[order.orderStatus] || "📋";

  let msg =
    `📦 *Order ${order.orderNumber}*\n━━━━━━━━━━━━━━━\n` +
    `Status: ${statusEmoji} *${order.orderStatus.toUpperCase()}*\n` +
    `Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"} · ${order.paymentStatus}\n`;

  msg += `\n━━━━━━━━━━━━━━━\n`;
  msg += `Items: ${order.items.length} · Total: ₹${order.total}\n`;
  msg += `Deliver to: ${order.shippingAddress.city}, ${order.shippingAddress.state}`;

  await sendText(to, msg);
  await sendButtons(
    to,
    "What else can I help you with?",
    [
      { id: "menu_track", title: "Track Another" },
      { id: "menu_orders", title: "My Orders" },
      { id: "menu", title: "Main Menu" },
    ],
  );

  await updateSession(session, "main_menu", session.data);
}

export async function handleMyOrders(to: string, session: IWhatsAppSession): Promise<void> {
  if (!session.userId) {
    return promptLogin(to, session, "your order history");
  }

  const orders = await Order.find({ user: session.userId })
    .sort({ createdAt: -1 })
    .limit(ORDERS_PER_PAGE)
    .select("orderNumber orderStatus total createdAt")
    .lean();

  if (!orders.length) {
    await sendButtons(
      to,
      "You haven't placed any orders yet. Start shopping!",
      [
        { id: "menu_shop", title: "Shop Now" },
        { id: "menu", title: "Main Menu" },
      ],
    );
    return updateSession(session, "main_menu", session.data);
  }

  const rows = orders.map((o) => {
    const emoji = STATUS_EMOJI[o.orderStatus] || "📋";
    const date = new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return {
      id: `order_${o._id}`,
      title: `${o.orderNumber.substring(0, 20)}`,
      description: `${emoji} ${o.orderStatus} · ₹${o.total} · ${date}`.substring(0, 72),
    };
  });

  await sendList(
    to,
    "Tap an order to view details:",
    "View Orders",
    [{ title: `Recent Orders (${orders.length})`, rows }],
    "My Orders",
    'Reply "menu" to go back',
  );

  await updateSession(session, "my_orders", session.data);
}

export async function handleMyOrdersSelection(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  if (input.value === "menu" || input.value === "back") {
    return sendMainMenu(to, session);
  }

  if (input.value === "menu_shop") {
    const { handleBrowseCategories } = await import("./shop");
    return handleBrowseCategories(to, session);
  }

  if (input.value.startsWith("order_")) {
    const orderId = input.value.replace("order_", "");
    return showOrderDetail(to, session, orderId);
  }

  return handleMyOrders(to, session);
}

async function showOrderDetail(
  to: string,
  session: IWhatsAppSession,
  orderId: string,
): Promise<void> {
  const order = await Order.findById(orderId).lean();

  if (!order || (session.userId && order.user.toString() !== session.userId.toString())) {
    await sendText(to, "Order not found.");
    return handleMyOrders(to, session);
  }

  const statusEmoji = STATUS_EMOJI[order.orderStatus] || "📋";

  let msg =
    `📦 *${order.orderNumber}*\n━━━━━━━━━━━━━━━\n` +
    `Status: ${statusEmoji} *${order.orderStatus.toUpperCase()}*\n` +
    `Payment: ${order.paymentMethod === "cod" ? "COD" : "Online"} · ${order.paymentStatus}\n\n` +
    `*Items:*\n`;

  order.items.slice(0, 5).forEach((item: any) => {
    const v = item.variantLabel ? ` (${item.variantLabel})` : "";
    msg += `• ${item.name}${v} × ${item.quantity} = ₹${item.lineTotal}\n`;
  });
  if (order.items.length > 5) msg += `…and ${order.items.length - 5} more items\n`;

  msg += `\n━━━━━━━━━━━━━━━\n`;
  msg += `Subtotal: ₹${order.subtotal} | Shipping: ₹${order.shippingFee} | *Total: ₹${order.total}*\n`;
  msg += `Deliver to: ${order.shippingAddress.city}, ${order.shippingAddress.state}`;

  await sendText(to, msg);
  await sendButtons(
    to,
    "What would you like to do?",
    [
      { id: `track_${order.orderNumber}`, title: "Track Shipment" },
      { id: "menu_orders", title: "All Orders" },
      { id: "menu", title: "Main Menu" },
    ],
  );

  await updateSession(session, "view_order", { ...session.data, viewingOrderId: orderId, viewingOrderNumber: order.orderNumber });
}

export async function handleViewOrderAction(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  if (input.value === "menu_orders") return handleMyOrders(to, session);
  if (input.value === "menu") return sendMainMenu(to, session);

  if (input.value.startsWith("track_")) {
    const orderNumber = input.value.replace("track_", "");
    return showOrderTracking(to, session, orderNumber);
  }

  return handleMyOrders(to, session);
}

export async function handleWishlist(to: string, session: IWhatsAppSession): Promise<void> {
  if (!session.userId) {
    return promptLogin(to, session, "your wishlist");
  }

  const wishlist = await Wishlist.findOne({ user: session.userId }).lean();

  if (!wishlist || wishlist.items.length === 0) {
    await sendButtons(
      to,
      "Your wishlist is empty. Browse products and save your favourites!",
      [
        { id: "menu_shop", title: "Shop Now" },
        { id: "menu", title: "Main Menu" },
      ],
    );
    return updateSession(session, "main_menu", session.data);
  }

  let msg = `❤️ *My Wishlist* (${wishlist.items.length} item${wishlist.items.length > 1 ? "s" : ""})\n━━━━━━━━━━━━━━━\n`;
  wishlist.items.slice(0, 10).forEach((item: any, i: number) => {
    msg += `${i + 1}. ${item.name}${item.flavor ? ` · ${item.flavor}` : ""}\n`;
  });
  if (wishlist.items.length > 10) msg += `…and ${wishlist.items.length - 10} more\n`;
  msg += `\nVisit *suitablevastra.com/wishlist* to manage your wishlist or add items to cart.`;

  await sendText(to, msg);
  await sendButtons(
    to,
    "What would you like to do?",
    [
      { id: "menu_shop", title: "Shop Now" },
      { id: "menu", title: "Main Menu" },
    ],
  );

  await updateSession(session, "main_menu", session.data);
}
