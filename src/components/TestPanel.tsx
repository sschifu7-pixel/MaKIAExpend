import { useState } from "react";
import { actions, machine, useMachine, type GhostEmotion } from "@/lib/machine";
import { cn } from "@/lib/utils";
import { Card, btn, btnAccent, input } from "./vending/ui";

const voicePhrases = ["Quiero una Soda Web3", "Dame un Cyber Snack", "Comprar Crypto Energy", "Cancelar"];
const emotions: [GhostEmotion, string][] = [
  ["idle", "💤 Reposo"],
  ["thinking", "🤔 Esperando NFC"],
  ["happy", "✨ Pago aprobado"],
  ["surprised", "⚡ Error"],
];

/** All simulations and diagnostics, kept apart from the real machine controls. */
export function TestPanel() {
  const s = useMachine();
  const [uid, setUid] = useState("4A:8F:12:9C");

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-3">
      <Card title="🎙️ Órdenes de voz" tag="SIMULACIÓN">
        <div className="flex flex-wrap gap-1.5">
          {voicePhrases.map((p) => (
            <button key={p} className={btn} onClick={() => machine.voiceCommand(p)}>"{p}"</button>
          ))}
        </div>
        <p className="text-[11px] text-primary">{s.lastIntent}</p>
      </Card>

      <Card title="💳 Pago NFC" tag="SIMULACIÓN">
        <label className="flex items-center gap-2 text-xs">
          UID
          <input aria-label="UID de la tarjeta" className={cn(input, "flex-1 font-mono")} maxLength={14} value={uid} onChange={(e) => setUid(e.target.value)} />
        </label>
        <button className={btnAccent} disabled={s.servoRunning} onClick={() => actions.tapCard(uid)}>⚡ Acercar tarjeta / tag NFC</button>
      </Card>

      <Card title="🔄 Motor y sensor IR" tag="SIMULACIÓN">
        <div className="grid grid-cols-2 gap-1.5">
          <button className={btn} disabled={s.servoRunning} onClick={() => actions.manualDispense()}>▶ Despacho manual</button>
          <button className={btn} onClick={() => actions.simulateDrop()}>✅ Caída detectada</button>
          <button className={btn} onClick={() => actions.simulateTimeout()}>⚠️ Timeout sin caída</button>
        </div>
      </Card>

      <Card title="👻 Emociones (TFT)" tag="SIMULACIÓN">
        <div className="grid grid-cols-2 gap-1.5">
          {emotions.map(([e, l]) => (
            <button key={e} className={cn(btn, s.emotion === e && "border-primary text-primary")} onClick={() => machine.setEmotion(e)}>{l}</button>
          ))}
        </div>
      </Card>

      <Card title="🔗 Integraciones" tag="DIAGNÓSTICO">
        <div className="grid grid-cols-2 gap-1.5">
          <button className={btn} disabled={s.sendingN8n} onClick={() => actions.testWebhook()}>{s.sendingN8n ? "Enviando..." : "Probar webhook n8n"}</button>
          <button className={btn} onClick={() => actions.testVoice()}>🔊 Probar voz</button>
        </div>
        <p className="text-xs text-muted-foreground">n8n: {s.n8nStatus} · Voz: {s.apiKey ? "ElevenLabs" : "nativa"}</p>
      </Card>
    </div>
  );
}
