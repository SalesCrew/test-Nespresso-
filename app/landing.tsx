"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Settings, 
  ArrowRight, 
  Star, 
  Shield,
  Coffee,
  Briefcase,
  Clock,
  Heart
} from "lucide-react";

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<'promotors' | 'salescrew' | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleSelect = (role: 'promotors' | 'salescrew') => {
    setSelectedRole(role);
    // For now, redirect to dashboard (later these will go to respective login pages)
    if (role === 'promotors') {
      router.push('/dashboard');
    } else {
      // Future: router.push('/salescrew/login');
      router.push('/dashboard'); // Temporary
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-200/25 rounded-full blur-xl"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
                <Coffee className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4">
                SalesCrew
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Ihre professionelle Plattform für Nespresso Promotion Management
              </p>
            </div>

            {/* Features Preview */}
            <div className="flex justify-center items-center space-x-8 mb-12 opacity-70">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Zeiterfassung</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Briefcase className="h-4 w-4" />
                <span>Einsatzplanung</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Star className="h-4 w-4" />
                <span>Statistiken</span>
              </div>
            </div>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Promotors Card */}
            <Card 
              className={`group relative overflow-hidden border-2 cursor-pointer transition-all duration-500 hover:scale-[1.02] ${
                hoveredCard === 'promotors' 
                  ? 'border-blue-300 shadow-2xl shadow-blue-500/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 shadow-xl'
              }`}
              onMouseEnter={() => setHoveredCard('promotors')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleRoleSelect('promotors')}
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="mx-auto mb-6 relative">
                  <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
                    hoveredCard === 'promotors' ? 'scale-110' : ''
                  }`}>
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  {hoveredCard === 'promotors' && (
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl opacity-20 animate-pulse"></div>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Promotoren Login
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Zugang für Nespresso Promotoren zu Dashboard, Einsätzen und Schulungen
                </p>
              </CardHeader>
              
              <CardContent className="relative z-10 text-center pb-8">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>To-Do Verwaltung</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                    <span>Terminkalender</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>CA KPI Statistiken</span>
                  </div>
                </div>
                
                <Button 
                  className={`w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg transition-all duration-300 ${
                    hoveredCard === 'promotors' ? 'shadow-blue-500/25' : ''
                  }`}
                >
                  <span>Promotor Bereich</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* SalesCrew Card */}
            <Card 
              className={`group relative overflow-hidden border-2 cursor-pointer transition-all duration-500 hover:scale-[1.02] ${
                hoveredCard === 'salescrew' 
                  ? 'border-purple-300 shadow-2xl shadow-purple-500/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-200 shadow-xl'
              }`}
              onMouseEnter={() => setHoveredCard('salescrew')}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleRoleSelect('salescrew')}
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="mx-auto mb-6 relative">
                  <div className={`w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
                    hoveredCard === 'salescrew' ? 'scale-110' : ''
                  }`}>
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  {hoveredCard === 'salescrew' && (
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl opacity-20 animate-pulse"></div>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  SalesCrew Login
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Admin-Bereich für interne Mitarbeiter und Team-Management
                </p>
              </CardHeader>
              
              <CardContent className="relative z-10 text-center pb-8">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Promotor Verwaltung</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    <span>Einsatz Planung</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Team Statistiken</span>
                  </div>
                </div>
                
                <Button 
                  className={`w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg transition-all duration-300 ${
                    hoveredCard === 'salescrew' ? 'shadow-purple-500/25' : ''
                  }`}
                >
                  <span>Admin Bereich</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-20 opacity-60">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Sicher & Verschlüsselt</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>Made in Austria</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <Coffee className="h-4 w-4" />
                <span>Nespresso Partner</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 