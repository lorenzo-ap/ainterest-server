import type { Types } from 'mongoose';

export type Ref<T> = Types.ObjectId | T;
