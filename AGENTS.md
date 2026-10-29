<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Vending machine state, hardware links (Web Serial/WebSocket), ElevenLabs TTS and n8n calls live in one client-side store (`src/lib/machine.ts`); pure parsing rules live in separate testable modules. Why: mirrors the original Angular services and keeps browser-only APIs out of SSR.
- NFC payments go through a server function that calls the VendingPayments contract (contracts/); with no keys configured it falls back to simulated mode. Why: keys never reach the browser and the demo works without a chain.
