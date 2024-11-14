import type { Meta, StoryObj } from "@storybook/react";
import { Application } from "../components/Application";
import { KnackProvider } from "../components/KnackProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const meta: Meta<typeof Application> = {
  component: Application,
  title: "Knack/Application",
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
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof Application>;

export const Default: Story = {};
