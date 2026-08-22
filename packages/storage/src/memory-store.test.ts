import { describeProgressStoreContract } from './conformance.ts';
import { MemoryProgressStore } from './memory-store.ts';

describeProgressStoreContract('MemoryProgressStore', async () => new MemoryProgressStore());
