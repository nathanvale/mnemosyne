import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import Layout from '@theme/Layout'
import React from 'react'

import styles from './index.module.css'

export default function Home(): JSX.Element {
  return (
    <Layout title="Mnemosyne" description="AI that remembers what matters">
      <a href="#main-content" className="hero-skip-link">
        Skip to main content
      </a>
      <HeroSection />
      <main id="main-content">
        <FeaturesSection />
        <DocsOverview />
      </main>
    </Layout>
  )
}

function HeroSection() {
  const heroImageUrl = useBaseUrl('/img/hero/hero-mnemosyne.png')

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <h1 id="hero-title" className={styles.visuallyHidden}>
            Mnemosyne - AI that remembers what matters
          </h1>
          <picture className={styles.heroImageContainer}>
            <source
              media="(max-width: 768px)"
              srcSet={heroImageUrl}
              width="300"
              height="300"
            />
            <img
              src={heroImageUrl}
              alt="Mnemosyne, the Greek goddess of memory, depicted with a golden laurel crown and flowing hair, surrounded by mystical network connections representing AI memory systems, chat bubbles, and emotional indicators showing sentiment analysis"
              className={styles.heroImage}
              loading="eager"
              width="400"
              height="400"
              decoding="async"
              fetchpriority="high"
            />
          </picture>
          <blockquote className={styles.heroQuote}>
            &ldquo;Memory isn&rsquo;t just what we store — it&rsquo;s what makes
            us human.&rdquo;
          </blockquote>
          <p className={styles.heroDescription}>
            <strong>Mnemosyne</strong> is a relationship-aware AI memory engine
            that transforms raw conversations into meaningful, emotional
            context. Through advanced sentiment analysis and memory networks, it
            powers intelligent features like journaling, insight generation, and
            personalized interactions — creating AI that truly remembers what
            matters.
          </p>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      title: 'Message Import',
      description:
        'Ingest and normalize years of real-world text history with intelligent deduplication.',
      icon: '📥',
      link: '/architecture/system-overview',
    },
    {
      title: 'Memory Extraction',
      description:
        'Transform messages into structured, retrievable emotional memory using AI.',
      icon: '🧠',
      link: '/features/dual-logging/intent',
    },
    {
      title: 'Agent Serving',
      description:
        'Deliver memory to agents in ways that shape their responses and emotional tone.',
      icon: '🤖',
      link: '/packages',
    },
  ]

  return (
    <section className={styles.features} aria-labelledby="features-title">
      <div className={styles.featuresContainer}>
        <h2 id="features-title" className={styles.featuresTitle}>
          What We&rsquo;re Building
        </h2>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <article key={index} className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              <Link
                to={feature.link}
                className={styles.featureLink}
                aria-label={`Learn more about ${feature.title}`}
              >
                Learn more →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function DocsOverview() {
  const docSections = [
    {
      title: 'Architecture',
      description:
        'High-level system design, data flow, and technical foundations built on Next.js 15 + Turborepo.',
      link: '/architecture/system-overview',
      icon: '🏗️',
    },
    {
      title: 'Features',
      description:
        'Detailed documentation for each feature following Basecamp-style planning methodology.',
      link: '/features/dual-logging/intent',
      icon: '🎨',
    },
    {
      title: 'Packages',
      description:
        'Technical documentation for the @studio/* monorepo packages.',
      link: '/packages',
      icon: '📦',
    },
    {
      title: 'Guides',
      description:
        'Development methodology, planning approach, and team collaboration guides.',
      link: '/guides/planning-guide',
      icon: '🗺️',
    },
  ]

  return (
    <section className={styles.docs} aria-labelledby="docs-title">
      <div className={styles.docsContainer}>
        <h2 id="docs-title" className={styles.docsTitle}>
          Quick Navigation
        </h2>
        <nav className={styles.docsGrid} aria-label="Documentation sections">
          {docSections.map((section, index) => (
            <Link
              key={index}
              to={section.link}
              className={styles.docCard}
              aria-label={`Navigate to ${section.title} documentation`}
            >
              <div className={styles.docIcon} aria-hidden="true">
                {section.icon}
              </div>
              <h3 className={styles.docTitle}>{section.title}</h3>
              <p className={styles.docDescription}>{section.description}</p>
            </Link>
          ))}
        </nav>
        <div className={styles.gettingStarted}>
          <h3 className={styles.gettingStartedTitle}>🚀 Getting Started</h3>
          <div
            className={styles.codeBlock}
            role="region"
            aria-label="Installation commands"
          >
            <code>
              # Clone and install
              <br />
              git clone https://github.com/nathanvale/mnemosyne.git
              <br />
              cd mnemosyne
              <br />
              pnpm install
              <br />
              <br />
              # Start development (Next.js app on port 3000)
              <br />
              pnpm dev
              <br />
              <br />
              # View documentation locally (port 3001)
              <br />
              pnpm docs:dev
            </code>
          </div>
        </div>
      </div>
    </section>
  )
}
