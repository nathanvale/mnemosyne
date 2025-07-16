export const Features = () => (
  <section className="features-section ">
    <div className="hero-layout-container">
      <div className="hero-container-query">
        <div className="features-content-wrapper">
          <div className="features-content">
            <div className="features-header">
              <h1 className="features-title">Key Features</h1>
              <p className="features-description">
                Transform your message history into emotionally intelligent AI
                that truly understands your relationships and memories.
              </p>
            </div>

            <div className="features-grid">
              <a
                href="features/phase1/message-import-intent"
                className="feature-card feature-link"
              >
                <div className="feature-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM32,64H224V88H32ZM32,104H224v88H32Z"></path>
                  </svg>
                </div>
                <div className="feature-content">
                  <h2 className="feature-title">Solid Data Foundation</h2>
                  <p className="feature-text">
                    Transform years of message history into a clean, structured
                    foundation. Import WhatsApp, Signal, and SMS data with zero
                    data loss and intelligent deduplication. The rock-solid base
                    that makes emotional AI possible.
                  </p>
                </div>
              </a>

              <a
                href="features/phase2/memory-extraction-intent"
                className="feature-card feature-link"
              >
                <div className="feature-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z"></path>
                  </svg>
                </div>
                <div className="feature-content">
                  <h2 className="feature-title">Emotional Intelligence</h2>
                  <p className="feature-text">
                    Extract meaningful emotional memories from conversations
                    using advanced AI processing. Capture mood patterns,
                    relationship dynamics, and emotional moments that
                    matter—creating the intelligence layer for truly personal
                    AI.
                  </p>
                </div>
              </a>

              <a
                href="features/phase3/claude-memory-integration-intent"
                className="feature-card feature-link"
              >
                <div className="feature-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
                  </svg>
                </div>
                <div className="feature-content">
                  <h2 className="feature-title">AI That Knows You</h2>
                  <p className="feature-text">
                    Experience Claude conversations enhanced with your emotional
                    history and relationship context. AI that remembers your
                    journey, understands your patterns, and responds with
                    genuine warmth and personal insight.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)
