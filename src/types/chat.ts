export type Role = "user" | "assistant";

export type MessageStatus = "streaming" | "complete" | "error" | "cancelled";

export interface Attachment {
  name: string;
  mimeType: string;
  text: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  status?: MessageStatus;
  error?: string;
  attachment?: Attachment;
}

export interface ConversationSettings {
  model: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  settings: ConversationSettings;
}

export interface ChatStore {
  activeId: string;
  conversations: Conversation[];
}

export const DEFAULT_MODEL = "gemini-3-flash-preview";
export const NEW_CHAT_TITLE = "New chat";
export const TITLE_MAX_LENGTH = 40;