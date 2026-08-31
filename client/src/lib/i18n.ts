/* i18n/RTL foundation (A11Y-12). Framework-free and pure: message catalog with
 * interpolation, RTL detection, Intl-based formatting with safe fallback, and a
 * pseudolocalizer for layout/expansion stress testing. No React/DOM/network. */

export type Locale = string;
export type TextDirection = "ltr" | "rtl";
export type Messages = Record<string, string>;

export const enMessages: Messages = {
  "app.title": "Context Continuity",
  "capture.note": "Note",
  "capture.voice": "Voice",
  "capture.document": "Document",
  "capture.camera": "Camera",
  "graph.relationships": "Relationships",
  "suggestion.advisory": "Suggestion · you decide. No action is taken automatically.",
  "action.dismiss": "Dismiss",
  "action.undo": "Undo",
  "data.clearAll": "Clear all saved threads",
  "capture.saved": "Saved {count} item{plural}.",
  "capture.map": "Map context",
  "capture.detectInputs": "DETECT INPUTS",
  "capture.detecting": "CHECKING…",
  "continuity.kicker": "06 / Continuity",
  "continuity.intro": "Turn on what you need, then hand it off to another device you own. Your accessibility preferences travel with you and the other device adapts — locally, with your consent, without an account.",
  "continuity.thisPhone": "This phone",
  "continuity.yourLaptop": "Your laptop",
  "continuity.prefsLegend": "Accessibility preferences",
  "continuity.pref.largerText": "Larger text",
  "continuity.pref.largerText.hint": "Increase text size wherever you go.",
  "continuity.pref.highContrast": "High contrast",
  "continuity.pref.highContrast.hint": "Stronger borders and separation.",
  "continuity.pref.reduceMotion": "Reduce motion",
  "continuity.pref.reduceMotion.hint": "Minimize animation and movement.",
  "continuity.pref.voicePreferred": "Voice-first",
  "continuity.pref.voicePreferred.hint": "Prefer voice interaction where available.",
  "continuity.handoff": "Hand off to your laptop",
  "continuity.adaptedLabel": "ADAPTED PRESENTATION",
  "continuity.sample": "Tomorrow’s client review — slide 7 still needs the approved Q2 numbers.",
  "continuity.badge.default": "Default presentation",
  "continuity.empty": "Waiting for a hand-off. Your laptop keeps its own state until you send your preferences.",
  "continuity.identityDevices": "Identity & devices",
  "continuity.mode": "Mode: {state} · local guest access is always available",
  "continuity.enablePasskey": "Enable passkey",
  "continuity.usePairing": "Use a pairing code",
  "continuity.confirm": "Confirm",
  "continuity.continueGuest": "Continue as guest",
  "continuity.prototypeNote": "Prototype only — this demo uses a local sync simulator. It is not production end-to-end encryption and moves no data off your device.",
  "continuity.status.initial": "Local-first: your preferences stay on this device until you choose to hand them off.",
  "continuity.status.handedOff": "Handed off to your laptop. It adapted its presentation from your preferences — no manual setup, no account required.",
  "continuity.status.enabling": "Enabling a passkey for your own devices. You can cancel and stay a guest at any time.",
  "continuity.status.manual": "A manual pairing code is used — no QR code or camera required.",
  "continuity.status.confirmed": "Passkey enabled for devices you own. Recovery never weakens encryption.",
  "continuity.status.guest": "Continuing as a local guest. Nothing leaves this device.",
};

const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur", "ps", "sd", "ug", "yi", "dv"]);

/** Returns the message with {name} placeholders filled; missing id returns the id unchanged. */
export function translate(messages: Messages, id: string, params?: Record<string, string | number>): string {
  const template = messages[id];
  if (template === undefined) return id;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

/** RTL by primary language subtag (e.g. "ar-EG" -> rtl), case-insensitive. */
export function textDirection(locale: Locale): TextDirection {
  const primary = locale.toLowerCase().split(/[-_]/)[0];
  return RTL_LANGUAGES.has(primary) ? "rtl" : "ltr";
}

export function formatNumber(value: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return String(value);
  }
}

export function formatDate(value: Date | number, locale: Locale): string {
  const date = typeof value === "number" ? new Date(value) : value;
  try {
    return new Intl.DateTimeFormat(locale).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Bracket + lengthen text for layout stress tests; {placeholders} are preserved. */
export function pseudolocalize(text: string): string {
  const segments = text.split(/(\{\w+\})/g);
  const body = segments
    .map((segment) => (/^\{\w+\}$/.test(segment) ? segment : segment.replace(/[aeiou]/gi, (vowel) => `${vowel}${vowel}`)))
    .join("");
  return `[!${body}!]`;
}
