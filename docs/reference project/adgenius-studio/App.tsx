
import React, { useState } from 'react';
import { AppStep, AdProject, ConceptIdea, StoryboardScene } from './types';
import * as aiService from './services/geminiService';
import { 
  Clapperboard, 
  Sparkles, 
  Settings, 
  Image as ImageIcon, 
  Film, 
  Rocket,
  Loader2,
  CheckCircle2,
  ChevronRight,
  MonitorPlay,
  ArrowRight,
  RefreshCcw,
  Clock,
  Layers,
  Plus
} from 'lucide-react';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.Ideation);
  const [project, setProject] = useState<AdProject>({
    prompt: '',
    shotCount: 3,
    totalLength: 15,
    storyboard: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [concepts, setConcepts] = useState<ConceptIdea[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkApiKey = async () => {
    // @ts-ignore
    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
    return true;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProject(prev => ({ ...prev, referenceImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartIdeation = async () => {
    if (!project.prompt) return;
    setLoading(true);
    setError(null);
    setLoadingMsg('Generating innovative ad concepts with Gemini 3 Flash...');
    try {
      const ideas = await aiService.generateConcepts(project.prompt, project.referenceImage);
      setConcepts(ideas);
      setCurrentStep(AppStep.Concepts);
    } catch (err: any) {
      setError(err.message || 'Failed to generate concepts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConcept = (concept: ConceptIdea) => {
    setProject(prev => ({ ...prev, selectedConcept: concept }));
    setCurrentStep(AppStep.Config);
  };

  const handleGenerateHero = async () => {
    setLoading(true);
    setError(null);
    setLoadingMsg('Sculpting your hero asset using Nano Banana Pro (Gemini 3 Pro Image)...');
    try {
      await checkApiKey();
      if (project.selectedConcept) {
        const url = await aiService.generateHeroImage(project.selectedConcept);
        setProject(prev => ({ ...prev, heroImage: url }));
        setCurrentStep(AppStep.HeroShot);
      }
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      setError(err.message || 'Hero shot generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    setLoading(true);
    setError(null);
    setLoadingMsg('Drafting scene sequences and camera paths...');
    try {
      if (project.selectedConcept) {
        const scenes = await aiService.generateStoryboardPlan(project.selectedConcept, project.shotCount);
        setProject(prev => ({ ...prev, storyboard: scenes }));
        setCurrentStep(AppStep.Storyboard);
      }
    } catch (err: any) {
      setError(err.message || 'Storyboard generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProduceVideo = async () => {
    setLoading(true);
    setError(null);
    setLoadingMsg('Commencing high-speed rendering with Veo 3.1 Fast...');
    try {
      await checkApiKey();
      const updatedStoryboard = [...project.storyboard];
      for (let i = 0; i < updatedStoryboard.length; i++) {
        setLoadingMsg(`Rendering Shot ${i + 1} of ${updatedStoryboard.length}... This may take a few minutes.`);
        const videoUrl = await aiService.generateShotVideo(updatedStoryboard[i], project.heroImage);
        updatedStoryboard[i].videoUrl = videoUrl;
      }
      setProject(prev => ({ ...prev, storyboard: updatedStoryboard }));
      setCurrentStep(AppStep.Production);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      setError(err.message || 'Video production failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIcon = (step: AppStep) => {
    switch (step) {
      case AppStep.Ideation: return <Sparkles size={16} />;
      case AppStep.Concepts: return <Clapperboard size={16} />;
      case AppStep.Config: return <Settings size={16} />;
      case AppStep.HeroShot: return <ImageIcon size={16} />;
      case AppStep.Storyboard: return <Film size={16} />;
      case AppStep.Production: return <Rocket size={16} />;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/40">
            <MonitorPlay className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            ADGENIUS STUDIO
          </h1>
        </div>
        <div className="hidden lg:flex gap-1">
          {Object.values(AppStep).map((step) => (
            <div 
              key={step} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentStep === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-500 bg-white/5 border border-white/5'
              }`}
            >
              {renderStepIcon(step)}
              {step}
            </div>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full relative">
        <main className="w-full glass-panel rounded-3xl p-6 md:p-10 shadow-2xl transition-all duration-500 overflow-hidden min-h-[500px]">
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="hover:text-white"><RefreshCcw size={16} /></button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
              <div className="relative mb-8">
                <Loader2 className="animate-spin text-blue-500" size={64} strokeWidth={1.5} />
                <Sparkles className="absolute -top-2 -right-2 text-blue-300 animate-pulse" size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Crafting Excellence</h2>
              <p className="text-gray-400 max-w-md mx-auto">{loadingMsg}</p>
              <div className="mt-8 flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-2 h-2 rounded-full bg-blue-500 animate-bounce`} style={{ animationDelay: `${i * 0.2}s` }}></div>
                ))}
              </div>
            </div>
          )}

          {!loading && currentStep === AppStep.Ideation && (
            <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-4xl font-bold mb-4 text-white">What are we building today?</h2>
              <p className="text-gray-400 mb-8 text-lg">Input your creative brief. Our AI models will handle the rest, from initial concepts to the final high-definition video.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Campaign Description</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[180px] text-lg resize-none shadow-inner"
                    placeholder="Example: A cinematic ad for a new luxury watch called 'Eclipse'. The mood should be sophisticated, featuring deep shadows, golden light, and a high-end urban setting."
                    value={project.prompt}
                    onChange={(e) => setProject({...project, prompt: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Reference Image (Optional)</label>
                    <label className="flex items-center justify-center h-32 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-pointer group">
                      {project.referenceImage ? (
                        <div className="relative w-full h-full p-2">
                          <img src={project.referenceImage} alt="Ref" className="w-full h-full object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                            <span className="text-xs text-white">Change Image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <ImageIcon className="text-gray-500 mb-2" size={28} />
                          <span className="text-xs text-gray-400">Upload visuals</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <button 
                      onClick={handleStartIdeation}
                      disabled={!project.prompt}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 group"
                    >
                      Generate Concepts
                      <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && currentStep === AppStep.Concepts && (
            <div className="animate-in fade-in duration-700">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Curated Concepts</h2>
                  <p className="text-gray-400">Choose the creative direction that fits your vision.</p>
                </div>
                <button onClick={() => setCurrentStep(AppStep.Ideation)} className="text-sm text-gray-500 hover:text-white transition-colors">Back to Brief</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {concepts.map((concept, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSelectConcept(concept)}
                    className="group flex flex-col p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="text-blue-400" />
                    </div>
                    <span className="text-xs font-bold text-blue-500 mb-3 tracking-widest uppercase">Direction 0{idx + 1}</span>
                    <h3 className="text-xl font-bold text-white mb-3">{concept.title}</h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-3">{concept.description}</p>
                    <div className="mt-auto space-y-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 block uppercase mb-1">Visual Hook</span>
                        <p className="text-xs text-gray-300 italic">"{concept.hook}"</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-blue-400 font-medium group-hover:gap-2 transition-all">
                        <span>Select Concept</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && currentStep === AppStep.Config && (
            <div className="max-w-2xl mx-auto animate-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-bold text-white mb-2">Define the Scale</h2>
              <p className="text-gray-400 mb-8">Set the production parameters for your campaign.</p>
              
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
                <div className="p-6 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                  <h4 className="text-blue-400 font-bold mb-1 uppercase text-xs tracking-widest">Selected Concept</h4>
                  <p className="text-lg font-medium text-white">{project.selectedConcept?.title}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-3 items-center">
                      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Layers size={16} className="text-gray-500" /> Number of Shots
                      </label>
                      <span className="bg-white/10 px-3 py-1 rounded-full text-blue-400 font-bold text-sm">{project.shotCount} Scenes</span>
                    </div>
                    <input 
                      type="range" min="1" max="5" step="1"
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      value={project.shotCount}
                      onChange={(e) => setProject({...project, shotCount: parseInt(e.target.value)})}
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase">
                      <span>Quick Ad</span>
                      <span>Full Sequence</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-3 items-center">
                      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" /> Target Duration
                      </label>
                      <span className="bg-white/10 px-3 py-1 rounded-full text-blue-400 font-bold text-sm">{project.totalLength} Seconds</span>
                    </div>
                    <input 
                      type="range" min="5" max="30" step="5"
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      value={project.totalLength}
                      onChange={(e) => setProject({...project, totalLength: parseInt(e.target.value)})}
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase">
                      <span>Short Form</span>
                      <span>Premium Spot</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleGenerateHero}
                  className="w-full py-5 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl"
                >
                  Generate Hero Shot
                  <ImageIcon size={20} />
                </button>
              </div>
            </div>
          )}

          {!loading && currentStep === AppStep.HeroShot && (
            <div className="animate-in zoom-in-95 duration-500">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">Master Visual</h2>
                  <p className="text-gray-400 mb-6">Generated by Nano Banana Pro. This serves as the visual anchor for the entire campaign.</p>
                  
                  <div className="relative group rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-video bg-white/5">
                    {project.heroImage ? (
                      <img src={project.heroImage} className="w-full h-full object-cover" alt="Hero Shot" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex flex-col justify-end">
                      <p className="text-white font-medium text-lg">{project.selectedConcept?.title}</p>
                      <p className="text-gray-300 text-sm">{project.selectedConcept?.visualStyle}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-80 flex flex-col justify-center">
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Production Review</h4>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-sm text-gray-300">
                        <CheckCircle2 size={18} className="text-green-500" /> Concept Approved
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-300">
                        <CheckCircle2 size={18} className="text-green-500" /> Hero Visual Synthesized
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-400">
                        <div className="w-[18px] h-[18px] rounded-full border border-white/20"></div> Pending Storyboard
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={handleGenerateStoryboard}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 group"
                  >
                    Build Storyboard
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => setCurrentStep(AppStep.Config)} className="mt-4 text-sm text-gray-500 hover:text-white transition-colors text-center">Back to Config</button>
                </div>
              </div>
            </div>
          )}

          {!loading && currentStep === AppStep.Storyboard && (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Storyboard Sequence</h2>
                  <p className="text-gray-400">Defined sequence for the automated video production.</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleGenerateStoryboard()} className="p-3 bg-white/5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                    <RefreshCcw size={20} />
                  </button>
                  <button 
                    onClick={handleProduceVideo}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2"
                  >
                    Produce Final Ad <Rocket size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {project.storyboard.map((scene, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col h-full relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 bg-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-tighter">Shot {scene.shotNumber}</div>
                    <div className="mb-4">
                       <div className="aspect-video bg-white/5 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden mb-4">
                          <img src={project.heroImage} alt="ref" className="w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-60 transition-all" />
                          <div className="absolute flex flex-col items-center">
                            <Film className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                            <span className="text-[10px] text-gray-600 uppercase font-bold mt-1">Ready for Anim</span>
                          </div>
                       </div>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Shot {scene.shotNumber}: {scene.duration}</h4>
                    <p className="text-xs text-gray-400 flex-1">{scene.description}</p>
                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
                       <div className="p-2 bg-black/20 rounded-lg">
                          <span className="text-[8px] text-gray-500 font-bold uppercase block">Starting</span>
                          <span className="text-[10px] text-gray-400 line-clamp-1 italic">{scene.startFrameDesc}</span>
                       </div>
                       <div className="p-2 bg-black/20 rounded-lg">
                          <span className="text-[8px] text-gray-500 font-bold uppercase block">Ending</span>
                          <span className="text-[10px] text-gray-400 line-clamp-1 italic">{scene.endFrameDesc}</span>
                       </div>
                    </div>
                  </div>
                ))}
                <div className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-8 opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
                  <Plus className="text-gray-500 mb-2" size={32} />
                  <span className="text-sm text-gray-400 font-medium">Add Manual Scene</span>
                </div>
              </div>
            </div>
          )}

          {!loading && currentStep === AppStep.Production && (
            <div className="animate-in slide-in-from-bottom-10 duration-1000">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  <CheckCircle2 size={14} /> Production Complete
                </div>
                <h2 className="text-5xl font-extrabold text-white mb-4">Your Vision, Realized.</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">The final sequence has been rendered using Veo 3.1 Fast. Review the shots below or export the full campaign.</p>
              </div>

              <div className="space-y-12">
                {project.storyboard.map((scene, idx) => (
                  <div key={idx} className="flex flex-col lg:flex-row gap-8 items-center bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 transition-all">
                    <div className="flex-1 w-full relative">
                      <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/5 relative group">
                        {scene.videoUrl ? (
                          <video 
                            src={scene.videoUrl} 
                            controls 
                            autoPlay 
                            loop 
                            muted 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                            <Loader2 className="animate-spin mb-4" />
                            <span>Awaiting stream...</span>
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white uppercase border border-white/10">
                          Shot 0{scene.shotNumber}
                        </div>
                      </div>
                    </div>
                    <div className="lg:w-96 space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 block">Cinematic Notes</span>
                        <p className="text-gray-300 text-sm italic">"{scene.description}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl text-center">
                          <span className="block text-[10px] text-gray-500 font-bold uppercase">Format</span>
                          <span className="text-white font-medium">16:9</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl text-center">
                          <span className="block text-[10px] text-gray-500 font-bold uppercase">Res</span>
                          <span className="text-white font-medium">720p</span>
                        </div>
                      </div>
                      <button className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                        <MonitorPlay size={18} /> Download Shot
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 flex flex-col items-center gap-6 pb-20">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-extrabold text-xl shadow-2xl shadow-blue-600/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
                >
                  Start New Campaign <Rocket size={24} />
                </button>
                <p className="text-gray-500 text-sm">All assets generated by Gemini 3 Flash, Nano Banana Pro, and Veo 3.1 Fast.</p>
              </div>
            </div>
          )}
        </main>

        {/* Floating Tooltips or Elements could go here */}
      </div>

      <footer className="mt-12 py-8 text-gray-600 text-xs border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; 2024 AdGenius Studio. Powered by Google Gemini & Veo.</p>
        <div className="flex gap-6">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hover:text-gray-400 transition-colors">Billing Docs</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Terms of Production</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
