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
      id: providedId,
      ...restProps
    },
    ref
  ) => {
    // Use provided id or generate deterministic id from label
    const id = providedId || `field-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="block">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </Label>

        {as === "textarea" ? (
          <Textarea
            ref={ref as any}
            id={id}
            className={cn(error && "border-danger", className)}
            value={value}
            onChange={onChange}
            {...restProps}
          />
        ) : as === "select" ? (
          <select
            ref={ref as any}
            id={id}
            className={cn("flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50", error && "border-danger", className)}
            value={value}
            onChange={onChange}
            {...restProps}
          >
            {options.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            ref={ref as any}
            id={id}
            className={cn(error && "border-danger", className)}
            value={value}
            onChange={onChange}
            {...restProps}
          />
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && <p className="text-xs text-secondary">{hint}</p>}
      </div>
    );
  }
);

FormField.displayName = "FormField";
