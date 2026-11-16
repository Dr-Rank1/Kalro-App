import { useState, useEffect } from 'react';
import { Batch } from '../../../types';
import { storage } from '../../../storage';

export function useBatches(userId?: string) {
  const [batches, setBatches] = useState<Batch[]>(() => storage.getBatches(userId));

  useEffect(() => {
    const sub = storage.batches$.subscribe((list) => {
      setBatches(list);
    });
    return () => sub.unsubscribe();
  }, []);

  const activeBatches = batches.filter((b) => b.status === 'active');
  const closedBatches = batches.filter((b) => b.status === 'closed');
  const quarantinedBatches = batches.filter((b) => b.isQuarantined);

  const addBatch = (batch: Batch, operator?: { id: string; name: string; role: string }) => {
    storage.addBatch(batch, operator);
  };

  const updateBatch = (batch: Batch, operator?: { id: string; name: string; role: string }) => {
    storage.updateBatch(batch, operator);
  };

  const exportBatchesCsv = () => {
    return storage.exportBatchesCsv();
  };

  return {
    batches,
    activeBatches,
    closedBatches,
    quarantinedBatches,
    addBatch,
    updateBatch,
    exportBatchesCsv,
  };
}
