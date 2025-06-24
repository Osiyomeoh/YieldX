import React from 'react';
import { ArrowRight, Play, Target, TrendingUp, Shield, Globe } from 'lucide-react';
import { TabId } from '@/types';

interface LandingPageProps {
  setActiveTab: (tab: TabId) => void;
  setShowVideo: (show: boolean) => void;
  totalVolume: number;
  currentAPR: number;
}

export function LandingPage({ 
  setActiveTab, 
  setShowVideo, 
  totalVolume, 
  currentAPR 
}: LandingPageProps) {

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50"></div>
        
        {/* Floating shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-emerald-100 rounded-full opacity-30 animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Live on Sepolia Testnet
              </div>
              
              {/* Main headline */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  African Trade Finance
                  <span className="block bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Meets DeFi
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed">
                  Tokenize export invoices. Unlock global capital. 
                  Earn sustainable yields from real African trade.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                <button 
                  onClick={() => setActiveTab('invest')}
                  className="group bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center"
                >
                  Start Investing
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" size={20} />
                </button>
                
                <button 
                  onClick={() => setShowVideo(true)}
                  className="group border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-700 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center hover:shadow-lg"
                >
                  <Play className="mr-2 group-hover:scale-110 transition-transform duration-300" size={20} />
                  Watch Demo
                </button>
              </div>

              {/* Live stats */}
              <div className="pt-8">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold text-gray-900">
                      ${totalVolume.toLocaleString()}
                    </div>
                    <div className="text-gray-600 text-sm">Volume Processed</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold text-emerald-600">
                      {currentAPR}%
                    </div>
                    <div className="text-gray-600 text-sm">Target APR</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold text-blue-600">
                      3
                    </div>
                    <div className="text-gray-600 text-sm">Active Invoices</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              {/* Main hero image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
                {/* Replace with actual image */}
                <div className="bg-gradient-to-br from-emerald-400 to-blue-500 aspect-[4/3] flex items-center justify-center">
                  <div className="text-center text-white space-y-4 p-8">
                    <Globe className="w-16 h-16 mx-auto opacity-80" />
                    <div className="text-xl font-semibold">African Trade → Global DeFi</div>
                    <div className="text-sm opacity-90">Replace with: African entrepreneur with laptop</div>
                  </div>
                </div>
                {/* 
                Uncomment and replace with actual image:
                <img 
                  src="/african-entrepreneur-hero.jpg" 
                  alt="African entrepreneur managing trade finance digitally"
                  className="w-full h-full object-cover"
                />
                */}
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Live Trading</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-4 rounded-xl shadow-lg">
                <div className="text-sm font-medium">15% APR</div>
                <div className="text-xs opacity-90">Current Yield</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works - Simple 3 steps */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              How YieldX Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to bridge African trade with global DeFi
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center space-y-6">
              {/* Step image */}
              <div className="relative mb-6">
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center overflow-hidden">
                  <div className="text-center text-blue-700 space-y-2">
                    <Target className="w-12 h-12 mx-auto" />
                    <div className="text-sm font-medium">Invoice Submission</div>
                    <div className="text-xs opacity-80">Replace with: African farmer with invoice</div>
                  </div>
                </div>
                {/* 
                Replace with actual image:
                <img 
                  src="/african-farmer-invoice.jpg" 
                  alt="African coffee farmer submitting digital invoice"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Submit Invoice</h3>
                <p className="text-gray-600">
                  African exporters submit trade invoices that get tokenized as NFTs
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-6">
              {/* Step image */}
              <div className="relative mb-6">
                <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center overflow-hidden">
                  <div className="text-center text-emerald-700 space-y-2">
                    <Shield className="w-12 h-12 mx-auto" />
                    <div className="text-sm font-medium">Committee Review</div>
                    <div className="text-xs opacity-80">Replace with: Committee meeting/validation</div>
                  </div>
                </div>
                {/* 
                Replace with actual image:
                <img 
                  src="/committee-validation.jpg" 
                  alt="Expert committee reviewing trade documents"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Committee Review</h3>
                <p className="text-gray-600">
                  Expert committee validates invoices using Chainlink oracles
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-6">
              {/* Step image */}
              <div className="relative mb-6">
                <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center overflow-hidden">
                  <div className="text-center text-purple-700 space-y-2">
                    <TrendingUp className="w-12 h-12 mx-auto" />
                    <div className="text-sm font-medium">Global Investment</div>
                    <div className="text-xs opacity-80">Replace with: Global investors/returns</div>
                  </div>
                </div>
                {/* 
                Replace with actual image:
                <img 
                  src="/global-investment.jpg" 
                  alt="Global investors earning yields from African trade"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Global Investment</h3>
                <p className="text-gray-600">
                  DeFi investors fund approved invoices and earn sustainable yields
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="space-y-6 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Bridging the $40B Gap
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Connecting African SMEs to global capital through transparent, blockchain-powered trade finance
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-emerald-400">$40B</div>
              <div className="text-gray-300">Finance Gap</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-blue-400">54</div>
              <div className="text-gray-300">Countries</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-purple-400">1.3B</div>
              <div className="text-gray-300">People</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-yellow-400">15%</div>
              <div className="text-gray-300">Target APR</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
              Ready to Start?
            </h2>
            <p className="text-xl text-gray-600">
              Join the future of trade finance today
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setActiveTab('invest')}
              className="group bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center"
            >
              <Globe className="mr-3" size={24} />
              Invest Now
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" size={20} />
            </button>
            
            <button 
              onClick={() => setActiveTab('submit')}
              className="group border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-700 px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-lg flex items-center"
            >
              <Target className="mr-3" size={24} />
              Submit Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}