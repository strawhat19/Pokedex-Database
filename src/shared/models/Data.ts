import { omitUndefined } from '../common/values';

export interface DataRecord {
  id: string;
  number: number;
  createdAt: string;
  updatedAt: string;
}

export class Data implements DataRecord {
  id: string;
  number: number;
  createdAt: string;
  updatedAt: string;
  constructor(record: DataRecord) { this.id = record.id; this.number = record.number; this.createdAt = record.createdAt; this.updatedAt = record.updatedAt; }
  toRecord(): DataRecord { return omitUndefined({ id: this.id, number: this.number, createdAt: this.createdAt, updatedAt: this.updatedAt }); }
}
