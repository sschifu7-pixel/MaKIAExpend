import { actions, machine, useMachine } from "@/lib/machine";
import { cn } from "@/lib/utils";
import { Card, btn, btnPrimary } from "./ui";

export function CatalogPanel() {
  const s = useMachine();
  const waiting = s.estado === "ESPERANDO_PAGO";

  return (
    <Card title="📦 Catálogo de Productos" tag="TFT 320x240 ILI9341">
      <p className="rounded-lg border px-3 py-2 text-xs">
        ⚡ <strong>Flujo n8n:</strong> <span className="text-muted-foreground">{s.n8nStatus}</span>
      </p>

      <div className="flex flex-col gap-2">
        {s.catalogo.map((p, i) => {
          const sel = s.opcion === i;
          return (
            <div
              key={p.id}
              onClick={() => actions.selectProduct(i)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
                sel ? "border-primary bg-secondary glow-primary" : "hover:bg-muted",
                sel && s.servoRunning && "animate-pulse",
              )}
            >
              <span className="text-3xl">{p.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] text-muted-foreground">OPCIÓN {i + 1}</p>
                <h3 className="font-bold">{p.nombre}</h3>
                <p className="text-[11px] text-muted-foreground">{p.descripcion}</p>
                <div className="mt-1 flex gap-3 text-xs">
                  <span className="font-bold text-primary">{p.precio}</span>
                  <span className={p.stock <= 1 ? "text-destructive" : "text-muted-foreground"}>Stock: {p.stock}</span>
                </div>
              </div>
              <button
                className={sel ? btnPrimary : btn}
                disabled={p.stock === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  actions.selectProduct(i);
                  machine.ok();
                }}
              >
                {sel ? "Pagar" : "Elegir"}
              </button>
            </div>
          );
        })}
      </div>

      <div className={cn("flex items-center justify-between rounded-xl border p-3 text-xs", waiting && "border-warning")}>
        <span className="font-bold">💳 Lector NFC PN532</span>
        {waiting ? (
          <span className="flex items-center gap-2">
            <span className="animate-pulse text-warning">📡 Acerca tu tarjeta…</span>
            <button className={btn} onClick={() => actions.cancelPayment()}>Cancelar</button>
          </span>
        ) : (
          <span className="font-mono text-muted-foreground">Último UID: {s.lastUid}</span>
        )}
      </div>
    </Card>
  );
}
