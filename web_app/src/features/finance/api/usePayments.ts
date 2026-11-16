import { useState, useEffect } from 'react';
import { PaymentRecord } from '../../../types';
import { storage } from '../../../storage';

export function usePayments(userId?: string) {
  const [payments, setPayments] = useState<PaymentRecord[]>(() => storage.getPayments(userId));

  useEffect(() => {
    const sub = storage.payments$.subscribe((list) => {
      setPayments(list);
    });
    return () => sub.unsubscribe();
  }, []);

  const totalInflow = payments
    .filter((p) => p.direction === 'inflow')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutflow = payments
    .filter((p) => p.direction === 'outflow')
    .reduce((sum, p) => sum + p.amount, 0);

  const netIncome = totalInflow - totalOutflow;

  const addPayment = (payment: PaymentRecord) => {
    storage.addPayment(payment);
  };

  return {
    payments,
    totalInflow,
    totalOutflow,
    netIncome,
    addPayment,
  };
}
