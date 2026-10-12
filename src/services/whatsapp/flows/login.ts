import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../../../models/user.model";
import WhatsAppSession, { IWhatsAppSession } from "../../../models/WhatsAppSession";
import { NormalizedInput } from "../types";
import { sendButtons, sendText } from "../api";
import { updateSession } from "../session";
import { sendMainMenu } from "./main";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  const masked = user.length <= 2 ? user[0] + "*" : user[0] + "*".repeat(user.length - 2) + user[user.length - 1];
  return `${masked}@${domain}`;
}

async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_SERVER,
    port: Number(process.env.BREVO_SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Denimique WhatsApp Login Code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#102B50">Denimique WhatsApp Login</h2>
        <p>Use this code to log in to your Denimique account on WhatsApp:</p>
        <div style="background:#f4f4f4;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#102B50">${otp}</span>
        </div>
        <p style="color:#555">This code expires in <strong>10 minutes</strong>.</p>
        <p style="font-size:12px;color:#999">If you didn't request this, someone may have typed your email on WhatsApp. You can ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Soft login gate — shown when a guest tries to access a protected feature.
 * Gives them options to login OR continue as guest (browse/track).
 */
export async function promptLogin(
  to: string,
  session: IWhatsAppSession,
  featureLabel = "this feature",
): Promise<void> {
  await sendButtons(
    to,
    `*Login required*\n\nTo use ${featureLabel} you need to be logged in.\n\nYou can still browse products, view deals, and track orders without logging in.`,
    [
      { id: "do_login", title: "Login with Email" },
      { id: "menu_shop", title: "Browse Products" },
      { id: "menu", title: "Main Menu" },
    ],
  );
  // Keep current state so the next message is handled correctly
  await updateSession(session, "login_gate", { ...session.data, gateFeature: featureLabel });
}

export async function handleLoginGate(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  switch (input.value) {
    case "do_login":
      return startLogin(to, session);
    case "menu_shop": {
      const { handleBrowseCategories } = await import("./shop");
      return handleBrowseCategories(to, session);
    }
    default:
      return sendMainMenu(to, session);
  }
}

export async function startLogin(to: string, session: IWhatsAppSession): Promise<void> {
  if (session.userId) {
    await sendText(to, "You're already logged in! Type *menu* to continue.");
    return;
  }

  await sendText(
    to,
    `*Login to Denimique*\n━━━━━━━━━━━━━━━\nEnter your registered *email address* and we'll send you a one-time login code:\n\n_Don't have an account? Register on our website._`,
  );

  await updateSession(session, "login_email", session.data);
}

export async function handleLoginEmail(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  if (input.value === "cancel" || input.value === "menu") {
    return sendMainMenu(to, session);
  }

  const email = input.value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    await sendText(to, "That doesn't look like a valid email. Please enter your registered email address:");
    return;
  }

  const user = await User.findOne({ email }).select("_id name email isVerified").lean();

  if (!user) {
    await sendButtons(
      to,
      `No account found for *${email}*.\n\nPlease check the email or register on our website.`,
      [
        { id: "retry_email", title: "Try Another Email" },
        { id: "menu", title: "Main Menu" },
      ],
    );
    return;
  }

  // Check cooldown (prevent OTP spam)
  const lastOtpSent = session.data.otpSentAt as number | undefined;
  if (lastOtpSent && Date.now() - lastOtpSent < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastOtpSent)) / 1000);
    await sendText(to, `Please wait ${wait} seconds before requesting a new code.`);
    return;
  }

  const otp = generateOtp();
  const expiry = Date.now() + OTP_EXPIRY_MS;

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error("[WhatsApp Login] OTP email failed:", err);
    await sendText(
      to,
      "Failed to send the login code. Please try again or contact support.",
    );
    return;
  }

  await updateSession(session, "login_otp", {
    ...session.data,
    otpEmail: email,
    otpUserId: user._id.toString(),
    otpUserName: user.name,
    otpCode: otp,
    otpExpiry: expiry,
    otpAttempts: 0,
    otpSentAt: Date.now(),
  });

  await sendButtons(
    to,
    `✉️ A 6-digit login code was sent to *${maskEmail(email)}*\n\nEnter the code below (expires in 10 minutes):`,
    [
      { id: "resend_otp", title: "Resend Code" },
      { id: "menu", title: "Cancel" },
    ],
  );
}

export async function handleLoginOtp(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  if (input.value === "menu" || input.value === "cancel") {
    return sendMainMenu(to, session);
  }

  if (input.value === "resend_otp") {
    // Re-enter the email step with the stored email pre-filled
    const storedEmail = session.data.otpEmail as string;
    if (!storedEmail) return startLogin(to, session);

    // Re-use the stored email by simulating the email step
    const fakeInput: NormalizedInput = { type: "text", value: storedEmail };
    await updateSession(session, "login_email", { ...session.data, otpSentAt: undefined });
    return handleLoginEmail(to, session, fakeInput);
  }

  const { otpCode, otpExpiry, otpAttempts = 0, otpUserId, otpUserName, otpEmail } = session.data;

  if (!otpCode || !otpUserId) {
    await sendText(to, "Session expired. Please start the login again.");
    return startLogin(to, session);
  }

  // Expired
  if (Date.now() > otpExpiry) {
    await sendButtons(
      to,
      "This login code has expired (10 minute limit). Please request a new one.",
      [
        { id: "resend_otp", title: "Get New Code" },
        { id: "menu", title: "Cancel" },
      ],
    );
    return;
  }

  const entered = input.value.trim().replace(/\s/g, "");

  // Too many attempts
  if (otpAttempts >= MAX_ATTEMPTS) {
    await sendButtons(
      to,
      `Too many incorrect attempts. Please request a new login code.`,
      [
        { id: "resend_otp", title: "Get New Code" },
        { id: "menu", title: "Cancel" },
      ],
    );
    return;
  }

  if (entered !== otpCode) {
    const remaining = MAX_ATTEMPTS - otpAttempts - 1;
    await session.updateOne({ "data.otpAttempts": otpAttempts + 1 });
    session.data.otpAttempts = otpAttempts + 1;

    if (remaining === 0) {
      await sendButtons(
        to,
        "Incorrect code. No more attempts — please request a new code.",
        [
          { id: "resend_otp", title: "Get New Code" },
          { id: "menu", title: "Cancel" },
        ],
      );
    } else {
      await sendText(to, `Incorrect code. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining:`);
    }
    return;
  }

  // ✅ OTP correct — link the account
  await WhatsAppSession.findByIdAndUpdate(session._id, {
    userId: otpUserId,
    state: "main_menu",
    "data.userName": otpUserName,
    "data.otpCode": undefined,
    "data.otpExpiry": undefined,
    "data.otpAttempts": undefined,
    "data.otpEmail": undefined,
    "data.otpUserId": undefined,
    "data.otpSentAt": undefined,
  });

  // Also update phone on the user account for future auto-linking
  await User.findByIdAndUpdate(otpUserId, {
    $set: { phone: to.startsWith("91") ? `+${to}` : `+91${to}` },
  });

  session.userId = otpUserId as any;
  session.state = "main_menu";
  session.data = { userName: otpUserName };

  await sendText(to, `✅ *Logged in as ${otpUserName}!*\n\nYour WhatsApp is now linked to your Denimique account.`);
  return sendMainMenu(to, session, true);
}
