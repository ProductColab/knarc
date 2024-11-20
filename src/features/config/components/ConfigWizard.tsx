"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { KnackConfig, ConfigUpdate } from "../types";
import {
  ArrowRight,
  ArrowLeft,
  Rocket,
  Key,
  Globe,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ConfigForm } from "./ConfigForm";
import { useVerifyConfig } from "@/lib/knack/hooks/useVerifyConfig";

interface WizardStep {
  title: string;
  description: string;
  field: keyof KnackConfig | "verify";
  icon: React.ReactNode;
  placeholder: string;
  validation?: (value: string) => string | null;
}

interface ConfigWizardProps {
  onComplete: (data: ConfigUpdate) => Promise<number>;
}

const steps: WizardStep[] = [
  {
    title: "Application ID",
    description: "Find this in your Knack dashboard under Application Settings",
    field: "applicationId",
    icon: <Rocket className="w-6 h-6" />,
    placeholder: "5f3c7a1b-8f4d-2x9e",
    validation: (value) =>
      value.length < 5 ? "Application ID must be at least 5 characters" : null,
  },
  {
    title: "API Key",
    description: "Your secret key for API access. Keep this safe!",
    field: "apiKey",
    icon: <Key className="w-6 h-6" />,
    placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  {
    title: "API Subdomain",
    description: "The subdomain for your Knack API endpoints",
    field: "apiDomain",
    icon: <Globe className="w-6 h-6" />,
    placeholder: "api",
  },
  {
    title: "App Host",
    description: "Your Knack application host",
    field: "apiHost",
    icon: <Server className="w-6 h-6" />,
    placeholder: "knack.com",
  },
  {
    title: "Verify Connection",
    description: "Let's verify your Knack application credentials",
    field: "verify",
    icon: <CheckCircle2 className="w-6 h-6" />,
    placeholder: "",
  },
];

const SuccessCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-2xl mx-auto p-6"
  >
    <Card className="p-8 text-center space-y-4 rounded-xl">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
      </motion.div>
      <h2 className="text-2xl font-bold">Configuration Complete!</h2>
      <p className="text-muted-foreground">
        Your Knack application configuration has been saved successfully.
      </p>
    </Card>
  </motion.div>
);

const ProgressIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex justify-center mb-8">
    <div className="flex items-center space-x-2">
      {steps.map((_, index) => (
        <div key={index} className="flex items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-colors duration-200",
                index <= currentStep ? "bg-primary" : "bg-gray-300",
                index === currentStep && "ring-4 ring-primary/20"
              )}
            />
          </motion.div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-10 h-0.5 transition-colors duration-200",
                index < currentStep ? "bg-primary" : "bg-gray-300"
              )}
            />
          )}
        </div>
      ))}
    </div>
  </div>
);

export function ConfigWizard({ onComplete }: ConfigWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<KnackConfig>>({
    apiVersion: "v1",
    apiDomain: "api",
    apiHost: "knack.com",
    applicationId: "6707c48f6f4c5d028061aba5",
    apiKey: "1362c64a-6c63-4431-b993-84ba28682f20",
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { verify, isVerifying, error: verificationError } = useVerifyConfig();
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const validateField = (field: keyof KnackConfig, value: string) => {
    const step = steps.find((s) => s.field === field);
    return step?.validation?.(value) || null;
  };

  const handleNext = async () => {
    const currentField = steps[currentStep].field;

    if (currentField === "verify") {
      const isValid = await verify(formData as KnackConfig);
      if (!isValid) {
        return;
      }
    } else {
      const error = validateField(
        currentField as keyof KnackConfig,
        formData[currentField as keyof KnackConfig] as string
      );
      if (error) {
        setErrors((prev) => ({ ...prev, [currentField]: error }));
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((current) => current + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    setCurrentStep((current) => current - 1);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const config = formData as KnackConfig;
      const configId = await onComplete({
        config,
      });
      setShowSuccess(true);
      return configId;
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to save configuration. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof KnackConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleVerify = async () => {
    const isValid = await verify(formData as KnackConfig);
    if (isValid) {
      setVerificationSuccess(true);
    }
  };

  const handleFormSubmit = async (data: ConfigUpdate): Promise<number> => {
    setIsSubmitting(true);
    try {
      const configData = {
        config: data.config,
      };
      const configId = await onComplete(configData);
      setShowSuccess(true);
      return configId;
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to save configuration. Please try again.",
      }));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return <SuccessCard />;
  }

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Welcome to knarc
        </h1>
        <p className="text-muted-foreground">
          Let&apos;s set up your configuration in a few simple steps.
        </p>
      </motion.div>

      <ProgressIndicator currentStep={currentStep} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-6 rounded-xl">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {currentStepData.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {currentStepData.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {currentStepData.field === "verify" ? (
                  <div className="space-y-4">
                    {isVerifying ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Verifying connection...</span>
                      </div>
                    ) : verificationError ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start space-x-2 text-red-500 bg-red-50 p-4 rounded-lg"
                        >
                          <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                          <span className="text-sm text-left">
                            {verificationError}
                          </span>
                        </motion.div>
                        <ConfigForm
                          config={{
                            id: 0,
                            config: formData as KnackConfig,
                          }}
                          onSubmit={handleFormSubmit}
                        />
                      </>
                    ) : verificationSuccess ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-2 text-green-500">
                          <CheckCircle2 className="w-6 h-6" />
                          <span>Connection verified successfully!</span>
                        </div>
                        <p className="text-muted-foreground">
                          Click Save Configuration to complete setup
                        </p>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Click Verify to test your connection
                      </div>
                    )}
                  </div>
                ) : (
                  <Input
                    placeholder={currentStepData.placeholder}
                    value={
                      (formData[
                        currentStepData.field as keyof KnackConfig
                      ] as string) || ""
                    }
                    onChange={(e) =>
                      handleInputChange(
                        currentStepData.field as keyof KnackConfig,
                        e.target.value
                      )
                    }
                    className={cn(
                      "rounded-lg",
                      errors[currentStepData.field] &&
                        "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                )}
                {errors[currentStepData.field] && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-1 text-red-500 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors[currentStepData.field]}</span>
                  </motion.div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                {!verificationError && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={isFirstStep || isSubmitting}
                      className="rounded-lg"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    {currentStepData.field === "verify" ? (
                      <Button
                        onClick={
                          verificationSuccess ? handleComplete : handleVerify
                        }
                        disabled={isVerifying || isSubmitting}
                        className="min-w-[100px] rounded-lg bg-green-600 hover:bg-green-700"
                      >
                        {isVerifying || isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : verificationSuccess ? (
                          "Save Configuration"
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={
                          !formData[currentStepData.field as keyof KnackConfig]
                        }
                        className="min-w-[100px] rounded-lg"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-sm text-muted-foreground"
      >
        Step {currentStep + 1} of {steps.length}
      </motion.div>
    </div>
  );
}
