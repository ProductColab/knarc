import type { Meta, StoryObj } from "@storybook/react";
import { Objects } from "../components/Objects";
import { KnackProvider } from "../components/KnackProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const meta: Meta<typeof Objects> = {
  component: Objects,
  title: "Knack/Objects",
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

type Story = StoryObj<typeof Objects>;

export const Default: Story = {};
