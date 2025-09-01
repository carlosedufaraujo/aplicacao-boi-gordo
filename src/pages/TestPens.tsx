import React, { useEffect } from 'react';
import { usePensApi } from '../hooks/api/usePensApi';
import { PenAllocationForm } from '../components/Lots/PenAllocationForm';

export const TestPens: React.FC = () => {
  const { pens, loading, error, refresh } = usePensApi();
  const [showAllocationForm, setShowAllocationForm] = React.useState(false);
  const [selectedPenNumber, setSelectedPenNumber] = React.useState('');

  useEffect(() => {
    console.log('Pens loaded:', pens);
  }, [pens]);

  const handlePenClick = (penNumber: string) => {
    setSelectedPenNumber(penNumber);
    setShowAllocationForm(true);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p>Carregando currais...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-500">Erro: {error}</p>
        <button 
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Currais</h1>
      
      <div className="mb-6">
        <p className="text-lg">Total de currais: {pens.length}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pens.map(pen => (
          <div 
            key={pen.id}
            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => handlePenClick(pen.penNumber)}
          >
            <h3 className="font-bold text-lg">Curral {pen.penNumber}</h3>
            <p className="text-sm text-gray-600">{pen.location}</p>
            <div className="mt-2">
              <p>Capacidade: {pen.capacity}</p>
              <p>Ocupação: {pen.currentOccupancy || 0}</p>
              <p>Disponível: {pen.capacity - (pen.currentOccupancy || 0)}</p>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${((pen.currentOccupancy || 0) / pen.capacity) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((pen.currentOccupancy || 0) / pen.capacity * 100).toFixed(0)}% ocupado
              </p>
            </div>
          </div>
        ))}
      </div>

      {pens.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum curral encontrado</p>
        </div>
      )}

      <PenAllocationForm
        isOpen={showAllocationForm}
        onClose={() => setShowAllocationForm(false)}
        penNumber={selectedPenNumber}
      />
    </div>
  );
};