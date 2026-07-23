import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Admin Sign In | Tires SOS Rescue",
  robots: { index: false, follow: false, noarchive: true },
};

export default function SignInPage() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--ink)",
        backgroundImage: "var(--tread)",
      }}
    >
      <SignIn />
    </div>
  );
}
