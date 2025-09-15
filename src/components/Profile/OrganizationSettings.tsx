import React, { useState } from 'react';
import { Building2, Mail, Phone, MapPin, Globe, FileText, Save } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const OrganizationSettings: React.FC = () => {
  const { darkMode } = useAppStore();
  
  const [orgData, setOrgData] = useState({
    name: 'CEAC Agropecuária e Mercantil Ltda',
    cnpj: '12.345.678/0001-90',
    ie: '123.456.789.000',
    email: 'contato@ceac.com.br',
    phone: '(65) 3544-1000',
    website: 'www.ceac.com.br',
    address: 'Fazenda CEAC, Rod. BR-163, km 45',
    city: 'Sorriso',
    state: 'MT',
    zipCode: '78890-000',
    responsibleName: 'Carlos Eduardo Araujo',
    responsibleCpf: '123.456.789-00',
    responsibleRole: 'Diretor Executivo',
    logo: null as string | null
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setOrgData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Aqui você salvaria os dados no backend
    setIsEditing(false);
    // Mostrar notificação de sucesso
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Dados da Organização
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Informações cadastrais e configurações da empresa
        </p>
      </div>

      {/* Logo e Informações Básicas */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Informações da Empresa
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-b3x-lime-600 hover:text-b3x-lime-700 text-sm font-medium"
            >
              Editar
            </button>
          )}
        </div>

        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-xl flex items-center justify-center shadow-soft">
              {orgData.logo ? (
                <img src={orgData.logo} alt="Logo" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className="text-b3x-navy-900 font-black text-2xl">CEAC</span>
              )}
            </div>
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 bg-b3x-lime-500 p-2 rounded-full cursor-pointer hover:bg-b3x-lime-600 transition-colors">
                <FileText className="w-4 h-4 text-b3x-navy-900" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">{orgData.name}</h3>
            <p className="text-neutral-600 dark:text-neutral-400">CNPJ: {orgData.cnpj}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Razão Social
            </label>
            <input
              type="text"
              value={orgData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              CNPJ
            </label>
            <input
              type="text"
              value={orgData.cnpj}
              onChange={(e) => handleInputChange('cnpj', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Inscrição Estadual
            </label>
            <input
              type="text"
              value={orgData.ie}
              onChange={(e) => handleInputChange('ie', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={orgData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          Informações de Contato
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              E-mail Corporativo
            </label>
            <input
              type="email"
              value={orgData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={orgData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          Endereço
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Endereço
            </label>
            <input
              type="text"
              value={orgData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Cidade
            </label>
            <input
              type="text"
              value={orgData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Estado
            </label>
            <select
              value={orgData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            >
              <option value="MT">MT</option>
              <option value="MS">MS</option>
              <option value="GO">GO</option>
              <option value="SP">SP</option>
              <option value="MG">MG</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              CEP
            </label>
            <input
              type="text"
              value={orgData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Responsável Legal */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          Responsável Legal
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={orgData.responsibleName}
              onChange={(e) => handleInputChange('responsibleName', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              CPF
            </label>
            <input
              type="text"
              value={orgData.responsibleCpf}
              onChange={(e) => handleInputChange('responsibleCpf', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Cargo
            </label>
            <input
              type="text"
              value={orgData.responsibleRole}
              onChange={(e) => handleInputChange('responsibleRole', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      )}
    </div>
  );
}; 
