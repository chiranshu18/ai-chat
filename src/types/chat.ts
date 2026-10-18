export type Role = "user" | "assistant";

export type MessageStatus = "streaming" | "complete" | "error" | "cancelled";

export interface Message {
  id: string;
  role: Role;
  content: string;
  status?: MessageStatus;
  error?: string;
}