import React from 'react';
import { useAppStore } from '../../stores/useAppStore';

export const DashboardHeader: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 rounded-xl p-6 shadow-soft text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Bem-vindo ao B3X CEAC</h1>
          <p className="text-b3x-navy-200">Gestão completa do ciclo de produção e engorda de bovinos</p>
        </div>
      </div>
    </div>
  );
}; 
