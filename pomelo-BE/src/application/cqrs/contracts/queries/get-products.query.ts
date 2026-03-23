export interface GetProductsQuery {
  slug?: string;
  collection?: string;
  category?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}
