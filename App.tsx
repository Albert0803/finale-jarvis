import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import HexagonBackground from './components/HexagonBackground';
import ArcReactor from './components/ArcReactor';
import JarvisVisualizer from './components/JarvisVisualizer';
import Clock from './components/Clock';
import HudPanel from './components/HudPanel';
import { createBlob, decodeAudioData, base64ToArrayBuffer } from './utils/audioUtils';
import { PanelContent } from './types';

// Tool to control screens
const updateScreenFunction: FunctionDeclaration = {
  name: 'update_screen',
  description: 'Update or clear the HUD screens.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      panel: {
        type: Type.STRING,
        description: 'Which panel to update: "left" (for text/info) or "right" (for images/maps).',
        enum: ['left', 'right']
      },
      type: {
        type: Type.STRING,
        description: 'Type of content.',
        enum: ['text', 'image', 'map', 'empty']
      },
      title: {
        type: Type.STRING,
        description: 'Short title for the display.'
      },
      content: {
        type: Type.STRING,
        description: 'The content string.'
      }
    },
    required: ['panel', 'type', 'title', 'content']
  }
};

// Tool to manage timers
const manageTimerFunction: FunctionDeclaration = {
  name: 'manage_timer',
  description: 'Set a timer or alarm. Calculates the duration in seconds.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      seconds: {
        type: Type.NUMBER,
        description: 'Duration of the timer in seconds.'
      },
      label: {
        type: Type.STRING,
        description: 'Label for the timer (e.g. "Pizza", "Alarm").'
      }
    },
    required: ['seconds', 'label']
  }
};

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HUD State
  const [leftPanel, setLeftPanel] = useState<PanelContent>({ title: '', type: 'empty', content: '' });
  const [rightPanel, setRightPanel] = useState<PanelContent>({ title: '', type: 'empty', content: '' });

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  
  // State for visualizer
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Live Session Refs
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Timer State
  const activeTimerRef = useRef<{ target: number, label: string } | null>(null);

  // Alarm Sound Effect
  const playAlarmSound = () => {
      const ctx = outputAudioContextRef.current;
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
  };

  // Timer Check Loop
  useEffect(() => {
    const interval = setInterval(() => {
        if (activeTimerRef.current) {
            const now = Date.now();
            if (now >= activeTimerRef.current.target) {
                // Timer finished
                playAlarmSound();
                // We keep it active in Ref so HudPanel can show "Expired" state, 
                // but we stop playing sound after a few beeps if we implemented a loop.
                // For now, just one beep burst per second if we leave it? 
                // Let's just beep once per second if expired.
                 if ((now - activeTimerRef.current.target) % 2000 < 100) {
                     playAlarmSound();
                 }
            }
        }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const initializeJarvis = async () => {
    try {
      setError(null);
      
      // 1. Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Setup Analyser for Visuals
      const outputCtx = outputAudioContextRef.current!;
      const analyserNode = outputCtx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserRef.current = analyserNode;
      setAnalyser(analyserNode);

      const outputGain = outputCtx.createGain();
      outputGain.connect(analyserNode);
      analyserNode.connect(outputCtx.destination);
      outputNodeRef.current = outputGain;

      // 2. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 3. Connect to Gemini Live
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
          // Enable Google Search AND our Custom Screen Tool
          tools: [
            { googleSearch: {} }, 
            { functionDeclarations: [updateScreenFunction, manageTimerFunction] }
          ],
          systemInstruction: `Tu es J.A.R.V.I.S., l'IA de Tony Stark.
          Tu contrôles une interface HUD holographique.
          
          RÈGLES D'AFFICHAGE :
          1. **INFORMATIONS** : Pour les questions "Qui est...", "Qu'est-ce que...", utilise 'update_screen' (panel='left', type='text').
          
          2. **VISUELS** : Pour "Montre-moi...", utilise 'update_screen' (panel='right', type='image').
             - Cherche des URLs valides via Google Search.
             - SECOURS : Si pas d'URL, utilise: \`https://image.pollinations.ai/prompt/{sujet_anglais}?nologo=true\`
          
          3. **CARTES** : Pour "Où est...", utilise 'update_screen' (panel='right', type='map').
          
          4. **MINUTEURS / ALARMES** :
             - Si l'utilisateur demande "Mets un minuteur de X minutes" ou "Réveille-moi à X heure".
             - Calcule TOUJOURS la durée restante en secondes par rapport à l'heure actuelle.
             - Utilise l'outil \`manage_timer\` avec le nombre de secondes calculé.
             - NE PAS utiliser \`update_screen\` pour les minuteurs, utilise \`manage_timer\`.
          
          5. **NETTOYAGE** : Si demandé ("Efface", "Supprime"), appelle 'update_screen' avec type='empty'.
          
          Comportement :
          - Exécute les ordres immédiatement.
          - Sois concis ("Minuteur lancé", "Affichage en cours").
          `,
        },
        callbacks: {
          onopen: () => {
            console.log('J.A.R.V.I.S. Online');
            setIsConnected(true);
            
            // Start processing microphone input
            const inputCtx = inputAudioContextRef.current!;
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
              
              const volume = inputData.reduce((acc, val) => acc + Math.abs(val), 0) / inputData.length;
              if (volume > 0.01) {
                 setIsListening(true);
              } else {
                 setIsListening(false);
              }
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls (The Brain controlling the HUD)
            if (message.toolCall) {
               const responses = message.toolCall.functionCalls.map(fc => {
                  if (fc.name === 'update_screen') {
                    const args = fc.args as any;
                    const newContent: PanelContent = {
                      title: args.title || '',
                      type: args.type,
                      content: args.content || ''
                    };
                    if (args.panel === 'left') setLeftPanel(newContent);
                    else setRightPanel(newContent);
                    return { id: fc.id, name: fc.name, response: { result: "Screen updated" } };
                  } else if (fc.name === 'manage_timer') {
                      const args = fc.args as any;
                      const seconds = args.seconds;
                      const label = args.label;
                      
                      const targetTime = Date.now() + (seconds * 1000);
                      activeTimerRef.current = { target: targetTime, label: label };
                      
                      // Update Left Panel to show timer
                      setLeftPanel({
                          type: 'timer',
                          title: label.toUpperCase(),
                          content: new Date(targetTime).toISOString()
                      });
                      
                      return { id: fc.id, name: fc.name, response: { result: "Timer set" } };
                  }
                  return { id: fc.id, name: fc.name, response: { result: "Unknown tool" }};
               });

               sessionPromise.then(session => {
                  session.sendToolResponse({ functionResponses: responses });
               });
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const outputCtx = outputAudioContextRef.current!;
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                new Uint8Array(base64ToArrayBuffer(base64Audio)),
                outputCtx
              );

              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current!);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              
              sourcesRef.current.add(source);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsSpeaking(false);
                }
              };
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            console.log('J.A.R.V.I.S. Offline');
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error(err);
            setError("Connection Protocol Violation");
            setIsConnected(false);
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setError("Initialization Protocol Failed: Check Permissions or API Key.");
    }
  };

  const handleDisconnect = () => {
     window.location.reload();
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <HexagonBackground />
      <Clock />
      
      {/* HUD Panels */}
      {isConnected && <HudPanel side="left" data={leftPanel} />}
      {isConnected && <HudPanel side="right" data={rightPanel} />}

      {/* Decorative Corners */}
      <div className="absolute top-10 left-10 w-32 h-32 border-l-2 border-t-2 border-cyan-500 rounded-tl-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute top-10 right-10 w-32 h-32 border-r-2 border-t-2 border-cyan-500 rounded-tr-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 border-l-2 border-b-2 border-cyan-500 rounded-bl-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 border-r-2 border-b-2 border-cyan-500 rounded-br-3xl opacity-60 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Main Interface */}
        <div className="relative">
          <ArcReactor isListening={isListening} isSpeaking={isSpeaking} />
          <JarvisVisualizer analyser={analyser} isActive={isConnected} />
        </div>

        {/* Start Button Overlay */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
            <div className="text-center">
              <button 
                onClick={initializeJarvis}
                className="group relative px-8 py-4 bg-transparent border-2 border-cyan-500 text-cyan-500 font-bold tracking-widest uppercase transition-all hover:bg-cyan-500/10 hover:shadow-[0_0_20px_#00f0ff]"
              >
                <span className="absolute inset-0 w-full h-full border-t border-b border-cyan-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                INITIALISATION DU SYSTÈME
              </button>
              {error && <p className="mt-4 text-red-500 tracking-widest text-sm bg-red-900/20 p-2 border border-red-500/50">{error}</p>}
            </div>
          </div>
        )}

        {/* Status Footer */}
        <div className="mt-12 flex gap-8">
           <StatusMetric label="MÉMOIRE" value="42TB" />
           <StatusMetric label="CPU" value="OPTIMAL" />
           <StatusMetric label="LATENCE" value={isConnected ? "12ms" : "OFFLINE"} />
           <div className="flex flex-col items-center">
              <span className="text-[10px] text-cyan-700 tracking-widest mb-1">PROTOCOLE</span>
              <button 
                onClick={handleDisconnect}
                disabled={!isConnected}
                className="text-xs text-cyan-400 border border-cyan-800 px-3 py-1 hover:bg-cyan-900/30 disabled:opacity-30"
              >
                REDÉMARRER
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatusMetric: React.FC<{label: string, value: string}> = ({ label, value }) => (
  <div className="flex flex-col items-center">
    <span className="text-[10px] text-cyan-700 tracking-widest mb-1">{label}</span>
    <span className="text-sm text-cyan-300 font-bold tracking-wider drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">{value}</span>
  </div>
);

export default App;