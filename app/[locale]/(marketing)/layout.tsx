import { JsonLd } from '@/components/seo';
import { getLocaleUrl } from '@/i18n/routing';
import { SITE_URL, SEO_CONFIG } from '@/lib/constants';

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function MarketingLayout({ children, params }: MarketingLayoutProps) {
  const { locale } = await params;
  const baseUrl = getLocaleUrl(SITE_URL, locale);

  return (
    <>
      {/* FAQ Schema for GEO - helps AI search engines understand common questions */}
      <JsonLd
        type="faq"
        data={{
          faqs: SEO_CONFIG.faq,
        }}
      />
      {/* HowTo Schema for GEO - explains the process to AI search engines */}
      <JsonLd
        type="howto"
        data={{
          howToName: SEO_CONFIG.howToMeta.name,
          howToDescription: SEO_CONFIG.howToMeta.description,
          howToSteps: SEO_CONFIG.howToSteps.map((step, index) => ({
            ...step,
            url: `${baseUrl}#step-${index + 1}`,
          })),
        }}
      />
      {children}
    </>
  );
}
