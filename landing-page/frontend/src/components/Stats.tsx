import { MagicWand } from "@phosphor-icons/react/dist/ssr";

export default function Stats() {
  return (
    <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20 -mt-16 sm:-mt-24 md:-mt-40 lg:-mt-52">
      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
        <div className="stat-card bg-white rounded-[2rem] p-5 lg:p-8 flex-1 flex justify-between items-end shadow-2xl min-h-[140px] md:min-h-[160px]">
          <div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 text-black tracking-tight">1-Click</h3>
            <p className="text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-widest font-bold">2D to 3D Generation</p>
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-gray-200 flex items-center justify-center bg-transparent shrink-0">
            <MagicWand weight="bold" className="text-lg lg:text-xl text-black" />
          </div>
        </div>

        <div className="stat-card bg-white rounded-[2rem] p-5 lg:p-8 flex-1 flex justify-between items-end shadow-2xl min-h-[140px] md:min-h-[160px]">
          <div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 text-black tracking-tight">AI Driven</h3>
            <p className="text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Movement Simulations</p>
          </div>
          <div className="w-16 h-8 lg:w-20 lg:h-10 bg-gray-100 rounded-full overflow-hidden shrink-0 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=2069&auto=format&fit=crop" alt="Simulation" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="stat-card bg-[#111111] text-white rounded-[2rem] p-5 lg:p-8 flex-1 flex flex-col justify-end shadow-2xl relative overflow-hidden group min-h-[140px] md:min-h-[160px]">
          <div className="relative z-10 flex justify-between items-end w-full">
            <div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 tracking-tight">Real-time</h3>
              <p className="text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-widest font-bold">Browser Collaboration</p>
            </div>
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 border border-white/10 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute top-2 -right-4 w-16 h-16 border border-white/10 rounded-full group-hover:scale-110 transition-transform duration-700 delay-100"></div>
        </div>
      </div>
    </div>
  );
}
