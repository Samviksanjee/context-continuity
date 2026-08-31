/* Signal Atlas: editorial systems design, warm paper + ink + signal orange, asymmetric narrative layouts. */
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDownRight, ArrowUpRight, Camera, ChevronRight, CircleHelp, Download, FileText, LockKeyhole, Menu, Mic, Minus, MoveRight, Network, Play, Plus, RotateCcw, ScanLine, Send, Sparkles, Timer, WifiOff, X } from "lucide-react";
import { buildContextGraph } from "../lib/contextGraph";
import { parseConfidence, uncertaintyPhrase } from "../lib/advisory";
import { readDeviceProfile, gestureHint } from "../lib/deviceProfile";
import { enMessages, translate, textDirection } from "../lib/i18n";
import ContinuityPanel from "../components/ContinuityPanel";

const APP_LOCALE = "en";

const layers = [
  { key: "perceive", label: "01 / Perceive", title: "Notice what is happening", copy: "Camera, screen, voice and documents become structured signals — without asking you to narrate the obvious.", icon: ScanLine, color: "#DDE8E2" },
  { key: "remember", label: "02 / Remember", title: "Keep the thread", copy: "A private context graph connects people, tasks, deadlines and evidence across the moments that created them.", icon: Network, color: "#F3E3C8" },
  { key: "reason", label: "03 / Reason", title: "Understand why it matters", copy: "On-device intelligence compares new information with what already exists, then surfaces the useful relationship.", icon: Sparkles, color: "#DCE6EF" },
  { key: "action", label: "04 / Take action", title: "Move the work forward", copy: "A clear, permission-based next step appears when the system has enough context to make one worth considering.", icon: MoveRight, color: "#F6D7CB" },
];

const moments = [
  ["MON", "Poster photographed", "A hackathon enters the graph."],
  ["TUE", "Problem statement read", "The PDF becomes evidence."],
  ["WED", "Rahul gets the backend", "A responsibility finds its owner."],
  ["THU", "Presentation created", "The deck joins the project."],
  ["FRI", "State reconstructed", "“You’re missing the prototype demo.”"],
];

type CaptureSource = "NOTE" | "VOICE" | "DOCUMENT" | "CAMERA";
type MemorySpace = {
  key: string; label: string; cue: string; status: string; color: string; source: string; relationship: string; memory: string; why: string; action: string; confidence: string; nodes: string[]; raw: string; details: string[]; sourceKind: CaptureSource;
};

type BrowserRecognitionEvent = { results: { [index: number]: { [index: number]: { transcript: string } } } };
type BrowserRecognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onstart: (() => void) | null; onresult: ((event: BrowserRecognitionEvent) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; };
type BrowserRecognitionConstructor = new () => BrowserRecognition;
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type GraphPoint = { x: number; y: number };

const graphPositions = [
  { x: 15, y: 22 }, { x: 84, y: 19 }, { x: 12, y: 74 }, { x: 86, y: 77 }, { x: 65, y: 56 }, { x: 30, y: 50 },
];
const atlasSections = [
  { index: "01", id: "thesis", label: "THESIS" }, { index: "02", id: "story", label: "THREAD" }, { index: "03", id: "memory-demo", label: "SWITCH" }, { index: "04", id: "architecture", label: "SYSTEM" }, { index: "05", id: "trust", label: "TRUST" },
];

const memorySpaces: MemorySpace[] = [
  { key: "work-review", label: "Tomorrow’s client review", cue: "Calendar + slide draft + chat", status: "ACTIVE THREAD", color: "#F26B3A", source: "Q2_client_review.pptx", relationship: "Aisha → budget slide", memory: "Slide 7 is still missing the approved Q2 numbers for tomorrow’s 9:00 AM review.", why: "The calendar invite, shared slide draft, and Aisha’s message all point to the same client review. The deadline is within 18 hours.", action: "Why this is in focus", confidence: "94%", nodes: ["Calendar", "Slides", "Aisha", "Finance", "Client"], raw: "Client review tomorrow at 9:00 AM. Aisha will add approved Q2 budget figures. Need to review slide 7.", details: ["Event: client review", "Time: tomorrow, 9:00 AM", "Person: Aisha", "Task: review slide 7"], sourceKind: "DOCUMENT" },
  { key: "move-in", label: "New flat move-in", cue: "Lease + delivery + landlord chat", status: "PAUSED THREAD", color: "#799E92", source: "IKEA_delivery_9821.pdf", relationship: "Key handover → 2:00 PM", memory: "Your bed delivery overlaps with the key handover on Saturday afternoon.", why: "The lease confirmation, furniture delivery window, and landlord chat share the same address and Saturday date.", action: "Why this is in focus", confidence: "91%", nodes: ["Lease", "Keys", "Delivery", "Landlord", "Address"], raw: "The landlord will hand over keys at 2 PM on Saturday. Furniture delivery is scheduled between 1 PM and 4 PM.", details: ["Event: move-in", "Time: Saturday, 2:00 PM", "Person: landlord", "Conflict: delivery window"], sourceKind: "DOCUMENT" },
  { key: "weekend-trip", label: "Mysuru weekend train", cue: "E-ticket + maps + family chat", status: "BACKGROUND THREAD", color: "#7998B6", source: "IRCTC_eTicket_8843.pdf", relationship: "Cab pickup → 6:10 AM", memory: "Leave home 30 minutes earlier: rain is forecast before your train to Mysuru.", why: "The train e-ticket, saved station route, and family chat reference the same Saturday-morning departure.", action: "Why this is in focus", confidence: "87%", nodes: ["Train", "Cab", "Weather", "Family", "Station"], raw: "Mysuru train leaves Saturday at 6:40 AM. Book a cab; rain is expected before departure.", details: ["Event: weekend train", "Time: Saturday, 6:40 AM", "Place: station", "Task: book a cab"], sourceKind: "DOCUMENT" },
];

