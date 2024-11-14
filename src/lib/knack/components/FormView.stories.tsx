import type { Meta, StoryObj } from "@storybook/react";
import { FormView } from "./FormView";
import { KnackProvider } from "./KnackProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { KnackFormView, KnackFormInput } from "../types";

const meta: Meta<typeof FormView> = {
  component: FormView,
  title: "Knack/FormView",
  decorators: [
    (Story) => (
      <KnackProvider
        applicationId={process.env.KNACK_APP_ID!}
        apiKey={process.env.KNACK_API_KEY}
        apiHost={process.env.KNACK_API_HOST}
      >
        <div className="p-4 max-w-2xl mx-auto">
          <Story />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </KnackProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof FormView>;

// Real schema from view_347
const purchaseRequisitionForm: KnackFormView = {
  _id: "6661c8f0f8f76a0027055acc",
  key: "view_347",
  name: "Add Purchase Requisition",
  type: "form",
  action: "create",
  submit_button_text: "Submit",
  groups: [
    {
      columns: [
        {
          inputs: [
            {
              instructions: "Select the team to benefit from this PR",
              source: {
                filters: [],
                type: "user",
                connection_key: "field_21",
                remote_key: "null",
              },
              field: {
                key: "field_407",
              },
              id: "field_407",
              label: "Team",
              type: "connection",
              format: {
                type: "connection",
                format: {
                  input: "chosen",
                  conn_default: "none",
                },
              },
            },
            {
              instructions: "Select if the PO for this PR is a Blanket PO",
              field: {
                key: "field_538",
              },
              id: "field_538",
              label: "Blanket PO",
              type: "boolean",
              format: {
                type: "boolean",
                format: {
                  default: false,
                  format: "yes_no",
                  input: "checkbox",
                  required: false,
                },
              },
            },
            {
              instructions: "",
              field: {
                key: "field_390",
              },
              id: "field_390",
              label: "Delivery Date",
              type: "date_time",
              format: {
                type: "date_time",
                format: {
                  calendar: false,
                  date_format: "mm/dd/yyyy",
                  default_time: "",
                  default_type: "none",
                  time_format: "Ignore Time",
                  time_type: "current",
                  default_date: "04/18/2024",
                },
              },
            },
          ],
        },
      ],
    },
    {
      columns: [
        {
          inputs: [
            {
              instructions:
                "Selecting Yes requires selecting the user on whose behalf the PR is being entered",
              field: {
                key: "field_526",
              },
              id: "field_526",
              label:
                "I am entering this Purchase Requisition on behalf of somebody else",
              type: "multiple_choice",
              format: {
                type: "multiple_choice",
                format: {
                  blank: "Select...",
                  default: "kn-blank",
                  options: ["Yes", "No"],
                  sorting: "custom",
                  type: "single",
                },
              },
            },
            {
              instructions:
                "Select the user on whose behalf the PR is being entered",
              source: {
                filters: [],
                connections: [
                  {
                    field: {
                      key: "field_21",
                    },
                    source: {
                      type: "input",
                      field: {
                        key: "field_407",
                      },
                    },
                  },
                ],
              },
              field: {
                key: "field_525",
              },
              id: "field_525",
              label: "Entered on behalf of",
              type: "connection",
              format: {
                type: "connection",
                format: {
                  input: "chosen",
                  conn_default: "none",
                },
              },
            },
          ],
        },
      ],
    },
    {
      columns: [
        {
          inputs: [
            {
              instructions:
                "Select the Vendor whose product/service is to be purchased",
              source: {
                filters: [],
              },
              field: {
                key: "field_381",
              },
              label: "Vendor",
              type: "connection",
              format: {
                type: "connection",
                format: {
                  input: "chosen",
                  conn_default: "none",
                },
              },
            },
            {
              instructions: "Enter the total cost of the purchase",
              field: {
                key: "field_383",
              },
              label: "Dollar Amount",
              type: "currency",
              format: {
                type: "currency",
                format: {
                  format: "$",
                },
              },
            },
          ],
        },
        {
          inputs: [
            {
              instructions: "Enter the Vendor's quote or proposal number",
              field: {
                key: "field_379",
              },
              label: "Quote/Proposal Number",
              type: "short_text",
              format: {
                type: "short_text",
                format: {},
              },
            },
            {
              instructions: "Select the Vendor's Quote/Proposal date",
              field: {
                key: "field_380",
              },
              label: "Quote/Proposal Date",
              type: "date_time",
              format: {
                type: "date_time",
                format: {
                  calendar: false,
                  date_format: "mm/dd/yyyy",
                  default_time: "",
                  default_type: "none",
                  time_format: "Ignore Time",
                  time_type: "current",
                  default_date: "04/18/2024",
                },
              },
            },
          ],
        },
      ],
    },
    {
      columns: [
        {
          inputs: [
            {
              instructions: "",
              field: {
                key: "field_537",
              },
              id: "field_537",
              label: "Would you like to enter a Cost center or an IO Number?",
              type: "multiple_choice",
              format: {
                type: "multiple_choice",
                format: {
                  blank: "Select...",
                  default: "kn-blank",
                  options: ["Cost Center", "I/O Number", "Both"],
                  sorting: "custom",
                  type: "single",
                },
              },
            },
            {
              instructions: "",
              field: {
                key: "field_393",
              },
              id: "field_393",
              label: "Cost Center #",
              type: "short_text",
              format: {
                type: "short_text",
                format: {},
              },
            },
            {
              instructions: "",
              source: {
                filters: [],
              },
              field: {
                key: "field_394",
              },
              id: "field_394",
              label: "IO/Program",
              type: "connection",
              format: {
                type: "connection",
                format: {
                  input: "chosen",
                  conn_default: "none",
                },
              },
            },
          ],
        },
        {
          inputs: [
            {
              instructions: "Enter the internal financial account number",
              field: {
                key: "field_392",
              },
              id: "field_392",
              label: "General Ledger #",
              type: "short_text",
              format: {
                type: "short_text",
                format: {},
              },
            },
            {
              instructions: "Enter the person expected to approve this PR",
              source: {
                filters: [
                  {
                    field: "field_8",
                    operator: "contains",
                    value: "profile_44",
                  },
                ],
                connections: [
                  {
                    field: {
                      key: "field_21",
                    },
                    source: {
                      type: "input",
                      field: {
                        key: "field_407",
                      },
                    },
                  },
                ],
              },
              field: {
                key: "field_401",
              },
              id: "field_401",
              label: "Invoice Approver",
              type: "connection",
              format: {
                type: "connection",
                format: {
                  input: "chosen",
                  conn_default: "none",
                },
              },
            },
          ],
        },
      ],
    },
    {
      columns: [
        {
          inputs: [
            {
              instructions: "",
              field: {
                key: "field_382",
              },
              label: "Description",
              type: "paragraph_text",
              format: {
                type: "paragraph_text",
                format: {},
              },
            },
            {
              instructions: "Attach a Quote or Invoice",
              field: {
                key: "field_414",
              },
              id: "field_414",
              label: "Copy of Quote",
              type: "file",
              format: {
                type: "file",
                format: {
                  secure: true,
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rules: {
    submits: [
      {
        key: "submit_1",
        action: "parent_page",
        message: "Form successfully submitted.",
        reload_show: false,
        is_default: true,
        reload_auto: true,
      },
    ],
    fields: [
      {
        criteria: [
          {
            field: "field_537",
            value: "Cost Center",
            operator: "is not",
          },
        ],
        actions: [
          {
            action: "hide-show",
            field: "field_393",
            value: "",
          },
        ],
        key: "107",
      },
      {
        criteria: [
          {
            field: "field_537",
            value: "I/O Number",
            operator: "is",
          },
        ],
        actions: [
          {
            action: "show-hide",
            field: "field_394",
            value: "",
          },
        ],
        key: "102",
      },
    ],
    records: [],
    emails: [],
  },
  source: {
    object: "object_34",
    authenticated_user: true,
    connection_key: "field_386",
    relationship_type: "foreign",
  },
};

export const Default: Story = {
  args: {
    view: purchaseRequisitionForm,
    onSubmit: async (data) => {
      console.log("Form submitted:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

function makeRequired(input: KnackFormInput): KnackFormInput {
  if (!input.format) return input;

  const format = { ...input.format };

  switch (format.type) {
    case "connection":
      return {
        ...input,
        format: {
          ...format,
          format: { ...format.format, required: true },
        },
      };
    case "boolean":
      return {
        ...input,
        format: {
          ...format,
          format: { ...format.format, required: true },
        },
      };
    case "multiple_choice":
      return {
        ...input,
        format: {
          ...format,
          format: { ...format.format, required: true },
        },
      };
    case "date_time":
      return {
        ...input,
        format: {
          ...format,
          format: { ...format.format, required: true },
        },
      };
    case "currency":
      return {
        ...input,
        format: {
          ...format,
          format: { ...format.format, required: true },
        },
      };
    case "short_text":
    case "paragraph_text":
      return {
        ...input,
        format: {
          ...format,
          format: { ...format.format, required: true },
        },
      };
    case "file":
      return {
        ...input,
        format: {
          ...format,
          format: { ...format.format, required: true },
        },
      };
    default:
      return input;
  }
}

export const WithValidation: Story = {
  args: {
    view: {
      ...purchaseRequisitionForm,
      groups: purchaseRequisitionForm.groups.map((group) => ({
        ...group,
        columns: group.columns.map((column) => ({
          ...column,
          inputs: column.inputs.map(makeRequired),
        })),
      })),
    },
  },
};

export const Submitting: Story = {
  args: {
    view: purchaseRequisitionForm,
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    },
  },
};
