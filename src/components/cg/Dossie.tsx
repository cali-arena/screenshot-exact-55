import type { ReactNode } from "react";
import { Download, FileCheck2 } from "lucide-react";
import { LOGO } from "@/data/plant";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function Dossie({ open, onOpenChange, titulo, children }: { open: boolean; onOpenChange: (o: boolean) => void; titulo: string; children: ReactNode }) {
  const hash = "SHA-256 7f3a·c91e·0b44·d2a8·91fe·6c03";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Prévia do PDF</DialogTitle></DialogHeader>
        <div className="print-area rounded-md bg-foreground p-8 text-ink">
          <div className="flex items-center justify-between border-b-2 border-primary pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded bg-ink p-1"><img src={LOGO} alt="" className="h-12" /></div>
              <div><div className="text-lg font-bold">{titulo}</div><div className="text-xs opacity-70">Carbono Química · São Bernardo do Campo/SP · Carbono Guard AI</div></div>
            </div>
            <div className="text-right font-mono text-[10px] opacity-70">Emitido em<br />{new Date().toLocaleString("pt-BR")}</div>
          </div>
          <div className="py-4 text-sm">{children}</div>
          <div className="mt-4 flex items-center justify-between border-t border-ink/20 pt-3 text-[10px]">
            <div className="flex items-center gap-2"><FileCheck2 className="size-5 text-ok" /><div><b>Assinatura digital (simulada)</b><br /><span className="font-mono">{hash}</span></div></div>
            <div className="opacity-70">powered by AntiF · SitecomAI</div>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-md bg-brand py-2 text-sm font-semibold text-primary-foreground"><Download className="size-4" />Baixar PDF</button>
      </DialogContent>
    </Dialog>
  );
}
