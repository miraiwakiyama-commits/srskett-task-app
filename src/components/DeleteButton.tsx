"use client";

export default function DeleteButton({
  action,
  confirmMessage,
  label = "削除",
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  label?: string;
  className: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
        className={className}
      >
        {label}
      </button>
    </form>
  );
}
