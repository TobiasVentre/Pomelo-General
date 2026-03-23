import type { Product } from "../../domain/entities/product";
import type { GetProductsQuery } from "../cqrs/contracts/queries/get-products.query";
import type { GetProductsQueryHandler } from "../cqrs/contracts/queries/get-products.query-handler";

export class GetProductsService {
  constructor(private readonly queryHandler: GetProductsQueryHandler) {}

  execute(query: GetProductsQuery): Promise<Product[]> {
    return this.queryHandler.execute(query);
  }
}
