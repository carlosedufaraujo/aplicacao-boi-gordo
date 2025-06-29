import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useSystemSettings } from '../../hooks/useSystemSettings';

export const ProfileSettings: React.FC = () => {
  const { darkMode } = useAppStore();
  const { profile, updateProfile } = useSystemSettings();
  
  const [profileData, setProfileData] = useState({
    ...profile,
    address: 'Fazenda CEAC, Rod. BR-163, km 45',
    city: 'Sorriso',
    state: 'MT',
    zipCode: '78890-000',
    bio: 'Gestor responsável pelo confinamento de bovinos da CEAC Agropecuária.',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Atualizar o store global
    updateProfile({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      avatar: profileData.avatar,
    });
    
    setIsEditing(false);
    // Mostrar notificação de sucesso
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const avatarData = reader.result as string;
        setProfileData(prev => ({ ...prev, avatar: avatarData }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Meu Perfil
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Foto de Perfil */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-full flex items-center justify-center shadow-soft">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-b3x-navy-900" />
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-b3x-lime-500 p-2 rounded-full cursor-pointer hover:bg-b3x-lime-600 transition-colors">
                <Camera className="w-4 h-4 text-b3x-navy-900" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{profileData.name}</h2>
            <p className="text-neutral-600 dark:text-neutral-400">{profileData.role}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">{profileData.department}</p>
          </div>
        </div>
      </div>

      {/* Informações Pessoais */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Informações Pessoais
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={profileData.email}
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
              value={profileData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
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
              value={profileData.role}
              disabled
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white cursor-not-allowed"
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
              value={profileData.address}
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
              value={profileData.city}
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
              value={profileData.state}
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
              value={profileData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Sobre
        </h2>
        <textarea
          value={profileData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          disabled={!isEditing}
          rows={4}
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed resize-none"
        />
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