import { v4 as uuid } from "uuid";

import type {
  Attachment,
  ChatStore,
  Conversation,
  Message,
  MessageStatus,
  Role,
} from "@/types/chat";
import { DEFAULT_MODEL, NEW_CHAT_TITLE, TITLE_MAX_LENGTH } from "@/types/chat";
import { MAX_DOCUMENT_CHARS } from "@/lib/document";

export const STORAGE_KEY = "ai-chat:v1";

const MESSAGE_STATUSES = new Set<MessageStatus>([
  "streaming",
  "complete",
  "error",
  "cancelled",
]);

export function createConversation(): Conversation {
  const now = Date.now();

  return {
    id: uuid(),
    title: NEW_CHAT_TITLE,
    messages: [],
    createdAt: now,
    updatedAt: now,
    settings: { model: DEFAULT_MODEL },
  };
}

export function createEmptyStore(): ChatStore {
  const conversation = createConversation();

  return {
    activeId: conversation.id,
    conversations: [conversation],
  };
}

export function titleFromMessage(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (!trimmed) return NEW_CHAT_TITLE;
  if (trimmed.length <= TITLE_MAX_LENGTH) return trimmed;
  return trimmed.slice(0, TITLE_MAX_LENGTH).trimEnd();
}

export function parseStore(raw: string | null): ChatStore {
  if (!raw) return createEmptyStore();

  try {
    return normalizeStore(JSON.parse(raw)) ?? createEmptyStore();
  } catch {
    return createEmptyStore();
  }
}

export function loadStore(): ChatStore {
  if (typeof window === "undefined") return createEmptyStore();
  return parseStore(window.localStorage.getItem(STORAGE_KEY));
}

export function saveStore(store: ChatStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function normalizeStore(value: unknown): ChatStore | null {
  if (!value || typeof value !== "object") return null;

  const record = value as { activeId?: unknown; conversations?: unknown };
  if (!Array.isArray(record.conversations)) return null;

  const conversations = record.conversations
    .map(normalizeConversation)
    .filter((conversation): conversation is Conversation => conversation !== null);

  if (conversations.length === 0) return null;

  const activeId =
    typeof record.activeId === "string" &&
    conversations.some((conversation) => conversation.id === record.activeId)
      ? record.activeId
      : conversations[0].id;

  return { activeId, conversations };
}

function normalizeConversation(value: unknown): Conversation | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Partial<Conversation>;
  if (typeof record.id !== "string" || !Array.isArray(record.messages)) return null;

  const now = Date.now();
  const model =
    record.settings &&
    typeof record.settings === "object" &&
    typeof record.settings.model === "string" &&
    record.settings.model.trim()
      ? record.settings.model
      : DEFAULT_MODEL;

  return {
    id: record.id,
    title: typeof record.title === "string" && record.title.trim()
      ? record.title
      : NEW_CHAT_TITLE,
    messages: record.messages
      .map(normalizeMessage)
      .filter((message): message is Message => message !== null),
    createdAt: typeof record.createdAt === "number" ? record.createdAt : now,
    updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : now,
    settings: { model },
  };
}

function normalizeMessage(value: unknown): Message | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Partial<Message>;
  if (typeof record.id !== "string" || typeof record.content !== "string") return null;
  if (record.role !== "user" && record.role !== "assistant") return null;

  // A refresh during Thinking... stores an empty assistant bubble. Stop already
  // removes that placeholder; reload should too. Partial text is kept below.
  if (
    record.role === "assistant" &&
    record.content === "" &&
    record.status !== "error"
  ) {
    return null;
  }

  const message: Message = {
    id: record.id,
    role: record.role as Role,
    content: record.content,
  };

  if (record.status === "streaming") {
    message.status = "cancelled";
  } else if (record.status && MESSAGE_STATUSES.has(record.status)) {
    message.status = record.status;
  }

  if (typeof record.error === "string") {
    message.error = record.error;
  }

  const attachment = normalizeAttachment(record.attachment, message.role);
  if (attachment) {
    message.attachment = attachment;
  }

  return message;
}

function normalizeAttachment(value: unknown, role: Role): Attachment | undefined {
  if (role !== "user" || !value || typeof value !== "object") return undefined;

  const record = value as Partial<Attachment>;
  if (
    typeof record.name !== "string" ||
    typeof record.mimeType !== "string" ||
    typeof record.text !== "string"
  ) {
    return undefined;
  }

  const name = record.name.trim();
  if (!name || record.text.length === 0 || record.text.length > MAX_DOCUMENT_CHARS) {
    return undefined;
  }

  return {
    name,
    mimeType: record.mimeType,
    text: record.text,
  };
}
