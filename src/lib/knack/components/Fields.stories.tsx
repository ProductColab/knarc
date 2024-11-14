import type { Meta, StoryObj } from "@storybook/react";
import { Fields } from "./Fields";
import { KnackProvider } from "./KnackProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const meta: Meta<typeof Fields> = {
  component: Fields,
  title: "Knack/Fields",
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

type Story = StoryObj<typeof Fields>;

export const Default: Story = {};
