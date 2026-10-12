import Cart from "../../../models/Cart";
import Order from "../../../models/Order";
import User from "../../../models/user.model";
import Settings from "../../../models/Settings";
import { IWhatsAppSession } from "../../../models/WhatsAppSession";
import { NormalizedInput } from "../types";
import { sendButtons, sendList, sendText } from "../api";
import { patchSessionData, updateSession } from "../session";
import { sendMainMenu } from "./main";
import { promptLogin } from "./login";
import { computePackageDetails } from "../../../utils/packing";
import { createNotification } from "../../../utils/notifications";
import { createRazorpayPaymentLink } from "../../../utils/razorpayLink";

export async function handleCart(to: string, session: IWhatsAppSession): Promise<void> {
  if (!session.userId) {
    return promptLogin(to, session, "your cart & checkout");
  }

  const cart = await Cart.findOne({ user: session.userId }).lean();

  if (!cart || cart.items.length === 0) {
    await sendButtons(
      to,
      "Your cart is empty! Browse our products and add something you'll love.",
      [
        { id: "menu_shop", title: "Shop Now" },
        { id: "menu", title: "Main Menu" },
      ],
    );
    return updateSession(session, "cart", session.data);
  }

  let cartText = `🛒 *Your Cart* (${cart.items.length} item${cart.items.length > 1 ? "s" : ""})\n━━━━━━━━━━━━━━━\n`;
  cart.items.forEach((item: any, i: number) => {
    const v = item.variantLabel ? ` (${item.variantLabel})` : "";
    cartText += `${i + 1}. ${item.name}${v}\n   ${item.quantity} × ₹${item.unitPrice} = *₹${item.lineTotal}*\n`;
  });
  cartText += `━━━━━━━━━━━━━━━\n*Subtotal: ₹${cart.subtotal}*\n\n_Type "remove 1" to remove item 1_`;

  await sendText(to, cartText);
  await sendButtons(
    to,
    "Ready to order?",
    [
      { id: "checkout", title: "Proceed to Checkout" },
      { id: "clear_cart", title: "Clear Cart" },
      { id: "menu_shop", title: "Continue Shopping" },
    ],
  );

  await updateSession(session, "cart", session.data);
}

export async function handleCartActions(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  switch (input.value) {
    case "checkout":
      return handleCheckoutAddress(to, session);
    case "clear_cart":
      await Cart.findOneAndUpdate({ user: session.userId }, { items: [], subtotal: 0 });
      await sendText(to, "🗑️ Cart cleared!");
      return sendMainMenu(to, session);
    case "menu_shop": {
      const { handleBrowseCategories } = await import("./shop");
      return handleBrowseCategories(to, session);
    }
    case "menu":
      return sendMainMenu(to, session);
  }

  const removeMatch = input.value.match(/^remove\s+(\d+)$/i);
  if (removeMatch) {
    const idx = parseInt(removeMatch[1]) - 1;
    const cart = await Cart.findOne({ user: session.userId });
    if (cart && idx >= 0 && idx < cart.items.length) {
      const removedName = (cart.items[idx] as any).name;
      cart.items.splice(idx, 1);
      (cart as any).subtotal = (cart.items as any[]).reduce((s: number, i: any) => s + i.lineTotal, 0);
      await cart.save();
      await sendText(to, `✅ *${removedName}* removed from cart.`);
      return handleCart(to, session);
    }
    await sendText(to, "Invalid item number. Please try again.");
    return handleCart(to, session);
  }

  return handleCart(to, session);
}

async function handleCheckoutAddress(to: string, session: IWhatsAppSession): Promise<void> {
  if (!session.userId) return sendMainMenu(to, session);

  const user = await User.findById(session.userId).select("addresses").lean();
  if (!user) return sendMainMenu(to, session);

  if (!user.addresses || user.addresses.length === 0) {
    await sendText(
      to,
      "You don't have any saved addresses. Let's add one!\n\nPlease enter your *Full Name*:",
    );
    return updateSession(session, "checkout_new_addr", {
      ...session.data,
      newAddrStep: "name",
      newAddress: {},
    });
  }

  const rows = (user.addresses as any[]).map((addr: any, i: number) => ({
    id: `addr_${addr._id}`,
    title: (addr.label || `Address ${i + 1}`).substring(0, 24),
    description: `${addr.line1}, ${addr.city} – ${addr.postalCode}`.substring(0, 72),
  }));

  rows.push({ id: "addr_new", title: "Add New Address", description: "Enter a new delivery address" });

  await sendList(
    to,
    "Where should we deliver?",
    "Pick Address",
    [{ title: "Your Saved Addresses", rows }],
    "Delivery Address",
  );

  await updateSession(session, "checkout_addr", session.data);
}

