export type VoiceAction = "SELECT_PRODUCT" | "PROCEED_PAYMENT" | "CANCEL" | "DISPENSE" | "UNKNOWN";

export interface VoiceIntent {
  action: VoiceAction;
  productIndex: number;
}

/** Same keyword rules as the original IAFantasma voice workflow. */
export function parseVoiceCommand(phrase: string): VoiceIntent {
  const t = phrase.toLowerCase().trim();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  let productIndex = -1;
  let action: VoiceAction = "UNKNOWN";

  if (has("soda", "refresco", "bebida", "lata", "uno", "1", "a1")) {
    productIndex = 0;
    action = "SELECT_PRODUCT";
  } else if (has("snack", "chocolate", "barra", "cyber", "dos", "2", "a2")) {
    productIndex = 1;
    action = "SELECT_PRODUCT";
  } else if (has("energy", "energía", "energetica", "crypto", "tres", "3", "a3")) {
    productIndex = 2;
    action = "SELECT_PRODUCT";
  }

  if (has("pagar", "comprar", "confirmar", "ok", "tarjeta", "nfc")) action = "PROCEED_PAYMENT";
  else if (has("cancelar", "atras", "atrás", "no", "volver", "menú")) action = "CANCEL";
  else if (has("despachar", "servir", "entregar", "motor")) action = "DISPENSE";

  return { action, productIndex };
}
