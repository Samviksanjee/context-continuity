/* Continuity experience: the user's accessibility preferences belong to the
 * user, not a device. Set them on one device, hand them off to another the user
 * owns, and its presentation adapts — local-first and consent-based.
 * PROTOTYPE: uses a local sync simulator, not production end-to-end encryption.
 * Operational text is sourced from the i18n catalog (A11Y-12). */
import { useRef, useState } from "react";
import { KeyRound, Laptop, Smartphone } from "lucide-react";
import { ContinuityManager } from "../lib/continuityManager";
import { adaptPresentation, defaultPreferences, type AccessibilityPreferences } from "../lib/accessibilityPreferences";
import type { PasskeyEvent } from "../lib/passkeyFlow";
import { enMessages, translate } from "../lib/i18n";

const THIS_DEVICE = { id: "phone", label: "This phone" };
const OTHER_DEVICE = { id: "laptop", label: "Your laptop" };

type PrefKey = keyof AccessibilityPreferences;

const PREF_CONTROLS: Array<{ key: PrefKey; labelId: string; hintId: string }> = [
  { key: "largerText", labelId: "continuity.pref.largerText", hintId: "continuity.pref.largerText.hint" },
  { key: "highContrast", labelId: "continuity.pref.highContrast", hintId: "continuity.pref.highContrast.hint" },
  { key: "reduceMotion", labelId: "continuity.pref.reduceMotion", hintId: "continuity.pref.reduceMotion.hint" },
  { key: "voicePreferred", labelId: "continuity.pref.voicePreferred", hintId: "continuity.pref.voicePreferred.hint" },
];

function t(id: string, params?: Record<string, string | number>) {
  return translate(enMessages, id, params);
}

export default function ContinuityPanel() {
  const managerRef = useRef<ContinuityManager | null>(null);
  if (managerRef.current === null) {
    const created = new ContinuityManager();
    created.enrollDevice(THIS_DEVICE.id, THIS_DEVICE.label);
    created.enrollDevice(OTHER_DEVICE.id, OTHER_DEVICE.label);
    managerRef.current = created;
  }
  const manager = managerRef.current;

  const [prefs, setPrefs] = useState<AccessibilityPreferences>({ ...defaultPreferences });
  const [handedOff, setHandedOff] = useState<AccessibilityPreferences | null>(null);
  const [identityState, setIdentityState] = useState(manager.identity().state);
  const [status, setStatus] = useState(t("continuity.status.initial"));

  function togglePref(key: PrefKey) {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
  }

  function handOff() {
    manager.setPreferences(THIS_DEVICE.id, prefs);
    manager.receiveHandoff(OTHER_DEVICE.id);
    setHandedOff(manager.preferencesFor(OTHER_DEVICE.id));
    setStatus(t("continuity.status.handedOff"));
  }

  function identityEvent(event: PasskeyEvent, statusId: string) {
    setIdentityState(manager.applyPasskeyEvent(event).state);
    setStatus(t(statusId));
  }

  const adaptation = handedOff ? adaptPresentation(handedOff) : null;

  return (
    <section id="continuity" className="continuity section-pad" aria-labelledby="continuity-heading">
      <div className="continuity-head">
        <div className="section-kicker">{t("continuity.kicker")}</div>
        <h2 id="continuity-heading">Your context is <em>yours</em>,<br />not the device&rsquo;s.</h2>
        <p>{t("continuity.intro")}</p>
      </div>

      <div className="continuity-grid">
        <div className="continuity-card">
          <div className="continuity-card-head"><Smartphone size={16} aria-hidden="true" /><h3>{t("continuity.thisPhone")}</h3></div>
          <fieldset className="continuity-prefs">
            <legend>{t("continuity.prefsLegend")}</legend>
            {PREF_CONTROLS.map((control) => (
              <label key={control.key} className="continuity-pref">
                <input type="checkbox" checked={prefs[control.key]} onChange={() => togglePref(control.key)} />
                <span><strong>{t(control.labelId)}</strong><small>{t(control.hintId)}</small></span>
              </label>
            ))}
          </fieldset>
          <button type="button" className="continuity-primary" onClick={handOff}>{t("continuity.handoff")}</button>
        </div>

        <div className="continuity-card">
          <div className="continuity-card-head"><Laptop size={16} aria-hidden="true" /><h3>{t("continuity.yourLaptop")}</h3></div>
          {adaptation ? (
            <div
              className="continuity-preview"
              style={{ fontSize: `${adaptation.fontScale}rem` }}
              data-contrast={adaptation.highContrast ? "on" : "off"}
            >
              <span className="micro-label">{t("continuity.adaptedLabel")}</span>
              <p>{t("continuity.sample")}</p>
              <div className="continuity-badges">
                {adaptation.fontScale > 1 && <span>{t("continuity.pref.largerText")}</span>}
                {adaptation.highContrast && <span>{t("continuity.pref.highContrast")}</span>}
                {adaptation.reduceMotion && <span>{t("continuity.pref.reduceMotion")}</span>}
                {adaptation.primaryInput === "voice" && <span>{t("continuity.pref.voicePreferred")}</span>}
                {adaptation.fontScale === 1 && !adaptation.highContrast && !adaptation.reduceMotion && adaptation.primaryInput === "pointer" && (
                  <span>{t("continuity.badge.default")}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="continuity-empty">{t("continuity.empty")}</p>
          )}
        </div>

        <div className="continuity-card">
          <div className="continuity-card-head"><KeyRound size={16} aria-hidden="true" /><h3>{t("continuity.identityDevices")}</h3></div>
          <p className="continuity-identity">{t("continuity.mode", { state: identityState })}</p>
          <div className="continuity-actions">
            <button type="button" onClick={() => identityEvent({ type: "START_ENROLL" }, "continuity.status.enabling")}>{t("continuity.enablePasskey")}</button>
            <button type="button" onClick={() => identityEvent({ type: "USE_MANUAL_CODE" }, "continuity.status.manual")}>{t("continuity.usePairing")}</button>
            <button type="button" onClick={() => identityEvent({ type: "ENROLL_SUCCESS" }, "continuity.status.confirmed")}>{t("continuity.confirm")}</button>
            <button type="button" onClick={() => identityEvent({ type: "RESET_TO_GUEST" }, "continuity.status.guest")}>{t("continuity.continueGuest")}</button>
          </div>
          <p className="continuity-note" role="note">{t("continuity.prototypeNote")}</p>
        </div>
      </div>

      <p className="continuity-status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
