export const vehicleCostTypeLabels: Record<string, string> = {
  PAINTING: 'Pintura',
  MECHANICS: 'Mecânica',
  BODYWORK: 'Funilaria',
  SANITIZATION: 'Higienização',
  DOCUMENTATION: 'Documentação',
  DISPATCHER: 'Despachante',
  TRANSPORT: 'Transporte',
  TOWING: 'Guincho',
  ADVERTISING: 'Anúncios',
  COMMISSION: 'Comissão',
  WASHING: 'Lavagem',
  REVISION: 'Revisão',
  OTHER: 'Outros',
};

export const vehicleCostTypeOptions = Object.entries(vehicleCostTypeLabels).map(
  ([value, label]) => ({ value, label }),
);
