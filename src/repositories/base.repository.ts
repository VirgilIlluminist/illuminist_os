/**
 * base.repository.ts — Re-export central repository utilities
 * Convenience entry point for feature repositories under src/repositories/
 */
export {
  getRepo,
  getSeedableRepo,
  storageMode,
  type BaseRecord,
  type QueryOptions,
  type PageResult,
  type Repo,
} from '../core/repositories/index';
