import { useSyncExternalStore } from "react";
import { parseVoiceCommand } from "./voice-intent";
import { payWithNfc } from "./nfc-payment.functions";

export type GhostEmotion = "idle" | "thinking" | "happy" | "surprised";
export type EstadoVending = "MENU_SELECCION" | "ESPERANDO_PAGO" | "PAGO_EXITOSO";
export interface Product {
  id: number;
  nombre: string;
  precio: string;
  descripcion: string;
  icon: string;
  stock: number;
}
export interface SerialLog {
  direction: "rx" | "tx" | "sys";
  text: string;
  time: string;
}

export const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";
export const DEFAULT_N8N = "https://mak0ia0.app.n8n.cloud/webhook/vending-order";

export interface MachineState {
  estado: EstadoVending;
  opcion: number;
  emotion: GhostEmotion;
  speech: string;
  lastUid: string;
  catalogo: Product[];
  servoRunning: boolean;
  servoInverted: boolean;
  servoDuty: number;
  irTriggered: boolean;
  pn532Ok: boolean;
  serialConnected: boolean;
  serialPortName: string;
  wifiConnected: boolean;
  esp32Ip: string;
  logs: SerialLog[];
  soundEnabled: boolean;
  // voice / n8n
  apiKey: string;
  voiceId: string;
  n8nUrl: string;
  isListening: boolean;
  isPlaying: boolean;
  transcript: string;
  lastIntent: string;
  n8nStatus: string;
  sendingN8n: boolean;
}