function createMemory(text: string, sourceKind: CaptureSource): MemorySpace {
  const value = text.trim();
  const lower = value.toLowerCase();
  const label = lower.includes("review") || lower.includes("client") || lower.includes("slide") ? "Client review" : lower.includes("move") || lower.includes("lease") || lower.includes("landlord") ? "Move-in" : lower.includes("train") || lower.includes("trip") || lower.includes("ticket") ? "Weekend trip" : value.split(/[.!\n]/)[0].slice(0, 34) || "New context";
  const people = Array.from(new Set(value.match(/\b[A-Z][a-z]{2,}\b/g) ?? [])).slice(0, 2);
  const time = value.match(/\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}:\d{2})\b/gi) ?? [];
  const task = value.match(/(?:need to|must|todo|task|should)\s*[:\-]?\s*([^.!\n]{3,72})/i)?.[1]?.trim();
  const keywords = Array.from(new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3 && !["this", "that", "with", "from", "will", "have", "your", "they"].includes(word)))).slice(0, 4);
  const nodes = [...people, ...keywords.map((word) => word.replace(/^./, (char) => char.toUpperCase())), "Evidence"].slice(0, 5);
  const details = [`Source: ${sourceKind.toLowerCase()} · user initiated`, `Context: ${label}`, ...(people.length ? [`People: ${people.join(", ")}`] : []), ...(time.length ? [`Time: ${time.join(", ")}`] : []), ...(task ? [`Task: ${task}`] : []), `Stored: on this device until you delete it`];
  const suggestion = task ? `Your captured task is “${task}”. Review it before ContextOS suggests an action.` : time.length ? `This looks time-sensitive (${time.join(", ")}). Add one more source or a task to strengthen the context.` : "I captured the context locally. Add a person, time, or task if you want a stronger recommendation.";
  return { key: `capture-${Date.now()}`, label, cue: `${sourceKind.toLowerCase()} · live capture`, status: "LIVE THREAD", color: "#F26B3A", source: `${sourceKind.toLowerCase()} / user input`, relationship: `Input → ${label}`, memory: suggestion, why: `ContextOS parsed this only from the text you entered. It found ${people.length ? people.join(", ") : "no named people"}${time.length ? ` and ${time.join(", ")}` : ""}. The source remains evidence, not an instruction.`, action: "Inspect local evidence", confidence: `${Math.max(72, 96 - Math.max(0, 3 - details.length) * 6)}%`, nodes: nodes.length ? nodes : ["Input", "Evidence", "Context"], raw: value, details, sourceKind };
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [activeLayer, setActiveLayer] = useState("remember");
  const [activeAtlasId, setActiveAtlasId] = useState("thesis");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMemoryKey, setActiveMemoryKey] = useState("work-review");
  const [showEvidence, setShowEvidence] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [captureSource, setCaptureSource] = useState<CaptureSource>("NOTE");
  const [liveMemories, setLiveMemories] = useState<MemorySpace[]>(() => {
    try { return JSON.parse(window.localStorage.getItem("contextos-live-memories") ?? "[]") as MemorySpace[]; } catch { return []; }
  });
  const [undoMemories, setUndoMemories] = useState<MemorySpace[] | null>(null);
  const [governanceNotice, setGovernanceNotice] = useState("");
  const [dismissedKeys, setDismissedKeys] = useState<string[]>([]);
  const [deviceProfile, setDeviceProfile] = useState(() => readDeviceProfile());
  const [captureStatus, setCaptureStatus] = useState("Choose a source, capture deliberately, then map the evidence.");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [isDiscoveringMicrophones, setIsDiscoveringMicrophones] = useState(false);
  const [deferredInstall, setDeferredInstall] = useState<InstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState("");
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [graphView, setGraphView] = useState({ scale: 1, x: 0, y: 0 });
  const [isGraphInteracting, setIsGraphInteracting] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const cameraButtonRef = useRef<HTMLButtonElement>(null);
  const captureFrameButtonRef = useRef<HTMLButtonElement>(null);
  const captureTextareaRef = useRef<HTMLTextAreaElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const graphPointersRef = useRef(new Map<number, GraphPoint>());
  const graphGestureRef = useRef({ lastPoint: null as GraphPoint | null, lastCenter: null as GraphPoint | null, lastDistance: 0 });
  const active = layers.find((layer) => layer.key === activeLayer) ?? layers[1];
  const allMemories = [...liveMemories, ...memorySpaces];
  const activeMemory = allMemories.find((memory) => memory.key === activeMemoryKey) ?? allMemories[0];
  const contextGraph = buildContextGraph(activeMemory);
  const isLive = activeMemory.key.startsWith("capture-");
  const isDismissed = dismissedKeys.includes(activeMemory.key);

  useEffect(() => {
    if (cameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      void videoRef.current.play();
    }
    return () => {
      if (!cameraOpen) cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraOpen, cameraStream]);

  useEffect(() => () => { cameraStream?.getTracks().forEach((track) => track.stop()); }, [cameraStream]);

  useEffect(() => {
    try { window.localStorage.setItem("contextos-live-memories", JSON.stringify(liveMemories)); } catch { /* Browser storage can be unavailable in private modes. */ }
  }, [liveMemories]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuToggleRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!cameraOpen) return;
    captureFrameButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeCamera(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cameraOpen]);

  useEffect(() => {
    const setOnlineState = () => setIsOffline(!navigator.onLine);
    const rememberInstall = (event: Event) => { event.preventDefault(); setDeferredInstall(event as InstallPromptEvent); };
    const installed = () => { setDeferredInstall(null); setInstallStatus("ContextOS is installed. Your saved local threads remain on this device."); };
    window.addEventListener("online", setOnlineState);
    window.addEventListener("offline", setOnlineState);
    window.addEventListener("beforeinstallprompt", rememberInstall);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("online", setOnlineState);
      window.removeEventListener("offline", setOnlineState);
      window.removeEventListener("beforeinstallprompt", rememberInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  useEffect(() => {
    const update = () => setDeviceProfile(readDeviceProfile());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = APP_LOCALE;
    document.documentElement.dir = textDirection(APP_LOCALE);
  }, []);

  useEffect(() => { setGraphView({ scale: 1, x: 0, y: 0 }); }, [activeMemoryKey]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const activeEntry = entries.filter((entry) => entry.isIntersecting).sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (activeEntry) setActiveAtlasId(activeEntry.target.id);
    }, { rootMargin: "-18% 0px -55% 0px", threshold: [0.08, 0.35, 0.65] });
    atlasSections.forEach(({ id }) => { const section = document.getElementById(id); if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const refreshOnDeviceChange = () => { void refreshMicrophones(); };
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshOnDeviceChange);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshOnDeviceChange);
  }, []);

  async function refreshMicrophones() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const inputs = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput");
    setMicrophones(inputs);
    setSelectedMicrophoneId((current) => current && inputs.some((device) => device.deviceId === current) ? current : (inputs[0]?.deviceId ?? ""));
  }

  async function discoverMicrophones() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCaptureStatus("Microphone discovery needs a secure HTTPS page and a modern browser with microphone support.");
      return;
    }
    setIsDiscoveringMicrophones(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      await refreshMicrophones();
      setCaptureStatus("Microphones detected. Choose one, then start voice capture.");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "UnknownError";
      setCaptureStatus(name === "NotAllowedError" ? "Microphone access is blocked. Allow Microphone from the address-bar lock menu, then detect inputs again." : `Could not detect microphone inputs (${name}). Check your device connection and retry.`);
    } finally {
      setIsDiscoveringMicrophones(false);
    }
  }

  function addLiveContext() {
    if (!userInput.trim()) return;
    const captured = createMemory(userInput, captureSource);
    setLiveMemories((current) => [captured, ...current]);
    setActiveMemoryKey(captured.key);
    setSelectedNode(captured.nodes[0] ?? null);
    setShowEvidence(true);
    setCaptureStatus("Context mapped on this device. Inspect the nodes and evidence below—even when offline.");
    setUserInput("");
  }

  function forgetMemory(key: string) {
    const removed = liveMemories.find((memory) => memory.key === key);
    if (!removed) return;
    setLiveMemories((current) => current.filter((memory) => memory.key !== key));
    setActiveMemoryKey((prev) => {
      if (prev !== key) return prev;
      const nextLive = liveMemories.find((memory) => memory.key !== key);
      return nextLive?.key ?? memorySpaces[0].key;
    });
    setUndoMemories([removed]);
    setGovernanceNotice(`Forgot “${removed.label}”. It was deleted from this device.`);
  }

  function clearAllMemories() {
    if (!liveMemories.length) return;
    setUndoMemories(liveMemories);
    setGovernanceNotice(`Cleared ${liveMemories.length} saved thread${liveMemories.length > 1 ? "s" : ""} from this device.`);
    setLiveMemories([]);
    setActiveMemoryKey(memorySpaces[0].key);
  }

  function undoDelete() {
    if (!undoMemories) return;
    setLiveMemories((current) => [...undoMemories, ...current]);
    setActiveMemoryKey(undoMemories[0].key);
    setGovernanceNotice("Restored your saved context.");
    setUndoMemories(null);
  }

  function dismissSuggestion() {
    setDismissedKeys((current) => current.includes(activeMemory.key) ? current : [...current, activeMemory.key]);
  }

  function showSuggestion() {
    setDismissedKeys((current) => current.filter((key) => key !== activeMemory.key));
  }

  function onTabKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const navigationKeys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"];
    if (!navigationKeys.includes(event.key)) return;
    event.preventDefault();
    const count = allMemories.length;
    if (count === 0) return;
    const currentIndex = Math.max(0, allMemories.findIndex((memory) => memory.key === activeMemoryKey));
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (currentIndex + 1) % count;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + count) % count;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = count - 1;
    const target = allMemories[nextIndex];
    setActiveMemoryKey(target.key);
    setSelectedNode(target.nodes[0] ?? null);
    setShowEvidence(false);
    requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
  }

  async function startVoiceCapture() {
    const browserWindow = window as unknown as { SpeechRecognition?: BrowserRecognitionConstructor; webkitSpeechRecognition?: BrowserRecognitionConstructor };
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    setCaptureSource("VOICE");
    if (!window.isSecureContext) {
      setCaptureStatus("Voice needs a secure HTTPS page. Open the published preview over HTTPS, then allow microphone access.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCaptureStatus("This browser cannot request microphone access. Use current Chrome or Edge, or enter a transcript manually.");
      return;
    }
    if (!Recognition) {
      setCaptureStatus("Voice transcription is not available in this browser. Use Chrome with a configured speech service, or enter a transcript manually.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedMicrophoneId ? { exact: selectedMicrophoneId } : undefined, echoCancellation: true, noiseSuppression: true } });
      stream.getTracks().forEach((track) => track.stop());
      await refreshMicrophones();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "UnknownError";
      const message = name === "NotAllowedError"
        ? "Microphone access is blocked. Select the lock icon beside the address bar, allow Microphone, then retry."
        : name === "NotFoundError"
          ? "No microphone was detected. Connect or select a microphone in your device sound settings, then retry."
          : name === "NotReadableError"
            ? "Another app or browser tab is using the microphone. Close calls or recorders, then retry."
            : `The browser could not start a microphone stream (${name}). Check your selected input device and retry.`;
      setCaptureStatus(message);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      const selectedLabel = microphones.find((device) => device.deviceId === selectedMicrophoneId)?.label;
      setIsListening(true);
      setCaptureStatus(`Listening now${selectedLabel ? ` through ${selectedLabel}` : ""}. Speak a short context note, then pause.`);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (transcript) {
        setUserInput(transcript);
        setCaptureStatus("Voice transcript ready. Review it, then map the context.");
      }
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      const message = event.error === "audio-capture"
        ? "The speech service could not access the microphone after preflight. Close other microphone apps, confirm the correct input device in browser settings, refresh, and retry."
        : event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Voice permission or the browser speech service is blocked. Allow Microphone in the address-bar settings, then retry."
          : event.error === "network"
            ? "This browser’s speech provider is unavailable. The web demo has no offline speech fallback; use the Android app for strict on-device voice."
            : `Voice capture did not complete (${event.error}). Check microphone permission and the selected input device, then retry.`;
      setCaptureStatus(message);
    };
    recognition.onend = () => { setIsListening(false); setCaptureStatus((status) => status.startsWith("Listening") ? "Voice capture ended without a transcript. Check the microphone input level and try again." : status); };
    try {
      setCaptureStatus("Checking the microphone, then starting your browser’s speech service…");
      recognition.start();
    } catch {
      setIsListening(false);
      setCaptureStatus("The browser could not start speech recognition. Refresh the page, confirm microphone permission, and try again.");
    }
  }

  async function handleDocument(file: File) {
    setCaptureSource("DOCUMENT");
    setCameraPreview(null);
    const plainText = file.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(file.name);
    if (plainText) {
      const text = (await file.text()).slice(0, 5000);
      setUserInput(text);
      setCaptureStatus(`Read ${file.name} locally in this browser. Review the text, then map it.`);
      return;
    }
    setUserInput(`Document selected: ${file.name}. Add a short description, key people, timing, or task before mapping it.`);
    setCaptureStatus("The browser demo registered the document name only. For local PDF/image text extraction, use the native Android ContextOS prototype.");
  }

  async function openCamera() {
    setCaptureSource("CAMERA");
    setCameraPreview(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCaptureStatus("Camera access is not available in this browser. Use a secure browser context or capture an image through the Android app.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      setCameraStream(stream);
      setCameraOpen(true);
      setCaptureStatus("Camera live. Capture a frame, then add a brief observation before mapping it.");
    } catch {
      setCaptureStatus("Camera access was not granted. You can enter a camera observation manually instead.");
    }
  }

  function closeCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setCameraOpen(false);
    cameraButtonRef.current?.focus();
  }

  function captureCameraFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCameraPreview(canvas.toDataURL("image/jpeg", 0.82));
    closeCamera();
    setUserInput((current) => current || "Camera observation captured. Describe the important people, time, place, or task shown in the frame.");
    setCaptureStatus("Frame captured on this device. Add a concise observation so the local graph can map it.");
    captureTextareaRef.current?.focus();
  }

  async function installPwa() {
    if (!deferredInstall) {
      setInstallStatus("Use your browser menu: Install app or Add to Home Screen. Once opened online, ContextOS remains available offline.");
      return;
    }
    await deferredInstall.prompt();
    const choice = await deferredInstall.userChoice;
    setInstallStatus(choice.outcome === "accepted" ? "Installing ContextOS to this device…" : "Install cancelled. You can add it later from the browser menu.");
    setDeferredInstall(null);
  }

  function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
  function distance([first, second]: GraphPoint[]) { return Math.hypot(first.x - second.x, first.y - second.y); }
  function center([first, second]: GraphPoint[]) { return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }; }
  function resetGraphView() { setGraphView({ scale: 1, x: 0, y: 0 }); }
  function adjustGraphZoom(amount: number) { setGraphView((view) => ({ ...view, scale: clamp(view.scale + amount, 0.75, 2.4) })); }

  function onGraphPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    graphPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = Array.from(graphPointersRef.current.values());
    graphGestureRef.current.lastPoint = points[0] ?? null;
    graphGestureRef.current.lastCenter = points.length >= 2 ? center(points) : null;
    graphGestureRef.current.lastDistance = points.length >= 2 ? distance(points) : 0;
    setIsGraphInteracting(true);
  }

  function onGraphPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!graphPointersRef.current.has(event.pointerId)) return;
    graphPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = Array.from(graphPointersRef.current.values());
    if (points.length >= 2) {
      const nextCenter = center(points);
      const nextDistance = distance(points);
      const ratio = graphGestureRef.current.lastDistance ? nextDistance / graphGestureRef.current.lastDistance : 1;
      const priorCenter = graphGestureRef.current.lastCenter ?? nextCenter;
      setGraphView((view) => ({ scale: clamp(view.scale * ratio, 0.75, 2.4), x: clamp(view.x + nextCenter.x - priorCenter.x, -150, 150), y: clamp(view.y + nextCenter.y - priorCenter.y, -115, 115) }));
      graphGestureRef.current.lastCenter = nextCenter;
      graphGestureRef.current.lastDistance = nextDistance;
    } else if (points.length === 1) {
      const point = points[0];
      const prior = graphGestureRef.current.lastPoint ?? point;
      if (event.pointerType !== "mouse" || event.buttons === 1) setGraphView((view) => ({ ...view, x: clamp(view.x + point.x - prior.x, -150, 150), y: clamp(view.y + point.y - prior.y, -115, 115) }));
      graphGestureRef.current.lastPoint = point;
    }
  }

  function onGraphPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    graphPointersRef.current.delete(event.pointerId);
    const points = Array.from(graphPointersRef.current.values());
    graphGestureRef.current.lastPoint = points[0] ?? null;
    graphGestureRef.current.lastCenter = points.length >= 2 ? center(points) : null;
    graphGestureRef.current.lastDistance = points.length >= 2 ? distance(points) : 0;
    if (!points.length) setIsGraphInteracting(false);
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#top">Skip to main content</a>
      <header className="topbar">
        <button className="brand" onClick={() => scrollToId("top")} aria-label="Back to top">
          <img src="/manus-storage/context-logo_28ea51ee.png" alt="" className="brand-mark" />
          <span>CONTEXT<span className="brand-slash">/</span>CONTINUITY</span>
        </button>
        <nav id="primary-navigation" className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
          <button onClick={() => { scrollToId("thesis"); setMenuOpen(false); }}>The thesis</button>
          <button onClick={() => { scrollToId("memory-demo"); setMenuOpen(false); }}>Demo</button>
          <button onClick={() => { scrollToId("architecture"); setMenuOpen(false); }}>Architecture</button>
          <button onClick={() => { scrollToId("trust"); setMenuOpen(false); }}>Trust</button>
        </nav>
        <button ref={menuToggleRef} className="menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        <button className="nav-cta" onClick={() => scrollToId("architecture")}>Explore the layer <ArrowUpRight size={15} /></button>
        <button className="install-cta" onClick={() => void installPwa()}><Download size={14} /> {deferredInstall ? "Install" : "Add to home"}</button>
      </header>
      <div className="mobile-atlas" aria-label="ContextOS atlas progress">
        <span>ATLAS / 05</span>
        <div>{atlasSections.map(({ index, id, label }) => <button key={id} className={activeAtlasId === id ? "active" : ""} onClick={() => scrollToId(id)} aria-label={`Go to ${label.toLowerCase()} section`}><i /><b>{index}</b><em>{label}</em></button>)}</div>
      </div>

      <aside className="atlas-rail" aria-label="Atlas index">
        <span className="atlas-title">ATLAS / 05</span>
        <div className="atlas-track" />
        {atlasSections.map(({ index, id, label }) => <button key={id} className={activeAtlasId === id ? "active" : ""} onClick={() => scrollToId(id)}><i /><span>{index}</span><small>{label}</small></button>)}
      </aside>

      <main id="top" tabIndex={-1}>
        <section className="hero section-pad">
          <div className="hero-copy">
            <div className="eyebrow"><span className="signal-dot" /> Vendor-neutral / Android + Web</div>
            <h1>The intelligence<br /><em>between</em> moments.</h1>
            <p className="hero-lede">ContextOS understands what is happening around you. <strong>Context Continuity remembers why it matters</strong> — and carries that understanding across apps, devices, time and tasks.</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => scrollToId("thesis")}>See the missing layer <ArrowDownRight size={17} /></button>
              <button className="text-button" onClick={() => scrollToId("story")}><Play size={14} fill="currentColor" /> Follow one project</button>
            </div>
            <div className="hero-meta"><span>CONCEPT / 01</span><span>PRIVATE BY DEFAULT</span><span>CAPABILITY-DRIVEN</span></div>
          </div>
          <div className="hero-visual">
            <div className="visual-caption caption-top">A living map of what matters</div>
            <img src="/manus-storage/context-hero_607ec187.png" alt="Abstract context network with connected signal nodes" />
            <div className="hero-callout"><span className="callout-line" /><div><span className="micro-label">SIGNAL DETECTED</span><strong>“This belongs<br />to your project.”</strong></div></div>
            <div className="visual-caption caption-bottom">The interface is not the intelligence.<br />The continuity is.</div>
          </div>
        </section>

        <section id="thesis" className="thesis section-pad">
          <div className="section-kicker">01 / The missing layer</div>
          <div className="thesis-grid">
            <h2>Every phone has<br /><span>the moments.</span></h2>
            <div className="thesis-body"><p>Camera. Documents. Voice. Share sheets. Local AI. The exact capabilities vary by device.</p><p className="large-note">We provide the layer that turns those <strong>isolated contextual moments</strong> into private continuity, using each phone's available features with safe local fallbacks.</p><button className="underlined-button" onClick={() => scrollToId("architecture")}>Unify the pieces <ChevronRight size={16} /></button></div>
          </div>
          <div className="comparison-strip"><div><span>Today</span><strong>Feature → feature</strong><small>Useful in the moment. Forgotten after.</small></div><div className="strip-arrow">→</div><div className="highlight-cell"><span>ContextOS</span><strong>Moment → meaning</strong><small>Connected across time, apps, devices.</small></div></div>
        </section>

        <section id="story" className="story section-pad">
          <div className="story-intro"><div className="section-kicker">02 / Context continuity</div><h2>One project.<br /><em>Five days.</em></h2><p>Most apps remember an interaction. Context Continuity reconstructs the reason behind it.</p></div>
          <div className="timeline-panel">
            <img src="/manus-storage/context-timeline_9413ddfd.png" alt="Abstract connected timeline" className="timeline-art" />
            <div className="timeline-list">{moments.map(([day, title, copy], index) => <div className={index === moments.length - 1 ? "moment moment-last" : "moment"} key={day}><span className="moment-day">{day}</span><span className="moment-node" /><div><strong>{title}</strong><p>{copy}</p></div></div>)}</div>
          </div>
        </section>

        <section id="memory-demo" className="memory-demo section-pad" aria-labelledby="memory-demo-heading">
          <div className="memory-demo-head"><div><div className="section-kicker">03 / Live local demo</div><h2 id="memory-demo-heading">Give it a moment.<br /><em>See the meaning.</em></h2></div><p>Enter a note, spoken outcome, document excerpt, or camera observation. The demo turns it into a visible context thread: its source, entities, timing, task cues, graph nodes, and a permission-based suggestion all stay on this device until you delete them.</p></div>
          <div className="memory-workbench">
            <div className="memory-selector" role="tablist" aria-orientation="vertical" aria-label="Choose a context thread" onKeyDown={onTabKeyDown}>
              <span className="micro-label">AVAILABLE CONTEXTS</span>
              {allMemories.map((memory, index) => <button key={memory.key} ref={(element) => { tabRefs.current[index] = element; }} id={`tab-${memory.key}`} role="tab" aria-selected={activeMemory.key === memory.key} aria-controls="memory-stage-panel" tabIndex={activeMemory.key === memory.key ? 0 : -1} className={activeMemory.key === memory.key ? "memory-choice active" : "memory-choice"} onClick={() => { setActiveMemoryKey(memory.key); setSelectedNode(memory.nodes[0] ?? null); setShowEvidence(false); }}><span className="choice-index">0{index + 1}</span><span className="choice-copy"><strong>{memory.label}</strong><small>{memory.cue}</small></span><span className="choice-status" style={{ backgroundColor: memory.color }} /></button>)}
              <div className="selector-note"><span className="signal-dot" /> Only the active thread can shape the next suggestion.</div>
            </div>
            <div className="memory-stage" id="memory-stage-panel" role="tabpanel" aria-live="polite" aria-label={`${activeMemory.label} context details`}>
              <div className="capture-console">
                <div className="capture-console-head"><span className="micro-label">TRY CONTEXTOS / THIS DEVICE</span><span className={isOffline ? "offline-state" : "online-state"}>{isOffline ? <><WifiOff size={11} /> OFFLINE MODE</> : "PWA READY"}</span></div>
                <textarea ref={captureTextareaRef} value={userInput} onChange={(event) => setUserInput(event.target.value)} placeholder="Try: ‘Aisha will update the budget slide before tomorrow’s 9:00 AM client review. Need to verify slide 7.’" aria-label="Enter a local ContextOS input" />
                <input ref={documentInputRef} className="visually-hidden" type="file" accept=".txt,.md,.csv,.json,.pdf,image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleDocument(file); event.currentTarget.value = ""; }} />
                {cameraOpen && <div className="camera-capture" role="dialog" aria-modal="true" aria-label="Camera capture"><video ref={videoRef} muted playsInline aria-label="Live camera preview" /><div><button ref={captureFrameButtonRef} onClick={captureCameraFrame}>Capture frame</button><button onClick={closeCamera}>Close camera</button></div></div>}
                {cameraPreview && <div className="camera-preview"><img src={cameraPreview} alt="Captured browser camera frame" /><span>Frame stays in this browser session.</span></div>}
                <div className="capture-tools" aria-label="Capture from browser"><button onClick={() => setCaptureSource("NOTE")} className={captureSource === "NOTE" ? "active" : ""}><Sparkles size={13} />{translate(enMessages, "capture.note")}</button><button onClick={() => void startVoiceCapture()} className={captureSource === "VOICE" ? "active" : ""} disabled={isListening}>{isListening ? <ScanLine size={13} /> : <Mic size={13} />}{isListening ? "Listening" : translate(enMessages, "capture.voice")}</button><button onClick={() => documentInputRef.current?.click()} className={captureSource === "DOCUMENT" ? "active" : ""}><FileText size={13} />{translate(enMessages, "capture.document")}</button><button ref={cameraButtonRef} onClick={() => void openCamera()} className={captureSource === "CAMERA" ? "active" : ""}><Camera size={13} />{translate(enMessages, "capture.camera")}</button></div>
                <div className="microphone-picker"><div><span className="microphone-picker-label">VOICE INPUT</span><select value={selectedMicrophoneId} onChange={(event) => setSelectedMicrophoneId(event.target.value)} disabled={!microphones.length || isListening} aria-label="Preferred microphone input"><option value="">{microphones.length ? "Browser default microphone" : "Detect microphones first"}</option>{microphones.map((device, index) => <option key={`${device.deviceId}-${index}`} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}</select></div><button onClick={() => void discoverMicrophones()} disabled={isDiscoveringMicrophones || isListening}>{isDiscoveringMicrophones ? translate(enMessages, "capture.detecting") : translate(enMessages, "capture.detectInputs")}</button></div>
                {isListening && <div className="audio-wave" role="status" aria-label="Microphone active; listening for a context note"><span /><span /><span /><span /><span /><span /><span /><span /><em>MIC ACTIVE</em></div>}
                <div className="capture-status" role="status" aria-live="polite">{captureStatus}</div>
                <div className="capture-actions"><span className="capture-privacy">Text, graph, and saved threads work offline after first load. Browser voice may need its provider; strict offline voice is available in the Android app.</span><button className="capture-submit" onClick={addLiveContext} disabled={!userInput.trim()}>{translate(enMessages, "capture.map")} <Send size={14} /></button></div>
                {installStatus && <div className="pwa-install-status" aria-live="polite">{installStatus}</div>}
              </div>
              <div className="stage-top"><div><span className="micro-label">NOW IN FOCUS</span><h3>{activeMemory.label}</h3></div><span className="stage-status" style={{ color: activeMemory.color }}><i style={{ backgroundColor: activeMemory.color }} /> {activeMemory.status}</span></div>
              <div className="graph-viewport">
                <div className={isGraphInteracting ? "memory-graph is-gesturing" : "memory-graph"} style={{ "--memory-color": activeMemory.color } as CSSProperties} onPointerDown={onGraphPointerDown} onPointerMove={onGraphPointerMove} onPointerUp={onGraphPointerEnd} onPointerCancel={onGraphPointerEnd}>
                  <div className="graph-scene" aria-hidden="true" style={{ transform: `translate(${graphView.x}px, ${graphView.y}px) scale(${graphView.scale})` }}>
                    <svg className="graph-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      {activeMemory.nodes.map((node, index) => { const point = graphPositions[index % graphPositions.length]; return <line key={`${activeMemory.key}-core-${index}-${node}`} x1="50" y1="50" x2={point.x} y2={point.y} />; })}
                      {activeMemory.nodes.slice(1).map((node, index) => { const first = graphPositions[index % graphPositions.length]; const next = graphPositions[(index + 1) % graphPositions.length]; return <line key={`${activeMemory.key}-relation-${index}-${node}`} className="graph-link-secondary" x1={first.x} y1={first.y} x2={next.x} y2={next.y} />; })}
                    </svg>
                    {activeMemory.nodes.map((node, index) => { const point = graphPositions[index % graphPositions.length]; return <button key={`${activeMemory.key}-node-${index}-${node}`} tabIndex={-1} className={selectedNode === node ? "memory-node selected" : "memory-node"} style={{ "--node-x": `${point.x}%`, "--node-y": `${point.y}%` } as CSSProperties} onClick={() => setSelectedNode(node)}>{node}</button>; })}
                    <div className="memory-core"><Network size={17} /><span>CONTEXT<br />GRAPH</span></div>
                  </div>
                  <div className="graph-inspector"><span className="micro-label">SELECTED LINK</span><strong>{selectedNode ?? activeMemory.nodes[0]} <i>→</i> {activeMemory.label}</strong></div>
                </div>
                <div className="graph-gesture-bar"><span>{gestureHint(deviceProfile)}</span><div><button aria-label="Zoom out" onClick={() => adjustGraphZoom(-0.15)}><Minus size={13} /></button><output aria-live="polite">{Math.round(graphView.scale * 100)}%</output><button aria-label="Zoom in" onClick={() => adjustGraphZoom(0.15)}><Plus size={13} /></button><button className="graph-reset" onClick={resetGraphView}><RotateCcw size={12} /> Reset</button></div></div>
                <div className="graph-structured" role="group" aria-label={`Context relationships for ${activeMemory.label}`}>
                  <span className="micro-label">RELATIONSHIPS · STRUCTURED VIEW</span>
                  <p className="graph-structured-summary">Key link: {contextGraph.relationshipSummary}</p>
                  <ul className="graph-structured-list">
                    {contextGraph.edges.map((edge) => {
                      const target = contextGraph.nodes.find((graphNode) => graphNode.id === edge.target);
                      if (!target) return null;
                      const isSelected = selectedNode === target.label;
                      return (
                        <li key={edge.id}>
                          <button type="button" className={isSelected ? "graph-rel selected" : "graph-rel"} aria-pressed={isSelected} onClick={() => setSelectedNode(target.label)}>
                            <span className="graph-rel-center">{contextGraph.center.label}</span>
                            <span className="graph-rel-arrow" aria-hidden="true">→</span>
                            <span className="graph-rel-node">{target.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="graph-structured-meta">Source: {contextGraph.provenance.source} · Status: {contextGraph.provenance.status} · Confidence: {contextGraph.provenance.confidence}</p>
                </div>
              </div>
              <div className="memory-evidence"><div><span className="micro-label">EVIDENCE</span><strong>{activeMemory.source}</strong></div><div><span className="micro-label">RELATIONSHIP</span><strong>{activeMemory.relationship}</strong></div><div><span className="micro-label">CONFIDENCE</span><strong>{activeMemory.confidence}</strong></div></div>
              <div className="memory-ledger"><div className="ledger-source"><span className="micro-label">CAPTURED INPUT</span><p>{activeMemory.raw}</p></div><div className="ledger-details"><span className="micro-label">EXTRACTED LOCALLY</span>{activeMemory.details.map((detail, index) => <span key={`${activeMemory.key}-detail-${index}-${detail}`}>{detail}</span>)}</div></div>
              <div className="memory-suggestion"><span className="micro-label">CONTEXTOS SAYS</span>{isDismissed ? <p className="advisory-dismissed">Suggestion hidden. <button type="button" className="advisory-link" onClick={showSuggestion}>Show suggestion</button></p> : <><p>“{activeMemory.memory}”</p><p className="advisory-note">Suggestion · you decide. No action is taken automatically. {uncertaintyPhrase(parseConfidence(activeMemory.confidence))}.</p><div className="advisory-actions"><button onClick={() => setShowEvidence(!showEvidence)} aria-expanded={showEvidence}>{activeMemory.action} <ArrowUpRight size={14} /></button><button type="button" className="advisory-dismiss" onClick={dismissSuggestion}>{translate(enMessages, "action.dismiss")}</button></div>{showEvidence && <div className="memory-reasoning"><span className="micro-label">WHY CONTEXTOS SWITCHED</span><p>{activeMemory.why}</p></div>}</>}</div>
              <div className="memory-governance">
                {isLive && <button type="button" onClick={() => forgetMemory(activeMemory.key)}>Forget this saved context</button>}
                {liveMemories.length > 0 && <button type="button" onClick={clearAllMemories}>{translate(enMessages, "data.clearAll")}</button>}
                {governanceNotice && <span className="memory-governance-notice" role="status" aria-live="polite">{governanceNotice}{undoMemories && <button type="button" onClick={undoDelete}>{translate(enMessages, "action.undo")}</button>}</span>}
              </div>
            </div>
          </div>
        </section>

        <section id="architecture" className="architecture section-pad">
          <div className="architecture-head"><div><div className="section-kicker">04 / The architecture</div><h2>Perceive.<br />Remember.<br /><em>Reason.</em></h2></div><p>ContextOS is not another AI feature. It is the connective tissue beneath the features you already use.</p></div>
          <div className="architecture-layout">
            <div className="layer-tabs">{layers.map((layer) => { const Icon = layer.icon; return <button key={layer.key} className={activeLayer === layer.key ? "layer-tab active" : "layer-tab"} onClick={() => setActiveLayer(layer.key)}><span><Icon size={16} /> {layer.label}</span><ChevronRight size={15} /></button>; })}</div>
            <div className="layer-detail" style={{ backgroundColor: active.color }}><div className="detail-top"><span className="micro-label">CONTEXTOS / LAYER</span><span className="layer-number">{layers.findIndex((l) => l.key === active.key) + 1} / 04</span></div><active.icon size={30} strokeWidth={1.5} /><h3>{active.title}</h3><p>{active.copy}</p><div className="detail-rule" /><div className="detail-footer"><span>LOCAL PROCESSING</span><span>USER CONTROLLED</span></div></div>
            <div className="graph-card"><img src="/manus-storage/context-graph_7b67326b.png" alt="Context graph connecting project entities" /><div className="graph-label label-project">PROJECT</div><div className="graph-label label-task">TASK</div><div className="graph-label label-deadline">DEADLINE</div><div className="graph-label label-person">PERSON</div></div>
          </div>
        </section>

        <section id="trust" className="trust section-pad"><div className="trust-copy"><div className="section-kicker">05 / A memory you can govern</div><h2>Useful because<br /><em>you’re in control.</em></h2><p>Context is powerful only when it is legible. Every surfaced insight carries its source, its confidence, and a clear way to correct or forget it.</p><div className="trust-points"><div><LockKeyhole size={18} /><span><strong>Private by default</strong>On-device first. Cloud only when you choose.</span></div><div><Timer size={18} /><span><strong>Time-aware</strong>Old context can fade. Nothing is permanent by accident.</span></div><div><CircleHelp size={18} /><span><strong>Explainable</strong>See why the system made the connection.</span></div></div></div><div className="privacy-visual"><img src="/manus-storage/context-privacy_86c3a403.png" alt="Abstract private on-device intelligence symbol" /><span className="privacy-tag tag-source">SOURCE / PDF</span><span className="privacy-tag tag-memory">MEMORY / TASK</span><span className="privacy-tag tag-action">ACTION / YOUR CALL</span></div></section>

        <ContinuityPanel />

        <section className="closing section-pad"><div className="closing-index">CONTEXTOS<br /><span>THE OPERATING LAYER FOR MEANING</span></div><h2>Stop starting<br /><em>from zero.</em></h2><p>The best assistant is not the one that says more. It is the one that already understands the thread.</p><button className="primary-button" onClick={() => scrollToId("top")}>Revisit the proposition <ArrowUpRight size={17} /></button></section>
      </main>
      <footer><span>CONTEXT<span className="brand-slash">/</span>CONTINUITY</span><span>CONCEPT STUDY / 2026</span><span>BUILT FOR THE NEXT MOMENT <ArrowUpRight size={13} /></span></footer>
    </div>
  );
}
