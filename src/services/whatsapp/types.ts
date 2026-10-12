export type FlowState =
  | "idle"
  | "main_menu"
  | "browse_cats"
  | "browse_prods"
  | "view_product"
  | "cart"
  | "checkout_addr"
  | "checkout_new_addr"
  | "checkout_pay"
  | "track_input"
  | "my_orders"
  | "view_order"
  | "support"
  | "account";

export interface NormalizedInput {
  type: "text" | "list" | "button" | "unsupported";
  value: string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
  image?: { id: string; mime_type: string; sha256: string };
  audio?: { id: string };
  document?: { id: string };
}

export interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{ id: string; status: string; timestamp: string; recipient_id: string }>;
      };
      field: string;
    }>;
  }>;
}
