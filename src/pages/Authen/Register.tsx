import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";
import { apiJson } from "@/lib/api";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiJson<any>("/auth/register", {
        method: "POST",
        body: { username, email, password, role: "user" },
      });

      setSuccess("Registered successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 800);
    } catch (e: any) {
      setError(e?.message || "Register failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center px-4 py-8 overflow-hidden">
      <FallBeamBackground lineCount={15} beamColorClass="cyan-400" />

      <div className="max-w-md w-full relative z-20">
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg flex items-center justify-center" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 font-medium">Join VLK Analyzer in seconds</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 font-semibold">
                {success}
              </div>
            ) : null}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-2">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all duration-200 text-gray-800 font-medium placeholder-gray-400"
                placeholder="yourname"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all duration-200 text-gray-800 font-medium placeholder-gray-400"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all duration-200 text-gray-800 font-medium placeholder-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all duration-200 text-gray-800 font-medium placeholder-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-base py-4 px-6 rounded-xl hover:from-teal-600 hover:to-cyan-600 focus:ring-4 focus:ring-teal-200 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-600 hover:text-teal-700 font-bold hover:underline transition-all">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-teal-600 transition-colors inline-flex items-center">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

