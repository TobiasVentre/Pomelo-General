export interface IUnitOfWork {
  withTransaction<T>(fn: () => Promise<T>): Promise<T>;
}
