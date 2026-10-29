import { useState } from "react";
import { StatusBar } from "./vending/StatusBar";
import { GhostPanel } from "./vending/GhostPanel";
import { CatalogPanel } from "./vending/CatalogPanel";
import { HardwarePanel } from "./vending/HardwarePanel";
import { ConfigDialog } from "./vending/ConfigDialog";

export function VendingControl() {
  const [configOpen, setConfigOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 p-4 md:p-5">
      <StatusBar onOpenConfig={() => setConfigOpen(true)} />
      <div className="grid gap-4 xl:grid-cols-3">
        <GhostPanel />
        <CatalogPanel />
        <HardwarePanel />
      </div>
      {configOpen && <ConfigDialog onClose={() => setConfigOpen(false)} />}
    </div>
  );
}
