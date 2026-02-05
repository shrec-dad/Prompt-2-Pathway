import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock } from "lucide-react";
import { loginAPI } from '@/api';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginAPI({ email, password });

      // Save token (optional: localStorage or cookie)
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("roles", JSON.stringify(res.data.user.roles));
      localStorage.setItem("allowedTabs", JSON.stringify(res.data.user.allowedTabs || []));

      toast({
        title: "Login Successfully",
        description: res.data.message,
      });

      // Redirect to index page
      navigate("/");
    } catch (err) {
      if (err.response?.status === 400) {
        toast({
          title: "Login Error",
          description: err.response.data?.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Error",
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
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
          <CardTitle className="text-2xl font-bold text-center">
            Login
          </CardTitle>
          <p className="text-center text-blue-100">
            Sign in to access Prompt 2 Pathway
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input
                type="email"
                placeholder="Email"
                className="pl-10 border-2 border-gray-300 focus:border-blue-500"
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
                className="pl-10 border-2 border-gray-300 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <p className="text-center text-gray-700 text-sm mt-2 font-medium">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-700 hover:text-blue-800 font-semibold underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;