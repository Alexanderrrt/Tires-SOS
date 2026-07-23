import { notFound } from "next/navigation";

export const metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default function SignUpPage() {
  notFound();
}
