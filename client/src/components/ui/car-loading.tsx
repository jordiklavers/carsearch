import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Car, Loader2 } from "lucide-react";

export interface CarLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The size of the loading indicator
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * The text to display below the loading indicator
   */
  text?: string;
  
  /**
   * Whether to show the loading indicator in a centered fullscreen view
   * @default false
   */
  fullscreen?: boolean;
  
  /**
   * Whether to use a car animation or a simple spinner
   * @default "car"
   */
  type?: "car" | "spinner";
}

export function CarLoading({
  size = "md",
  text,
  fullscreen = false,
  type = "car",
  className,
  ...props
}: CarLoadingProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  
  const trackWidth = {
    sm: "w-20",
    md: "w-32",
    lg: "w-48",
  };

  const Container = ({ children }: { children: React.ReactNode }) => (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        fullscreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );

  if (type === "spinner") {
    return (
      <Container>
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {text && <p className="mt-4 text-sm text-muted-foreground">{text}</p>}
      </Container>
    );
  }

  return (
    <Container>
      <div className="relative">
        <div
          className={cn(
            "h-1 bg-slate-200 rounded-full overflow-hidden relative",
            trackWidth[size]
          )}
        >
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ 
              width: ["0%", "100%", "0%"],
              left: ["0%", "0%", "100%"],
            }}
            transition={{ 
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
          />
        </div>
        <motion.div
          className="absolute -bottom-5"
          initial={{ left: "-10%" }}
          animate={{ left: "110%" }}
          transition={{ 
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
        >
          <Car className={cn("text-primary", size === "sm" ? "w-5 h-5" : size === "md" ? "w-6 h-6" : "w-8 h-8")} />
        </motion.div>
      </div>
      {text && <p className="mt-8 text-sm text-muted-foreground">{text}</p>}
    </Container>
  );
}