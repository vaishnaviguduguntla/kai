import { useNavigate } from "react-router-dom";
import { useCompareStore } from "@/store/compare.store";
import { Button } from "@/components/ui/Button";

export default function CompareTray() {
  const navigate = useNavigate();
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const clear = useCompareStore((s) => s.clear);
  const max = useCompareStore((s) => s.max);

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(980px,calc(100%-24px))] rounded-2xl border border-white/10 bg-[#0f1b2d] shadow-[0_14px_40px_rgba(0,0,0,0.45)] px-4 py-3 flex items-center justify-between">
      <div className="text-sm text-slate-200">
        Selected <span className="font-semibold text-white">{selectedIds.length}</span> / {max} for compare
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outlined" onClick={clear}>
          Clear
        </Button>
        <Button onClick={() => navigate("/compare")}>Compare</Button>
      </div>
    </div>
  );
}
