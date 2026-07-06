import { toast } from 'sonner'
import { haptic } from './haptics'

export function notify(message: string): void {
  toast(message)
}

export function notifySuccess(message: string): void {
  haptic(10)
  toast.success(message)
}

export function notifyError(message: string): void {
  toast.error(message)
}

/** Optimistic action with an Undo affordance. */
export function notifyUndo(message: string, onUndo: () => void): void {
  haptic(14)
  toast(message, {
    action: { label: 'Undo', onClick: onUndo },
    duration: 6000,
  })
}

export { toast }
