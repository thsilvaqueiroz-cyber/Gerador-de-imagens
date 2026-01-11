
import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, RefreshCw, Download, Upload, ShieldCheck, AlertCircle } from 'lucide-react';
import { generateFashionImage, VARIATIONS } from './geminiService';
import { AppState, GenerationResult } from './types';

export default function App() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [modelPhoto, setModelPhoto] = useState<string | null>(null);
  const [productPhoto, setProductPhoto] = useState<string | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    // @ts-ignore
    if (window.aistudio?.hasSelectedApiKey) {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else if (process.env.API_KEY) {
      setHasKey(true);
    } else {
      setHasKey(false);
    }
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'model' | 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1] || '';
        if (type === 'model') setModelPhoto(base64);
        else setProductPhoto(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = async () => {
    if (!modelPhoto || !productPhoto) return;
    setAppState(AppState.GENERATING);
    setError(null);

    try {
      const promises = VARIATIONS.map(async (v, i) => {
        const url = await generateFashionImage(modelPhoto, productPhoto, v);
        return { id: i.toString(), url, variationType: v.label };
      });
      const images = await Promise.all(promises);
      setResults(images);
      setAppState(AppState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError("Erro na geração. Verifique sua chave de API ou conexão.");
      setAppState(AppState.ERROR);
    }
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full glass p-10 rounded-[2.5rem] text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/30">
            <ShieldCheck className="w-10 h-10 text-purple-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Chave Necessária</h1>
            <p className="text-gray-400 text-sm">O modelo <b>Nano Banana Pro</b> requer uma chave de API do Google AI Studio com faturamento ativo.</p>
          </div>
          <button onClick={handleSelectKey} className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all shadow-lg">
            Configurar Chave
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black gradient-text tracking-tighter text-glow">STUDIO BANANA PRO</h1>
          <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">AI Fashion Editorial • 4K Engine</p>
        </div>
        {appState === AppState.COMPLETED && (
          <button onClick={() => { setAppState(AppState.IDLE); setResults([]); }} className="flex items-center gap-2 px-6 py-3 glass rounded-full hover:bg-white/5 transition-all text-sm font-bold">
            <RefreshCw size={16} /> Novo Projeto
          </button>
        )}
      </header>

      <main>
        {(appState === AppState.IDLE || appState === AppState.ERROR) && (
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <UploadArea label="1. FOTO DA MODELO" img={modelPhoto} onFile={(e) => handleUpload(e, 'model')} />
              <UploadArea label="2. FOTO DO PRODUTO" img={productPhoto} onFile={(e) => handleUpload(e, 'product')} />
            </div>

            <div className="flex flex-col items-center gap-6">
              {error && <div className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><AlertCircle size={14}/> {error}</div>}
              <button
                disabled={!modelPhoto || !productPhoto}
                onClick={startGeneration}
                className={`px-12 py-5 rounded-2xl text-xl font-black transition-all shadow-2xl ${(!modelPhoto || !productPhoto) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:scale-105 active:scale-95'}`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={20} /> GERAR COLEÇÃO 4K
                </span>
              </button>
            </div>
          </div>
        )}

        {appState === AppState.GENERATING && (
          <div className="py-24 flex flex-col items-center justify-center space-y-8 glass rounded-[3rem] animate-pulse">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">Renderizando...</h2>
              <p className="text-gray-500 text-sm">Criando 4 variações ultra-realistas em 4K</p>
            </div>
          </div>
        )}

        {appState === AppState.COMPLETED && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((res) => (
              <div key={res.id} className="group glass rounded-3xl overflow-hidden shadow-2xl hover:border-purple-500/30 transition-all">
                <div className="aspect-[9/16] relative bg-black">
                  <img src={res.url} alt={res.variationType} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-widest">
                    {res.variationType}
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={12} /> 4K READY
                  </span>
                  <button onClick={() => {
                    const a = document.createElement('a');
                    a.href = res.url;
                    a.download = `fashion-${res.id}.png`;
                    a.click();
                  }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function UploadArea({ label, img, onFile }: { label: string, img: string | null, onFile: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black tracking-widest text-gray-500 text-center uppercase">{label}</h3>
      <label className={`relative group cursor-pointer glass rounded-[2.5rem] aspect-[9/16] flex flex-col items-center justify-center transition-all overflow-hidden border-2 border-dashed ${img ? 'border-purple-500/40' : 'border-white/5 hover:border-white/20'}`}>
        {img ? (
          <>
            <img src={`data:image/png;base64,${img}`} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
              <span className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold">TROCAR FOTO</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Upload Imagem</p>
              <p className="text-[10px] text-gray-500 uppercase mt-1">Formato Vertical 9:16</p>
            </div>
          </div>
        )}
        <input type="file" className="hidden" accept="image/*" onChange={onFile} />
      </label>
    </div>
  );
}
