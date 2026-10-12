import { IWhatsAppSession } from "../../../models/WhatsAppSession";
import { NormalizedInput } from "../types";
import { sendList, sendText } from "../api";
import { updateSession } from "../session";

const GREETINGS = new Set([
  "hi", "hello", "hey", "start", "menu", "home", "help",
  "denimique", "suitablevastra", "namaste", "hii", "helo", "hola", "hai",
]);

export function isGreeting(text: string): boolean {
  return GREETINGS.has(text.toLowerCase().trim());
}

export async function sendMainMenu(
  to: string,
  session: IWhatsAppSession,
  isFirst = false,
): Promise<void> {
  const name = session.data.userName as string | undefined;
  const header = isFirst
    ? `Welcome to Denimique${name ? `, ${name}` : ""}!`
    : "Denimique – Main Menu";
  const body = isFirst
    ? "Explore denim and lifestyle fashion, track orders, or get help. How can we help today?"
    : "What would you like to do?";

  await sendList(
    to,
    body,
    "Choose Option",
    [
      {
        title: "Quick Actions",
        rows: [
          { id: "menu_shop", title: "Shop Now", description: "Browse & buy products" },
          { id: "menu_track", title: "Track Order", description: "Check your order status" },
          { id: "menu_orders", title: "My Orders", description: "View your order history" },
          { id: "menu_wishlist", title: "My Wishlist", description: "View saved products" },
          { id: "menu_support", title: "Support & FAQs", description: "Get help" },
          { id: "menu_account", title: "My Account", description: "Profile & settings" },
        ],
      },
    ],
    header,
    'Reply "menu" anytime to return here',
  );

  await updateSession(session, "main_menu", session.data);
}

export async function handleMainMenuInput(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  if (input.type === "text" && isGreeting(input.value)) {
    return sendMainMenu(to, session, true);
  }

  switch (input.value) {
    case "menu_shop":
    case "1": {
      const { handleBrowseCategories } = await import("./shop");
      return handleBrowseCategories(to, session);
    }
    case "menu_track":
    case "2":
      await sendText(to, "Please enter your *Order Number*:\n(e.g. ORD-20241234567)");
      return updateSession(session, "track_input", session.data);

    case "menu_orders":
    case "3": {
      const { handleMyOrders } = await import("./orders");
      return handleMyOrders(to, session);
    }
    case "menu_wishlist":
    case "4": {
      const { handleWishlist } = await import("./orders");
      return handleWishlist(to, session);
    }
    case "menu_support":
    case "5": {
      const { handleSupport } = await import("./support");
      return handleSupport(to, session);
    }
    case "menu_account":
    case "6": {
      const { handleAccount } = await import("./account");
      return handleAccount(to, session);
    }
    default:
      return sendMainMenu(to, session);
  }
}
