import type { TrueNorth } from '../../models/trueNorth';

export interface TrueNorthSlice {
  trueNorths: TrueNorth[];
  addTrueNorth: (trueNorth: TrueNorth) => void;
  updateTrueNorth: (id: string, patch: Partial<TrueNorth>) => void;
  deleteTrueNorth: (id: string) => void;
}
