import { machine, useMachine } from "@/lib/machine";
import { cn } from "@/lib/utils";
import { btn, btnAccent, btnPrimary, input } from "./ui";

export function StatusBar({ onOpenConfig }: { onOpenConfig: () => void }) {
  const s = useMachine();
  const prod = s.catalogo[s.opcion];
  const tone = s.estado === "ESPERANDO_PAGO" ? "text-warning" : s.estado === "PAGO_EXITOSO" ? "text-success" : "text-primary";
  const link = (on: boolean) => cn("flex items-center gap-2 rounded-lg border px-2 py-1 text-xs", on && "border-success text-success");

  return (
    <header className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <span className={cn("flex items-center gap-2 font-mono text-xs font-bold", tone)}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> ESTADO: {s.estado}
        </span>
        <span className="text-xs text-muted-foreground">
          PRODUCTO ACTIVO: <strong className="text-foreground">[{s.opcion + 1}] {prod?.nombre}</strong>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => machine.toggleListening()} className={s.isListening ? cn(btnAccent, "glow-accent animate-pulse") : btnPrimary}>
          {s.isListening ? "🔴 Escuchando Voz..." : "🎙️ Pedir por Voz"}
        </button>
        <button className={btn} onClick={onOpenConfig}>⚙️ AI & n8n</button>

        <div className={link(s.serialConnected)}>
          🔌 {s.serialPortName}
          {s.serialConnected ? (
            <button className={btn} onClick={() => machine.disconnectSerial()}>Desconectar</button>
          ) : (
            <button className={btn} onClick={() => machine.connectSerial()}>USB</button>
          )}
        </div>

        <div className={link(s.wifiConnected)}>
          📶
          {s.wifiConnected ? (
            <>
              Wi-Fi ({s.esp32Ip})
              <button className={btn} onClick={() => machine.disconnectWifi()}>Desconectar</button>
            </>
          ) : (
            <>
              <input aria-label="IP del ESP32" className={cn(input, "w-28")} value={s.esp32Ip} onChange={(e) => machine.setIp(e.target.value)} />
              <button className={btn} onClick={() => machine.connectWifi()}>Conectar Wi-Fi</button>
            </>
          )}
        </div>

        <button className={btn} onClick={() => machine.toggleSound()} aria-label="Sonido">{s.soundEnabled ? "🔊" : "🔇"}</button>
      </div>
    </header>
  );
}