export async function handleAddressSelection(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  if (input.value === "addr_new" || input.value === "new") {
    await sendText(to, "Let's add a new address!\n\nEnter your *Full Name*:");
    return updateSession(session, "checkout_new_addr", {
      ...session.data,
      newAddrStep: "name",
      newAddress: {},
    });
  }

  if (input.value.startsWith("addr_")) {
    const addressId = input.value.replace("addr_", "");
    await patchSessionData(session, { addressId });
    return showPaymentOptions(to, session, addressId);
  }

  return handleCheckoutAddress(to, session);
}

const ADDR_STEPS = [
  { key: "name", field: "fullName", prompt: "Enter your *Phone Number*:" },
  { key: "phone", field: "phone", prompt: "Enter your *Street Address* (house no, street):" },
  { key: "line1", field: "line1", prompt: "Enter your *City*:" },
  { key: "city", field: "city", prompt: "Enter your *State*:" },
  { key: "state", field: "state", prompt: "Enter your *PIN Code*:" },
  { key: "pin", field: "postalCode", prompt: "" },
];

export async function handleNewAddressEntry(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  const { newAddrStep = "name", newAddress = {} } = session.data;
  const value = input.value.trim();

  const currentStepIdx = ADDR_STEPS.findIndex((s) => s.key === newAddrStep);
  if (currentStepIdx === -1) return handleCheckoutAddress(to, session);

  const currentStep = ADDR_STEPS[currentStepIdx];
  newAddress[currentStep.field] = value;

  if (currentStepIdx < ADDR_STEPS.length - 1) {
    const nextStep = ADDR_STEPS[currentStepIdx + 1];
    await sendText(to, nextStep.prompt);
    return updateSession(session, "checkout_new_addr", {
      ...session.data,
      newAddrStep: nextStep.key,
      newAddress,
    });
  }

  // All steps done – save address
  const user = await User.findById(session.userId);
  if (!user) return sendMainMenu(to, session);

  const addrToSave: any = {
    fullName: newAddress.fullName,
    phone: newAddress.phone,
    line1: newAddress.line1,
    city: newAddress.city,
    state: newAddress.state,
    postalCode: newAddress.postalCode,
    country: "India",
    isDefault: user.addresses.length === 0,
  };

  user.addresses.push(addrToSave);
  await user.save();

  const saved = user.addresses[user.addresses.length - 1] as any;
  await sendText(
    to,
    `✅ Address saved!\n${saved.line1}, ${saved.city}, ${saved.state} – ${saved.postalCode}`,
  );

  return showPaymentOptions(to, session, saved._id.toString());
}

async function showPaymentOptions(
  to: string,
  session: IWhatsAppSession,
  addressId: string,
): Promise<void> {
  const cart = await Cart.findOne({ user: session.userId }).lean();
  if (!cart || cart.items.length === 0) {
    await sendText(to, "Your cart is empty.");
    return sendMainMenu(to, session);
  }

  const settings = await Settings.findOne().lean();
  let shippingFee = 49;

  if (settings?.freeShippingEnabled && cart.subtotal >= (settings.freeShippingMinAmount || 0)) {
    shippingFee = 0;
  }

  const total = cart.subtotal + shippingFee;

  const summary =
    `*Order Summary*\n━━━━━━━━━━━━━━━\n` +
    `Items: ₹${cart.subtotal}\n` +
    `Shipping: ${shippingFee === 0 ? "FREE 🎉" : `₹${shippingFee}`}\n` +
    `━━━━━━━━━━━━━━━\n*Total: ₹${total}*`;

  await sendText(to, summary);

  await updateSession(session, "checkout_pay", {
    ...session.data,
    addressId,
    shippingFee,
    orderTotal: total,
  });

  const codEnabled = settings?.codEnabled !== false;
  const buttons: Array<{ id: string; title: string }> = [
    { id: "pay_online", title: "Pay Online" },
    { id: "go_back", title: "Change Address" },
  ];
  if (codEnabled) {
    buttons.unshift({ id: "pay_cod", title: "Cash on Delivery" });
  }

  await sendButtons(to, "Choose your payment method:", buttons.slice(0, 3));
}

