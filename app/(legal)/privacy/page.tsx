import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 font-sans py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-neutral-500 hover:text-white mb-12 inline-block">← Back to Home</Link>
        
        <h1 className="text-4xl font-medium tracking-tight text-white mb-4">Privacy Policy</h1>
        <p className="text-neutral-500 text-sm mb-12">Last updated: October 20, 2024</p>

        <div className="prose prose-invert prose-neutral max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-medium text-white mb-4">1. Introduction</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">
              Ghost ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our API services, software development kits (SDKs), and related policy engine infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">2. Information We Collect</h2>
            <p className="text-neutral-400 leading-relaxed text-sm mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-5 text-neutral-400 text-sm space-y-2">
              <li><strong>Account Information:</strong> Name, email address, company details, and billing information.</li>
              <li><strong>Technical Data:</strong> API keys, webhook URLs, and integration configurations.</li>
              <li><strong>Transaction Data:</strong> Data payloads submitted to our policy engine for evaluation. We do not store sensitive transactional data beyond what is required for audit logs and zero-knowledge proof generation on the Midnight network.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">3. Use of Information</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">
              We use the information we collect to operate, maintain, and provide the features of our service. This includes evaluating policy requests, generating cryptographic proofs, processing payments, and providing customer support. We may also use technical data to improve our machine learning models for policy optimization, strictly using anonymized datasets.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">
              We do not sell your personal data. We may share information with third-party vendors and service providers that perform services on our behalf, such as payment processors and cloud hosting providers (e.g., AWS, Midnight network validators). Any data broadcasted to blockchain networks for proof verification contains zero personal identifiable information by design.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">5. Contact Us</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">
              If you have questions or comments about this Privacy Policy, please contact us at: privacy@ghost.dev.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
