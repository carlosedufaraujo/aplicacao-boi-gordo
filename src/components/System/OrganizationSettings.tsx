import React, { useState } from 'react';
import { Building, MapPin, Phone, Mail, FileText, Save, Upload, Download } from 'lucide-react';
import { useSettings } from '@/providers/SettingsProvider';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const OrganizationSettings: React.FC = () => {
  const { 
    companyName, 
    companyDocument, 
    companyEmail, 
    companyPhone,
    updateSettings 
  } = useSettings();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [organizationData, setOrganizationData] = useState({
    name: companyName,
    document: companyDocument,
    email: companyEmail,
    phone: companyPhone,
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'GO',
      zipCode: ''
    },
    businessType: 'cattle_farming',
    foundedYear: new Date().getFullYear(),
    description: '',
    website: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      linkedin: ''
    }
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      updateSettings({
        companyName: organizationData.name,
        companyDocument: organizationData.document,
        companyEmail: organizationData.email,
        companyPhone: organizationData.phone
      });

      setMessage({ type: 'success', text: 'Configurações da organização salvas com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar configurações' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(organizationData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `organizacao-${organizationData.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          setOrganizationData(prev => ({ ...prev, ...importedData }));
          setMessage({ type: 'success', text: 'Configurações importadas com sucesso!' });
        } catch (error) {
          setMessage({ type: 'error', text: 'Erro ao importar configurações. Verifique o formato do arquivo.' });
        }
      };
      reader.readAsText(file);
    }
  };

  const BUSINESS_TYPES = [
    { value: 'cattle_farming', label: 'Pecuária de Corte' },
    { value: 'dairy_farming', label: 'Pecuária Leiteira' },
    { value: 'mixed_farming', label: 'Pecuária Mista' },
    { value: 'feedlot', label: 'Confinamento' },
    { value: 'breeding', label: 'Reprodução' },
    { value: 'other', label: 'Outro' }
  ];

  const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Configurações da Organização</h1>
        <p className="page-subtitle">
          Gerencie as informações da sua empresa e propriedade
        </p>
      </div>

      {/* Mensagens */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>
              Dados básicos da sua organização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Razão Social</Label>
                <Input
                  id="company-name"
                  value={organizationData.name}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-document">CNPJ</Label>
                <Input
                  id="company-document"
                  value={organizationData.document}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, document: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-email">Email Corporativo</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={organizationData.email}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-phone">Telefone</Label>
                <Input
                  id="company-phone"
                  value={organizationData.phone}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-type">Tipo de Negócio</Label>
                <Select
                  value={organizationData.businessType}
                  onValueChange={(value) => setOrganizationData(prev => ({ ...prev, businessType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="founded-year">Ano de Fundação</Label>
                <Input
                  id="founded-year"
                  type="number"
                  value={organizationData.foundedYear}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, foundedYear: parseInt(e.target.value) }))}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={organizationData.website}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Empresa</Label>
              <Textarea
                id="description"
                value={organizationData.description}
                onChange={(e) => setOrganizationData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva brevemente sua empresa e atividades..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
            <CardDescription>
              Localização da sede da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Logradouro</Label>
                <Input
                  id="street"
                  value={organizationData.address.street}
                  onChange={(e) => setOrganizationData(prev => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={organizationData.address.number}
                  onChange={(e) => setOrganizationData(prev => ({
                    ...prev,
                    address: { ...prev.address, number: e.target.value }
                  }))}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={organizationData.address.complement}
                  onChange={(e) => setOrganizationData(prev => ({
                    ...prev,
                    address: { ...prev.address, complement: e.target.value }
                  }))}
                  placeholder="Sala, Andar, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={organizationData.address.neighborhood}
                  onChange={(e) => setOrganizationData(prev => ({
                    ...prev,
                    address: { ...prev.address, neighborhood: e.target.value }
                  }))}
                  placeholder="Centro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={organizationData.address.city}
                  onChange={(e) => setOrganizationData(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  placeholder="Goiânia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select
                  value={organizationData.address.state}
                  onValueChange={(value) => setOrganizationData(prev => ({
                    ...prev,
                    address: { ...prev.address, state: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={organizationData.address.zipCode}
                  onChange={(e) => setOrganizationData(prev => ({
                    ...prev,
                    address: { ...prev.address, zipCode: e.target.value }
                  }))}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
            <CardDescription>
              Links para as redes sociais da empresa (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={organizationData.socialMedia.facebook}
                  onChange={(e) => setOrganizationData(prev => ({
                    ...prev,
                    socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                  }))}
                  placeholder="https://facebook.com/empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={organizationData.socialMedia.instagram}
                  onChange={(e) => setOrganizationData(prev => ({
                    ...prev,
                    socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                  }))}
                  placeholder="https://instagram.com/empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={organizationData.socialMedia.linkedin}
                  onChange={(e) => setOrganizationData(prev => ({
                    ...prev,
                    socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                  }))}
                  placeholder="https://linkedin.com/company/empresa"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleExportSettings}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Button type="button" variant="outline" asChild>
              <label htmlFor="import-settings" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </label>
            </Button>
            <input
              id="import-settings"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportSettings}
            />
          </div>
        </div>
      </form>
    </div>
  );
};