const initial: MachineState = {
  estado: "MENU_SELECCION",
  opcion: 0,
  emotion: "idle",
  speech: "¡Bienvenido! Selecciona un producto del catálogo con el joystick o en pantalla.",
  lastUid: "4A:8F:12:9C",
  catalogo: [
    { id: 0, nombre: "Soda Web3", precio: "1.50 USDC", descripcion: "Refresco gasificado descentralizado con infusión de menta y burbujas cuánticas.", icon: "🥤", stock: 5 },
    { id: 1, nombre: "Cyber Snack", precio: "0.80 USDC", descripcion: "Barra energética con sabor a chocolate espectral para recargar energía.", icon: "🍫", stock: 6 },
    { id: 2, nombre: "Crypto Energy", precio: "2.20 USDC", descripcion: "Bebida de alto voltaje y cafeína cuántica para hackathones intensos.", icon: "⚡", stock: 4 },
  ],
  servoRunning: false,
  servoInverted: true,
  servoDuty: 4915,
  irTriggered: false,
  pn532Ok: false,
  serialConnected: false,
  serialPortName: "Desconectado",
  wifiConnected: false,
  esp32Ip: "192.168.4.1",
  logs: [],
  soundEnabled: true,
  apiKey: "",
  voiceId: DEFAULT_VOICE,
  n8nUrl: DEFAULT_N8N,
  isListening: false,
  isPlaying: false,
  transcript: "",
  lastIntent: "Esperando orden de voz...",
  n8nStatus: "Listo",
  sendingN8n: false,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
class Machine {
  state: MachineState = initial;
  private listeners = new Set<() => void>();
  private port: any = null;
  private reader: any = null;
  private reading = false;
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private recognition: any = null;
  private audio: HTMLAudioElement | null = null;
  private hydrated = false;

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  get = () => this.state;
  getServer = () => initial;
  private set(p: Partial<MachineState>) {
    this.state = { ...this.state, ...p };
    this.listeners.forEach((l) => l());
  }
  get product() {
    return (this.state.catalogo[this.state.opcion] ?? this.state.catalogo[0])!;
  }

  hydrate() {
    if (this.hydrated) return;
    this.hydrated = true;
    this.set({
      apiKey: localStorage.getItem("elevenlabs_api_key") || "",
      voiceId: localStorage.getItem("elevenlabs_voice_id") || DEFAULT_VOICE,
      n8nUrl: localStorage.getItem("n8n_webhook_url") ?? DEFAULT_N8N,
    });
    this.log("sys", "IAFantasma Web3 Vending sincronizado con ESP32.");
  }

  saveConfig(apiKey: string, voiceId: string, n8nUrl: string) {
    const v = { apiKey: apiKey.trim(), voiceId: voiceId.trim() || DEFAULT_VOICE, n8nUrl: n8nUrl.trim() };
    this.set(v);
    localStorage.setItem("elevenlabs_api_key", v.apiKey);
    localStorage.setItem("elevenlabs_voice_id", v.voiceId);
    localStorage.setItem("n8n_webhook_url", v.n8nUrl);
    this.log("sys", "Configuración de ElevenLabs y n8n actualizada con éxito.");
  }

  // ---------- sound ----------
  tone(freq: number, type: OscillatorType = "sine", dur = 0.12, vol = 0.2) {
    if (!this.state.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const C = window.AudioContext || (window as any).webkitAudioContext;
        if (C) this.audioCtx = new C();
      }
      const ctx = this.audioCtx;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch {
      /* ignore */
    }
  }
  success() {
    this.tone(880, "sine", 0.1);
    setTimeout(() => this.tone(1320, "sine", 0.2), 90);
    setTimeout(() => this.tone(1760, "triangle", 0.35), 200);
  }
  error() {
    this.tone(280, "sawtooth", 0.15, 0.25);
    setTimeout(() => this.tone(200, "sawtooth", 0.25, 0.25), 150);
  }
  click() {
    this.tone(1200, "triangle", 0.04, 0.1);
  }
  toggleSound() {
    this.set({ soundEnabled: !this.state.soundEnabled });
  }

  // ---------- logs ----------
  log(direction: SerialLog["direction"], text: string) {
    const time = new Date().toLocaleTimeString();
    this.set({ logs: [{ direction, text, time }, ...this.state.logs.slice(0, 49)] });
  }
  clearLogs() {
    this.set({ logs: [] });
  }

  // ---------- USB serial ----------
  async connectSerial() {
    if (!("serial" in navigator)) {
      alert("Tu navegador no soporta Web Serial API. Usa Google Chrome o Microsoft Edge.");
      return;
    }
    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 115200 });
      this.set({ serialConnected: true, serialPortName: "ESP32 Conectado (115200 baud)" });
      this.log("sys", "Puerto USB abierto a 115200 baudios.");
      this.success();
      this.readSerial();
    } catch (e: any) {
      this.log("sys", `Error al conectar puerto USB: ${e?.message || e}`);
      this.set({ serialConnected: false });
    }
  }
  async disconnectSerial() {
    this.reading = false;
    try {
      if (this.reader) await this.reader.cancel();
      if (this.port) await this.port.close();
    } catch {
      /* ignore */
    }
    this.port = null;
    this.reader = null;
    this.set({ serialConnected: false, serialPortName: "Desconectado" });
    this.log("sys", "Puerto USB cerrado.");
  }
  private async readSerial() {
    this.reading = true;
    const dec = new TextDecoderStream();
    this.port.readable.pipeTo(dec.writable);
    this.reader = dec.readable.getReader();
    let buf = "";
    try {
      while (this.reading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buf += value;
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          lines.map((l) => l.trim()).filter(Boolean).forEach((l) => this.incoming(l));
        }
      }
    } catch (e) {
      if (this.reading) this.log("sys", `Lectura USB interrumpida: ${e}`);
    }
  }

  // ---------- Wi-Fi ----------
  setIp(ip: string) {
    this.set({ esp32Ip: ip });
  }
  connectWifi() {
    const ip = this.state.esp32Ip;
    this.log("sys", `Intentando conectar por Wi-Fi a ws://${ip}:81...`);
    try {
      this.ws = new WebSocket(`ws://${ip}:81`);
      this.ws.onopen = () => {
        this.set({ wifiConnected: true });
        this.log("sys", `¡Conexión Wi-Fi establecida con ESP32 en ${ip}!`);
        this.success();
      };
      this.ws.onmessage = (ev) => {
        const d = ev.data?.toString().trim();
        if (d) this.incoming(d);
      };
      this.ws.onerror = () => {
        this.log("sys", "Error en conexión Wi-Fi con ESP32.");
        this.set({ wifiConnected: false });
      };
      this.ws.onclose = () => {
        this.set({ wifiConnected: false });
        this.log("sys", "Conexión Wi-Fi cerrada.");
      };
    } catch (e: any) {
      this.log("sys", `Fallo al iniciar WebSocket: ${e?.message || e}`);
    }
  }
  disconnectWifi() {
    this.ws?.close();
    this.ws = null;
    this.set({ wifiConnected: false });
    this.log("sys", "Desconectado de Wi-Fi.");
  }

  async send(cmd: string) {
    this.log("tx", cmd);
    if (this.port?.writable) {
      try {
        const w = this.port.writable.getWriter();
        await w.write(new TextEncoder().encode(cmd + "\n"));
        w.releaseLock();
      } catch (e) {
        this.log("sys", `Error al enviar trama USB: ${e}`);
      }
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(cmd + "\n");
      } catch (e) {
        this.log("sys", `Error al enviar trama Wi-Fi: ${e}`);
      }
    }
  }

  incoming(line: string) {
    this.log("rx", line);
    if (line.includes("[OK] Lector PN532 configurado")) this.set({ pn532Ok: true });
    if (line.includes("Rx Pico: ARRIBA") || line.includes("Rx Pico: UP")) this.prev(false);
    else if (line.includes("Rx Pico: ABAJO") || line.includes("Rx Pico: DOWN")) this.next(false);
    else if (line.includes("Rx Pico: OK")) this.ok(false);
    if (line.includes("DESPACHAR")) this.dispense();
    if (line.includes("ITEM_DROPPED") || line.includes("ENTREGADO")) this.dropped(true);
    else if (line.includes("ERROR_DROP") || line.includes("ERROR_DISPENSA")) this.dropped(false);
  }

  // ---------- vending flow ----------
  private announce() {
    const p = this.product;
    this.set({ speech: `Seleccionaste: ${p.nombre} (${p.precio}). Presiona OK para pagar.` });
  }
  prev(uart = true) {
    this.click();
    const n = this.state.catalogo.length;
    this.set({ opcion: (this.state.opcion - 1 + n) % n });
    if (uart) this.send("ARRIBA");
    this.announce();
  }
  next(uart = true) {
    this.click();
    this.set({ opcion: (this.state.opcion + 1) % this.state.catalogo.length });
    if (uart) this.send("ABAJO");
    this.announce();
  }
  select(i: number) {
    this.click();
    this.set({ opcion: i });
    this.announce();
    this.send(`SELECT_${i}`);
  }
  ok(uart = true) {
    this.click();
    if (uart) this.send("OK");
    if (this.state.estado === "MENU_SELECCION") {
      const p = this.product;
      this.set({ estado: "ESPERANDO_PAGO", emotion: "thinking", speech: `Canal: ${p.nombre}. Total: ${p.precio}. ¡Acerca tu tarjeta o pulsera NFC!` });
    } else if (this.state.estado === "ESPERANDO_PAGO") {
      this.cancel(uart);
    }
  }
  cancel(uart = true) {
    this.click();
    if (uart) this.send("CANCEL");
    this.set({ estado: "MENU_SELECCION", emotion: "idle", speech: "Operación cancelada. Elige otro producto cuando gustes." });
  }
  tap(uid: string) {
    if (this.state.estado !== "ESPERANDO_PAGO") this.ok(true);
    this.success();
    const p = this.product;
    this.set({
      lastUid: uid,
      estado: "PAGO_EXITOSO",
      emotion: "happy",
      speech: `¡NFC Detectado [${uid}]! Pago de ${p.precio} aprobado. ¡Despachando ${p.nombre}!`,
    });
    this.send("HAPPY");
    this.dispense();
    this.set({ catalogo: this.state.catalogo.map((x, i) => (i === this.state.opcion ? { ...x, stock: Math.max(0, x.stock - 1) } : x)) });
    setTimeout(() => this.set({ estado: "MENU_SELECCION", emotion: "idle", speech: "¡Listo para la siguiente orden! Elige un producto." }), 4500);
  }
  private duty() {
    return this.state.servoInverted ? 3800 : 6000;
  }
  private dispense() {
    this.set({ servoRunning: true, servoDuty: this.duty() });
    this.send("DESPACHAR");
    if (!this.state.serialConnected) setTimeout(() => this.simulateDrop(), 2500);
  }
  simulateDrop() {
    if (!this.state.servoRunning) return;
    this.set({ irTriggered: true });
    this.tone(1500, "triangle", 0.1);
    setTimeout(() => {
      this.set({ irTriggered: false });
      this.dropped(true);
    }, 400);
  }
  simulateTimeout() {
    if (this.state.servoRunning) this.dropped(false);
  }
  dropped(ok: boolean) {
    this.set({ servoRunning: false, servoDuty: 4915 });
    if (ok) this.set({ speech: "¡Producto detectado por el sensor IR! ¡Gracias por tu compra! 🍬👻" });
    else {
      this.set({ emotion: "surprised", speech: "¡Alerta! El sensor IR no detectó la caída del producto. Revisar stock o espiral." });
      this.error();
    }
  }
  servoStart() {
    const d = this.duty();
    this.set({ servoRunning: true, servoDuty: d, speech: `Giro manual activado (Duty: ${d})` });
    this.send("DESPACHAR");
    this.click();
  }
  servoStop() {
    this.set({ servoRunning: false, servoDuty: 4915, speech: "Servomotor detenido (Punto neutro 4915)." });
    this.send("STOP");
    this.click();
  }
  toggleDirection() {
    this.set({ servoInverted: !this.state.servoInverted });
    this.click();
    if (this.state.servoRunning) this.set({ servoDuty: this.duty() });
  }
  setEmotion(e: GhostEmotion) {
    const s: Record<GhostEmotion, string> = {
      idle: "En reposo en el menú de productos...",
      thinking: "Esperando pago NFC o tarjeta...",
      happy: "¡Pago confirmado! Despachando con éxito.",
      surprised: "¡Alerta de caída o producto cancelado!",
    };
    this.set({ emotion: e, speech: s[e] });
    this.click();
  }

  // ---------- voice (speech recognition) ----------
  get speechSupported() {
    return typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }
  toggleListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Google Chrome o Microsoft Edge.");
      return;
    }
    if (!this.recognition) {
      const r = new SR();
      r.lang = "es-MX";
      r.continuous = false;
      r.interimResults = true;
      r.onstart = () => {
        this.set({ isListening: true, transcript: "Escuchando tu voz..." });
        this.log("sys", "🎙️ Micrófono activado: Escuchando comando de voz...");
      };
      r.onresult = (ev: any) => {
        let interim = "";
        let fin = "";
        for (let i = ev.resultIndex; i < ev.results.length; ++i) {
          if (ev.results[i].isFinal) fin += ev.results[i][0].transcript;
          else interim += ev.results[i][0].transcript;
        }
        this.set({ transcript: fin || interim });
        if (fin) this.voiceCommand(fin);
      };
      r.onerror = (ev: any) => {
        this.set({ isListening: false, transcript: `Error de micrófono: ${ev.error}` });
        this.log("sys", `Error micrófono: ${ev.error}`);
      };
      r.onend = () => this.set({ isListening: false });
      this.recognition = r;
    }
    if (this.state.isListening) {
      this.recognition.stop();
      this.set({ isListening: false });
    } else {
      try {
        this.recognition.start();
      } catch {
        this.recognition.stop();
        setTimeout(() => this.recognition?.start(), 200);
      }
    }
  }

  voiceCommand(phrase: string) {
    this.log("rx", `Voz Detectada: "${phrase}"`);
    const { action, productIndex } = parseVoiceCommand(phrase);
    let reply: string;
    if (action === "SELECT_PRODUCT" && productIndex >= 0) {
      const p = this.state.catalogo[productIndex]!;
      this.select(productIndex);
      this.ok(true);
      this.set({ lastIntent: `Orden por Voz: ${p.nombre} (${p.precio})` });
      reply = `¡Excelente elección espectral! Has pedido ${p.nombre}. El precio es ${p.precio}. Por favor acerca tu tarjeta NFC para completar el pago.`;
      this.n8n({ event: "VOICE_ORDER_RECEIVED", phrase, product: p, action: "SELECT_AND_WAIT_NFC", status: "ESPERANDO_PAGO" });
    } else if (action === "PROCEED_PAYMENT") {
      const p = this.product;
      this.ok(true);
      reply = `Listo, esperando tu tarjeta o pulsera NFC para pagar ${p.nombre}.`;
      this.set({ lastIntent: `Confirmación de pago para ${p.nombre}` });
      this.n8n({ event: "PAYMENT_REQUESTED_BY_VOICE", phrase, product: p, action: "WAIT_NFC" });
    } else if (action === "CANCEL") {
      this.cancel(true);
      reply = "Operación cancelada. Puedes pedirme otro producto con tu voz cuando quieras.";
      this.set({ lastIntent: "Orden cancelada por voz" });
      this.n8n({ event: "ORDER_CANCELLED_BY_VOICE", phrase, action: "CANCELLED" });
    } else if (action === "DISPENSE") {
      this.servoStart();
      reply = "¡Comando de despacho activado! El motor B está girando en la Pico.";
      this.set({ lastIntent: "Despacho activado por voz" });
    } else {
      reply = `Disculpa, escuché "${phrase}", pero no estoy seguro de qué producto deseas. Prueba diciendo "Quiero una Soda Web3", "Dame un Snack" o "Crypto Energy".`;
      this.set({ lastIntent: `No reconocido: "${phrase}"` });
    }
    this.speak(reply);
  }

  // ---------- ElevenLabs TTS ----------
  async speak(text: string) {
    this.set({ speech: text });
    const key = this.state.apiKey.trim();
    if (!key) return this.nativeSpeak(text);
    this.log("tx", `ElevenLabs TTS -> Generando voz para: "${text.substring(0, 40)}..."`);
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.state.voiceId || DEFAULT_VOICE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": key },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true },
        }),
      });
      if (!res.ok) throw new Error(`Error ElevenLabs ${res.status}: ${await res.text()}`);
      const url = URL.createObjectURL(await res.blob());
      this.audio?.pause();
      const a = new Audio(url);
      this.audio = a;
      this.set({ isPlaying: true });
      a.onended = () => {
        this.set({ isPlaying: false });
        URL.revokeObjectURL(url);
      };
      a.onerror = () => this.set({ isPlaying: false });
      a.play().catch(() => this.set({ isPlaying: false }));
      this.log("rx", "ElevenLabs TTS -> Audio generado y reproduciendo.");
    } catch (e: any) {
      this.log("sys", `ElevenLabs aviso: ${e.message}. Usando voz local.`);
      this.nativeSpeak(text);
    }
  }
  private nativeSpeak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.pitch = 0.85;
    u.onstart = () => this.set({ isPlaying: true });
    u.onend = () => this.set({ isPlaying: false });
    u.onerror = () => this.set({ isPlaying: false });
    window.speechSynthesis.speak(u);
  }

  // ---------- n8n ----------
  async n8n(payload: Record<string, unknown>) {
    const url = this.state.n8nUrl.trim();
    if (!url) {
      this.set({ n8nStatus: "URL no configurada" });
      return false;
    }
    this.set({ sendingN8n: true, n8nStatus: "Enviando a n8n..." });
    const s = this.state;
    const body = {
      timestamp: new Date().toISOString(),
      machine_id: "VENDING_WEB3_ESP32_01",
      device: { esp32_ip: s.esp32Ip, usb_connected: s.serialConnected, wifi_connected: s.wifiConnected },
      telemetry: { servo_duty: s.servoDuty, servo_running: s.servoRunning, ir_sensor_drop: s.irTriggered, nfc_tag_detected: s.lastUid },
      ...payload,
    };
    this.log("tx", `n8n Webhook [${String(payload["event"])}] -> ${url}`);
    try {
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      this.set({ n8nStatus: "Enviado OK (200)" });
      this.log("rx", "n8n Webhook: Flujo de información procesado correctamente.");
      return true;
    } catch {
      this.set({ n8nStatus: "Error / Sin conexión n8n" });
      this.log("sys", `n8n Webhook aviso: No se pudo conectar a ${url}. Asegúrate de que n8n esté corriendo.`);
      return false;
    } finally {
      this.set({ sendingN8n: false });
    }
  }
}

