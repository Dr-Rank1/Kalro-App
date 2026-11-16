import { useState, useEffect } from 'react';
import { LeafInventory, LeafMovement } from '../../../types';
import { storage } from '../../../storage';

export function useLeafInventory(userId?: string) {
  const [inventory, setInventory] = useState<LeafInventory>(() => storage.getLeafInventory(userId));
  const [leafMovements, setLeafMovements] = useState<LeafMovement[]>(() => storage.getLeafMovements(userId));

  useEffect(() => {
    const subInv = storage.inventory$.subscribe((inv) => {
      setInventory(inv);
    });
    const subMove = storage.leafMovements$.subscribe((movements) => {
      setLeafMovements(movements);
    });

    return () => {
      subInv.unsubscribe();
      subMove.unsubscribe();
    };
  }, []);

  const saveInventory = (newInv: LeafInventory) => {
    storage.saveLeafInventory(newInv, userId);
  };

  const addMovement = (movement: LeafMovement, operator?: { id: string; name: string; role: string }) => {
    storage.addLeafMovement(movement, operator);
  };

  return {
    inventory,
    leafMovements,
    saveInventory,
    addMovement,
  };
}
