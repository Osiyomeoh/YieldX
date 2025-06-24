import React from 'react';
import { Play } from 'lucide-react';
import { ModalProps } from '@/types/ui';

interface VideoModalProps extends Omit<ModalProps, 'children'> {
  onTryDemo: () => void;
}

export function VideoModal({ isOpen, onClose, onTryDemo }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">YieldX Demo</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="bg-slate-100 rounded-xl p-12 text-center">
          <Play className="mx-auto mb-4 text-emerald-600" size={48} />
          <h4 className="text-xl font-semibold text-slate-900 mb-2">Demo Video Coming Soon</h4>
          <p className="text-slate-600 mb-6">
            Watch how we turn a Nigerian cocoa export into a 10% DeFi yield using live Chainlink data!
          </p>
          <button 
            onClick={() => {
              onClose();
              onTryDemo();
            }}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Try Live Demo Instead
          </button>
        </div>
      </div>
    </div>
  );
}