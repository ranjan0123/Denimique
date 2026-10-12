import https from "https";

function post(path: string, body: object): Promise<any> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const token = process.env.WHATSAPP_ACCESS_TOKEN || "";
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "graph.facebook.com",
        path: `/v21.0/${phoneId}${path}`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
            if ((res.statusCode || 0) >= 400) {
              reject(new Error(parsed?.error?.message || "WhatsApp API error"));
            } else {
              resolve(parsed);
            }
          } catch {
            reject(new Error("Invalid WhatsApp API response"));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

const MP = "whatsapp";

export function sendText(to: string, body: string) {
  return post("/messages", {
    messaging_product: MP,
    to,
    type: "text",
    text: { preview_url: false, body: body.substring(0, 4096) },
  });
}

export function sendImage(to: string, link: string, caption?: string) {
  return post("/messages", {
    messaging_product: MP,
    to,
    type: "image",
    image: { link, ...(caption ? { caption: caption.substring(0, 1024) } : {}) },
  });
}

export function sendButtons(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
  header?: string,
  footer?: string,
) {
  return post("/messages", {
    messaging_product: MP,
    to,
    type: "interactive",
    interactive: {
      type: "button",
      ...(header ? { header: { type: "text", text: header.substring(0, 60) } } : {}),
      body: { text: body.substring(0, 1024) },
      ...(footer ? { footer: { text: footer.substring(0, 60) } } : {}),
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id.substring(0, 256), title: b.title.substring(0, 20) },
        })),
      },
    },
  });
}

export function sendList(
  to: string,
  body: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
  header?: string,
  footer?: string,
) {
  return post("/messages", {
    messaging_product: MP,
    to,
    type: "interactive",
    interactive: {
      type: "list",
      ...(header ? { header: { type: "text", text: header.substring(0, 60) } } : {}),
      body: { text: body.substring(0, 1024) },
      ...(footer ? { footer: { text: footer.substring(0, 60) } } : {}),
      action: {
        button: buttonText.substring(0, 20),
        sections: sections.map((s) => ({
          title: s.title.substring(0, 24),
          rows: s.rows.slice(0, 10).map((r) => ({
            id: r.id.substring(0, 200),
            title: r.title.substring(0, 24),
            ...(r.description ? { description: r.description.substring(0, 72) } : {}),
          })),
        })),
      },
    },
  });
}

export function markAsRead(messageId: string) {
  return post("/messages", {
    messaging_product: MP,
    status: "read",
    message_id: messageId,
  });
}
