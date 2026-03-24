"use client";

interface FormFieldErrorProps {
  message?: string;
}

export function FormFieldError({ message }: FormFieldErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" aria-live="assertive" className="text-sm text-destructive mt-1">
      {message}
    </p>
  );
}
