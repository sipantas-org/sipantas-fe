export interface ComboOption {
  label: string;
  value: string;
}

export interface ComboLoadParams {
  search: string;
  page: number;
  limit: number;
}

export interface ComboLoadResult {
  items: ComboOption[];
  total: number;
}

// Loads one page of options; `search` is matched by the server.
export type ComboLoader = (params: ComboLoadParams) => Promise<ComboLoadResult>;

// Finds the label of a value that may not be in the loaded pages yet.
export type ComboResolver = (value: string) => Promise<ComboOption | undefined>;
