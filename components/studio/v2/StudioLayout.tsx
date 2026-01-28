"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { 
  FolderOpen, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  User,
  Palette,
  Ban,
  Search,
  LayoutGrid
} from "lucide-react"
import { DetailModal } from "@/components/studio/v2/DetailModal"

interface StudioLayoutProps {
  children: React.ReactNode
  vaultContent?: React.ReactNode
  cockpitContent?: React.ReactNode
  contextContent?: React.ReactNode
  assetsContent?: React.ReactNode
}

export function StudioLayout({ children, vaultContent, cockpitContent, assetsContent }: StudioLayoutProps) {
  const [isVaultOpen, setIsVaultOpen] = useState(true)
  const [activeVaultTab, setActiveVaultTab] = useState<'assets' | 'scripts'>('scripts')
  const [gridCols] = useState(4)

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-[#a3e635] selection:text-black">
      <DetailModal />
      
      {/* AMBIENT GLOW */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#c084fc] opacity-[0.06] blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#a3e635] opacity-[0.06] blur-[150px] pointer-events-none z-0" />

      {/* ZONE A: THE VAULT */}
      <aside 
        className={cn(
          "h-full bg-zinc-900/60 backdrop-blur-xl border-r border-zinc-800/50 transition-all duration-300 relative flex flex-col z-40",
          isVaultOpen ? "w-[260px]" : "w-[72px]"
        )}
      >
        {/* Toggle */}
        <button
          onClick={() => setIsVaultOpen(!isVaultOpen)}
          className="absolute -right-3 top-7 bg-zinc-800 border border-zinc-700 rounded-full p-1.5 text-zinc-400 hover:text-[#a3e635] hover:border-[#a3e635] shadow-lg transition-all z-50"
        >
          {isVaultOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-800/50">
           {isVaultOpen ? (
             <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#a3e635] rounded-lg flex items-center justify-center text-black shadow-lg shadow-[#a3e635]/30">
                    <Zap size={14} fill="currentColor" />
                </div>
                <span className="font-bold text-sm tracking-wide">ADNOVA</span>
             </div>
           ) : (
             <div className="w-10 h-10 mx-auto bg-zinc-800 rounded-xl flex items-center justify-center text-[#a3e635]">
                <Zap size={18} fill="currentColor" />
             </div>
           )}
        </div>

        {/* Tabs */}
        {isVaultOpen && (
          <div className="flex border-b border-zinc-800/50">
            <button
              onClick={() => setActiveVaultTab('assets')}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                activeVaultTab === 'assets' 
                  ? "text-[#a3e635] border-b-2 border-[#a3e635] -mb-px" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <FolderOpen size={11} /> Assets
            </button>
            <button
              onClick={() => setActiveVaultTab('scripts')}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                activeVaultTab === 'scripts' 
                  ? "text-[#a3e635] border-b-2 border-[#a3e635] -mb-px" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <FileText size={11} /> Scripts
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
             {!isVaultOpen && (
                 <div className="flex flex-col items-center gap-4 mt-5">
                    <NavIcon icon={<FolderOpen size={18} />} label="Assets" active={activeVaultTab === 'assets'} onClick={() => { setIsVaultOpen(true); setActiveVaultTab('assets') }} />
                    <NavIcon icon={<FileText size={18} />} label="Scripts" active={activeVaultTab === 'scripts'} onClick={() => { setIsVaultOpen(true); setActiveVaultTab('scripts') }} />
                 </div>
             )}
             
             {isVaultOpen && (
                 <div className="p-4">
                     {activeVaultTab === 'scripts' && vaultContent}
                     {activeVaultTab === 'assets' && (
                       assetsContent || (
                       <div className="text-xs text-zinc-500 text-center py-10">
                         <FolderOpen className="mx-auto mb-2 text-zinc-600" size={28} />
                         <div className="text-zinc-400 font-medium">No assets</div>
                         <div className="text-zinc-600 text-[10px] mt-1">Generate or upload assets</div>
                       </div>
                       )
                     )}
                 </div>
             )}
        </div>
      </aside>

      {/* ZONE B: THE STREAM */}
      <main className="flex-1 relative h-full flex flex-col min-w-0 bg-zinc-950">
        
        {/* Stream Header */}
        <div className="h-12 border-b border-zinc-800/50 flex items-center px-5 justify-between bg-zinc-900/40 backdrop-blur-md z-30 sticky top-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <span className="hover:text-zinc-200 cursor-pointer transition-colors">Project Alpha</span>
                <ChevronRight size={10} className="text-zinc-700" />
                <span className="hover:text-zinc-200 cursor-pointer transition-colors">Scene 1</span>
                <ChevronRight size={10} className="text-zinc-700" />
                <span className="text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded text-[10px] font-bold border border-[#a3e635]/30">Shot 1A</span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-zinc-800/40 border border-zinc-700/30 rounded-lg px-2.5 py-1.5">
                   <Search size={12} className="text-zinc-500" />
                   <input 
                     type="text" 
                     placeholder="Search..." 
                     className="bg-transparent text-xs text-zinc-300 placeholder:text-zinc-600 outline-none w-24"
                   />
                 </div>
                 <button className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-800/40 border border-zinc-700/30 rounded-lg px-2.5 py-1.5">
                   <LayoutGrid size={12} />
                   <span className="text-[10px] font-bold">{gridCols} COL</span>
                 </button>
            </div>
        </div>

        {/* Stream Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent relative">
             <div className="w-full max-w-[1600px] mx-auto min-h-full">
                 {children}
             </div>
             
             {/* Cockpit Container */}
             <div className="sticky bottom-5 flex justify-center w-full px-5 pointer-events-none z-50">
                 <div className="pointer-events-auto">
                     {cockpitContent}
                 </div>
             </div>
        </div>

      </main>

      {/* ZONE D: GLOBAL CONTEXT */}
      <aside className="w-12 hover:w-[280px] transition-all duration-300 ease-out h-full border-l border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl z-40 flex flex-col group overflow-hidden">
          
          <div className="w-[280px] flex flex-col h-full">
              
              {/* Header */}
              <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-800/50">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Global Context</span>
                  <Settings size={14} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Anchors */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  <ContextAnchor icon={<User size={14} />} label="Character: Neo" scope="GLOBAL" />
                  <ContextAnchor icon={<Palette size={14} />} label="Style: Cyberpunk" scope="GLOBAL" />
                  <ContextAnchor icon={<Ban size={14} />} label="Neg: Blur, Text" scope="GLOBAL" dimmed />
                  
                  {/* Suggestions */}
                  <div className="pt-4 mt-4 border-t border-zinc-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Suggested Anchors</div>
                      <div className="flex flex-wrap gap-1.5">
                           <SuggestionChip label="Noir Style" />
                           <SuggestionChip label="Neg: Watermark" />
                      </div>
                  </div>
              </div>

          </div>

      </aside>

    </div>
  )
}

function NavIcon({ icon, label, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer relative group",
                active ? "bg-zinc-800 text-[#a3e635]" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            )}
        >
            {icon}
            <div className="absolute left-full ml-2 bg-zinc-800 text-xs px-2 py-1 rounded text-zinc-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-zinc-700">
                {label}
            </div>
        </button>
    )
}

function ContextAnchor({ icon, label, scope, dimmed }: any) {
    return (
        <div className={cn(
            "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
            dimmed 
                ? "bg-zinc-800/30 border-zinc-800/30 opacity-60" 
                : "bg-zinc-800/50 border-zinc-700/30 hover:border-zinc-600/50"
        )}>
             <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#c084fc]/10 border border-[#c084fc]/20 text-[#c084fc]">
                 {icon}
             </div>
             <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="text-xs text-zinc-200 font-medium truncate">{label}</div>
                 <div className="text-[9px] text-[#c084fc] font-bold uppercase">{scope}</div>
             </div>
        </div>
    )
}

function SuggestionChip({ label }: { label: string }) {
    return (
        <button className="text-[10px] px-2 py-1 rounded border border-zinc-700/50 text-zinc-500 hover:text-[#a3e635] hover:border-[#a3e635]/30 hover:bg-[#a3e635]/5 transition-all bg-zinc-800/30">
            + {label}
        </button>
    )
}
