import User from "../../../models/user.model";
import Order from "../../../models/Order";
import WhatsAppSession from "../../../models/WhatsAppSession";
import { IWhatsAppSession } from "../../../models/WhatsAppSession";
import { NormalizedInput } from "../types";
import { sendButtons, sendText } from "../api";
import { updateSession } from "../session";
import { sendMainMenu } from "./main";
import { startLogin } from "./login";

export async function handleAccount(to: string, session: IWhatsAppSession): Promise<void> {
  if (!session.userId) {
    await sendText(
      to,
      `*My Account*\n━━━━━━━━━━━━━━━\n` +
        `Your WhatsApp is not linked to any Denimique account.\n\n` +
        `*Option 1 – Login with email OTP:*\nTap "Login" below and enter your registered email. We'll send a one-time code.\n\n` +
        `*Option 2 – Auto-link:*\nIf you registered at suitablevastra.com with this phone number, it's already linked. Try sending "hi" again.\n\n` +
        `*New here?* Register at *suitablevastra.com*`,
    );
    return sendButtons(
      to,
      "What would you like to do?",
      [
        { id: "acc_login", title: "Login with Email" },
        { id: "menu_shop", title: "Shop as Guest" },
        { id: "menu", title: "Main Menu" },
      ],
    );
  }

  const [user, orderCount] = await Promise.all([
    User.findById(session.userId).select("name email phone addresses createdAt").lean(),
    Order.countDocuments({ user: session.userId }),
  ]);

  if (!user) {
    await updateSession(session, "idle", {});
    return sendMainMenu(to, session);
  }

  const memberSince = new Date((user as any).createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  let msg =
    `👤 *My Account*\n━━━━━━━━━━━━━━━\n` +
    `Name: *${user.name}*\n` +
    `Email: ${user.email}\n` +
    `Phone: ${user.phone || "Not set"}\n` +
    `Addresses: ${user.addresses.length} saved\n` +
    `Total Orders: ${orderCount}\n` +
    `Member since: ${memberSince}`;

  await sendText(to, msg);
  await sendButtons(
    to,
    "Account options:",
    [
      { id: "acc_orders", title: "My Orders" },
      { id: "acc_logout", title: "Unlink Account" },
      { id: "menu", title: "Main Menu" },
    ],
  );

  await updateSession(session, "account", session.data);
}

export async function handleAccountAction(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  switch (input.value) {
    case "acc_login":
      return startLogin(to, session);
    case "acc_orders": {
      const { handleMyOrders } = await import("./orders");
      return handleMyOrders(to, session);
    }
    case "acc_logout":
      await WhatsAppSession.findByIdAndUpdate(session._id, {
        userId: undefined,
        state: "idle",
        data: {},
      });
      await sendText(
        to,
        "✅ Your Denimique account has been unlinked from this WhatsApp number.\n\nYou can still browse products and track orders by order number.",
      );
      // reload session state
      session.userId = undefined;
      session.state = "idle";
      session.data = {};
      return sendMainMenu(to, session);

    case "menu":
      return sendMainMenu(to, session);

    default:
      return handleAccount(to, session);
  }
}
