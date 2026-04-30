export interface CollectionData {
  id: string;
  slug: string;
  name: string;
  colorHex: string;
  coverImageUrl: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

export class Collection {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly colorHex: string;
  readonly coverImageUrl: string;
  readonly description: string;
  readonly displayOrder: number;

  private _isActive: boolean;
  get isActive() { return this._isActive; }

  private constructor(data: CollectionData) {
    this.id = data.id;
    this.slug = data.slug;
    this.name = data.name;
    this.colorHex = data.colorHex;
    this.coverImageUrl = data.coverImageUrl;
    this.description = data.description;
    this.displayOrder = data.displayOrder;
    this._isActive = data.isActive;
  }

  static create(data: CollectionData): Collection {
    if (data.displayOrder < 0) {
      throw new Error("Collection displayOrder must be >= 0");
    }
    return new Collection(data);
  }

  static reconstitute(data: CollectionData): Collection {
    return new Collection(data);
  }

  activate(): void { this._isActive = true; }
  deactivate(): void { this._isActive = false; }
}
