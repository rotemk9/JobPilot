"use client";

import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

const iconFor = {
  default: <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />,
  success: <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />,
  destructive: <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />,
};

export function Toaster() {
  const { toasts } = useToast();
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          {iconFor[(variant as keyof typeof iconFor) || "default"]}
          <div className="flex-1 space-y-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
