import nodemailer from "nodemailer";

// SMTP creds are optional in local/dev setups — without them nodemailer
// throws on every send, which otherwise turns into a 500 on flows like
// signup that call sendVerificationEmail inline.
export const isEmailConfigured = () =>
  Boolean(
    process.env.BREVO_SMTP_SERVER &&
      process.env.BREVO_SMTP_PORT &&
      process.env.BREVO_SMTP_USER &&
      process.env.BREVO_SMTP_PASS,
  );

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_SERVER,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  // Defaults allow up to a 10-minute socket timeout, which is far too long
  // for a call sitting inline in the order-creation response path.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

export const sendVerificationEmail = async (email: string, token: string) => {

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your email - Denimique",
    html: `
      <div style="font-family:sans-serif">
        <h2>Welcome to Denimique</h2>

        <p>Please verify your email to activate your account.</p>

        <a href="${verificationUrl}"
        style="
          display:inline-block;
          background:#1F3D2B;
          color:white;
          padding:12px 20px;
          border-radius:6px;
          text-decoration:none;
        ">
          Verify Email
        </a>

        <p style="margin-top:20px;font-size:12px;color:#666">
          If you didn't create this account, ignore this email.
        </p>

      </div>
    `,
  });
};

interface ContactFormEmailDetails {
  name: string;
  email: string;
  message: string;
  sourceUrl?: string;
}

export const sendContactFormEmail = async (submission: ContactFormEmailDetails) => {
  const recipients = (process.env.CONTACT_NOTIFY_EMAIL || "care@denimique.com")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipients,
    replyTo: submission.email,
    subject: `New Contact Form Enquiry${submission.name ? ` from ${submission.name}` : ""}`,
    html: `
      <div style="font-family:sans-serif;color:#222;max-width:640px;margin:0 auto;">
        <h2 style="color:#7A3511;">New Contact Form Enquiry</h2>
        <p>Someone just submitted the contact form on Denimique.</p>

        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr>
            <td style="padding:6px 0;font-weight:bold;width:120px;">Name:</td>
            <td style="padding:6px 0;">${submission.name || "-"}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:bold;">Email:</td>
            <td style="padding:6px 0;"><a href="mailto:${submission.email}">${submission.email}</a></td>
          </tr>
          ${
            submission.sourceUrl
              ? `<tr>
                  <td style="padding:6px 0;font-weight:bold;">Page:</td>
                  <td style="padding:6px 0;">${submission.sourceUrl}</td>
                </tr>`
              : ""
          }
        </table>

        <h3 style="margin-top:20px;color:#7A3511;">Message</h3>
        <p style="white-space:pre-wrap;line-height:1.6;">${submission.message}</p>

        <p style="margin-top:24px;font-size:12px;color:#666">
          This is an automated notification from the Denimique contact form. Reply directly to this email to respond to ${submission.name || "the sender"}.
        </p>
      </div>
    `,
  });
};

interface OrderEmailItem {
  name: string;
  variantLabel?: string;
  flavor?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface OrderEmailDetails {
  orderNumber: string;
  total: number;
  subtotal: number;
  discount?: number;
  shippingFee?: number;
  paymentMethod: string;
  items: OrderEmailItem[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

const formatCurrency = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const buildOrderItemsRows = (items: OrderEmailItem[]) =>
  items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">
            ${item.name}${item.variantLabel ? `<br/><span style="font-size:12px;color:#666">${item.variantLabel}</span>` : ""}${item.flavor ? `<br/><span style="font-size:12px;color:#666">Flavor: ${item.flavor}</span>` : ""}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.unitPrice)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.lineTotal)}</td>
        </tr>
      `,
    )
    .join("");

export const sendOrderReceivedEmail = async (order: OrderEmailDetails) => {
  const recipients = (process.env.ORDER_NOTIFY_EMAIL || "sales.vintageroots@gmail.com")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const address = order.shippingAddress;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipients,
    subject: `New Order Received - #${order.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;color:#222;max-width:640px;margin:0 auto;">
        <h2 style="color:#1F3D2B;">New Order Received 🥜</h2>
        <p>A new order has just been placed on Denimique. Details below:</p>

        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr>
            <td style="padding:6px 0;font-weight:bold;">Order Number:</td>
            <td style="padding:6px 0;">${order.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:bold;">Payment Method:</td>
            <td style="padding:6px 0;text-transform:uppercase;">${order.paymentMethod}</td>
          </tr>
        </table>

        <h3 style="margin-top:24px;color:#1F3D2B;">Items</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1F3D2B;color:#fff;">
              <th style="padding:10px;text-align:left;">Item</th>
              <th style="padding:10px;text-align:center;">Qty</th>
              <th style="padding:10px;text-align:right;">Unit Price</th>
              <th style="padding:10px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${buildOrderItemsRows(order.items)}
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr>
            <td style="padding:4px 10px;text-align:right;">Subtotal:</td>
            <td style="padding:4px 10px;text-align:right;width:120px;">${formatCurrency(order.subtotal)}</td>
          </tr>
          ${
            order.discount
              ? `<tr>
                  <td style="padding:4px 10px;text-align:right;">Discount:</td>
                  <td style="padding:4px 10px;text-align:right;">-${formatCurrency(order.discount)}</td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding:4px 10px;text-align:right;">Shipping:</td>
            <td style="padding:4px 10px;text-align:right;">${formatCurrency(order.shippingFee || 0)}</td>
          </tr>
          <tr>
            <td style="padding:8px 10px;text-align:right;font-weight:bold;border-top:2px solid #1F3D2B;">Total:</td>
            <td style="padding:8px 10px;text-align:right;font-weight:bold;border-top:2px solid #1F3D2B;">${formatCurrency(order.total)}</td>
          </tr>
        </table>

        <h3 style="margin-top:24px;color:#1F3D2B;">Shipping Address</h3>
        <p style="margin:0;line-height:1.6;">
          ${address.fullName}<br/>
          ${address.line1}${address.line2 ? `, ${address.line2}` : ""}<br/>
          ${address.city}, ${address.state} - ${address.postalCode}<br/>
          ${address.country}<br/>
          Phone: ${address.phone}<br/>
          Email: ${address.email}
        </p>

        <p style="margin-top:24px;font-size:12px;color:#666">
          This is an automated notification from the Denimique order system.
        </p>
      </div>
    `,
  });
};
