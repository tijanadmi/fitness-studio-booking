"use client";
import { useFormStatus } from "react-dom";
export default function Submit({ children }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} type="submit">
      {pending ? "Sačekajte…" : children}
    </button>
  );
}
