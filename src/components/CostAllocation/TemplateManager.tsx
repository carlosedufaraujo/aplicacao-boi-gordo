import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { AllocationTemplate } from '../../types';
import { Portal } from '../Common/Portal';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: AllocationTemplate) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const { 
    allocationTemplates, 
    createAllocationTemplate, 
    updateAllocationTemplate, 
    deleteAllocationTemplate 
  } = useAppStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AllocationTemplate | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    costType: 'administrative' | 'financial' | 'operational' | 'marketing' | 'other';
    allocationMethod: 'by_heads' | 'by_value' | 'by_days' | 'by_weight' | 'custom';
    isActive: boolean;
  }>({
    name: '',
    description: '',
    costType: 'administrative',
    allocationMethod: 'by_heads',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTemplate) {
      updateAllocationTemplate(editingTemplate.id, formData);
    } else {
      createAllocationTemplate(formData);
    }
    
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      costType: 'administrative',
      allocationMethod: 'by_heads',
      isActive: true
    });
  };

  const handleEdit = (template: AllocationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      costType: template.costType,
      allocationMethod: template.allocationMethod,
      isActive: template.isActive
    });
    setShowForm(true);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-b3x-navy-700" />
              <h2 className="text-xl font-bold text-b3x-navy-900">
                Templates de Rateio
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {!showForm ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-neutral-600">
                    Templates facilitam a criação de rateios recorrentes
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-3 py-1.5 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Novo Template
                  </button>
                </div>

                {allocationTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600">Nenhum template cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allocationTemplates.map(template => (
                      <div
                        key={template.id}
                        className="bg-neutral-50 rounded-lg p-4 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-b3x-navy-900">
                              {template.name}
                            </h4>
                            {template.description && (
                              <p className="text-sm text-neutral-600 mt-1">
                                {template.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                              <span>
                                Tipo: {
                                  template.costType === 'administrative' ? 'Administrativo' :
                                  template.costType === 'financial' ? 'Financeiro' :
                                  template.costType === 'operational' ? 'Operacional' :
                                  template.costType === 'marketing' ? 'Marketing' : 'Outros'
                                }
                              </span>
                              <span>
                                Método: {
                                  template.allocationMethod === 'by_heads' ? 'Por Cabeças' :
                                  template.allocationMethod === 'by_value' ? 'Por Valor' :
                                  template.allocationMethod === 'by_days' ? 'Por Dias' :
                                  template.allocationMethod === 'by_weight' ? 'Por Peso' : 'Customizado'
                                }
                              </span>
                              {!template.isActive && (
                                <span className="text-warning-600">Inativo</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => onSelectTemplate(template)}
                              className="px-3 py-1.5 text-sm bg-b3x-navy-900 text-white rounded-lg hover:bg-b3x-navy-800"
                            >
                              Usar
                            </button>
                            <button
                              onClick={() => handleEdit(template)}
                              className="p-1.5 text-neutral-600 hover:bg-neutral-200 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir este template?')) {
                                  deleteAllocationTemplate(template.id);
                                }
                              }}
                              className="p-1.5 text-error-600 hover:bg-error-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nome do Template
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Tipo de Custo
                  </label>
                  <select
                    value={formData.costType}
                    onChange={(e) => setFormData({ ...formData, costType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  >
                    <option value="administrative">Administrativo</option>
                    <option value="financial">Financeiro</option>
                    <option value="operational">Operacional</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Método de Rateio
                  </label>
                  <select
                    value={formData.allocationMethod}
                    onChange={(e) => setFormData({ ...formData, allocationMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  >
                    <option value="by_heads">Por Cabeças</option>
                    <option value="by_value">Por Valor</option>
                    <option value="by_days">Por Dias</option>
                    <option value="by_weight">Por Peso</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-b3x-lime-500 focus:ring-b3x-lime-500 border-neutral-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-neutral-700">
                    Template ativo
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600"
                  >
                    {editingTemplate ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}; 