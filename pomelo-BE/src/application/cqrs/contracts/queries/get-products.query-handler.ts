import type { Product } from "../../../../domain/entities/product";
import type { GetProductsQuery } from "./get-products.query";

export interface GetProductsQueryHandler {
  execute(query: GetProductsQuery): Promise<Product[]>;
}
