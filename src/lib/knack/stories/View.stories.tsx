import type { Meta, StoryObj } from "@storybook/react";
import { View } from "../components/View";
import { KnackProvider } from "../components/KnackProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const meta: Meta<typeof View> = {
  component: View,
  title: "Knack/View",
  decorators: [
    (Story) => (
      <KnackProvider
        applicationId={process.env.KNACK_APP_ID!}
        apiKey={process.env.KNACK_API_KEY}
        apiHost={process.env.KNACK_API_HOST}
      >
        <div className="p-4">
          <Story />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </KnackProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof View>;

export const Default: Story = {
  args: {
    viewKey: "view_1",
  },
};

export const TableView: Story = {
  args: {
    viewKey: "view_1", // Replace with a known table view key
  },
};

export const FormView: Story = {
  args: {
    viewKey: "view_347", // Replace with a known form view key
  },
};

export const RichTextView: Story = {
  args: {
    viewKey: "view_3", // Replace with a known rich text view key
  },
};

export const Error: Story = {
  args: {
    viewKey: "nonexistent_view",
  },
};
