import { notFound } from "next/navigation";

export const metadata = { title: "Sign up", robots: { index: false, follow: false } };

export default function SignUpPage() {
  notFound();
}
