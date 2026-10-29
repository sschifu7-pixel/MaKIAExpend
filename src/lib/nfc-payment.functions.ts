import { createServerFn } from "@tanstack/react-start";

/* ===========================================================================
 * LLAVES DEL SMART CONTRACT (VendingPayments.sol)
 * Descomenta y rellena para activar pagos reales en blockchain.
 * Mientras estén comentadas, el pago NFC funciona en modo simulación.
 * Si las escribes aquí, usa estas constantes en lugar de process.env abajo.
 * Recomendado: en lugar de escribirlas aquí, guárdalas como secretos del
 * proyecto con estos mismos nombres (se leen desde process.env).
 * ===========================================================================
 */
// const VENDING_PRIVATE_KEY = "0x...";        // Llave privada de la cuenta operadora (la máquina)
// const VENDING_CONTRACT_ADDRESS = "0x...";   // Dirección del contrato desplegado
// const VENDING_RPC_URL = "https://sepolia.base.org"; // RPC de la red (Base Sepolia por defecto)
// const VENDING_CHAIN_ID = 84532;             // 84532 = Base Sepolia, 8453 = Base mainnet

const abi = [
  {
    type: "function",
    name: "pay",
    stateMutability: "nonpayable",
    inputs: [
      { name: "cardId", type: "bytes32" },
      { name: "productId", type: "uint8" },
    ],
    outputs: [],
  },
] as const;

export type NfcPaymentResult = { mode: "simulated" } | { mode: "onchain"; txHash: string } | { mode: "error"; message: string };

export const payWithNfc = createServerFn({ method: "POST" })
  .validator((d: { uid: string; productId: number }) => {
    if (!/^[0-9A-Fa-f:]{4,20}$/.test(d.uid)) throw new Error("UID inválido");
    if (![0, 1, 2].includes(d.productId)) throw new Error("Producto inválido");
    return d;
  })
  .handler(async ({ data }): Promise<NfcPaymentResult> => {
    const privateKey = process.env["VENDING_PRIVATE_KEY"];
    const contract = process.env["VENDING_CONTRACT_ADDRESS"];
    if (!privateKey || !contract) return { mode: "simulated" };

    try {
      const { createWalletClient, http, keccak256, toBytes, defineChain } = await import("viem");
      const { privateKeyToAccount } = await import("viem/accounts");
      const rpc = process.env["VENDING_RPC_URL"] || "https://sepolia.base.org";
      const chain = defineChain({
        id: Number(process.env["VENDING_CHAIN_ID"] || 84532),
        name: "vending",
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [rpc] } },
      });
      const client = createWalletClient({ account: privateKeyToAccount(privateKey as `0x${string}`), chain, transport: http(rpc) });
      const cardId = keccak256(toBytes(data.uid.toUpperCase()));
      const txHash = await client.writeContract({ address: contract as `0x${string}`, abi, functionName: "pay", args: [cardId, data.productId] });
      return { mode: "onchain", txHash };
    } catch (e) {
      console.error("NFC payment failed", e);
      return { mode: "error", message: "No se pudo completar el pago en blockchain (saldo insuficiente o red no disponible)." };
    }
  });
