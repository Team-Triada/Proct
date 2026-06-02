import { useEffect } from 'react'

export interface ProctoringEngineProps {
    attemptId: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    question: any
    completed: boolean
    logViolation: (type: string) => Promise<void>
    setScreenProtectionActive: (active: boolean) => void
    setIsFullscreen: (fullscreen: boolean) => void
    safeWriteClipboard: (value: string) => void
}

export function useProctoringEngine({
    attemptId,
    question,
    completed,
    logViolation,
    setScreenProtectionActive,
    setIsFullscreen,
    safeWriteClipboard
}: ProctoringEngineProps) {

    // SCREENSHOT PREVENTION 1: Screen Capture API Detection
    useEffect(() => {
        if (!attemptId || completed) return

        // Detect if screen is being captured/recorded
        const checkScreenCapture = async () => {
            try {
                // Check if getDisplayMedia is being used (screen recording)
                if ('getDisplayMedia' in navigator.mediaDevices) {
                    // We can't directly detect, but we can check for active captures
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const devices = await navigator.mediaDevices.enumerateDevices()
                    // Monitor for new media devices that might indicate recording
                }
            } catch { }
        }

        // Check periodically
        const interval = setInterval(checkScreenCapture, 5000)
        return () => clearInterval(interval)
    }, [attemptId, completed])

    // SCREENSHOT PREVENTION 2: Visibility Change with Screenshot Timing Detection
    useEffect(() => {
        if (!attemptId || !question || completed) return

        let lastHiddenTime = 0

        const handleVisibility = () => {
            if (document.hidden) {
                lastHiddenTime = Date.now()
                // Immediately trigger screen protection
                setScreenProtectionActive(true)
                logViolation('TAB_SWITCH')
            } else {
                // Check if it was a quick hide (potential screenshot)
                const hiddenDuration = Date.now() - lastHiddenTime
                if (hiddenDuration < 500 && lastHiddenTime > 0) {
                    logViolation('SCREENSHOT_DETECTED')
                }
                // Delay removing protection to catch screenshots
                setTimeout(() => setScreenProtectionActive(false), 300)
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [attemptId, question, completed, logViolation, setScreenProtectionActive])

    // SCREENSHOT PREVENTION 3: Window Blur with Screenshot Detection
    useEffect(() => {
        if (!attemptId || !question || completed) return

        let blurTime = 0

        const handleBlur = () => {
            blurTime = Date.now()
            setScreenProtectionActive(true)
            logViolation('APP_SWITCH')
        }

        const handleFocus = () => {
            const blurDuration = Date.now() - blurTime
            // Very quick blur-focus might indicate screenshot
            if (blurDuration < 300 && blurTime > 0) {
                logViolation('QUICK_BLUR_DETECTED')
            }
            setTimeout(() => setScreenProtectionActive(false), 200)
        }

        window.addEventListener('blur', handleBlur)
        window.addEventListener('focus', handleFocus)

        return () => {
            window.removeEventListener('blur', handleBlur)
            window.removeEventListener('focus', handleFocus)
        }
    }, [attemptId, question, completed, logViolation, setScreenProtectionActive])

    // SCREENSHOT PREVENTION 4: Key Combinations for Screenshots
    useEffect(() => {
        if (!attemptId || completed) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent PrintScreen
            if (e.key === 'PrintScreen') {
                e.preventDefault()
                e.stopPropagation()
                safeWriteClipboard('')
                logViolation('SCREENSHOT_ATTEMPT')
                return false
            }

            // Windows Snipping Tool: Win+Shift+S
            if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault()
                logViolation('SNIPPING_TOOL')
                return false
            }

            // Mac Screenshot: Cmd+Shift+3 or Cmd+Shift+4
            if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
                e.preventDefault()
                logViolation('MAC_SCREENSHOT')
                return false
            }

            // Prevent Ctrl+P (print)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                e.preventDefault()
                logViolation('PRINT_ATTEMPT')
                return false
            }

            // Prevent other shortcuts
            if (
                (e.ctrlKey || e.metaKey) &&
                ['c', 'v', 'x', 'a', 's', 'f', 'r'].includes(e.key.toLowerCase())
            ) {
                e.preventDefault()
                if (['c', 'v', 'x'].includes(e.key.toLowerCase())) {
                    logViolation('COPY_PASTE_SHORTCUT')
                }
            }

            // Prevent F12 (DevTools)
            if (e.key === 'F12') {
                e.preventDefault()
                logViolation('DEVTOOLS_ATTEMPT')
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            // Clear clipboard after PrintScreen release
            if (e.key === 'PrintScreen') {
                safeWriteClipboard('Screenshot disabled')
            }
        }

        document.addEventListener('keydown', handleKeyDown, true)
        document.addEventListener('keyup', handleKeyUp, true)

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true)
            document.removeEventListener('keyup', handleKeyUp, true)
        }
    }, [attemptId, completed, logViolation, safeWriteClipboard])

    // SCREENSHOT PREVENTION 5: Copy/Paste/Cut Prevention
    useEffect(() => {
        if (!attemptId || completed) return

        const preventCopy = (e: ClipboardEvent) => {
            e.preventDefault()
            // Clear clipboard
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', '')
            }
            logViolation('COPY_ATTEMPT')
        }

        const preventContextMenu = (e: MouseEvent) => {
            e.preventDefault()
            return false
        }

        document.addEventListener('copy', preventCopy, true)
        document.addEventListener('cut', preventCopy, true)
        document.addEventListener('contextmenu', preventContextMenu, true)

        return () => {
            document.removeEventListener('copy', preventCopy, true)
            document.removeEventListener('cut', preventCopy, true)
            document.removeEventListener('contextmenu', preventContextMenu, true)
        }
    }, [attemptId, completed, logViolation])

    // FULLSCREEN ENFORCEMENT
    useEffect(() => {
        if (!attemptId || completed) return

        const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent)
        if (isIOS) {
            setIsFullscreen(true)
            return
        }

        // Check if the browser actually supports fullscreen on the document element (e.g. iPhones do not)
        const el = document.documentElement
        const canFullscreen = !!(el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen)
        
        if (!canFullscreen) {
            setIsFullscreen(true) // Bypass enforcement if unsupported
            return
        }

        const handleFullscreenChange = () => {
            const doc = document as Document & { webkitFullscreenElement?: Element | null }
            const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement)
            setIsFullscreen(isFs)
            if (!isFs) {
                logViolation('FULLSCREEN_EXIT')
            }
        }

        // Check initial state
        const doc = document as Document & { webkitFullscreenElement?: Element | null }
        const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement)
        setIsFullscreen(isFs)

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
        }
    }, [attemptId, completed, logViolation, setIsFullscreen])

    // SCREENSHOT PREVENTION 6: Drag Prevention
    useEffect(() => {
        if (!attemptId || completed) return

        const preventDrag = (e: DragEvent) => {
            e.preventDefault()
            return false
        }

        document.addEventListener('dragstart', preventDrag, true)
        document.addEventListener('drop', preventDrag, true)

        return () => {
            document.removeEventListener('dragstart', preventDrag, true)
            document.removeEventListener('drop', preventDrag, true)
        }
    }, [attemptId, completed])

    // SCREENSHOT PREVENTION 7: Text Selection Prevention
    useEffect(() => {
        if (!attemptId || completed) return

        const preventSelection = (e: Event) => {
            const target = e.target as HTMLElement
            // Allow selection in inputs and textareas
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return
            }
            e.preventDefault()
            if (window.getSelection) {
                window.getSelection()?.removeAllRanges()
            }
        }

        const handleSelectionChange = () => {
            const activeElement = document.activeElement
            // If user is typing in an input, don't clear selection (cursor)
            if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
                return
            }
            if (window.getSelection) {
                window.getSelection()?.removeAllRanges()
            }
        }

        document.addEventListener('selectstart', preventSelection, true)
        document.addEventListener('selectionchange', handleSelectionChange, true)

        return () => {
            document.removeEventListener('selectstart', preventSelection, true)
            document.removeEventListener('selectionchange', handleSelectionChange, true)
        }
    }, [attemptId, completed])

    // SCREENSHOT PREVENTION 8: CSS Protection (inject styles)
    useEffect(() => {
        if (!attemptId || completed) return

        // Add CSS-based protections
        const style = document.createElement('style')
        style.id = 'screenshot-protection'
        style.textContent = `
      /* Prevent image saving */
      img {
        -webkit-touch-callout: none;
        pointer-events: none;
      }
      
      /* Prevent text selection globally */
      /* Prevent text selection globally */
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      /* Allow selection only in input fields */
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        cursor: text !important;
        pointer-events: auto !important;
        touch-action: manipulation !important;
      }
      
      /* Prevent printing */
      @media print {
        body {
          display: none !important;
        }
        html::after {
          content: "Printing is disabled for security reasons";
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px;
        }
      }
    `
        document.head.appendChild(style)

        return () => {
            const existingStyle = document.getElementById('screenshot-protection')
            if (existingStyle) {
                existingStyle.remove()
            }
        }
    }, [attemptId, completed])

    // SCREENSHOT PREVENTION 9: Back Navigation Prevention
    useEffect(() => {
        if (!attemptId || completed) return

        window.history.pushState(null, '', window.location.href)

        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href)
            logViolation('BACK_NAVIGATION')
        }

        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [attemptId, completed, logViolation])

    // SCREENSHOT PREVENTION 10: Window Resize Detection
    useEffect(() => {
        if (!attemptId || !question || completed) return

        const originalWidth = window.innerWidth
        const originalHeight = window.innerHeight

        const handleResize = () => {
            const widthDiff = Math.abs(window.innerWidth - originalWidth)
            const heightDiff = Math.abs(window.innerHeight - originalHeight)

            // Check if mobile (keyboard opens -> height changes, width stays same)
            const isMobile = window.innerWidth < 768 || 'ontouchstart' in window

            if (isMobile) {
                // On mobile, only care if WIDTH changes (split screen, rotation)
                // Ignore height changes (keyboard)
                if (widthDiff > 100) {
                    logViolation('WINDOW_RESIZE')
                }
            } else {
                // Desktop: Strict check
                if (widthDiff > 200 || heightDiff > 200) {
                    logViolation('WINDOW_RESIZE')
                }
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [attemptId, question, completed, logViolation])

    // SCREENSHOT PREVENTION 11: DevTools Detection (Desktop only)
    useEffect(() => {
        if (!attemptId || completed) return

        // Skip DevTools detection on mobile/touch devices
        // iOS Safari has no DevTools, and the window size difference 
        // is caused by Safari UI chrome, notches, and safe areas
        const isMobileOrTouch = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

        if (isMobileOrTouch) {
            console.log('[Integrity] Skipping DevTools detection on mobile device')
            return
        }

        let devToolsOpen = false
        let wasFullscreen = false

        const detectDevTools = () => {
            const isFullscreen = Boolean(
                document.fullscreenElement ||
                (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
            )

            if (isFullscreen) {
                devToolsOpen = false
                wasFullscreen = true
                return
            }

            if (wasFullscreen) {
                wasFullscreen = false
                return
            }

            const threshold = 160
            const widthThreshold = window.outerWidth - window.innerWidth > threshold
            const heightThreshold = window.outerHeight - window.innerHeight > threshold

            if (widthThreshold || heightThreshold) {
                if (!devToolsOpen) {
                    devToolsOpen = true
                    logViolation('DEVTOOLS_OPENED')
                }
            } else {
                devToolsOpen = false
            }
        }

        const interval = setInterval(detectDevTools, 1000)
        window.addEventListener('resize', detectDevTools)

        return () => {
            clearInterval(interval)
            window.removeEventListener('resize', detectDevTools)
        }
    }, [attemptId, completed, logViolation])

    // SCREENSHOT PREVENTION 12: iOS Safari Multi-Touch Detection (Screenshot gesture)
    useEffect(() => {
        if (!attemptId || completed) return

        // Detect iOS screenshot gesture (power + volume or 3-finger drag)
        const handleTouchStart = (e: TouchEvent) => {
            // iOS screenshot often involves 3+ touches
            if (e.touches.length >= 3) {
                logViolation('MULTI_TOUCH_GESTURE')
            }
        }

        // Prevent pinch-to-zoom (used in screen capture workflows)
        const handleGestureStart = (e: Event) => {
            e.preventDefault()
        }

        document.addEventListener('touchstart', handleTouchStart, { passive: true })
        // Safari-specific gesture events
        document.addEventListener('gesturestart', handleGestureStart, true)
        document.addEventListener('gesturechange', handleGestureStart, true)
        document.addEventListener('gestureend', handleGestureStart, true)

        return () => {
            document.removeEventListener('touchstart', handleTouchStart)
            document.removeEventListener('gesturestart', handleGestureStart, true)
            document.removeEventListener('gesturechange', handleGestureStart, true)
            document.removeEventListener('gestureend', handleGestureStart, true)
        }
    }, [attemptId, completed, logViolation])

    // SCREENSHOT PREVENTION 13: iOS Safari Screen Capture API & Page Lifecycle
    useEffect(() => {
        if (!attemptId || completed) return

        // Screen Capture API detection (Safari 13+)
        const handleScreenCapture = () => {
            logViolation('SCREEN_CAPTURE_DETECTED')
            setScreenProtectionActive(true)
            setTimeout(() => setScreenProtectionActive(false), 2000)
        }

        let restoreGetDisplayMedia: (() => void) | null = null

        // Check for getDisplayMedia (modern browsers)
        if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            const mediaDevices = navigator.mediaDevices as MediaDevices & {
                getDisplayMedia?: () => Promise<MediaStream>
            }
            const originalGetDisplayMedia = mediaDevices.getDisplayMedia?.bind(mediaDevices)

            try {
                mediaDevices.getDisplayMedia = async () => {
                    handleScreenCapture()
                    throw new Error('Screen capture is not allowed during the quiz')
                }
            } catch { }

            restoreGetDisplayMedia = () => {
                if (originalGetDisplayMedia) {
                    try {
                        mediaDevices.getDisplayMedia = originalGetDisplayMedia
                    } catch { }
                }
            }
        }

        // iOS Safari uses pageshow/pagehide more reliably than visibilitychange
        const handlePageHide = () => {
            logViolation('PAGE_HIDE_IOS')
        }

        // Handle iOS app switcher
        const handlePageShow = (e: PageTransitionEvent) => {
            if (e.persisted) {
                // Page was restored from bfcache (user switched apps)
                logViolation('APP_SWITCH_IOS')
            }
        }

        window.addEventListener('pagehide', handlePageHide)
        window.addEventListener('pageshow', handlePageShow)

        return () => {
            restoreGetDisplayMedia?.()
            window.removeEventListener('pagehide', handlePageHide)
            window.removeEventListener('pageshow', handlePageShow)
        }
    }, [attemptId, completed, logViolation, setScreenProtectionActive])

    // SCREENSHOT PREVENTION 14: Orientation Lock Detection (mobile)
    useEffect(() => {
        if (!attemptId || completed) return

        const handleOrientationChange = () => {
            // Orientation change could indicate screenshot attempt or screen recording start
            console.log('[Integrity] Orientation changed')
        }

        // Use both APIs for compatibility
        if ('orientation' in screen) {
            screen.orientation?.addEventListener('change', handleOrientationChange)
        }
        window.addEventListener('orientationchange', handleOrientationChange)

        return () => {
            screen.orientation?.removeEventListener('change', handleOrientationChange)
            window.removeEventListener('orientationchange', handleOrientationChange)
        }
    }, [attemptId, completed])

    // SCREENSHOT PREVENTION 15: iOS Safari Long Press Prevention
    useEffect(() => {
        if (!attemptId || completed) return

        const preventLongPress = (e: TouchEvent) => {
            // Prevent iOS long-press context menu
            if (e.touches.length === 1) {
                e.target?.addEventListener('touchend', () => { }, { once: true })
            }
        }

        // Add webkit touch callout meta tag dynamically
        const meta = document.createElement('meta')
        meta.name = 'apple-mobile-web-app-capable'
        meta.content = 'yes'
        document.head.appendChild(meta)

        document.addEventListener('touchstart', preventLongPress, { passive: true })

        return () => {
            document.removeEventListener('touchstart', preventLongPress)
            meta.remove()
        }
    }, [attemptId, completed])

}
