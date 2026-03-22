import { MagicWand } from "@phosphor-icons/react/dist/ssr";

export default function Stats() {
  return (
    <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 md:px-10 lg:px-20 -mt-40 sm:-mt-44 md:-mt-52 lg:-mt-52">
      <div className="flex flex-row md:flex-row gap-3 sm:gap-4 lg:gap-6">
        <div className="stat-card relative bg-white rounded-2xl md:rounded-[2rem] p-3 sm:p-4 lg:p-8 flex-1 flex flex-col justify-end md:flex-row md:justify-between md:items-end shadow-2xl min-h-[110px] sm:min-h-[120px] md:min-h-[160px]">
          <div className="relative z-10 w-full">
            <h3 className="text-sm sm:text-xl md:text-3xl lg:text-4xl font-semibold mb-1 lg:mb-2 text-black tracking-tight leading-tight">1-Click</h3>
            <p className="text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-widest font-bold leading-tight">2D to 3D<span className="hidden lg:inline"> Generation</span></p>
          </div>
          <div className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto flex w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 rounded-full border border-gray-100 sm:border-gray-200 items-center justify-center bg-gray-50/50 sm:bg-transparent shrink-0 mt-2 md:mt-0">
            <MagicWand weight="bold" className="text-[10px] sm:text-sm lg:text-xl text-gray-400 sm:text-black" />
          </div>
        </div>

        <div className="stat-card relative bg-white rounded-2xl md:rounded-[2rem] p-3 sm:p-4 lg:p-8 flex-1 flex flex-col justify-end md:flex-row md:justify-between md:items-end shadow-2xl min-h-[110px] sm:min-h-[120px] md:min-h-[160px]">
          <div className="relative z-10 w-full">
            <h3 className="text-sm sm:text-xl md:text-3xl lg:text-4xl font-semibold mb-1 lg:mb-2 text-black tracking-tight leading-tight">AI Driven</h3>
            <p className="text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-widest font-bold leading-tight">Simulations</p>
          </div>
          <div className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto block w-10 h-5 sm:w-12 sm:h-6 lg:w-20 lg:h-10 bg-gray-100 rounded-full overflow-hidden shrink-0 shadow-inner mt-2 md:mt-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=2069&auto=format&fit=crop" alt="Simulation" className="w-full h-full object-cover opacity-60 sm:opacity-100" />
          </div>
        </div>

        <div className="stat-card bg-[#111111] text-white rounded-2xl md:rounded-[2rem] p-3 sm:p-4 lg:p-8 flex-1 flex flex-col justify-end shadow-2xl relative overflow-hidden group min-h-[110px] sm:min-h-[120px] md:min-h-[160px]">
          <div className="relative z-10 flex justify-between items-end w-full">
            <div>
              <h3 className="text-sm sm:text-xl md:text-3xl lg:text-4xl font-semibold mb-1 lg:mb-2 tracking-tight leading-tight">Real-time</h3>
              <p className="text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-widest font-bold leading-tight">Collab<span className="hidden sm:inline">oration</span></p>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 lg:-bottom-8 lg:-right-8 w-16 h-16 sm:w-20 sm:h-20 lg:w-32 lg:h-32 border border-white/10 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute top-1 -right-2 sm:top-2 sm:-right-2 lg:top-2 lg:-right-4 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 border border-white/10 rounded-full group-hover:scale-110 transition-transform duration-700 delay-100"></div>
        </div>
      </div>
    </div>
  );
}