/** UI actions that also notify the n8n workflow (same events as the original app). */
class Actions {
  constructor(private m: Machine) {}
  selectProduct(i: number) {
    this.m.select(i);
    this.m.n8n({ event: "PRODUCT_SELECTED_MANUAL", product: this.m.state.catalogo[i], channel: `A${i + 1}` });
  }
  cancelPayment() {
    this.m.cancel();
    this.m.n8n({ event: "PAYMENT_CANCELLED_MANUAL" });
  }
  async tapCard(uid: string) {
    const p = this.m.product;
    const channel = `A${this.m.state.opcion + 1}`;
    const res = await payWithNfc({ data: { uid, productId: this.m.state.opcion } }).catch(() => ({ mode: "error" as const, message: "UID o producto inválido." }));
    if (res.mode === "error") {
      this.m.log("sys", `Pago NFC rechazado: ${res.message}`);
      this.m.setEmotion("surprised");
      this.m.error();
      return;
    }
    this.m.log("rx", res.mode === "onchain" ? `Smart contract: pago confirmado (tx ${res.txHash})` : "Smart contract sin llaves: pago simulado.");
    this.m.tap(uid);
    this.m.n8n({ event: "NFC_PAYMENT_CONFIRMED", card_uid: uid, product: p, amount: p.precio, channel, status: "DISPENSING", tx_hash: res.mode === "onchain" ? res.txHash : null });
    this.m.speak(`¡Pago confirmado con tarjeta NFC! Despachando tu ${p.nombre}. Motor B activado en la Pico.`);
  }
  simulateDrop() {
    this.m.simulateDrop();
    this.m.n8n({ event: "DISPENSE_SUCCESS_IR_DETECTED", product: this.m.product, ir_status: "ITEM_DROPPED" });
  }
  simulateTimeout() {
    this.m.simulateTimeout();
    this.m.n8n({ event: "DISPENSE_TIMEOUT_ALERT", error: "IR_SENSOR_NOT_TRIGGERED" });
  }
  manualDispense() {
    this.m.servoStart();
    this.m.n8n({ event: "MANUAL_MOTOR_B_STARTED" });
  }
  testWebhook() {
    this.m.n8n({ event: "TEST_CONNECTION", message: "Prueba de enlace exitosa entre IAFantasma y n8n" });
  }
  testVoice() {
    this.m.speak("¡Buuu! 👻 Soy IAFantasma impulsado por ElevenLabs. Tu orden de voz y el flujo n8n están sincronizados.");
  }
}

export const machine = new Machine();
export const actions = new Actions(machine);

export function useMachine() {
  return useSyncExternalStore(machine.subscribe, machine.get, machine.getServer);
}
