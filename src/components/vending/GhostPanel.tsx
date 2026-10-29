import { machine, useMachine } from "@/lib/machine";
import { cn } from "@/lib/utils";
import { GhostAvatar } from "../GhostAvatar";
import { Card, btn, btnAccent, btnPrimary } from "./ui";

export function GhostPanel() {
  const s = useMachine();
  const live = s.isListening || s.isPlaying;
  const waiting = s.estado === "ESPERANDO_PAGO";

  return (
    <Card title="👻 Avatar Espectral" tag={s.emotion.toUpperCase()}>
      <div className="rounded-xl border bg-secondary p-3 text-sm">{s.speech}</div>

      <div className={cn("rounded-xl border p-3", live && "border-primary glow-primary")}>
        <div className="flex items-center justify-between text-[10px] font-bold tracking-wider">
          <span className={s.isListening ? "text-accent" : s.isPlaying ? "text-primary" : "text-muted-foreground"}>
            {s.isListening ? "🎙️ ESCUCHANDO TU VOZ" : s.isPlaying ? "🔊 HABLANDO" : "ASISTENTE DE VOZ"}
          </span>
          <span className="rounded-full border px-2 py-0.5 text-muted-foreground">{s.apiKey ? "ElevenLabs TTS" : "Voz Nativa"}</span>
        </div>
        <p className="my-2 text-xs italic text-muted-foreground">"{s.transcript || "Di: Quiero una Soda, Dame un Snack, o Crypto Energy"}"</p>
        <p className="text-[11px] text-primary">{s.lastIntent}</p>
      </div>

      <div className="flex justify-center py-2">
        <GhostAvatar state={s.isPlaying && s.emotion === "idle" ? "talking" : s.emotion} />
      </div>

      <div>
        <p className="mb-1.5 text-[11px] text-muted-foreground">Joystick Pico:</p>
        <div className="mx-auto flex w-48 flex-col gap-1.5">
          <button className={btn} onClick={() => machine.prev()}>▲ ARRIBA</button>
          <button className={waiting ? btnAccent : btnPrimary} onClick={() => machine.ok()}>{waiting ? "CANCELAR" : "OK (Pagar)"}</button>
          <button className={btn} onClick={() => machine.next()}>▼ ABAJO</button>
        </div>
      </div>
    </Card>
  );
}
