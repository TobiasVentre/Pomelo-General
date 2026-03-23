import type { Product } from "../../../../domain/entities/product";
import type { CreateProductCommand } from "./create-product.command";

export interface CreateProductCommandHandler {
  execute(command: CreateProductCommand): Promise<Product>;
}
