# MaKIAExpend — Máquina expendedora Web3 con asistente fantasma "IAFantasma"

Panel web para controlar una máquina expendedora con pagos NFC en USDC (Base Sepolia),
asistente fantasma animado, pedidos por voz y notificaciones por voz + Telegram vía n8n.

## Características

- **Asistente fantasma (IAFantasma)**: avatar SVG animado con emociones y chat local por palabras clave (español).
- **Pedidos por voz**: reconocimiento de voz del navegador (`SpeechRecognition`, es-MX) con reglas de intención
  (`SELECT_PRODUCT`, `PROCEED_PAYMENT`, `CANCEL`, `DISPENSE`).
- **Voz del fantasma**: síntesis de voz por ElevenLabs (el usuario introduce su API key en el panel) con
  fallback a `speechSynthesis` nativo.
- **Pagos NFC**: server function `payWithNfc` que llama al contrato `VendingPayments` (USDC) en Base Sepolia;
  sin llaves configuradas funciona en modo simulado. Ver `contracts/VendingPayments.sol`.
- **Hardware**: conexión USB (Web Serial) y Wi-Fi (WebSocket) al ESP32; joystick, motor y sensor IR con telemetría en vivo.
- **n8n**: cada acción del panel notifica al webhook `vending-order`; flujo unificado importable con
  enrutado de eventos, TTS y Telegram (ver artefactos entregados en el chat).

## Desarrollo

```sh
npm i
npm run dev
```

## Estructura

- `src/lib/machine.ts` — store central del estado de la máquina, hardware (Serial/WS), voz y llamadas a n8n.
- `src/lib/voice-intent.ts` — reglas puras de interpretación de comandos de voz.
- `src/lib/chat-responses.ts` — respuestas locales del chat del fantasma.
- `src/lib/nfc-payment.functions.ts` — server function de pago NFC (llaves comentadas arriba del archivo).
- `src/components/` — UI: panel de máquina, chat, panel de pruebas, avatar fantasma.
- `contracts/VendingPayments.sol` — contrato de pagos NFC en USDC.

## Probar

```sh
npx vitest run
```

Built with Lovable · TanStack Start · React · Tailwind CSS
