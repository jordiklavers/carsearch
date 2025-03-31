import { cn } from "@/lib/utils";

export function CarLoading({ className, text = "Laden..." }: { className?: string; text?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-10", className)}>
      <div className="car-loader">
        <div className="car">
          <div className="car-body"></div>
          <div className="wheel wheel-left"></div>
          <div className="wheel wheel-right"></div>
        </div>
        <div className="road"></div>
      </div>
      <p className="text-sm text-center text-muted-foreground mt-4">{text}</p>
    </div>
  );
}