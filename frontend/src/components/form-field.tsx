"use client";
import React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  id?: string;
  as?: "input" | "textarea" | "select";
  options?: Array<{ value: string; label: string }>;
  value?: any;
  onChange?: any;
  [key: string]: any;
};

export const FormField = React.forwardRef<HTMLElement, FormFieldProps>(
  (
    {
      label,
      error,
      hint,
      required,
      className,
      as = "input",
      options = [],
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const id = `field-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="block">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </Label>

        {as === "textarea" ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={id}
            className={cn(error && "border-danger", className)}
            value={value}
            onChange={onChange}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : as === "select" ? (
          <Select
            ref={ref as React.Ref<HTMLSelectElement>}
            id={id}
            className={cn(error && "border-danger", className)}
            value={value}
            onChange={onChange}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            id={id}
            className={cn(error && "border-danger", className)}
            value={value}
            onChange={onChange}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && <p className="text-xs text-secondary">{hint}</p>}
      </div>
    );
  }
);

FormField.displayName = "FormField";
