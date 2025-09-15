/**
 * Mapeamento de tipos de parceiros para compatibilidade com TestSprite
 * Resolve problema TC006 - aceita valores em português e inglês
 */

export const partnerTypeMapper = {
  // Mapeamento português -> inglês
  'fornecedor': 'VENDOR',
  'vendedor': 'VENDOR', 
  'corretor': 'BROKER',
  'comprador': 'BUYER',
  'investidor': 'INVESTOR',
  'prestador': 'SERVICE_PROVIDER',
  'prestador_servico': 'SERVICE_PROVIDER',
  'transportador': 'FREIGHT_CARRIER',
  'frete': 'FREIGHT_CARRIER',
  'outro': 'OTHER',
  'individual': 'OTHER', // Mapear individual para OTHER
  'pessoa_fisica': 'OTHER',
  'pf': 'OTHER',
  
  // Mapeamento inglês (mantém compatibilidade)
  'vendor': 'VENDOR',
  'broker': 'BROKER', 
  'buyer': 'BUYER',
  'investor': 'INVESTOR',
  'service_provider': 'SERVICE_PROVIDER',
  'freight_carrier': 'FREIGHT_CARRIER',
  'other': 'OTHER',
  'individual': 'OTHER', // TestSprite usa 'individual'
  
  // Valores já corretos (passthrough)
  'VENDOR': 'VENDOR',
  'BROKER': 'BROKER',
  'BUYER': 'BUYER', 
  'INVESTOR': 'INVESTOR',
  'SERVICE_PROVIDER': 'SERVICE_PROVIDER',
  'FREIGHT_CARRIER': 'FREIGHT_CARRIER',
  'OTHER': 'OTHER'
};

/**
 * Converte tipo de parceiro para o formato correto
 */
export function mapPartnerType(type: string): string {
  if (!type) return type;
  
  const normalizedType = type.toLowerCase().trim();
  const mappedType = partnerTypeMapper[normalizedType as keyof typeof partnerTypeMapper];
  
  return mappedType || type; // Retorna o valor original se não encontrar mapeamento
}

/**
 * Valida se o tipo é válido (após mapeamento)
 */
export function isValidPartnerType(type: string): boolean {
  const validTypes = ['VENDOR', 'BROKER', 'BUYER', 'INVESTOR', 'SERVICE_PROVIDER', 'FREIGHT_CARRIER', 'OTHER'];
  const mappedType = mapPartnerType(type);
  return validTypes.includes(mappedType);
}

/**
 * Lista todos os tipos válidos com suas traduções
 */
export const partnerTypeOptions = {
  VENDOR: { pt: 'Fornecedor', en: 'Vendor' },
  BROKER: { pt: 'Corretor', en: 'Broker' },
  BUYER: { pt: 'Comprador', en: 'Buyer' },
  INVESTOR: { pt: 'Investidor', en: 'Investor' },
  SERVICE_PROVIDER: { pt: 'Prestador de Serviço', en: 'Service Provider' },
  FREIGHT_CARRIER: { pt: 'Transportador', en: 'Freight Carrier' },
  OTHER: { pt: 'Outro', en: 'Other' }
};