export async function handlePaymentAction(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  switch (input.value) {
    case "go_back":
      return handleCheckoutAddress(to, session);
    case "pay_cod":
      return placeOrder(to, session, "cod");
    case "pay_online":
      return placeOrder(to, session, "online");
    default:
      await sendText(to, "Please select a payment method using the buttons above.");
  }
}

async function placeOrder(
  to: string,
  session: IWhatsAppSession,
  paymentMethod: "cod" | "online",
): Promise<void> {
  const { addressId, shippingFee = 49, orderTotal } = session.data;

  const [user, cart] = await Promise.all([
    User.findById(session.userId).lean(),
    Cart.findOne({ user: session.userId }).lean(),
  ]);

  if (!user || !cart || cart.items.length === 0) {
    await sendText(to, "Unable to place order. Please try again.");
    return sendMainMenu(to, session);
  }

  const address = (user.addresses as any[]).find(
    (a: any) => a._id.toString() === addressId,
  );
  if (!address) {
    await sendText(to, "Address not found. Please select again.");
    return handleCheckoutAddress(to, session);
  }

  const orderNumber = `ORD-${Date.now()}`;

  const defaults = {
    weight: parseFloat(process.env.DEFAULT_WEIGHT_KG || "0.5"),
    length: parseFloat(process.env.DEFAULT_LENGTH_CM || "15"),
    breadth: parseFloat(process.env.DEFAULT_BREADTH_CM || "10"),
    height: parseFloat(process.env.DEFAULT_HEIGHT_CM || "5"),
  };

  const packageDetails = computePackageDetails(
    (cart.items as any[]).map((item: any) => ({ quantity: item.quantity })),
    defaults,
  );

  const total = orderTotal || cart.subtotal + shippingFee;

  const order = await Order.create({
    orderNumber,
    user: session.userId,
    items: (cart.items as any[]).map((item: any) => ({
      product: item.product,
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      image: item.image,
      flavor: item.flavor,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    shippingAddress: {
      fullName: address.fullName,
      email: user.email,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || "India",
    },
    subtotal: cart.subtotal,
    discount: 0,
    shippingFee,
    total,
    paymentMethod,
    paymentStatus: "pending",
    packageDetails,
    orderStatus: "placed",
    placedAt: new Date(),
  });

  await Cart.findOneAndUpdate({ user: session.userId }, { items: [], subtotal: 0 });

  await createNotification({
    userId: session.userId!,
    orderId: order._id,
    type: "order_created",
    title: "Order Placed",
    message: `Your order ${orderNumber} has been placed successfully.`,
  });

  if (paymentMethod === "cod") {
    await sendText(
      to,
      `✅ *Order Placed Successfully!*\n\n` +
        `📦 Order: *${orderNumber}*\n` +
        `💳 Payment: Cash on Delivery\n` +
        `📍 Deliver to: ${address.city}, ${address.state}\n\n` +
        `You'll receive shipping updates on WhatsApp. Track anytime: reply *"track ${orderNumber}"*`,
    );
  } else {
    let paymentMsg = `✅ *Order Created!*\n\n📦 Order: *${orderNumber}*\n\n`;
    try {
      const link = await createRazorpayPaymentLink({
        amount: total,
        orderNumber,
        customerName: user.name,
        customerPhone: `+${to}`,
        customerEmail: user.email,
      });
      paymentMsg += `💳 Complete your payment:\n${link}\n\n_Link expires in 1 hour._`;
    } catch {
      paymentMsg += `💳 Please complete payment at:\n*suitablevastra.com/orders*\n\nOrder will be confirmed after payment.`;
    }
    await sendText(to, paymentMsg);
  }

  await sendButtons(
    to,
    "What would you like to do next?",
    [
      { id: "menu_shop", title: "Shop More" },
      { id: "menu_orders", title: "My Orders" },
      { id: "menu", title: "Main Menu" },
    ],
  );

  await updateSession(session, "main_menu", { userName: session.data.userName });
}
