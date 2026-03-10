// ============================================
// SoulFriend — GameFi Integration Bridge
// ============================================
// Event-driven bridge: Chatbot → GameFi
//
// Quy tắc thiết kế:
//   1. KHÔNG sửa đổi chatbot hoặc AI code hiện tại
//   2. Bridge chỉ nhận event và chuyển cho GameFi
//   3. GameFi không gọi trực tiếp chatbot
//   4. Kiến trúc event-driven, loose coupling
//
// Flow:
//   User message → Chatbot → narrativeTrigger → gamefiBridge → GameFi → reward → gamefiFeedback

import {
  processEvent,
  getOrCreateCharacter,
  getCharacter,
  resetEventHandler,
  getSupportedEvents,
} from '../gamefi/core/eventHandler';
import type {
  PsychEvent,
  PsychEventType,
  EventResult,
} from '../gamefi/core/eventHandler';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

/** Listener callback type */
export type EventListener = (event: PsychEvent, result: EventResult) => void;

/** Bridge configuration */
export interface BridgeConfig {
  enabled: boolean;
  logEvents: boolean;
}

// ══════════════════════════════════════════════
// EVENT LOG + LISTENERS
// ══════════════════════════════════════════════

const eventLog: { event: PsychEvent; result: EventResult; timestamp: number }[] = [];
const MAX_EVENT_LOG = 1000;
const listeners: EventListener[] = [];
let config: BridgeConfig = { enabled: true, logEvents: true };

// ══════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════

/**
 * Gửi một psychological event từ chatbot đến GameFi.
 *
 * Đây là hàm chính mà chatbot gọi sau khi narrativeTrigger
 * xác định loại event từ tin nhắn người dùng.
 *
 * @param event - Event từ chatbot: { userId, eventType, content }
 * @returns EventResult - Kết quả GameFi: XP, growth, quest, milestone
 */
export function sendEvent(event: PsychEvent): EventResult {
  if (!config.enabled) {
    return emptyResult();
  }

  // Validate event
  validateEvent(event);

  // Forward to GameFi engine
  const result = processEvent(event);

  // Log event
  if (config.logEvents) {
    eventLog.push({ event, result, timestamp: Date.now() });
    if (eventLog.length > MAX_EVENT_LOG) {
      eventLog.splice(0, eventLog.length - MAX_EVENT_LOG);
    }
  }

  // Notify listeners
  for (const listener of listeners) {
    try {
      listener(event, result);
    } catch {
      // Listener errors should not break the bridge
    }
  }

  return result;
}

/**
 * Gửi event nhanh — helper cho chatbot.
 * Chỉ cần userId, eventType, content.
 */
export function quickEvent(
  userId: string,
  eventType: PsychEventType,
  content: string,
): EventResult {
  return sendEvent({ userId, eventType, content });
}

/**
 * Xử lý tin nhắn người dùng — full pipeline.
 * narrativeTrigger detect event → gamefiBridge forward → GameFi process.
 *
 * Import narrativeTrigger inline để tránh circular dependency.
 */
export function processUserMessage(
  userId: string,
  message: string,
  detectedEventType: PsychEventType,
): EventResult {
  return sendEvent({
    userId,
    eventType: detectedEventType,
    content: message,
  });
}

// ══════════════════════════════════════════════
// LISTENER MANAGEMENT
// ══════════════════════════════════════════════

/** Đăng ký listener cho mỗi event được xử lý */
export function onEvent(listener: EventListener): void {
  listeners.push(listener);
}

/** Xóa tất cả listeners */
export function clearListeners(): void {
  listeners.length = 0;
}

// ══════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════

/** Bật/tắt bridge */
export function setBridgeEnabled(enabled: boolean): void {
  config.enabled = enabled;
}

/** Kiểm tra bridge đang bật */
export function isBridgeEnabled(): boolean {
  return config.enabled;
}

/** Cấu hình bridge */
export function configureBridge(newConfig: Partial<BridgeConfig>): void {
  config = { ...config, ...newConfig };
}

// ══════════════════════════════════════════════
// QUERY API
// ══════════════════════════════════════════════

/** Lấy event log */
export function getEventLog(): readonly { event: PsychEvent; result: EventResult; timestamp: number }[] {
  return eventLog;
}

/** Lấy event log count */
export function getEventLogCount(): number {
  return eventLog.length;
}

/** Lấy profile GameFi của user */
export function getUserGameProfile(userId: string) {
  const char = getCharacter(userId);
  if (!char) return null;
  return {
    userId,
    level: char.level,
    xp: char.xp,
    growthScore: char.growthScore,
    growthStats: { ...char.growthStats },
    soulPoints: char.soulPoints,
    empathyScore: char.empathyScore,
    badges: [...char.badges],
  };
}

/** Lấy danh sách event types hỗ trợ */
export function getSupportedEventTypes(): PsychEventType[] {
  return getSupportedEvents();
}

// ══════════════════════════════════════════════
// RESET (testing)
// ══════════════════════════════════════════════

/** Reset bridge state (testing only) */
export function resetBridge(): void {
  eventLog.length = 0;
  listeners.length = 0;
  config = { enabled: true, logEvents: true };
  resetEventHandler();
}

// ══════════════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════════════

function validateEvent(event: PsychEvent): void {
  if (!event.userId || typeof event.userId !== 'string') {
    throw new Error('Event phải có userId hợp lệ');
  }
  const supported = getSupportedEvents();
  if (!supported.includes(event.eventType)) {
    throw new Error(`eventType "${event.eventType}" không được hỗ trợ. Hỗ trợ: ${supported.join(', ')}`);
  }
  if (!event.content || typeof event.content !== 'string' || event.content.length === 0) {
    throw new Error('Event phải có content không rỗng');
  }
  if (event.content.length > 5000) {
    throw new Error('Content không được vượt quá 5000 ký tự');
  }
}

function emptyResult(): EventResult {
  return {
    xpGained: 0,
    growthImpact: {},
    newLevel: 1,
    levelTitle: 'Người Quan Sát',
    unlockedQuest: null,
    milestone: null,
    safetyAlert: false,
    rewards: { soulPoints: 0, empathyPoints: 0 },
  };
}
