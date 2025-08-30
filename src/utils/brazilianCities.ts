export interface State {
  code: string;
  name: string;
}

export interface City {
  name: string;
  state: string;
}

export const brazilianStates: State[] = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

// Principais cidades por estado (focando em cidades relevantes para pecuária)
export const brazilianCities: Record<string, string[]> = {
  'MT': [
    'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra',
    'Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Barra do Garças', 'Primavera do Leste',
    'Alta Floresta', 'Juína', 'Nova Mutum', 'Campo Verde', 'Diamantino',
    'Colíder', 'São José do Rio Claro', 'Pontes e Lacerda', 'Guarantã do Norte',
    'Água Boa', 'Confresa', 'Paranatinga', 'Ribeirão Cascalheira'
  ],
  'MS': [
    'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
    'Naviraí', 'Nova Andradina', 'Aquidauana', 'Paranaíba', 'Sidrolândia',
    'Maracaju', 'Coxim', 'Rio Brilhante', 'São Gabriel do Oeste', 'Bonito',
    'Miranda', 'Anastácio', 'Terenos', 'Chapadão do Sul', 'Costa Rica'
  ],
  'GO': [
    'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia',
    'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa',
    'Novo Gama', 'Itumbiara', 'Senador Canedo', 'Catalão', 'Jataí',
    'Planaltina', 'Caldas Novas', 'Goianésia', 'Quirinópolis', 'Mineiros',
    'Cristalina', 'Inhumas', 'Cidade Ocidental', 'Porangatu', 'Ipameri'
  ],
  'MG': [
    'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
    'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares',
    'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité',
    'Poços de Caldas', 'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni',
    'Barbacena', 'Sabará', 'Varginha', 'Conselheiro Lafaiete', 'Araguari',
    'Passos', 'Ubá', 'Coronel Fabriciano', 'Muriaé', 'Ituiutaba'
  ],
  'SP': [
    'São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André',
    'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Mauá', 'São José dos Campos',
    'Mogi das Cruzes', 'Diadema', 'Piracicaba', 'Caraguatatuba', 'Jundiaí',
    'Presidente Prudente', 'Araçatuba', 'Bauru', 'Marília', 'Franca',
    'São José do Rio Preto', 'Americana', 'Araraquara', 'Santos', 'Taubaté'
  ],
  'BA': [
    'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari',
    'Juazeiro', 'Petrolina', 'Lauro de Freitas', 'Itabuna', 'Jequié',
    'Alagoinhas', 'Barreiras', 'Paulo Afonso', 'Eunápolis', 'Simões Filho',
    'Santo Antônio de Jesus', 'Valença', 'Candeias', 'Guanambi', 'Jacobina',
    'Serrinha', 'Senhor do Bonfim', 'Dias d\'Ávila', 'Luis Eduardo Magalhães'
  ],
  'PR': [
    'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
    'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava',
    'Paranaguá', 'Araucária', 'Toledo', 'Apucarana', 'Pinhais',
    'Campo Largo', 'Arapongas', 'Almirante Tamandaré', 'Umuarama',
    'Paranavaí', 'Sarandi', 'Fazenda Rio Grande', 'Cambé', 'Francisco Beltrão'
  ],
  'RS': [
    'Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria',
    'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande',
    'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana', 'Santa Cruz do Sul',
    'Cachoeirinha', 'Bagé', 'Bento Gonçalves', 'Erechim', 'Guaíba',
    'Cachoeira do Sul', 'Santana do Livramento', 'Ijuí', 'Sapiranga'
  ],
  'RO': [
    'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal',
    'Rolim de Moura', 'Guajará-Mirim', 'Jaru', 'Ouro Preto do Oeste',
    'Machadinho d\'Oeste', 'Presidente Médici', 'Espigão d\'Oeste',
    'Colorado do Oeste', 'Cerejeiras', 'Alta Floresta d\'Oeste'
  ],
  'TO': [
    'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins',
    'Colinas do Tocantins', 'Guaraí', 'Formoso do Araguaia', 'Tocantinópolis',
    'Araguatins', 'Pedro Afonso', 'Miranorte', 'Dianópolis', 'Xambioá'
  ],
  'PA': [
    'Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas',
    'Castanhal', 'Abaetetuba', 'Cametá', 'Marituba', 'Bragança',
    'Altamira', 'Tucuruí', 'Paragominas', 'Redenção', 'Conceição do Araguaia',
    'São Félix do Xingu', 'Itaituba', 'Dom Eliseu', 'Tailândia'
  ],
  'AC': [
    'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá',
    'Feijó', 'Brasileia', 'Plácido de Castro', 'Xapuri', 'Epitaciolândia'
  ],
  'AM': [
    'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari',
    'Tefé', 'Tabatinga', 'Maués', 'São Gabriel da Cachoeira', 'Humaitá'
  ],
  'RR': [
    'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre',
    'Mucajaí', 'Cantá', 'Normandia', 'Bonfim'
  ],
  'AP': [
    'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque',
    'Porto Grande', 'Mazagão', 'Tartarugalzinho'
  ],
  'RJ': [
    'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu',
    'Niterói', 'Belford Roxo', 'São João de Meriti', 'Campos dos Goytacazes',
    'Petrópolis', 'Volta Redonda', 'Magé', 'Macaé', 'Itaboraí',
    'Cabo Frio', 'Angra dos Reis', 'Nova Friburgo', 'Barra Mansa',
    'Teresópolis', 'Mesquita', 'Nilópolis'
  ],
  'ES': [
    'Vitória', 'Vila Velha', 'Cariacica', 'Serra', 'Linhares',
    'Cachoeiro de Itapemirim', 'São Mateus', 'Colatina', 'Guarapari',
    'Aracruz', 'Viana', 'Marataízes', 'Santa Teresa', 'Nova Venécia'
  ],
  'SC': [
    'Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma',
    'Chapecó', 'Itajaí', 'Lages', 'Palhoça', 'Balneário Camboriú',
    'Brusque', 'Tubarão', 'São Bento do Sul', 'Caçador', 'Camboriú',
    'Navegantes', 'Concórdia', 'Rio do Sul', 'Araranguá', 'Gaspar'
  ],
  'CE': [
    'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
    'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá',
    'Canindé', 'Aquiraz', 'Pacatuba', 'Crateús', 'Russas'
  ],
  'PE': [
    'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina',
    'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns',
    'Vitória de Santo Antão', 'Igarassu', 'São Lourenço da Mata',
    'Santa Cruz do Capibaribe', 'Abreu e Lima', 'Ipojuca'
  ],
  'PB': [
    'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos',
    'Bayeux', 'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira',
    'Mamanguape', 'Esperança', 'Monteiro', 'Princesa Isabel'
  ],
  'RN': [
    'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante',
    'Macaíba', 'Ceará-Mirim', 'Currais Novos', 'Caicó',
    'Açu', 'Nova Cruz', 'João Câmara', 'Pau dos Ferros'
  ],
  'AL': [
    'Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios',
    'Union dos Palmares', 'Penedo', 'Coruripe', 'Delmiro Gouveia',
    'São Miguel dos Campos', 'Santana do Ipanema', 'Girau do Ponciano'
  ],
  'SE': [
    'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana',
    'São Cristóvão', 'Estância', 'Tobias Barreto', 'Simão Dias',
    'Propriá', 'Canindé de São Francisco', 'Barra dos Coqueiros'
  ],
  'PI': [
    'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano',
    'Campo Maior', 'Barras', 'União', 'Altos', 'Pedro II',
    'Valença do Piauí', 'José de Freitas', 'Oeiras', 'São Raimundo Nonato'
  ],
  'MA': [
    'São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon',
    'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal',
    'Balsas', 'Santa Inês', 'Pinheiro', 'Pedreiras', 'Chapadinha'
  ],
  'DF': [
    'Brasília', 'Taguatinga', 'Ceilândia', 'Gama', 'Sobradinho',
    'Planaltina', 'Águas Claras', 'Guará', 'Santa Maria', 'São Sebastião',
    'Samambaia', 'Recanto das Emas', 'Riacho Fundo', 'Núcleo Bandeirante'
  ]
};

export const getCitiesByState = (stateCode: string): string[] => {
  return brazilianCities[stateCode] || [];
};

export const formatLocation = (city: string, state: string): string => {
  return `${city} - ${state}`;
};

export const parseLocation = (location: string): { city: string; state: string } => {
  const parts = location.split(' - ');
  if (parts.length === 2) {
    return { city: parts[0].trim(), state: parts[1].trim() };
  }
  return { city: location, state: '' };
};