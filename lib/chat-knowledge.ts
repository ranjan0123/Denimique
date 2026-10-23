import api from "@/lib/api";

export type ChatKnowledgeFile = {
  fileName: string;
  fileType: "csv" | "json" | "txt";
  content: string;
  updatedAt?: string;
};

export const getChatKnowledgeFile = async (): Promise<ChatKnowledgeFile | null> => {
  const response = await api.get("/chatbot-knowledge");
  return response.data || null;
};

export const uploadChatKnowledgeFile = async (file: File): Promise<void> => {
  const form = new FormData();
  form.append("file", file);
  await api.post("/chatbot-knowledge", form);
};

export const deleteChatKnowledgeFile = async (): Promise<void> => {
  await api.delete("/chatbot-knowledge");
};
