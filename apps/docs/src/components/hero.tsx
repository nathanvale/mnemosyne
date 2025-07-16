import useBaseUrl from '@docusaurus/useBaseUrl'

export const Hero = () => {
  const heroImageUrl = useBaseUrl('/img/hero.svg')

  return (
    <section
      style={{
        color: 'white',
        paddingTop: '1.5rem',
        paddingBottom: '1.5rem',
        textAlign: 'center',
      }}
      className="hero-section"
    >
      <div className="hero-layout-container">
        <div className="hero-container-query">
          <div className="hero-content-wrapper">
            <div
              className="hero-content"
              style={{
                backgroundColor: '#275948',
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url('${heroImageUrl}')`,
              }}
            >
              <h1
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 'bold',
                  margin: '0 0 1rem 0',
                  lineHeight: '1.2',
                }}
              >
                Unlocking the Secrets of AI with Mnemosyne
              </h1>
              <p
                style={{
                  maxWidth: '36rem',
                  margin: '0 auto 2rem auto',
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                  lineHeight: '1.6',
                }}
              >
                Mnemosyne is a revolutionary AI platform that combines
                cutting-edge technology with a touch of magic. Explore the
                depths of artificial intelligence and discover new
                possibilities.
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <a
                  href="/docs"
                  style={{
                    backgroundColor: '#1481b7',
                    color: 'white',
                    minWidth: '84px',
                    maxWidth: '480px',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    height: '40px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    lineHeight: 'normal',
                    letterSpacing: '0.015em',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                  className="primary-button"
                >
                  Explore Documentation
                </a>
                <a
                  href="/docs/get-started"
                  style={{
                    backgroundColor: '#283928',
                    color: 'white',
                    minWidth: '84px',
                    maxWidth: '480px',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    height: '40px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    lineHeight: 'normal',
                    letterSpacing: '0.015em',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                  className="secondary-button"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
