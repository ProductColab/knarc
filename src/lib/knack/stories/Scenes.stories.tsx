import type { Meta, StoryObj } from "@storybook/react";
import { Scenes } from "../components/Scenes";
import { KnackProvider } from "../components/KnackProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const meta: Meta<typeof Scenes> = {
  component: Scenes,
  title: "Knack/Scenes",
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

type Story = StoryObj<typeof Scenes>;

export const Default: Story = {};
