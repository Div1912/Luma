'use client';

import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const plans = [
  {
    name: 'Builder',
    price: 'Free',
    description: 'For individuals exploring policies and local simulations.',
    features: [
      '1 agent',
      '50 transactions/mo',
      '1 policy',
      'Community support',
      'Simulation adapter only'
    ],
    popular: false,
    cta: 'Start Building',
    href: '/dashboard'
  },
  {
    name: 'Growth',
    price: '$149',
    period: '/mo',
    description: 'For production workloads that require strong guarantees.',
    features: [
      '10 agents',
      '2,000 transactions/mo',
      'Unlimited policies',
      'Email support',
      'Production Midnight adapter',
      'Webhook events',
      'Audit export'
    ],
    popular: true,
    cta: 'Start Free Trial',
    href: '/dashboard/billing'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Mission-critical infrastructure with high throughput.',
    features: [
      'Unlimited agents',
      'Unlimited transactions/mo',
      'Custom SLA',
      'Dedicated support',
      'On-premise option',
      'Full audit depth',
      'SOC2 compliance'
    ],
    popular: false,
    cta: 'Contact Sales',
    href: '/contact'
  }
];

const faqs = [
  {
    q: 'What is considered a transaction?',
    a: 'A transaction is counted any time an agent requests an action that goes through the Ghost policy engine, regardless of whether the policy ultimately approves or blocks it.'
  },
  {
    q: 'When does proof generation happen?',
    a: 'Proof generation occurs continuously in the background for approved transactions on the Midnight network (for Growth and Enterprise plans).'
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes, you can upgrade or downgrade at any time. Prorated charges or credits will be applied automatically in the next billing cycle.'
  },
  {
    q: 'Is there a free trial for the Growth plan?',
    a: 'We offer a 14-day free trial of the Growth plan, no credit card required to start.'
  },
  {
    q: 'What happens if I exceed my transaction limit?',
    a: 'If you exceed your transaction limit, further transactions will be blocked until the next billing cycle, unless you enable overages or upgrade your plan.'
  },
  {
    q: 'Do you offer custom integrations?',
    a: 'Yes, for Enterprise customers we offer custom integration support to connect Ghost directly to your proprietary internal systems or unique blockchain architectures.'
  }
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 font-sans pb-24">
      <div className="max-w-6xl mx-auto px-6 pt-32">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-6">
            Pricing
          </h1>
          <p className="text-xl text-neutral-400 font-light">
            Simple, usage-based.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {plans.map((plan, i) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col p-8 bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border rounded-lg ${
                plan.popular ? 'border-neutral-400' : 'border-white/[0.07]'
              }`}
            >
              {plan.popular && (
                <div className="text-xs uppercase tracking-widest text-neutral-400 font-medium mb-4">
                  Most Popular
                </div>
              )}
              <h2 className="text-2xl font-medium text-white mb-2">{plan.name}</h2>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-medium text-white">{plan.price}</span>
                {plan.period && <span className="text-neutral-500 ml-1">{plan.period}</span>}
              </div>
              <p className="text-sm text-neutral-400 mb-8 min-h-[40px]">{plan.description}</p>
              
              <Link 
                href={plan.href}
                className={`w-full py-3 text-center rounded-sm font-medium transition-colors mb-8 ${
                  plan.popular 
                    ? 'bg-white text-black hover:bg-neutral-200' 
                    : 'bg-transparent border border-white/[0.1] text-white hover:bg-white/[0.05]'
                }`}
              >
                {plan.cta}
              </Link>

              <div className="flex flex-col gap-3 mt-auto">
                {plan.features.map(feature => (
                  <div key={feature} className="flex items-start text-sm text-neutral-300">
                    <Check className="w-4 h-4 mr-3 mt-0.5 text-neutral-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-medium text-white mb-10 text-center">Frequently asked questions</h3>
          <div className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-white/[0.07] py-4">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between text-left focus:outline-none group"
                >
                  <span className="text-lg font-medium text-neutral-200 group-hover:text-white transition-colors">
                    {faq.q}
                  </span>
                  <Plus className={`w-5 h-5 text-neutral-500 transition-transform ${openFaq === i ? 'rotate-45' : ''}`} />
                </button>
                {openFaq === i && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 text-neutral-400 text-sm leading-relaxed"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-20 text-center">
            <p className="text-neutral-400 mb-4">Need something more tailored?</p>
            <Link href="/contact" className="text-white hover:text-neutral-300 underline underline-offset-4 transition-colors">
              Contact sales for enterprise
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
