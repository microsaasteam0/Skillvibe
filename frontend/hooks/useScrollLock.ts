import { useEffect } from 'react'

/**
 * Locks page scroll (both CSS overflow AND Lenis smooth scroll)
 * whenever `isLocked` is true. Automatically restores on unlock/unmount.
 */
export function useScrollLock(
    isLocked: boolean,
    options: { stopLenis?: boolean } = {}
) {
    const { stopLenis = true } = options

    useEffect(() => {
        if (isLocked) {
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
            if (stopLenis && typeof window !== 'undefined') {
                // Stop Lenis when full page should be frozen.
                window.lenis?.stop()
            }
        } else {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
            if (stopLenis && typeof window !== 'undefined') {
                window.lenis?.start()
            }
        }

        return () => {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
            if (stopLenis && typeof window !== 'undefined') {
                window.lenis?.start()
            }
        }
    }, [isLocked, stopLenis])
}
