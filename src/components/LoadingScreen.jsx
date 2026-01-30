import React from 'react';
import { Cpu } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-pulse">
      <div className="w-16 h-16 bg-[#FFF1F2] rounded-full flex items-center justify-center border border-[#FECDD3]">
        <Cpu className="w-8 h-8 text-[#E11D48] animate-spin" />
      </div>
      <p className="text-[#E11D48] font-medium tracking-wide text-sm">PROCESSING NEURAL CONTEXT...</p>
    </div>
  );
}