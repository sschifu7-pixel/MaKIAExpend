import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { GhostAvatar } from "./GhostAvatar";
import { localReply } from "@/lib/chat-responses";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const welcome = (): Msg => ({ id: "w", role: "assistant", content: "¡Buu! 👻 Soy IAFantasma. Pregúntame lo que quieras… o pídeme un chiste.", time: now() });

export function ChatPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => setMsgs([welcome()]), []);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, thinking]);

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || thinking) return;
    setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "user", content: t, time: now() }]);
    setText("");
    setThinking(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: localReply(t), time: now() }]);
      setThinking(false);
    }, 800 + Math.random() * 1000);
  };

  return (
    <div className="mx-auto grid h-full w-full max-w-5xl gap-5 p-5 md:grid-cols-[260px_1fr]">
      <aside className="panel flex flex-col items-center gap-4 p-6 text-center">
        <GhostAvatar state={thinking ? "thinking" : "idle"} size={140} />
        <div>
          <h2 className="text-brand text-2xl font-bold">IAFantasma</h2>
          <p className="text-sm text-muted-foreground">Asistente Espectral IA</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("h-2 w-2 rounded-full", thinking ? "bg-warning" : "bg-success")} />
          {thinking ? "Pensando..." : "En línea"}
        </span>
        <div className="grid w-full grid-cols-3 gap-2 text-center">
          {[
            [String(msgs.length), "Mensajes"],
            ["∞", "Conocimiento"],
            ["👻", "Nivel"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-lg bg-muted p-2">
              <div className="font-bold text-primary">{v}</div>
              <div className="text-[10px] text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setMsgs([welcome()])} className="mt-auto flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Limpiar chat
        </button>
      </aside>

      <section className="panel flex min-h-[520px] flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <span className="font-semibold">👻 IAFantasma</span>
          <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">IA Local</span>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {msgs.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary text-secondary-foreground",
                )}
              >
                <p>{m.content}</p>
                <p className="mt-1 text-[10px] opacity-60">{m.time}</p>
              </div>
            </div>
          ))}
          {thinking && <div className="text-sm text-muted-foreground">👻 escribiendo…</div>}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje al fantasma…"
            className="flex-1 rounded-lg border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" disabled={!text.trim() || thinking} className="rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-40" aria-label="Enviar">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
