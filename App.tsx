
import React, { useState, useCallback, useEffect } from 'react';
import { generateFashionVariation, VARIATIONS } from './geminiService';
import { AppState, GenerationResult } from './types';

// Components
const FileUpload = ({ label, onUpload, preview }: { label: string, onUpload: (base64: string) => void, preview: string | null }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result?.toString().split(',')[1] || '');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <label className={`relative group cursor-pointer border-2 border-dashed rounded-2xl aspect-[9/16] w-full flex flex-col items-center justify-center transition-all overflow-hidden ${preview ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-purple-500/50 hover:bg-white/5'}`}>
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-sm font-medium">Trocar Imagem</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-400 text-sm">Upload (Vertical 9:16)</span>
          </div>
        )}
        <input type="file" className="hidden" accept="image/*" onChange={handleChange} />
      </label>
    </div>
  );
};

export default function App() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [modelPhoto, setModelPhoto] = useState<string | null>(null);
  const [productPhoto, setProductPhoto] = useState<string | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Se não estiver no AI Studio, assume que a chave está no process.env (Vercel)
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!modelPhoto || !productPhoto) return;

    setAppState(AppState.GENERATING);
    setErrorMsg(null);
    setResults([]);

    try {
      const variationPromises = VARIATIONS.map(async (v, idx) => {
        const url = await generateFashionVariation(modelPhoto, productPhoto, v);
        return {
          id: idx.toString(),
          url,
          variationType: v.label
        };
      });

      const generatedImages = await Promise.all(variationPromises);
      setResults(generatedImages);
      setAppState(AppState.COMPLETED);
    } catch (error: any) {
      console.error(error);
      if (error.message === "API_KEY_EXPIRED") {
        setHasKey(false);
        setErrorMsg("Sua chave API expirou ou não foi encontrada.");
      } else {
        setErrorMsg("Erro na geração. Certifique-se de configurar a API_KEY nas configurações da Vercel.");
      }
      setAppState(AppState.ERROR);
    }
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-panel rounded-3xl p-10 flex flex-col gap-8 shadow-2xl">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Configuração Necessária</h1>
            <p className="text-gray-400">
              O modelo <strong>Nano Banana Pro</strong> exige uma chave de API válida.
            </p>
            <p className="text-xs text-gray-500 italic">Se estiver na Vercel, configure a variável de ambiente API_KEY.</p>
          </div>
          <button 
            onClick={handleSelectKey}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-all transform hover:scale-[1.02]"
          >
            Selecionar Chave (AI Studio)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black gradient-text tracking-tight">STUDIO BANANA PRO</h1>
          <p className="text-gray-400 font-medium">Editor de Moda 4K (9:16) via Gemini AI</p>
        </div>
        {appState === AppState.COMPLETED && (
          <button 
            onClick={() => {
              setAppState(AppState.IDLE);
              setResults([]);
            }}
            className="px-6 py-3 border border-gray-700 hover:bg-white/5 rounded-full text-sm font-semibold transition-all"
          >
            Novo Projeto
          </button>
        )}
      </header>

      <main className="space-y-12">
        {appState === AppState.IDLE || appState === AppState.ERROR ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FileUpload 
              label="1. Foto da Modelo" 
              preview={modelPhoto ? `data:image/png;base64,${modelPhoto}` : null}
              onUpload={(base64) => setModelPhoto(base64)} 
            />
            <FileUpload 
              label="2. Foto do Produto" 
              preview={productPhoto ? `data:image/png;base64,${productPhoto}` : null}
              onUpload={(base64) => setProductPhoto(base64)} 
            />
            
            <div className="sm:col-span-2 flex flex-col items-center gap-6 pt-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-2xl w-full text-center text-sm">
                  {errorMsg}
                </div>
              )}
              <button
                disabled={!modelPhoto || !productPhoto}
                onClick={handleGenerate}
                className={`w-full max-w-md py-5 rounded-2xl text-xl font-bold shadow-2xl transition-all flex items-center justify-center gap-3 ${
                  (!modelPhoto || !productPhoto) 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transform hover:scale-[1.02]'
                }`}
              >
                Gerar Coleção 4K
              </button>
            </div>
          </div>
        ) : appState === AppState.GENERATING ? (
          <div className="py-24 flex flex-col items-center justify-center gap-8 glass-panel rounded-3xl text-center">
            <div className="w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-white">Renderizando 4K...</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((res) => (
              <div key={res.id} className="group relative glass-panel rounded-2xl overflow-hidden shadow-2xl">
                <img src={res.url} alt={res.variationType} className="w-full aspect-[9/16] object-cover" />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60">
                  <h3 className="text-sm font-bold text-white">{res.variationType}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
