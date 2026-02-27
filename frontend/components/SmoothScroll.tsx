'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

// Extend window to hold the lenis instance
declare global {
    interface Window {
        lenis?: Lenis
    }
}

export default function SmoothScroll() {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true,
            touchMultiplier: 1.5,
            infinite: false,
        })

        // Make lenis globally accessible so any component can call stop()/start()
        window.lenis = lenis

        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        const rafId = requestAnimationFrame(raf)

        return () => {
            cancelAnimationFrame(rafId)
            lenis.destroy()
            window.lenis = undefined
        }
    }, [])

    return null
}
