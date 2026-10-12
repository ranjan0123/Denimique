import crypto from "crypto";
import https from "https";
import { CheckoutError } from "./checkout";

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";
const RAZORPAY_REQUEST_TIMEOUT_MS = 15_000;

const getRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new CheckoutError("Razorpay credentials are missing", 500);
  }

  return { keyId, keySecret };
};

export const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const toPaise = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new CheckoutError("Order total must be greater than 0");
  }

  return Math.round(amount * 100);
};

export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
  notes,
}: {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> => {
  const { keyId, keySecret } = getRazorpayCredentials();

  const payload = JSON.stringify({
    amount: toPaise(amount),
    currency,
    receipt,
    notes,
  });

  return new Promise((resolve, reject) => {
    const request = https.request(
      `${RAZORPAY_API_BASE}/orders`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += chunk.toString();
        });

        response.on("end", () => {
          const statusCode = response.statusCode || 500;

          try {
            const parsedBody = JSON.parse(body);

            if (statusCode >= 400) {
              const description =
                parsedBody?.error?.description || "Failed to create Razorpay order";
              return reject(new CheckoutError(description, statusCode));
            }

            resolve(parsedBody);
          } catch {
            reject(new CheckoutError("Invalid response received from Razorpay", 502));
          }
        });
      },
    );

    request.on("error", () => {
      reject(new CheckoutError("Unable to connect to Razorpay", 502));
    });

    // Without this, a connection that hangs mid-response (accepted but never
    // completes) never fires "error" and leaves the request awaiting forever.
    request.setTimeout(RAZORPAY_REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("Razorpay request timed out"));
      reject(new CheckoutError("Razorpay is not responding. Please try again.", 504));
    });

    request.write(payload);
    request.end();
  });
};

export const verifyRazorpaySignature = ({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) => {
  const { keySecret } = getRazorpayCredentials();
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
};
