import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, Shield, Clock, GraduationCap, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Compass, title: "Smart Matching", desc: "Find local DMV volunteer opportunities matched to your skills, interests, and schedule." },
  { icon: Shield, title: "Safe & Halal Filters", desc: "Filter by women-led, mosque-based, youth-friendly, SSL-approved, and more." },
  { icon: Clock, title: "Hour Tracking", desc: "Log your service hours and get them verified by organizations." },
  { icon: GraduationCap, title: "College Ready", desc: "Auto-generate resume bullets and activity descriptions for college applications." },
  { icon: Heart, title: "Peer Support", desc: "Anonymously share advice, set goals, and swap skills with fellow students." },
  { icon: Star, title: "Earn Badges", desc: "Get verified badges and downloadable certificates for your service." },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-heading text-xl font-semibold text-navy">Amanah Atlas</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-navy">Log in</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="bg-navy hover:bg-navy/90 text-white rounded-xl">Sign up</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <motion.section 
        className="px-4 pt-16 pb-20 text-center max-w-3xl mx-auto"
        initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sage/15 text-navy text-sm font-medium mb-6">
          <Star className="w-3.5 h-3.5 text-gold" />
          For Muslim girl students in the DMV
        </div>
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-navy leading-tight mb-4">
          Find service. Build identity.{" "}
          <span className="text-sage">Stay supported.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Discover safe, skill-matched volunteer opportunities in Montgomery County and the DMV. 
          Track hours, earn certificates, and build your college profile — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg" className="bg-navy hover:bg-navy/90 text-white rounded-xl px-8 h-12 text-base">
              Get started free
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 text-base border-navy/20 text-navy">
              I have an account
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* Features */}
      <section className="px-4 pb-24 max-w-5xl mx-auto">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden" animate="visible" 
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {features.map((f, i) => (
            <motion.div 
              key={i} 
              variants={fadeUp} 
              transition={{ duration: 0.5 }}
              className="bg-card rounded-2xl p-6 border border-border/50 hover:shadow-lg hover:shadow-sage/5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-sage/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-navy" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Amanah Atlas. Built for DMV Muslim girl students.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
