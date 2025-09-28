/**
 * MODULE D'AUTOMATISATION DES PAIEMENTS DE COMMISSIONS
 * Gère automatiquement les échéances CVD et CCA selon les conditions spécifiques
 */

export interface PaymentSchedule {
  type: 'CVD' | 'CCA';
  clientId: number;
  vendeurId: number;
  productType: string;
  installationDate: Date;
  acquisitionDate: Date;
  paymentDate: Date;
  commission: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface CommissionCalculation {
  cvdCommission: number;
  ccaCommission: number;
  nextCvdPayment: Date;
  nextCcaPayment: Date;
  pendingCvdAmount: number;
  pendingCcaAmount: number;
}

/**
 * Calcule la date de paiement CVD selon la règle :
 * Ventes installées en N payées le 15 N+1
 */
export function calculateCvdPaymentDate(installationDate: Date): Date {
  const paymentDate = new Date(installationDate);
  paymentDate.setMonth(paymentDate.getMonth() + 1);
  paymentDate.setDate(15);
  paymentDate.setHours(0, 0, 0, 0);
  return paymentDate;
}

/**
 * Calcule la date de paiement CCA selon la règle :
 * Paiement le 22 du mois suivant l'acquisition client
 */
export function calculateCcaPaymentDate(acquisitionDate: Date): Date {
  const paymentDate = new Date(acquisitionDate);
  paymentDate.setMonth(paymentDate.getMonth() + 1);
  paymentDate.setDate(22);
  paymentDate.setHours(0, 0, 0, 0);
  return paymentDate;
}

/**
 * Génère le planning automatique des paiements pour un client
 */
export function generatePaymentSchedule(
  clientId: number,
  vendeurId: number,
  productType: string,
  installationDate: Date,
  acquisitionDate: Date,
  cvdCommission: number,
  ccaCommission: number
): PaymentSchedule[] {
  const schedules: PaymentSchedule[] = [];
  
  // Planning CVD (ventes directes)
  if (cvdCommission > 0) {
    schedules.push({
      type: 'CVD',
      clientId,
      vendeurId,
      productType,
      installationDate,
      acquisitionDate,
      paymentDate: calculateCvdPaymentDate(installationDate),
      commission: cvdCommission,
      status: 'pending'
    });
  }
  
  // Planning CCA (7ème niveau)
  if (ccaCommission > 0) {
    schedules.push({
      type: 'CCA',
      clientId,
      vendeurId,
      productType,
      installationDate,
      acquisitionDate,
      paymentDate: calculateCcaPaymentDate(acquisitionDate),
      commission: ccaCommission,
      status: 'pending'
    });
  }
  
  return schedules;
}

/**
 * Calcule les prochaines échéances de paiement pour un vendeur
 */
export function getUpcomingPayments(vendeurId: number, schedules: PaymentSchedule[]): {
  nextCvdPayments: PaymentSchedule[];
  nextCcaPayments: PaymentSchedule[];
  totalCvdPending: number;
  totalCcaPending: number;
} {
  const now = new Date();
  const vendeurSchedules = schedules.filter(s => s.vendeurId === vendeurId && s.status === 'pending');
  
  const nextCvdPayments = vendeurSchedules
    .filter(s => s.type === 'CVD' && s.paymentDate >= now)
    .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
    
  const nextCcaPayments = vendeurSchedules
    .filter(s => s.type === 'CCA' && s.paymentDate >= now)
    .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
  
  const totalCvdPending = nextCvdPayments.reduce((sum, p) => sum + p.commission, 0);
  const totalCcaPending = nextCcaPayments.reduce((sum, p) => sum + p.commission, 0);
  
  return {
    nextCvdPayments,
    nextCcaPayments,
    totalCvdPending,
    totalCcaPending
  };
}

/**
 * Vérifie les paiements en retard et les marque comme overdue
 */
export function checkOverduePayments(schedules: PaymentSchedule[]): PaymentSchedule[] {
  const now = new Date();
  return schedules.map(schedule => {
    if (schedule.status === 'pending' && schedule.paymentDate < now) {
      return { ...schedule, status: 'overdue' as const };
    }
    return schedule;
  });
}

/**
 * Génère un rapport mensuel des commissions à payer
 */
export function generateMonthlyPaymentReport(month: number, year: number, schedules: PaymentSchedule[]): {
  cvdPayments: PaymentSchedule[];
  ccaPayments: PaymentSchedule[];
  totalCvd: number;
  totalCca: number;
  paymentDates: {
    cvdDate: Date;
    ccaDate: Date;
  };
} {
  const cvdDate = new Date(year, month - 1, 15);
  const ccaDate = new Date(year, month - 1, 22);
  
  const cvdPayments = schedules.filter(s => 
    s.type === 'CVD' && 
    s.paymentDate.getMonth() === month - 1 && 
    s.paymentDate.getFullYear() === year &&
    s.status === 'pending'
  );
  
  const ccaPayments = schedules.filter(s => 
    s.type === 'CCA' && 
    s.paymentDate.getMonth() === month - 1 && 
    s.paymentDate.getFullYear() === year &&
    s.status === 'pending'
  );
  
  return {
    cvdPayments,
    ccaPayments,
    totalCvd: cvdPayments.reduce((sum, p) => sum + p.commission, 0),
    totalCca: ccaPayments.reduce((sum, p) => sum + p.commission, 0),
    paymentDates: { cvdDate, ccaDate }
  };
}

/**
 * Formate une date de paiement pour l'affichage
 */
export function formatPaymentDate(date: Date, type: 'CVD' | 'CCA'): string {
  const day = type === 'CVD' ? 15 : 22;
  const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${monthName} ${year}`;
}

/**
 * Calcule le délai restant avant le prochain paiement
 */
export function getDaysUntilPayment(paymentDate: Date): number {
  const now = new Date();
  const timeDiff = paymentDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}