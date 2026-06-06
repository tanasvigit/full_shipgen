import { apiRequest, unwrapEntity } from "@/src/lib/api";

export type CreateIssueInput = {
  driver: string;
  report: string;
  location?: string;
  category?: string;
  type?: string;
  priority?: string;
};

export const issuesService = {
  async create(input: CreateIssueInput) {
    const payload = await apiRequest("/issues", {
      method: "POST",
      body: { issue: input },
    });
    return unwrapEntity(payload, ["issue"]);
  },
};
