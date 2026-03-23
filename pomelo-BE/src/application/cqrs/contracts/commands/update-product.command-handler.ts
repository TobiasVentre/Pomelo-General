import type { Product } from "../../../../domain/entities/product";
import type { UpdateProductCommand } from "./update-product.command";

export interface UpdateProductCommandHandler {
  execute(command: UpdateProductCommand): Promise<Product | null>;
}
