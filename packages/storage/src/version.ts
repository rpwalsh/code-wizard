/**
 * Schema version for stored progress and for exported snapshots.
 *
 * Lives apart from the SQLite migrations so the web build can validate an
 * import without pulling in `node:sqlite`.
 */
export const LATEST_VERSION = 1;
