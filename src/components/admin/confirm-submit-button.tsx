"use client";

import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  label: string;
  loadingLabel?: string;
  className: string;
  confirmText: string;
};

export function ConfirmSubmitButton({
  label,
  loadingLabel = "মুছে ফেলা হচ্ছে...",
  className,
  confirmText
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        if (!window.confirm(confirmText)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-1.5">
          <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
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
