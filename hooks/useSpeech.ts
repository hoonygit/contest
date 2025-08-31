import { useState, useCallback, useRef } from 'react';

// Type definitions for the Web Speech API
interface SpeechGrammarList {
    addFromString(string: string, weight?: number): void;
    readonly length: number;
    item(index: number): any;
}

interface SpeechRecognition extends EventTarget {
    grammars?: SpeechGrammarList;
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    onstart: (() => void) | null;
    onresult: ((event: any) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: any) => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition };
        webkitSpeechRecognition: { new(): SpeechRecognition };
        SpeechGrammarList?: { new(): SpeechGrammarList };
        webkitSpeechGrammarList?: { new(): SpeechGrammarList };
        AudioContext: { new(): AudioContext };
        webkitAudioContext: { new(): AudioContext };
    }
}

const useSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Ensures the AudioContext is initialized and in a 'running' state.
    // This is crucial for browsers like Safari that suspend the audio context until a user gesture.
    const ensureAudioContext = useCallback(() => {
        if (typeof window === 'undefined') return null;

        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
                return null;
            }
        }

        // If the context is suspended, try to resume it.
        // This must be called in response to a user gesture.
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(e => console.error("AudioContext resume failed:", e));
        }
        
        return audioContextRef.current;
    }, []);

    const playBeep = useCallback(() => {
        const context = ensureAudioContext();
        if (!context) return;

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.1);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
    }, [ensureAudioContext]);

    const speak = useCallback((text: string): Promise<void> => {
        // Ensure AudioContext is active before trying to speak.
        ensureAudioContext();

        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.speechSynthesis) {
                console.warn("Speech synthesis not supported.");
                return reject("Speech synthesis not supported.");
            }
            
            // Workaround for a Safari bug where the speech synthesis queue gets stuck.
            // Cancelling previous utterances can help "un-stick" it.
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            utterance.pitch = 1;
            utterance.rate = 1;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
                setIsSpeaking(false);
                resolve();
            };
            utterance.onerror = (event) => {
                setIsSpeaking(false);
                console.error("Speech synthesis error:", event.error);
                reject(event.error);
            };

            // A short delay can sometimes help ensure the `cancel` has taken effect.
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 50);
        });
    }, [ensureAudioContext]);

    const listen = useCallback((timeoutSeconds: number, grammar?: string[]): Promise<string> => {
        // Ensure AudioContext is active before trying to listen.
        ensureAudioContext();

        return new Promise((resolve, reject) => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn("Speech recognition not supported.");
                return reject("Speech recognition not supported.");
            }

            // Ensure any previous recognition is stopped before starting a new one.
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'ko-KR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            recognitionRef.current = recognition;

            if (grammar && grammar.length > 0) {
                const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
                if (SpeechGrammarList) {
                    const speechRecognitionList = new SpeechGrammarList();
                    const grammarString = '#JSGF V1.0; grammar answers; public <answer> = ' + grammar.join(' | ') + ' ;';
                    speechRecognitionList.addFromString(grammarString, 1);
                    recognition.grammars = speechRecognitionList;
                }
            }

            let timeout: number | null = null;
            let ended = false; // Flag to prevent multiple resolutions/rejections

            const cleanup = () => {
                if (timeout) clearTimeout(timeout);
                if (recognitionRef.current) {
                    recognitionRef.current.onresult = null;
                    recognitionRef.current.onend = null;
                    recognitionRef.current.onerror = null;
                    recognitionRef.current.onstart = null;
                    recognitionRef.current = null;
                }
                setIsListening(false);
            };

            recognition.onstart = () => {
                playBeep();
                setIsListening(true);
            };
            
            recognition.onresult = (event) => {
                if (ended) return;
                ended = true;

                const lastResult = event.results[event.results.length - 1];
                const bestAlternative = lastResult[0];
                const transcript = bestAlternative.transcript;
                const confidence = bestAlternative.confidence;

                // Add a confidence check. 0.4 seems a reasonable threshold.
                if (confidence < 0.4) {
                    reject('low-confidence');
                    cleanup();
                    return;
                }
                
                resolve(transcript);
                cleanup();
            };

            recognition.onend = () => {
                if (ended) return;
                cleanup();
            };

            recognition.onerror = (event) => {
                if (ended) return;
                ended = true;
                console.error("Speech recognition error:", event.error);
                if (event.error === 'no-speech') {
                    reject('no-speech');
                } else if (event.error === 'aborted') {
                    reject('Listening timeout.');
                }
                else {
                    reject(event.error);
                }
                cleanup();
            };
            
            recognition.start();

            timeout = window.setTimeout(() => {
                if (ended) return;
                ended = true;
                if(recognitionRef.current) {
                    recognitionRef.current.stop();
                }
                reject('Listening timeout.');
            }, timeoutSeconds * 1000);
        });
    }, [ensureAudioContext, playBeep]);

    return { speak, listen, isSpeaking, isListening };
};

export default useSpeech;
