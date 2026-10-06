export enum Roles {
  Subscriber = `Subscriber`,
  Owner = `Owner`,
}

export enum Providers {
  Local = `local`,
}

export enum Types {
  User = `User`,
  Team = `Team`,
}

export type ProfilePrivacy = `public` | `private`;
export type TeamCapacity = 3 | 6 | 10;
export type VoteValue = -1 | 0 | 1;
