export interface SchemaResponse {
  filters: Filter[];
}

export interface Filter {
  key: string;
  label: string;
  kind: FilterKind;
  isMulti: boolean;
  resourceField: string | null;
  values: FilterValue[];
}

export interface FilterValue {
  value: string;
  label: string;
}

export enum FilterKind {
  Facet = 'Facet',
  Range = 'Range',
  Boolean = 'Boolean',
  Text = 'Text'
}

