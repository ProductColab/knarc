/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * Constants for the login form test
 */
const LOGIN_CONFIG = {
  pageSlug: `add-purchase-requisition`,
  emailLabel: `Email Address`,
  passwordLabel: `Password`,
  submitButtonText: `Sign In`,
  testCredentials: {
    email: `n.galluzzo@tyelus.com`,
    password: `nicknack`,
  },
} as const;

const SPINNER_CONFIG = {
  selector: `#kn-loading-spinner`,
  timeout: 10000,
} as const;

const FORM_CONFIG = {
  key: `view_347`,
  values: {
    Team: `Physical`,
    // "Blanket PO": `Yes`,
    // "I am entering this Purchase Requisition on behalf of somebody else": `Yes`,
    // "Entered on behalf of": `Alan Curry`,
  },
} as const;

class KnackPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getPageUrl() {
    return `${process.env.NEXT_PUBLIC_KNACK_APP_URL}#${LOGIN_CONFIG.pageSlug}`;
  }

  getLoginFormElements() {
    return {
      email: this.page.getByLabel(LOGIN_CONFIG.emailLabel),
      password: this.page.getByLabel(LOGIN_CONFIG.passwordLabel),
      submit: this.page.getByRole(`button`, {
        name: LOGIN_CONFIG.submitButtonText,
      }),
    };
  }

  getSpinner() {
    return this.page.locator(SPINNER_CONFIG.selector);
  }

  async awaitKnackLoading(timeout = 1000) {
    const spinner = this.getSpinner();
    await expect(spinner).toBeVisible();
    await expect(spinner).not.toBeVisible({ timeout });
  }

  async login(
    email = LOGIN_CONFIG.testCredentials.email,
    password = LOGIN_CONFIG.testCredentials.password
  ) {
    await this.page.goto(this.getPageUrl());

    const {
      email: emailInput,
      password: passwordInput,
      submit,
    } = this.getLoginFormElements();
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await submit.click();

    await this.awaitKnackLoading(SPINNER_CONFIG.timeout);
  }
}

class KnackForm {
  readonly page: Page;
  readonly form: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = this.page.locator(`#${FORM_CONFIG.key}`);
  }

  async getFormGroupAndInputType(label: string) {
    // Find the form group containing this label
    const labelElement = this.form.getByText(label, { exact: true });
    const formGroup = labelElement.locator(
      'xpath=ancestor::div[contains(@class, "kn-input")]'
    );

    // Get the input type from the form group's class
    const formGroupClass = await formGroup.getAttribute("class");
    const inputType = formGroupClass?.match(/kn-input-(\w+)/)?.[1];
    if (!inputType) {
      throw new Error(`Could not determine input type for label "${label}"`);
    }

    return { formGroup, inputType };
  }

  private readonly inputTypeHandlers: Record<string, InputHandler> = {
    async connection(page: Page, formGroup: any, value: string) {
      // Handle Chosen.js enhanced dropdowns
      const chosenContainer = formGroup.locator(".chzn-container");
      const containerId = await chosenContainer.getAttribute("id");
      if (!containerId) throw new Error("Could not find Chosen container ID");

      await chosenContainer.click();
      // Click specifically on the Chosen.js dropdown option within this container
      const chosenOption = page.locator(`#${containerId} .active-result`, {
        hasText: value,
      });
      await chosenOption.click();
    },
    async boolean(_: Page, formGroup: any, value: string) {
      // Handle checkboxes
      const checkbox = formGroup.locator('input[type="checkbox"]');
      if (value.toLowerCase() === "yes") {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    },
    async multiple_choice(_: Page, formGroup: any, value: string) {
      // Handle radio buttons
      const radio = formGroup.locator(`input[value="${value}"]`);
      await radio.check();
    },
    async date_time(_: Page, formGroup: any, value: string) {
      // Handle date inputs
      const dateInput = formGroup.locator("input.kn-datetime-input");
      await dateInput.fill(value);
    },
    async default(_: Page, formGroup: any, value: string) {
      // Handle regular text inputs
      const input = formGroup.locator("input.input");
      await input.fill(value);
    },
  };

  async fillFormValues(formValues: Record<string, string>) {
    for (const [label, value] of Object.entries(formValues)) {
      const { formGroup, inputType } = await this.getFormGroupAndInputType(
        label
      );

      const handler =
        this.inputTypeHandlers[inputType] || this.inputTypeHandlers.default;

      await handler(this.page, formGroup, value);
    }
  }

  async isInputVisible(label: string) {
    return await this.form.getByText(label, { exact: true }).isVisible();
  }

  async submitForm() {
    await this.page.getByRole(`button`, { name: `Submit` }).click();
  }
}

type InputHandler = (
  page: Page,
  formGroup: any,
  value: string
) => Promise<void>;

/**
 * Helper function to perform login and fill initial form
 */
async function loginAndFillForm(
  page: Page,
  formValues = FORM_CONFIG.values,
  email = LOGIN_CONFIG.testCredentials.email,
  password = LOGIN_CONFIG.testCredentials.password
) {
  const knackPage = new KnackPage(page);
  const knackForm = new KnackForm(page);

  await knackPage.login(email, password);

  expect(
    await knackForm.isInputVisible(
      `I am entering this Purchase Requisition on behalf of somebody else`
    )
  ).toBeFalsy();

  await knackForm.fillFormValues(formValues);

  expect(
    await knackForm.isInputVisible(
      `I am entering this Purchase Requisition on behalf of somebody else`
    )
  ).toBeTruthy();
}

test("@smoke login", async ({ page }) => {
  const knackPage = new KnackPage(page);
  await knackPage.login();
});

test("form display rules", async ({ page }) => {
  await loginAndFillForm(page);
});
