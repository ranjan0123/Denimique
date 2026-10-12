import { NormalizedInput, WhatsAppMessage } from "./types";
import { markAsRead, sendText } from "./api";
import { getOrCreateSession, updateSession } from "./session";
import { isGreeting, sendMainMenu, handleMainMenuInput } from "./flows/main";
import { handleBrowseCategories, handleBrowseProducts, handleProductInteraction, handleCategorySelected } from "./flows/shop";
import { handleCart, handleCartActions, handleAddressSelection, handleNewAddressEntry, handlePaymentAction } from "./flows/cart";
import { handleMyOrders, handleMyOrdersSelection, handleViewOrderAction, handleWishlist, handleTrackOrderInput, showOrderTracking } from "./flows/orders";
import { handleSupport, handleSupportSelection } from "./flows/support";
import { handleAccount, handleAccountAction } from "./flows/account";
import { startLogin, handleLoginEmail, handleLoginOtp, handleLoginGate } from "./flows/login";

export function extractInput(message: WhatsAppMessage): NormalizedInput {
  if (message.type === "text" && message.text?.body) {
    return { type: "text", value: message.text.body.trim().toLowerCase() };
  }
  if (message.type === "interactive") {
    if (message.interactive?.type === "list_reply" && message.interactive.list_reply?.id) {
      return { type: "list", value: message.interactive.list_reply.id };
    }
    if (message.interactive?.type === "button_reply" && message.interactive.button_reply?.id) {
      return { type: "button", value: message.interactive.button_reply.id };
    }
  }
  return { type: "unsupported", value: "" };
}

export async function processMessage(message: WhatsAppMessage): Promise<void> {
  const from = message.from;

  await markAsRead(message.id).catch(() => {});

  const session = await getOrCreateSession(from);
  const input = extractInput(message);

  if (input.type === "unsupported") {
    await sendText(
      from,
      "I can only process text messages and menu selections.\n\nReply *menu* to see all options.",
    );
    return;
  }

  // Global shortcut: "menu" or "home" always resets to main menu
  if (input.type === "text" && (input.value === "menu" || input.value === "home")) {
    return sendMainMenu(from, session);
  }

  // Global shortcut: "login" triggers OTP login from any state
  if (input.type === "text" && (input.value === "login" || input.value === "link account")) {
    return startLogin(from, session);
  }

  // Global shortcut: "track ORD-xxx" works from any state
  if (input.type === "text" && input.value.startsWith("track ")) {
    const orderNumber = input.value.replace(/^track\s+/i, "").toUpperCase().trim();
    if (orderNumber) return showOrderTracking(from, session, orderNumber);
  }

  try {
    switch (session.state) {
      case "idle":
      case "main_menu":
        if (input.type === "text" && isGreeting(input.value)) {
          return sendMainMenu(from, session, true);
        }
        return handleMainMenuInput(from, session, input);

      case "browse_cats":
        if (input.value.startsWith("cat_")) {
          return handleCategorySelected(from, session, input.value.replace("cat_", ""));
        }
        if (input.type === "text" && (input.value === "back" || isGreeting(input.value))) {
          return sendMainMenu(from, session);
        }
        return handleBrowseCategories(from, session);

      case "browse_prods":
        return handleBrowseProducts(from, session, input);

      case "view_product":
        return handleProductInteraction(from, session, input);

      case "cart":
        return handleCartActions(from, session, input);

      case "checkout_addr":
        return handleAddressSelection(from, session, input);

      case "checkout_new_addr":
        if (input.type === "text") return handleNewAddressEntry(from, session, input);
        return;

      case "checkout_pay":
        return handlePaymentAction(from, session, input);

      case "track_input":
        if (input.value === "retry_track") {
          await sendText(from, "Please enter your *Order Number*:");
          return;
        }
        return handleTrackOrderInput(from, session, input);

      case "my_orders":
        return handleMyOrdersSelection(from, session, input);

      case "view_order":
        return handleViewOrderAction(from, session, input);

      case "support":
        return handleSupportSelection(from, session, input);

      case "account":
        return handleAccountAction(from, session, input);

      case "login_gate":
        return handleLoginGate(from, session, input);

      case "login_email":
        if (input.type === "text") return handleLoginEmail(from, session, input);
        if (input.value === "retry_email") return startLogin(from, session);
        return;

      case "login_otp":
        return handleLoginOtp(from, session, input);

      default:
        return sendMainMenu(from, session);
    }
  } catch (err) {
    console.error("[WhatsApp] Flow error:", err);
    await sendText(
      from,
      "Oops! Something went wrong on our end. Please try again.\n\nReply *menu* to start over.",
    );
    await updateSession(session, "main_menu", { userName: session.data.userName });
  }
}
