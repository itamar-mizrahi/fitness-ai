import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioFeedback } from './AudioFeedback'

// Mock window.speechSynthesis
const mockSpeak = vi.fn()
const mockCancel = vi.fn()
const mockGetVoices = vi.fn().mockReturnValue([
  { lang: 'en-US', name: 'English Voice' }
])

const mockSpeechSynthesis = {
  speak: mockSpeak,
  cancel: mockCancel,
  getVoices: mockGetVoices,
  onvoiceschanged: null,
  speaking: false,
}

vi.stubGlobal('window', {
  speechSynthesis: mockSpeechSynthesis,
})

vi.stubGlobal('speechSynthesis', mockSpeechSynthesis)

// Mock SpeechSynthesisUtterance constructor
global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  voice: null,
  rate: 1,
  pitch: 1,
})) as any

describe('AudioFeedback', () => {
  let audio: AudioFeedback

  beforeEach(() => {
    vi.clearAllMocks()
    audio = new AudioFeedback()
  })

  it('should initialize correctly', () => {
    expect(audio).toBeDefined()
    expect(window.speechSynthesis.getVoices).toHaveBeenCalled()
  })

  it('should speak message', () => {
    audio.speak('Hello')
    expect(mockSpeak).toHaveBeenCalled()
    expect(SpeechSynthesisUtterance).toHaveBeenCalledWith('Hello')
  })

  it('should respect priority', () => {
    // Mock Date.now to control timing
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    // First message
    audio.speak('First', 'low')
    expect(mockSpeak).toHaveBeenCalledTimes(1)

    // Second low priority message immediately after (should be ignored due to rate limit)
    audio.speak('Second', 'low')
    expect(mockSpeak).toHaveBeenCalledTimes(1)

    // High priority message (should be spoken and cancel previous)
    audio.speak('Urgent', 'high')
    expect(mockCancel).toHaveBeenCalled()
    expect(mockSpeak).toHaveBeenCalledTimes(2)
  })

  it('should toggle on/off', () => {
    audio.toggle(false)
    audio.speak('Test', 'high') // Use high to bypass rate limit check if any, but toggle should block it
    expect(mockSpeak).not.toHaveBeenCalled()

    audio.toggle(true)
    audio.speak('Test', 'high')
    expect(mockSpeak).toHaveBeenCalled()
  })
})
