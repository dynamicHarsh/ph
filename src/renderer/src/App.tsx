import { useState, useEffect, useRef } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebaseSetup'
import Lottie from 'lottie-react'
import catIdle from './assets/cat-idle.json.json'
import catSleep from './assets/cat-sleep.json.json'
import catSearching from './assets/cat-searching.json.json'
import catFun from './assets/cat-fun.json.json'
import catCute from './assets/cat-cute.json.json'
import catCoding from './assets/cat-coding.json.json'
import catError from './assets/cat-error.json.json'
import './App.css'

interface WidgetState {
  message: string
  status: string
}

const defaultState: WidgetState = {
  message: 'Waiting for connection...',
  status: 'idle'
}

function getAnimationData(status: string) {
  // Map status to animation data - using catIdle for all states
  // Can add more animations like cat-sleep.json later
  switch (status) {
    case 'coding':
      return catCoding
    case 'sleeping':
      return catSleep
    case 'searching':
      return catSearching
    case 'love':
      return catIdle
    case 'fun':
      return catFun
    case 'cute':
      return catCute
    case 'error':
      return catError
    default:
      return catIdle
  }
}

// Declare the API type
declare global {
  interface Window {
    api: {
      setIgnoreMouseEvents: (ignore: boolean) => void
      moveWindow: (deltaX: number) => void
    }
  }
}

function App(): React.JSX.Element {
  const [widgetState, setWidgetState] = useState<WidgetState>(defaultState)
  const speechBubbleRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const fadeTimerRef = useRef<number | null>(null)
  const resetTimerRef = useRef<number | null>(null)

  // Fetch message and status from Firebase
  const fetchWidgetStatus = async () => {
    try {
      const statusRef = doc(db, 'widget', 'currentStatus')
      const docSnap = await getDoc(statusRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        const newMessage = data.message ?? defaultState.message
        const newStatus = data.status ?? defaultState.status
        
        setWidgetState({
          message: newMessage,
          status: newStatus
        })
        
        // Show the message with fade in/out
        showThoughtMessage(newMessage)
        console.log('Fetched from Firebase:', newMessage, newStatus)
      } else {
        console.log('Document does not exist')
        setWidgetState(defaultState)
        showThoughtMessage(defaultState.message)
      }
    } catch (err) {
      console.error('Firebase fetch error:', err)
      setWidgetState(defaultState)
      showThoughtMessage(defaultState.message)
    }
  }

  // Show thought message function with fade in/out
  const showThoughtMessage = (text: string) => {
    console.log('showThoughtMessage called with:', text)

    // Clear any existing timers
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }

    // Set the new text
    if (speechBubbleRef.current) {
      speechBubbleRef.current.textContent = text
    }

    // Apply fade-in
    if (speechBubbleRef.current) {
      speechBubbleRef.current.classList.remove('fade-out')
      speechBubbleRef.current.classList.add('fade-in')
      console.log('Applied fade-in class')
    }

    // Set 4 second timer to fade out
    fadeTimerRef.current = window.setTimeout(() => {
      console.log('Fade-out timer triggered')
      if (speechBubbleRef.current) {
        speechBubbleRef.current.classList.remove('fade-in')
        // Force reflow to ensure transition triggers
        void speechBubbleRef.current.offsetWidth
        speechBubbleRef.current.classList.add('fade-out')
        console.log('Applied fade-out class')
      }

      // Reset classes after fade-out animation (500ms)
      resetTimerRef.current = window.setTimeout(() => {
        console.log('Reset timer triggered')
        if (speechBubbleRef.current) {
          speechBubbleRef.current.classList.remove('fade-out')
          console.log('Removed fade-out class')
        }
      }, 500)
    }, 4000)
  }

  // Expose function globally for testing
  useEffect(() => {
    ;(window as unknown as { showThoughtMessage: (text: string) => void }).showThoughtMessage = showThoughtMessage
    console.log('Test: Call window.showThoughtMessage("Your message") in the console')
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  // Mouse event handlers for interactive elements
  const handleMouseEnterInteractive = () => {
    console.log('Mouse entered interactive area - enabling mouse events')
    window.api.setIgnoreMouseEvents(false)
  }

  const handleMouseLeaveInteractive = () => {
    console.log('Mouse left interactive area - disabling mouse events')
    window.api.setIgnoreMouseEvents(true)
  }

  // Click handler for the cat - fetch message from Firebase
  const handleMouseUp = () => {
    console.log('Cat clicked, fetching from Firebase...')
    fetchWidgetStatus()
  }

  return (
    <div className="app-container">
      {/* Speech Bubble - fades in/out automatically */}
      <div ref={speechBubbleRef} className="speech-bubble"></div>

      {/* Cute Cat Avatar - Lottie Animation */}
      <div
        ref={avatarRef}
        className="avatar"
        onMouseEnter={handleMouseEnterInteractive}
        onMouseLeave={handleMouseLeaveInteractive}
        onMouseUp={handleMouseUp}
      >
        <Lottie
          animationData={getAnimationData(widgetState.status)}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
          rendererSettings={{ preserveAspectRatio: 'xMidYMid meet', hideOnTransparent: true, scale: 0.3 }}
        />
      </div>
    </div>
  )
}

export default App
