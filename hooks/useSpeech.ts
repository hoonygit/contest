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

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current && typeof window !== 'undefined') {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
            }
        }
        return audioContextRef.current;
    }, []);

    const playBeep = useCallback(() => {
        const context = getAudioContext();
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
    }, [getAudioContext]);


    const speak = useCallback((text: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.speechSynthesis) {
                console.warn("Speech synthesis not supported.");
                return reject("Speech synthesis not supported.");
            }
            
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

            window.speechSynthesis.speak(utterance);
        });
    }, []);

    const listen = useCallback((timeoutSeconds: number, grammar?: string[]): Promise<string> => {
        return new Promise((resolve, reject) => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn("Speech recognition not supported.");
                return reject("Speech recognition not supported.");
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

            recognition.onstart = () => {
                playBeep();
                setIsListening(true);
            };
            
            recognition.onresult = (event) => {
                if (timeout) clearTimeout(timeout);
                const transcript = event.results[0][0].transcript;
                resolve(transcript);
            };

            recognition.onend = () => setIsListening(false);

            recognition.onerror = (event) => {
                if (timeout) clearTimeout(timeout);
                console.error("Speech recognition error:", event.error);
                if (event.error === 'no-speech') {
                    reject('no-speech');
                } else {
                    reject(event.error);
                }
            };
            
            recognition.start();

            timeout = window.setTimeout(() => {
                recognition.stop();
                reject('Listening timeout.');
            }, timeoutSeconds * 1000);
        });
    }, [playBeep]);

    return { speak, listen, isSpeaking, isListening };
};

export default useSpeech;