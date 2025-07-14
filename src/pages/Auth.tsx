
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Key, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [email, setEmail] = useState('');
  const [codeword, setCodeword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signIn, signInWithCodeword } = useAuth();
  const { toast } = useToast();

  const handleMagicLinkAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await signIn(email);
      setEmailSent(true);
      toast({
        title: "Magic link sent!",
        description: "Check your email for the login link.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodewordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeword) return;

    setIsLoading(true);
    try {
      await signInWithCodeword(codeword);
      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Invalid codeword",
        description: "Please check your codeword and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="pt-32 p-4">
          <div className="container mx-auto max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold mb-4">Check your email</h2>
                  <p className="text-muted-foreground mb-6">
                    We've sent a magic link to <strong>{email}</strong>. 
                    Click the link in your email to sign in.
                  </p>
                  
                  <div className="space-y-4">
                    <Button
                      onClick={() => setEmailSent(false)}
                      variant="outline"
                      className="w-full"
                    >
                      Back to login
                    </Button>
                    
                    <Link to="/">
                      <Button variant="ghost" className="w-full">
                        Return to home
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 p-4">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Welcome to Ohmedit</h1>
            <p className="text-muted-foreground">
              Sign in to save presets and access your projects
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-center">Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="magic-link" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="magic-link" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Magic Link
                    </TabsTrigger>
                    <TabsTrigger value="codeword" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Codeword
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="magic-link" className="space-y-4">
                    <form onSubmit={handleMagicLinkAuth} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="mt-2"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <Label htmlFor="remember" className="text-sm">
                          Remember me
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full btn-primary group"
                      >
                        {isLoading ? (
                          "Sending..."
                        ) : (
                          <>
                            Send Magic Link
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center">
                      We'll send you a secure link to sign in without a password
                    </p>
                  </TabsContent>

                  <TabsContent value="codeword" className="space-y-4">
                    <form onSubmit={handleCodewordAuth} className="space-y-4">
                      <div>
                        <Label htmlFor="codeword">Codeword</Label>
                        <Input
                          id="codeword"
                          type="text"
                          placeholder="Enter your unique codeword"
                          value={codeword}
                          onChange={(e) => setCodeword(e.target.value)}
                          required
                          className="mt-2"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-codeword"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <Label htmlFor="remember-codeword" className="text-sm">
                          Remember me
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || !codeword}
                        className="w-full btn-primary group"
                      >
                        {isLoading ? (
                          "Signing in..."
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center">
                      Your codeword was generated when you first signed up with email
                    </p>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No account needed to{" "}
                    <Link to="/editor" className="text-ohmedit-red hover:underline">
                      try the editor
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
