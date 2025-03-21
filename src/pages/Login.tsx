
import { LoginForm } from "@/components/auth/LoginForm";
import threatEraseLogo from "@/logo/THREAT_ERASE_LOGO.png";

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black p-4">
      <div className="mb-8 text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          {/* <div className="h-10 w-10 rounded-full bg-primary" /> */}
          <img
            src={threatEraseLogo}
            alt="Threat Erase Logo"
            className="h-40 w-30"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Threat Erase</h1>
        <p className="text-muted-foreground max-w-md">
          Advanced threat detection system
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
