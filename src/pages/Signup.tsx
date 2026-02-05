import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock } from "lucide-react";
import { signupAPI } from '@/api';
import { useToast } from '@/hooks/use-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signupAPI({ email, password });
      toast({
        title: "Signup Successfully",
        description: res.data.message,
      });
      // After signup, redirect to login
      navigate("/login");
    } catch (err) {
      if (err.response?.status === 400) {
        toast({
          title: "Signup Error",
          description: err.response.data?.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup Error",
          description: err.response.data?.message,
          variant: "destructive",
        });
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-blue-200 to-indigo-200 px-4">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl border-2 border-blue-300 bg-white">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
          <CardTitle className="text-2xl font-bold text-center">
            Sign Up
          </CardTitle>
          <p className="text-center text-indigo-100">
            Create an account to access Prompt 2 Pathway
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input
                type="email"
                placeholder="Email"
                className="pl-10 border-2 border-gray-300 focus:border-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input
                type="password"
                placeholder="Password"
                className="pl-10 border-2 border-gray-300 focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </Button>

            <p className="text-center text-gray-700 text-sm mt-2 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-700 hover:text-indigo-800 font-semibold underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
