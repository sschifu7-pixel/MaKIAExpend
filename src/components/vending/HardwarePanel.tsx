import { machine, useMachine } from "@/lib/machine";
import { cn } from "@/lib/utils";
import { Box, Card, btn } from "./ui";

const logTone = { rx: "text-success", tx: "text-primary", sys: "text-muted-foreground" } as const;

export function HardwarePanel() {
  const s = useMachine();

  return (
    <Card title="⚙️ Telemetría de Hardware" tag="ESP32 & PICO RP2040">
      <Box title="🔄 Motor B (L298N Dispensador)" pins="Pico IN3=GP8, IN4=GP7, ENB=GP6" active={s.servoRunning}>
        <div className="mb-3 flex items-center gap-4">
          <div
            className={cn("flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed border-primary text-2xl", s.servoRunning && "animate-spin")}
            style={{ animationDirection: s.servoInverted ? "reverse" : "normal" }}
          >
            ⚙️
          </div>
          <div className="space-y-1 font-mono text-xs">
            <p className={s.servoRunning ? "font-bold text-primary" : "text-muted-foreground"}>{s.servoRunning ? "DESPACHANDO" : "DETENIDO"}</p>
            <p>Duty: <strong>{s.servoDuty}</strong></p>
            <p>Sentido: <strong className={s.servoInverted ? "text-accent" : ""}>{s.servoInverted ? "CONTRARIO (3800)" : "NORMAL (6000)"}</strong></p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button className={btn} onClick={() => machine.toggleDirection()}>🔀 Invertir sentido</button>
          <button className={btn} disabled={!s.servoRunning} onClick={() => machine.servoStop()}>⏹ Parar motor</button>
        </div>
      </Box>

      <Box title="🔴 Sensor Infrarrojo IR" pins="Pico GP14 (Caída de Producto)" active={s.irTriggered}>
        <p className={cn("font-mono text-xs font-bold", s.irTriggered ? "text-success" : "text-muted-foreground")}>
          {s.irTriggered ? "PRODUCTO DETECTADO (0)" : "HAZ DESPEJADO (1)"}
        </p>
      </Box>

      <div className="flex flex-col rounded-xl border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2 text-xs font-bold">
          📟 Registro UART & n8n
          <button className={btn} onClick={() => machine.clearLogs()}>Limpiar</button>
        </div>
        <div className="h-64 overflow-y-auto p-2 font-mono text-[11px]">
          {s.logs.length === 0 && <p className="text-muted-foreground">Sin tráfico serie aún.</p>}
          {s.logs.map((l, i) => (
            <p key={i} className={logTone[l.direction]}>
              <span className="opacity-60">[{l.time}]</span> {l.direction.toUpperCase()}: {l.text}
            </p>
          ))}
        </div>
      </div>
    </Card>
  );
}
