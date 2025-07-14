
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
          <div className="w-24 h-24 bg-gradient-to-br from-ohmedit-red/20 to-muted/20 rounded-lg mx-auto mb-4 animate-glitch"></div>
        </motion.div>

        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Looks like this page got corrupted in the digital void. 
          Let's get you back to creating.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="btn-primary group">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="btn-ghost group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
