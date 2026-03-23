export interface CreateCollectionCommand {
  slug: string;
  name: string;
  colorHex: string;
  coverImageUrl: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}
