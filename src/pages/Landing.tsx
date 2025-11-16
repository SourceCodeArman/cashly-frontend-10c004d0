import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Shield, Zap, Target, PiggyBank, Bell } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
            <span className="text-xl font-bold text-foreground">Cashly</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Take Control of Your
            <span className="block mt-2 bg-gradient-primary bg-clip-text text-transparent">
              Financial Future
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Smart financial management made simple. Track expenses, set goals, and achieve financial freedom with Cashly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 group">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed to help you manage your money better
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-in">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Smart Tracking</h3>
              <p className="text-muted-foreground">
                Automatically categorize and track all your transactions in real-time
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Goal Setting</h3>
              <p className="text-muted-foreground">
                Set financial goals and track your progress with AI-powered insights
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <PiggyBank className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Smart Savings</h3>
              <p className="text-muted-foreground">
                Automated savings recommendations based on your spending patterns
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Bank-Level Security</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and protected with industry-leading security
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Instant Insights</h3>
              <p className="text-muted-foreground">
                Get real-time analytics and personalized financial recommendations
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Smart Alerts</h3>
              <p className="text-muted-foreground">
                Stay on top of bills, unusual spending, and savings opportunities
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto p-8 md:p-12 bg-gradient-primary text-primary-foreground">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Finances?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join thousands of users who are already taking control of their financial future with Cashly
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 group">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-primary" />
              <span className="font-semibold text-foreground">Cashly</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Cashly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
