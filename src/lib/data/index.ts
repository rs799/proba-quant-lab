/**
 * Data access facade.
 * Components import from here only. Swap `DATA_SOURCE` to "api" once the
 * backend exposes the same contracts (see ./types.ts).
 */
import * as mock from "./mock";
import type { DataSource } from "./types";

export const DATA_SOURCE: DataSource = "mock";

export const data = mock;
export { classifySignal } from "./mock";
export * from "./types";
