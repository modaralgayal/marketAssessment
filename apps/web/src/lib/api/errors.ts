

// Carries field-level validation errors (`{ field: string[] }`) from the API so
// forms can highlight the exact missing/invalid fields instead of a generic message.
export class ApiError extends Error {
  fields?: Record<string, string[]>;
  constructor(message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.fields = fields;
  }
}
