import https from "https";

interface CreatePaymentLinkOptions {
  amount: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export async function createRazorpayPaymentLink(options: CreatePaymentLinkOptions): Promise<string> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  const frontendUrl = process.env.FRONTEND_URL || "https://suitablevastra.com";

  const payload = JSON.stringify({
    amount: Math.round(options.amount * 100),
    currency: "INR",
    accept_partial: false,
    description: `Denimique Order ${options.orderNumber}`,
    reference_id: options.orderNumber,
    customer: {
      name: options.customerName,
      contact: options.customerPhone,
      email: options.customerEmail,
    },
    notify: { sms: false, email: false },
    reminder_enable: false,
    expire_by: Math.floor(Date.now() / 1000) + 3600,
    callback_url: `${frontendUrl}/order-success?order=${options.orderNumber}`,
    callback_method: "get",
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.razorpay.com",
        path: "/v1/payment_links",
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if ((res.statusCode || 500) >= 400) {
              reject(new Error(parsed?.error?.description || "Payment link creation failed"));
            } else {
              resolve(parsed.short_url || `https://rzp.io/${parsed.id}`);
            }
          } catch {
            reject(new Error("Invalid Razorpay response"));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}
