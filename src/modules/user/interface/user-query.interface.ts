export interface FindAllQuery {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  // Multiple filters (e.g. status, category_id)
//   status?: string;
//   category_id?: number;

//   baseUrl?: string; // Request URL path (e.g., "https://api.example.com/restaurants")
}