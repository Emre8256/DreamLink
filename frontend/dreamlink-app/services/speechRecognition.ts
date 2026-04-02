/**
 * Safe wrapper for expo-speech-recognition.
 * Gracefully degrades when native module is unavailable (e.g. in Expo Go).
 */

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;
let isSpeechRecognitionAvailable = false;

try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
  isSpeechRecognitionAvailable = true;
} catch {
  // Native module not available (Expo Go).
  // Provide a no-op hook to prevent crashes.
  useSpeechRecognitionEvent = (_event: string, _handler: (...args: any[]) => void) => {
    // no-op
  };
}

export { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent, isSpeechRecognitionAvailable };
