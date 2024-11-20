import { useState } from "react";
import { KnackConfig, ApplicationInfo } from "@/features/config/types";
import { KnackClient } from "..";
import { KnackApplication } from "../types/application";

interface UseVerifyConfigResult {
  verify: (config: KnackConfig) => Promise<{
    isValid: boolean;
    applicationInfo?: ApplicationInfo;
  }>;
  isVerifying: boolean;
  error: string | null;
}

export const useVerifyConfig = (): UseVerifyConfigResult => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async (config: KnackConfig) => {
    setIsVerifying(true);
    setError(null);

    try {
      console.log('Verifying config:', {
        applicationId: config.applicationId,
        apiDomain: config.apiDomain,
        apiHost: config.apiHost,
        apiVersion: config.apiVersion,
      });

      const client = new KnackClient(config);
      const response = await client.getApplicationSchema();
      const application = response.application as KnackApplication;

      console.log('Raw application data:', JSON.stringify(application, null, 2));

      const applicationInfo: ApplicationInfo = {
        name: application.name,
        slug: application.slug,
        logoUrl: application.logo_url,
        objects: application.objects,
        scenes: application.scenes,
        account: {
          slug: application.account.slug,
          name: application.account.name,
        }
      };

      console.log('Processed application info:', applicationInfo);

      return {
        isValid: true,
        applicationInfo,
      };
    } catch (err) {
      let errorMessage = "Failed to connect to Knack. ";
      if (err instanceof Error) {
        const cleanedMessage = err.message.replace(
          "Failed to fetch application schema: ",
          ""
        );
        errorMessage += cleanedMessage;
        console.error('Verification failed:', {
          error: cleanedMessage,
          fullError: err,
          stack: err.stack
        });
      } else {
        errorMessage += String(err);
        console.error('Verification failed with non-Error object:', err);
      }
      setError(errorMessage);
      return { isValid: false };
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verify,
    isVerifying,
    error,
  };
}; 