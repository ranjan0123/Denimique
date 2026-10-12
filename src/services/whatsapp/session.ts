import WhatsAppSession, { IWhatsAppSession } from "../../models/WhatsAppSession";
import User from "../../models/user.model";

function normalizePhone(waPhone: string): string[] {
  const digits = waPhone.replace(/\D/g, "");
  const tenDigit = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return [waPhone, digits, tenDigit, `+91${tenDigit}`, `91${tenDigit}`, `0${tenDigit}`];
}

export async function getOrCreateSession(phoneNumber: string): Promise<IWhatsAppSession> {
  let session = await WhatsAppSession.findOne({ phoneNumber });

  if (!session) {
    const variants = normalizePhone(phoneNumber);
    const user = await User.findOne({ phone: { $in: variants } }).select("_id name").lean();

    session = await WhatsAppSession.create({
      phoneNumber,
      userId: user?._id,
      state: "idle",
      data: user ? { userName: user.name } : {},
    });
  }

  return session;
}

export async function updateSession(
  session: IWhatsAppSession,
  state: string,
  data: Record<string, any>,
): Promise<void> {
  session.state = state;
  session.data = data;
  session.lastActivity = new Date();
  await session.save();
}

export async function patchSessionData(
  session: IWhatsAppSession,
  patch: Record<string, any>,
): Promise<void> {
  session.data = { ...session.data, ...patch };
  session.lastActivity = new Date();
  await session.save();
}
