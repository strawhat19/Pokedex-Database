import { Data, DataRecord } from '../Data';
import { ProfilePrivacy, Providers, Roles } from '../../../types/types';

export interface UserRecord extends DataRecord {
  name: string;
  trainerId: string;
  role: Roles;
  provider: Providers;
  privacy: ProfilePrivacy;
}

export class User extends Data implements UserRecord {
  name: string;
  trainerId: string;
  role: Roles;
  provider: Providers;
  privacy: ProfilePrivacy;
  constructor(record: UserRecord) {
    super(record);
    this.name = record.name;
    this.trainerId = record.trainerId;
    this.role = record.role;
    this.provider = record.provider;
    this.privacy = record.privacy;
  }
  toRecord(): UserRecord { return { ...super.toRecord(), name: this.name, trainerId: this.trainerId, role: this.role, provider: this.provider, privacy: this.privacy }; }
}
