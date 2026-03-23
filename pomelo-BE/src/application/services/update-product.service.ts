import type { Product } from "../../domain/entities/product";
import type { UpdateProductCommand } from "../cqrs/contracts/commands/update-product.command";
import type { UpdateProductCommandHandler } from "../cqrs/contracts/commands/update-product.command-handler";

export class UpdateProductService {
  constructor(private readonly commandHandler: UpdateProductCommandHandler) {}

  execute(command: UpdateProductCommand): Promise<Product | null> {
    return this.commandHandler.execute(command);
  }
}
