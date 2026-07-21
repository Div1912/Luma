import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 font-sans py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-neutral-500 hover:text-white mb-12 inline-block">← Back to Home</Link>
        
        <h1 className="text-4xl font-medium tracking-tight text-white mb-4">Terms of Service</h1>
        <p className="text-neutral-500 text-sm mb-12">Last updated: October 20, 2024</p>

        <div className="prose prose-invert prose-neutral max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-medium text-white mb-4">1. Agreement to Terms</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">
              By accessing or using the Ghost platform, APIs, SDKs, or related services (collectively, the "Services"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">2. Use License and API Usage</h2>
            <p className="text-neutral-400 leading-relaxed text-sm mb-4">
              Subject to these Terms, Ghost grants you a non-exclusive, non-transferable right to access and use the Services for your internal business purposes. You agree not to:
            </p>
            <ul className="list-disc pl-5 text-neutral-400 text-sm space-y-2">
              <li>Exceed the rate limits associated with your billing plan.</li>
              <li>Use the Services to facilitate illegal transactions, exploit smart contracts, or circumvent regulatory requirements.</li>
              <li>Reverse engineer the deterministic policy engine or the zero-knowledge proof generation pipeline.</li>
              <li>Share API keys across multiple unrelated entities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">3. Service Level Agreement (SLA)</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">
              For Enterprise customers, specific SLAs regarding uptime and proof generation latency are provided in separate Enterprise Agreements. For Builder and Growth plans, the Services are provided on an "as is" and "as available" basis without strict uptime guarantees, though we strive for 99.9% availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">4. Fees and Payment</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">
              Usage-based fees are calculated monthly. You agree to pay all charges incurred under your account. Failure to pay may result in immediate suspension of API access and proof generation capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">5. Limitation of Liability</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">
              In no event shall Ghost, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Services.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
