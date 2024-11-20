import { FormInput } from "../views/form";
import { KnackField, SHORT_TEXT } from "../field";

export interface ShortTextField extends KnackField {
  type: typeof SHORT_TEXT;
}

export interface ShortTextInput extends FormInput {
  type: typeof SHORT_TEXT;
}
