import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="toast-enhanced">
            <div className="grid gap-1">
              {title && <ToastTitle className="flex items-center gap-1.5">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-[0.92rem]">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="toast-viewport-enhanced" />
    </ToastProvider>
  )
}
