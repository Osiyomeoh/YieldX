import React from 'react';
import { TrendingUp } from 'lucide-react';

export function Footer() {
  const footerSections = [
    {
      title: 'Platform',
      links: ['Dashboard', 'Invest', 'Submit Invoice', 'Analytics']
    },
    {
      title: 'Technology',
      links: ['Chainlink Oracles', 'Smart Contracts', 'NFT Tokenization', 'DeFi Integration']
    },
    {
      title: 'Impact',
      links: ['$40B Trade Gap', 'African SMEs', 'Global Investors', 'Financial Inclusion']
    }
  ];

  return (
    <footer className="bg-slate-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-2">
                <TrendingUp size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold">YieldX</span>
            </div>
            <p className="text-slate-400">
              Bridging African trade finance with global DeFi capital through tokenized invoices.
            </p>
          </div>
          
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <div className="space-y-2 text-slate-400">
                {section.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="hover:text-white cursor-pointer transition-colors">
                    {link}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
          <p>© 2024 YieldX Protocol. Building the future of African trade finance.</p>
        </div>
      </div>
    </footer>
  );
}