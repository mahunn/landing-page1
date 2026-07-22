"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string | React.ReactNode;
  loadingLabel?: string | React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function SubmitButton({
  label,
  loadingLabel = "সেভ হচ্ছে...",
  className,
  disabled
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`${className} ${pending || disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
