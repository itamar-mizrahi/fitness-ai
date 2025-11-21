/**
 * Audio Feedback Service
 * 
 * Manages Text-to-Speech (TTS) announcements for the workout session.
 * Prioritizes messages to ensure safety warnings are heard immediately.
 */

export class AudioFeedback {
  private synthesis: SpeechSynthesis
  private voice: SpeechSynthesisVoice | null = null
  private isEnabled: boolean = true
  private lastMessageTime: number = 0
  private minInterval: number = 2000 // Minimum time between messages (ms)

  constructor() {
    this.synthesis = window.speechSynthesis
    this.initVoice()
    
    // Handle voice loading (async in some browsers)
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.initVoice()
    }
  }

  private initVoice() {
    const voices = this.synthesis.getVoices()
    // Try to find a Hebrew voice, fallback to English
    this.voice = voices.find(v => v.lang.includes('he')) || 
                 voices.find(v => v.lang.includes('en')) || 
                 null
  }

  /**
   * Speak a message
   * @param message Text to speak
   * @param priority 'high' (safety) | 'low' (encouragement)
   */
  speak(message: string, priority: 'high' | 'low' = 'low') {
    if (!this.isEnabled || !this.voice) return

    const now = Date.now()

    // Rate limiting for low priority messages
    if (priority === 'low' && now - this.lastMessageTime < this.minInterval) {
      return
    }

    // High priority messages cancel current speech
    if (priority === 'high') {
      this.synthesis.cancel()
    } else if (this.synthesis.speaking) {
      return // Don't interrupt for low priority
    }

    const utterance = new SpeechSynthesisUtterance(message)
    utterance.voice = this.voice
    utterance.rate = 1
    utterance.pitch = 1
    
    this.synthesis.speak(utterance)
    this.lastMessageTime = now
  }

  /**
   * Toggle audio on/off
   */
  toggle(enabled: boolean) {
    this.isEnabled = enabled
    if (!enabled) {
      this.synthesis.cancel()
    }
  }

  /**
   * Check if audio is supported
   */
  static isSupported(): boolean {
    return 'speechSynthesis' in window
  }
}

export default AudioFeedback
