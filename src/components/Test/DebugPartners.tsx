import React, { useEffect } from 'react';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { useBackend } from '@/providers/BackendProvider';

export const DebugPartners: React.FC = () => {
  const { user, token } = useBackend();
  const { partners, loading, error, refresh } = usePartnersApi();

  useEffect(() => {
    console.log('=== DEBUG PARTNERS ===');
    console.log('User:', user);
    console.log('Token:', token);
    console.log('Partners:', partners);
    console.log('Loading:', loading);
    console.log('Error:', error);
    console.log('API URL:', import.meta.env.VITE_API_URL);
  }, [user, token, partners, loading, error]);

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-4">Debug Partners</h2>
      
      <div className="space-y-2">
        <div>
          <strong>Usuário:</strong> {user ? user.email : 'Não autenticado'}
        </div>
        <div>
          <strong>Token:</strong> {token ? 'Presente' : 'Ausente'}
        </div>
        <div>
          <strong>Loading:</strong> {loading ? 'Sim' : 'Não'}
        </div>
        <div>
          <strong>Error:</strong> {error || 'Nenhum'}
        </div>
        <div>
          <strong>Total Partners:</strong> {partners?.length || 0}
        </div>
        <div>
          <strong>API URL:</strong> {import.meta.env.VITE_API_URL}
        </div>
      </div>

      <button 
        onClick={() => refresh()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh
      </button>

      {partners && partners.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold">Partners:</h3>
          <ul className="list-disc list-inside">
            {partners.map(p => (
              <li key={p.id}>{p.name} - {p.type}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};