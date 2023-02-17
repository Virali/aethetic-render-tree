export const CY_ID: "cy_cont" = "cy_cont";

export const CASE_TYPE: "case" = "case";

export const ACTION_TYPE: "action" = "action";
export const ACTION_SUBTYPE_EMAIL: "email" = "email";
export const ACTION_SUBTYPE_PUSH: "push" = "push";
export const ACTION_SUBTYPE_DELAY: "delay" = "delay";

export const ENTRY_TYPE: "entryPoint" = "entryPoint";
export const ENTRY_SUBTYPE: "busEvent" = "busEvent";

export const FILTER_TYPE: "filter" = "filter";
export const FILTER_SUBTYPE_IF: "if" = "if";
export const FILTER_SUBTYPE_MULTI: "switch" = "switch";

export const FINISH_TYPE: "finish" = "finish";

export const INTERMEDIATE_TYPE: "intermediate" = "intermediate";

export const NODE_TYPES = [
  ACTION_TYPE,
  ENTRY_TYPE,
  FILTER_TYPE,
  CASE_TYPE,
  FINISH_TYPE,
  INTERMEDIATE_TYPE,
] as const;
