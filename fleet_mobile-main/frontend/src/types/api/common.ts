export type ApiErrorEnvelope = {
  errors?: string[];
  error?: string;
  message?: string;
};

export type ApiEntityEnvelope<T, K extends string> = {
  [P in K]?: T;
} & {
  data?: T;
};

export type ApiListEnvelope<T, K extends string> = {
  [P in K]?: T[];
} & {
  data?: T[];
  records?: T[];
  results?: T[];
};

export type IdRef = {
  id?: string | number;
  uuid?: string;
  public_id?: string;
};

