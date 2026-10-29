import { useState } from "react";
import { DEFAULT_VOICE, machine } from "@/lib/machine";
import { cn } from "@/lib/utils";
import { btnPrimary, input } from "./ui";

const voicePresets = [
  { id: DEFAULT_VOICE, name: "Rachel (Espectral / Serena)" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam (Profundo / Épico)" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Enérgico)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi (Dinámica)" },
];

export function ConfigDialog({ onClose }: { onClose: () => void }) {
  const { apiKey, voiceId, n8nUrl } = machine.state;
  const [cfg, setCfg] = useState({ apiKey, voiceId, n8nUrl });
  const field = cn(input, "w-full py-2");

  const save = () => {
    machine.saveConfig(cfg.apiKey, cfg.voiceId, cfg.n8nUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div role="dialog" aria-label="Configuración" className="panel w-full max-w-lg space-y-4 bg-popover p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">⚙️ ElevenLabs AI & n8n Workflow</h3>
          <button onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <label className="block space-y-1 text-xs">
          <span>ElevenLabs API Key</span>
          <input type="password" className={field} placeholder="sk_..." value={cfg.apiKey} onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} />
          <span className="block text-muted-foreground">Se guarda solo en este navegador. Si se deja vacía, se usa la voz nativa.</span>
        </label>
        <label className="block space-y-1 text-xs">
          <span>Voz espectral</span>
          <select className={field} value={cfg.voiceId} onChange={(e) => setCfg({ ...cfg, voiceId: e.target.value })}>
            {voicePresets.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          <span>URL del Webhook n8n</span>
          <input className={field} value={cfg.n8nUrl} onChange={(e) => setCfg({ ...cfg, n8nUrl: e.target.value })} />
        </label>
        <div className="flex justify-end">
          <button className={btnPrimary} onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
