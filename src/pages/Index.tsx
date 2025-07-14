
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Upload, Sparkles, Users, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";

export default function Index() {
  const features = [
    {
      icon: Upload,
      title: "Upload & Transform",
      description: "Drag and drop images or videos. Support for JPEG, PNG, SVG, GIF, MP4, and WebM.",
    },
    {
      icon: Sparkles,
      title: "Real-time Effects",
      description: "15+ GPU-accelerated presets across Error Diffusion, Bitmap, Glitch, and more.",
    },
    {
      icon: Users,
      title: "Community Presets",
      description: "Discover and share effect presets with the creative community.",
    },
  ];

  const presetPreviews = [
    { name: "Floyd-Steinberg", category: "Error Diffusion" },
    { name: "Bayer 8x8", category: "Bitmap" },
    { name: "Data Mosh", category: "Glitch" },
    { name: "Scanline Drift", category: "Pattern" },
    { name: "Halftone Pop", category: "Modulation" },
    { name: "RGB Split", category: "Special Effects" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Break your{" "}
              <span className="text-gradient animate-float">pixels</span>,{" "}
              <br className="hidden md:block" />
              beautifully.
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A free, browser-native toolkit to dither, glitch, and transform your 
              images and videos. No sign-up required to start.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/editor">
                <Button size="lg" className="btn-primary group">
                  Upload File
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              
              <Link to="/editor?demo=true">
                <Button size="lg" variant="outline" className="btn-ghost">
                  Try a Demo
                </Button>
              </Link>
              
              <Link to="/community">
                <Button size="lg" variant="outline" className="btn-ghost">
                  Explore Community Presets
                </Button>
              </Link>
            </div>

            {/* Preview Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-16"
            >
              {presetPreviews.map((preset, index) => (
                <motion.div
                  key={preset.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                  className="effect-preset"
                >
                  <div className="aspect-square bg-gradient-to-br from-ohmedit-red/20 to-muted/20 rounded-lg mb-2"></div>
                  <h4 className="font-medium text-sm">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground">{preset.category}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to create
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional-grade effects processing, entirely in your browser
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="effect-panel text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-ohmedit-red/20 rounded-lg mb-6">
                  <feature.icon className="h-6 w-6 text-ohmedit-red" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="effect-panel max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to break some pixels?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start creating with our free, browser-native effects toolkit
            </p>
            <Link to="/editor">
              <Button size="lg" className="btn-primary group">
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Built with code & chaos.
          </p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
