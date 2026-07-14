import { SignIn } from "@clerk/nextjs";

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
