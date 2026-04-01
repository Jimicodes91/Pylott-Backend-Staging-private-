import { injectable } from 'tsyringe';
import { FormFieldDefinition, FieldError, ValidationRule } from '../forms.dto';
import { evaluateCondition } from './conditional-evaluator';

@injectable()
export class FormValidationService {
  /**
   * Validates submission data against field definitions.
   * Evaluates conditional rules to determine visible fields, then validates each visible field.
   */
  validateSubmission(fieldsSnapshot: FormFieldDefinition[], submissionData: Record<string, any>, conditionalContext: Record<string, any>): { valid: boolean; errors: FieldError[] } {
    const errors: FieldError[] = [];

    for (const field of fieldsSnapshot) {
      // Check if field is visible based on conditional rule
      if (field.conditional_rule) {
        const isVisible = evaluateCondition(field.conditional_rule, conditionalContext);
        if (!isVisible) continue; // skip hidden fields
      }

      const value = submissionData[field.id];
      const rules = field.validation_rules || [];

      for (const rule of rules) {
        const error = this.validateRule(field, value, rule);
        if (error) {
          errors.push(error);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private validateRule(field: FormFieldDefinition, value: any, rule: ValidationRule): FieldError | null {
    const isEmpty = value === null || value === undefined || value === '';

    switch (rule.type) {
      case 'required':
        if (isEmpty) {
          return this.makeError(field, rule, `${field.label} is required`);
        }
        break;

      case 'email': {
        if (!isEmpty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          return this.makeError(field, rule, `${field.label} must be a valid email address`);
        }
        break;
      }

      case 'phone': {
        if (!isEmpty && !/^\+?[\d\s\-()]{7,20}$/.test(String(value))) {
          return this.makeError(field, rule, `${field.label} must be a valid phone number`);
        }
        break;
      }

      case 'url': {
        if (!isEmpty) {
          try {
            new URL(String(value));
          } catch {
            return this.makeError(field, rule, `${field.label} must be a valid URL`);
          }
        }
        break;
      }

      case 'min_length': {
        const min = rule.params?.min ?? rule.params?.value;
        if (!isEmpty && typeof value === 'string' && value.length < min) {
          return this.makeError(field, rule, `${field.label} must be at least ${min} characters`);
        }
        break;
      }

      case 'max_length': {
        const max = rule.params?.max ?? rule.params?.value;
        if (!isEmpty && typeof value === 'string' && value.length > max) {
          return this.makeError(field, rule, `${field.label} must be at most ${max} characters`);
        }
        break;
      }

      case 'min_value': {
        const minVal = rule.params?.min ?? rule.params?.value;
        if (!isEmpty && Number(value) < minVal) {
          return this.makeError(field, rule, `${field.label} must be at least ${minVal}`);
        }
        break;
      }

      case 'max_value': {
        const maxVal = rule.params?.max ?? rule.params?.value;
        if (!isEmpty && Number(value) > maxVal) {
          return this.makeError(field, rule, `${field.label} must be at most ${maxVal}`);
        }
        break;
      }

      case 'regex': {
        const pattern = rule.params?.pattern ?? rule.params?.value;
        if (!isEmpty && pattern && !new RegExp(pattern).test(String(value))) {
          return this.makeError(field, rule, rule.message || `${field.label} does not match the required format`);
        }
        break;
      }
    }

    return null;
  }

  private makeError(field: FormFieldDefinition, rule: ValidationRule, defaultMessage: string): FieldError {
    return {
      field_id: field.id,
      field_label: field.label,
      rule_type: rule.type,
      message: rule.message || defaultMessage,
    };
  }
}
