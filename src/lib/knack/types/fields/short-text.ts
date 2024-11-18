import { FormInput } from "../views/form";
import { KnackField, SHORT_TEXT } from "../field";

export interface ShortTextField extends KnackField {
  type: SHORT_TEXT;
}

export interface ShortTextInput extends FormInput {
  type: SHORT_TEXT;
}
