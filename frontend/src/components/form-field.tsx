import React from "react";

interface FormFieldProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children, helperText }) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="text-xs text-secondary">{helperText}</p>}
    </div>
  );
};
