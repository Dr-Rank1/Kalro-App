import { useState, useEffect } from 'react';
import { MortalityLog } from '../../../types';
import { storage } from '../../../storage';

export function useHealth(userId?: string) {
  const [mortalityLogs, setMortalityLogs] = useState<MortalityLog[]>(() => storage.getMortalityLogs(userId));

  useEffect(() => {
    const sub = storage.mortalityLogs$.subscribe((logs) => {
      setMortalityLogs(logs);
    });
    return () => sub.unsubscribe();
  }, []);

  const totalMortality = mortalityLogs.reduce((sum, m) => sum + m.count, 0);

  const addMortalityLog = (log: MortalityLog, operator?: { id: string; name: string; role: string }) => {
    storage.addMortalityLog(log, operator);
  };

  return {
    mortalityLogs,
    totalMortality,
    addMortalityLog,
  };
}
