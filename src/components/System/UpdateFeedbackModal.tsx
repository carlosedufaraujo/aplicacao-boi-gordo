import React, { useState } from 'react';
import { X, Star, Send, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface UpdateFeedbackModalProps {
  updateId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateFeedbackModal: React.FC<UpdateFeedbackModalProps> = ({
  updateId,
  isOpen,
  onClose
}) => {
  const { addUpdateFeedback, addNotification } = useAppStore();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      addNotification({
        type: 'warning',
        title: 'Avaliação necessária',
        message: 'Por favor, selecione uma avaliação antes de enviar.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 1000));

      addUpdateFeedback({
        updateId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        comment: comment.trim() || undefined
      });

      addNotification({
        type: 'success',
        title: 'Feedback enviado',
        message: 'Obrigado por avaliar esta atualização!'
      });

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setRating(0);
        setComment('');
        setIsSubmitted(false);
      }, 2000);
    } catch (_error) {
      addNotification({
        type: 'error',
        title: 'Erro ao enviar',
        message: 'Não foi possível enviar seu feedback. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form
      setRating(0);
      setComment('');
      setIsSubmitted(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-b3x-navy-900">
            {isSubmitted ? 'Feedback Enviado!' : 'Avaliar Atualização'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-2">
              Obrigado pelo seu feedback!
            </h3>
            <p className="text-neutral-600">
              Sua opinião é muito importante para continuarmos melhorando o sistema.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Como você avalia esta atualização?
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-2 transition-all duration-200"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        value <= (hoveredRating || rating)
                          ? 'fill-warning-500 text-warning-500'
                          : 'text-neutral-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center mt-2">
                <span className="text-sm text-neutral-600">
                  {rating === 0 && 'Clique para avaliar'}
                  {rating === 1 && 'Muito Ruim'}
                  {rating === 2 && 'Ruim'}
                  {rating === 3 && 'Regular'}
                  {rating === 4 && 'Bom'}
                  {rating === 5 && 'Excelente'}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Comentários (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent resize-none"
                placeholder="Conte-nos o que você achou desta atualização..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-b3x-navy-900 border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}; 
