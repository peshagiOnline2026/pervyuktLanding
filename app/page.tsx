import Image from "next/image";

const platformSteps = [
  {
    number: "01",
    title: "Controlled cultivation",
    text: "Proprietary low-cost cropping rooms and unique Indian strains create the foundation for consistency, traceability and viable unit economics.",
    tone: "green",
  },
  {
    number: "02",
    title: "Potent ingredients",
    text: "Biotechnology-led research advances premium extracts, tinctures and beta-glucan-rich bioactive ingredients.",
    tone: "blue",
  },
  {
    number: "03",
    title: "Healing formulations",
    text: "Nutraceuticals, functional foods and healing-centric personal care are developed in deliberate, quality-first phases.",
    tone: "yellow",
  },
  {
    number: "04",
    title: "Trusted wellness",
    text: "Education, responsible claims and premium brand-building turn a fragmented category into a platform people can understand and rely on.",
    tone: "orange",
  },
];

const audiences = [
  ["For daily wellbeing", "Health-conscious people seeking natural, evidence-led support for preventive health."],
  ["For expert care", "Practitioners and wellness centres looking for traceable, science-backed ingredients and products."],
  ["For shared progress", "Strategic partners and institutions ready to co-create responsible, premium wellness rooted in India’s bio-resources."],
];

function PetalMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`petal-mark${small ? " petal-mark--small" : ""}`} aria-hidden="true">
      <i className="petal petal--fire" />
      <i className="petal petal--earth" />
      <i className="petal petal--water" />
      <i className="petal petal--air" />
    </span>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PARVYUKT home">
          <Image src="/pervyukt-lockup.png" alt="Pervyukt Agrinnovaters Private Limited" width={1786} height={298} priority />
        </a>
        <nav aria-label="Primary navigation">
          <a href="#story">Our story</a>
          <a href="#platform">Platform</a>
          <a href="#science">Science</a>
          <a href="#impact">Impact</a>
        </nav>
        <a className="header-cta" href="#partner">Partner with us <span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> India’s integrated medicinal mushroom wellness platform</p>
          <h1>Healing the healthy way.</h1>
          <p className="hero-lede">From Himalayan farms to your daily life.</p>
          <p className="hero-body">PARVYUKT brings proprietary cultivation, premium extracts, nutraceuticals, functional foods and healing personal care into one evidence-led ecosystem for preventive health.</p>
          <div className="hero-actions">
            <a className="button button--dark" href="#platform">Discover our platform <span aria-hidden="true">↓</span></a>
            <a className="text-link" href="#partner">Build the future with us <span aria-hidden="true">↗</span></a>
          </div>
          <div className="trust-line" aria-label="Recognition and support">
            <span>Recognised by <strong>DPIIT</strong></span>
            <span>Acknowledged by <strong>BIRAC & TDB</strong></span>
            <span>Supported by <strong>IIT & AIF</strong></span>
          </div>
        </div>
        <div className="hero-art">
          <Image className="hero-mushroom" src="/og.png" alt="Medicinal mushrooms framed by PARVYUKT’s modular brand shapes" fill sizes="(max-width: 760px) 88vw, 42vw" priority />
          <div className="hero-art-badge"><span>Farm</span><i /> <span>Science</span><i /> <span>Wellness</span></div>
        </div>
      </section>

      <section className="manifesto section" id="story">
        <div className="section-kicker"><span>01</span> Who we are</div>
        <div className="manifesto-grid">
          <h2>Nature’s intelligence.<br />Made credible.</h2>
          <div>
            <p className="lead">Pervyukt Agrinnovaters is a purpose-driven preventive healthcare Agri-innovation company founded in 2021.</p>
            <p>We pioneer “skin-to-stomach” solutions that begin at the farm and culminate in high-value wellness products—combining specialty medicinal mushroom cultivation, biotechnology-led research, premium personal care, nutraceuticals and food-and-beverage innovation.</p>
            <p>Guided by <strong>“Healing The Healthy Way”</strong>, we help people move from chronic lifestyle stress and deficiencies toward sustainable, nature-aligned wellbeing.</p>
          </div>
        </div>
        <div className="vision-grid">
          <article className="vision-card vision-card--green">
            <p>Our vision</p>
            <h3>“Innovate, provide, and inspire every human to find happiness through natural healing.”</h3>
          </article>
          <article className="vision-card vision-card--light">
            <p>Our mission</p>
            <h3>Create sustainable skin-to-stomach preventive healthcare, grow and supply nutrition globally, and foster a better quality of life.</h3>
            <small>For our farmers, consumers and colleagues around the world.</small>
          </article>
        </div>
      </section>

      <section className="mushroom-section section" id="mushrooms">
        <div className="section-kicker section-kicker--light"><span>02</span> Why medicinal mushrooms</div>
        <div className="mushroom-intro">
          <h2>An ancient intelligence for modern life.</h2>
          <p>For centuries, fungi have been revered in folk medicine. Today, medicinal mushrooms are emerging as a credible bridge between traditional wisdom and evidence-based wellness—especially for immunity, inflammation, cognition and healthy ageing.</p>
        </div>
        <div className="mushroom-grid">
          <article>
            <div className="species-shape species-shape--tail"><span /></div>
            <p className="species-tag">Trametes versicolor</p>
            <h3>Turkey Tail</h3>
            <p>Associated with immune support and inflammation modulation, supported by growing global clinical and translational research.</p>
          </article>
          <article>
            <div className="species-shape species-shape--mane"><span /></div>
            <p className="species-tag">Hericium erinaceus</p>
            <h3>Lion’s Mane</h3>
            <p>Associated with cognition, brain health and healthy ageing—an active focus for our proprietary research programme.</p>
          </article>
          <aside>
            <p>Global functional mushroom market</p>
            <strong>USD 83.6B</strong>
            <span>Projected by 2033</span>
            <div><b>11.5%</b> expected CAGR</div>
            <small>Market research cited in supplied company content; 2024 market value USD 31.4B.</small>
          </aside>
        </div>
      </section>

      <section className="platform section" id="platform">
        <div className="section-kicker"><span>03</span> Our integrated wellness platform</div>
        <div className="platform-heading">
          <h2>From spawn<br />to shelf.</h2>
          <p>One connected system. Four deliberate stages. Complete visibility from cultivation control to premium natural healing products.</p>
        </div>
        <div className="platform-steps">
          {platformSteps.map((step) => (
            <article className={`step-card step-card--${step.tone}`} key={step.number}>
              <div><span>{step.number}</span><i /></div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <div className="platform-statement">
          <PetalMark />
          <p>By combining cultivation control, ingredient development and premium brand-building under one roof, PARVYUKT replaces low trust with a wellness stack people can understand and rely on.</p>
        </div>
      </section>

      <section className="science section" id="science">
        <div className="section-kicker"><span>04</span> Science, technology & standards</div>
        <div className="science-grid">
          <div className="science-copy">
            <h2>Evidence is not an accessory. It is the foundation.</h2>
            <p>Our biotechnology and nano-technology-based MDEN research focuses on substantially higher beta-glucan content and enhanced bioactive potency in proprietary Turkey Tail and Lion’s Mane strains.</p>
            <p>Early controlled cell-line work at IIT and partnering institutions has shown encouraging signals around anti-cancer and neuroprotective potential. These are being evaluated further under scientific supervision.</p>
            <div className="responsible-claim"><span>✓</span><p><strong>Compliance first.</strong> Commercial products are positioned as supportive wellness offerings, never as medical treatments.</p></div>
          </div>
          <div className="certificate-card">
            <div className="certificate-frame">
              <Image src="/iso-9001-certificate.jpg" alt="ISO 9001:2015 certificate of registration for Pervyukt Agrinnovaters Private Limited" width={724} height={1024} />
            </div>
            <div>
              <p>Quality management</p>
              <h3>ISO 9001:2015 certified</h3>
              <span>Research, mushroom cultivation, farming, production and international distribution.</span>
            </div>
          </div>
        </div>
        <div className="science-board">
          <span>Advised across</span>
          <p>Cancer research</p><i />
          <p>Neuroscience</p><i />
          <p>Biotechnology</p><i />
          <p>Rural development</p><i />
          <p>Women’s empowerment</p>
        </div>
      </section>

      <section className="impact section" id="impact">
        <div className="section-kicker"><span>05</span> Rural impact & Himalayan bio-resources</div>
        <div className="impact-grid">
          <div>
            <p className="impact-eyebrow">Uttarakhand, India</p>
            <h2>Better wellbeing begins with better livelihoods.</h2>
          </div>
          <div className="impact-copy">
            <p>PARVYUKT transforms farming livelihoods and local bio-resources into high-value wellness platforms, linking women farmers in the hills to an alternative, high-value crop.</p>
            <ul>
              <li><span>01</span> Spawn-to-shelf value-chain upskilling</li>
              <li><span>02</span> Renewable-energy cropping-room design</li>
              <li><span>03</span> Resilient rural development pathways</li>
            </ul>
          </div>
        </div>
        <div className="peshagi-panel">
          <div className="peshagi-pattern"><Image src="/logo_word_dark.svg" alt="PESHAGI wordmark" width={164} height={50} /></div>
          <div>
            <p>Extending the ecosystem</p>
            <h3>PESHAGI</h3>
            <span>100% natural premium personal care built around Himalayan Seabuckthorn—extending our science-anchored, AYUSH-aligned approach while medicinal mushrooms remain the core spine.</span>
          </div>
        </div>
      </section>

      <section className="audience section">
        <div className="section-kicker"><span>06</span> Who we serve</div>
        <div className="audience-grid">
          <h2>Wellness is stronger when it is shared.</h2>
          <div>
            {audiences.map(([title, text], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="founder-strip">
          <p>Founder & leadership edge</p>
          <h3>Two decades of international experience. A decade focused on medicinal mushroom research.</h3>
          <p>Founder, MD & CEO <strong>Rrahul Dalmia</strong> brings experience across Wall Street finance, Microsoft strategy consulting, Doordarshan media and health-tech entrepreneurship—blending operating ambition with category education, capital awareness and strategic partnership-building.</p>
        </div>
      </section>

      <section className="meaning section" id="meaning">
        <div className="meaning-mark"><Image src="/pervyukt-retail-mark.png" alt="PARVYUKT emblem and wordmark" width={1089} height={662} /></div>
        <div className="meaning-copy">
          <div className="section-kicker"><span>07</span> Meaning of PARVYUKT</div>
          <h2>Full of festivities.</h2>
          <p className="meaning-lede">A joyful union of cultures, traditions and contributions that shape who you are.</p>
          <p>Rooted in the ancient Dev Bhasha Sanskrit, <strong>“Parv / Perv”</strong> signifies festival and <strong>“Yukt”</strong> means full of. PARVYUKT is a yogic expression of immense festivities and joy arising from diverse cultures coming together.</p>
          <details>
            <summary>Discover the deeper inspiration <span>+</span></summary>
            <p>PARVYUKT also draws inspiration from two Mahabharata archetypes: Krishna, the supreme strategist (Avyukt), and Arjun, the devoted implementer (also known as Parth). Together they symbolise clear vision and decisive action—the balance we seek in evidence-led, nature-aligned preventive healthcare.</p>
          </details>
        </div>
      </section>

      <section className="partner section" id="partner">
        <div className="partner-art" aria-hidden="true"><Image src="/pervyukt-emblem.png" alt="" width={586} height={589} /></div>
        <div className="partner-copy">
          <div className="section-kicker section-kicker--light"><span>08</span> Invitation to partners & collaborators</div>
          <h2>Let’s shape the next chapter of natural healing.</h2>
          <p>We seek partnerships that bring more than capital—distribution strength, manufacturing leverage, category-building experience and institutional reach.</p>
          <p>Aligned with national AYUSH frameworks, we are exploring research validation, standardisation, wellness pilots and responsible public-health category education.</p>
          <a className="button button--light" href="#top">Start with PARVYUKT <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <footer>
        <div className="footer-brand"><Image src="/pervyukt-lockup.png" alt="Pervyukt Agrinnovaters Private Limited" width={1786} height={298} /></div>
        <p>Healing The Healthy Way</p>
        <nav aria-label="Footer navigation"><a href="#story">Story</a><a href="#platform">Platform</a><a href="#science">Science</a><a href="#impact">Impact</a></nav>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Pervyukt Agrinnovaters Private Limited</span><span>Natural healing · Responsible science · Shared progress</span></div>
      </footer>
    </main>
  );
}
