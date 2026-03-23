import type { Product } from "../../domain/entities/product";
import type { CreateProductCommand } from "../cqrs/contracts/commands/create-product.command";
import type { CreateProductCommandHandler } from "../cqrs/contracts/commands/create-product.command-handler";

export class CreateProductService {
  constructor(private readonly commandHandler: CreateProductCommandHandler) {}

  execute(command: CreateProductCommand): Promise<Product> {
    return this.commandHandler.execute(command);
  }
}
