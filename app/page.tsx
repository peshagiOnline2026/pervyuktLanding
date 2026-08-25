import Image from "next/image";
import { AboutHeadline, ContactForm, HeroVideo, NotifyForm, ParallaxScene, SiteHeader } from "./interactive";

const VISION = "Innovate, provide, and inspire every human to find happiness through natural healing";

const MISSION =
  "Innovate and create sustainable skin-to-stomach preventive healthcare solutions, grow and supply nutrition globally, and foster better quality of life for our farmers, consumers and colleagues around the world.";

const VALUES = ["Inclusion", "Sustainability", "Innovation", "Integrity", "Long-term thinking"];

const MARKET = [
  ["USD 83.6B", "Projected market by 2033"],
  ["11.5%", "Expected CAGR"],
  ["USD 31.4B", "Market value in 2024"],
];

const STAGES = [
  [
    "Controlled cultivation",
    "Proprietary low-cost cropping-room designs and unique Indian strains give consistent quality, traceability and viable unit economics.",
  ],
  [
    "Value-added formulations",
    "Extracts, tinctures, nutraceuticals, functional foods and healing-centric personal care — sequenced in phases, not launched all at once.",
  ],
  [
    "Premium brand-building",
    "Cultivation control, ingredient development and brand-building under one roof, in a category that has rarely had all three.",
  ],
];

const AUDIENCES = [
  ["Health-conscious consumers", "Natural, evidence-led support for daily preventive health."],
  ["Practitioners & wellness centres", "Traceable, science-backed ingredients and products."],
  ["Strategic partners & institutions", "Co-creating premium wellness rooted in India’s bio-resources."],
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="top">

      {/* ============================== HERO ============================== */}
      <section className="hero">
        <HeroVideo />

        {/* Two bands, top and bottom. The film carries its own burned-in
            captions through the middle, so nothing of ours sits there. */}
        <div className="hero__content">
          <div className="hero__lead">
            <p className="label label--air hero__eyebrow">India’s first vertically integrated medicinal mushroom wellness platform</p>
            <h1 className="hero__title">Healing the healthy way.</h1>
            <p className="hero__tagline">From Himalayan farms to your daily life.</p>
          </div>
          <div className="hero__action">
            <NotifyForm />
          </div>
        </div>

        <p className="label hero__cue">
          <span>Farm</span><i aria-hidden="true" />
          <span>Science</span><i aria-hidden="true" />
          <span>Wellness</span>
        </p>
      </section>

      {/* ========================= ACT I — IDENTITY =========================
          Who we are and the vision share one grid, and the mission follows as a
          compact two-column band instead of a full-height centred plate. Two
          screens of scroll become a little over one. */}
      <ParallaxScene>

      <section className="act container" id="story">
        <div className="act__intro">
          <div className="act__lede">
            <h2 className="script act__script">Who we are</h2>
            <div className="prose prose--justify">
              <p className="is-lede">
                Pervyukt Agrinnovaters is a purpose-driven preventive healthcare Agri-innovation company,
                founded in 2021.
              </p>
              <p>
                We focus on “skin-to-stomach” solutions that start at the farm and culminate in high-value
                wellness products — pioneering integrated specialty medicinal mushroom cultivation and allied
                Agri-activities, with a strong emphasis on biotechnology-driven research and premium personal
                care, nutraceutical and food-and-beverage offerings.
              </p>
              <p>
                Guided by the philosophy <strong>“Healing The Healthy Way”</strong>, PARVYUKT exists to help
                people move from chronic lifestyle stress and deficiencies towards sustainable,
                nature-aligned wellbeing.
              </p>
            </div>
          </div>

          <div className="act__figure">
            <AboutHeadline text={VISION} />
          </div>
        </div>

        {/* Mission — was a 25rem-tall centred plate, now a band. */}
        <aside className="mission">
          <span className="drift drift--glow" aria-hidden="true" />
          <div className="mission__side">
            {/* Decorative: PARVYUKT is named in the copy either side of it. */}
            <Image className="mission__emblem" src="/pervyukt-emblem.png" alt="" width={586} height={589} />
            <p className="label label--air">Our mission</p>
            <ul className="mission__values">
              {VALUES.map((value) => <li key={value}>{value}</li>)}
            </ul>
          </div>
          <p className="mission__quote">{MISSION}</p>
        </aside>
      </section>

      {/* ===================== ACT II — CATEGORY & PLATFORM =====================
          The problem and the answer to it, under one pinned heading. The market
          figures sit on a tinted band with a decorative layer drifting behind
          them; the caveat becomes a margin pull-quote rather than a full
          paragraph of its own. */}
      <section className="act act--pinned container" id="mushrooms">
        <div className="act__head">
          <p className="label label--water">Why medicinal mushrooms</p>
          <h2>A credible bridge between tradition and evidence.</h2>
          <p className="act__note">
            Consumers still face low trust, uneven sourcing and inconsistent quality. PARVYUKT focuses only
            on high-value functional mushrooms, on a science-anchored platform — not a broad “everything
            wellness” story.
          </p>
        </div>

        <div className="act__body">
          <div className="prose plx">
            <p>
              For centuries, fungi have been revered in folk medicine. Today, medicinal mushrooms are one of
              the most credible bridges between traditional wisdom and evidence-based wellness — especially
              for immunity, inflammation, cognition and healthy ageing.
            </p>
            <p>
              <strong>Turkey Tail</strong> and <strong>Lion’s Mane</strong> lead the field, backed by growing
              global clinical and translational research.
            </p>
          </div>

          <div className="band plx">
            <span className="drift drift--spore" aria-hidden="true" />
            <dl className="stats">
              {MARKET.map(([figure, caption]) => (
                <div className="stats__item" key={figure}>
                  <dt>{figure}</dt>
                  <dd>{caption}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="turn plx" id="platform">
            <span className="drift drift--haze" aria-hidden="true" />
            <div className="turn__head">
              <p className="label label--air">Our integrated wellness platform</p>
              <h3>From spawn to shelf.</h3>
            </div>
            <p>
              A vertically integrated medicinal mushroom platform that starts with controlled cultivation and
              moves up the value chain into premium branded natural healing products — a unified,
              education-driven answer to a fragmented, low-trust category.
            </p>
          </div>

          <ol className="stages plx">
            {STAGES.map(([title, text], index) => (
              <li key={title}>
                <span className="stages__no">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ======================== ACT III — THE PROOF ========================
          Science and rural impact were two full sections; both are evidence, so
          they pair off. The certificate and the PESHAGI mark are media, which
          makes them the two places parallax belongs — each clipped by its own
          frame so a drifting layer can never escape into the copy. */}
      <section className="act container" id="science">
        <div className="act__pair">
          <div className="act__col plx">
            <p className="label label--water">Science, technology and standards</p>
            <h2>Biotechnology-led, compliance-first.</h2>
            <div className="prose">
              <p>
                Our biotechnology and nano-technology-based <strong>MDEN research</strong> pursues substantially
                higher beta-glucan content and enhanced bioactive potency in proprietary strains of Turkey Tail
                and Lion’s Mane.
              </p>
              <p>
                Early lab work at IIT and partnering institutions has shown encouraging signals around
                anti-cancer and neuroprotective potential in controlled cell-line studies, evaluated further
                under the supervision of an advisory board spanning cancer research, neuroscience,
                biotechnology, rural development and women’s empowerment.
              </p>
            </div>
            <p className="claim">
              We make only responsible, regulation-aligned claims. Commercial products are positioned as
              supportive wellness offerings, not as medical treatments.
            </p>
          </div>

          <figure className="cert plx">
            <span className="cert__media">
              <Image
                className="drift drift--cert"
                src="/iso-9001-certificate.jpg"
                alt="ISO 9001:2015 certificate of registration for Pervyukt Agrinnovaters Private Limited"
                width={724}
                height={1024}
              />
            </span>
            <figcaption>
              <p className="label label--fire">Quality management</p>
              <strong>ISO 9001:2015 certified</strong>
              <span>Research, cultivation, farming, production and international distribution.</span>
            </figcaption>
          </figure>
        </div>

        <div className="act__pair act__pair--flip" id="impact">
          <div className="act__col plx">
            <p className="label label--fire">Rural impact and Himalayan bio-resources</p>
            <h2>Better wellbeing begins with better livelihoods.</h2>
            <div className="prose">
              <p>
                Rooted in India’s agricultural heartland, PARVYUKT fosters preventive healthcare from the
                grassroots — turning farming livelihoods and local bio-resources into high-value wellness
                platforms.
              </p>
              <p>
                Our model links women farmers in the hills of Uttarakhand to an alternative, high-value crop
                through spawn-to-shelf upskilling, renewable-energy cropping-room designs and resilient rural
                development pathways.
              </p>
            </div>
          </div>

          <aside className="peshagi plx">
            <div className="peshagi__mark">
              <span className="drift drift--mark" aria-hidden="true" />
              <Image src="/logo_word_dark.svg" alt="PESHAGI" width={164} height={50} />
            </div>
            <div className="peshagi__copy">
              <p className="label label--water">Extending the ecosystem</p>
              <p>
                Under its flagship brand <strong>PESHAGI</strong>, PARVYUKT has developed a 100% natural
                premium personal-care range built around Himalayan Seabuckthorn — the same
                science-anchored, AYUSH-aligned approach applied to broader Himalayan bio-resources.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ==================== ACT IV — REACH AND MEANING ====================
          Who we serve, the founder and the name were three stacked beats. The
          audiences keep the full width they need to stay readable; the founder
          and the meaning of PARVYUKT run side by side underneath. */}
      <section className="act container" id="meaning">
        <div className="serve">
          <div className="serve__head plx">
            <p className="label">Who we serve</p>
            <h2>Wellness is stronger when it is shared.</h2>
          </div>

          <ul className="serve__list plx">
            {AUDIENCES.map(([title, text], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="act__pair act__pair--even">
          <div className="founder plx">
            <span className="drift drift--bloom" aria-hidden="true" />
            <p className="label label--fire">Founder and leadership edge</p>
            <h3>Two decades international. A decade in medicinal mushroom research.</h3>
            <p>
              Founder, MD &amp; CEO <strong>Rrahul Dalmia</strong> brings experience across Wall Street
              finance, strategy consulting at Microsoft, media with Doordarshan and health-tech
              entrepreneurship — blending operating ambition with category education, premium positioning
              and strategic partnership-building.
            </p>
          </div>

          <div className="meaning plx">
            <p className="label label--air">Meaning of PARVYUKT</p>
            <h3>Full of festivities.</h3>
            <p className="lede">
              A joyful union of cultures, traditions and contributions that shape who you are.
            </p>
            <p>
              Rooted in the ancient Dev Bhasha Sanskrit, <strong>“Parv / Perv”</strong> signifies festival
              and <strong>“Yukt”</strong> means full of — a yogic expression of the joy arising when diverse
              cultures and their traditions come together, where wellness, nature and human potential
              converge into a continuous festival of growth and healing.
            </p>
            <details>
              <summary>Deeper inspiration <span aria-hidden="true">+</span></summary>
              <p>
                PARVYUKT also draws on the union of two archetypes from the Mahabharata: Krishna, the supreme
                strategist (Avyukt), and Arjun, the devoted implementer (also known as Parth). Together they
                symbolise clear vision and decisive action — exactly the balance PARVYUKT seeks in building
                evidence-led, nature-aligned preventive healthcare.
              </p>
            </details>
          </div>
        </div>
      </section>

      </ParallaxScene>

      {/* ============================= CONTACT ============================= */}
      <section className="contact container" id="contact">
        <h2 className="script contact__title">Let’s shape the next chapter</h2>
        <p className="contact__lede">
          PARVYUKT is seeking strategic partnerships that bring more than capital — distribution strength,
          manufacturing leverage, category-building experience and institutional reach.
        </p>
        <p className="contact__sub">
          In alignment with national AYUSH frameworks, we are exploring collaboration pathways for research
          validation, standardisation, wellness pilots and responsible public-health category education.
        </p>
        <ContactForm />
      </section>
      </main>

      {/* ============================== FOOTER ============================== */}
      <footer className="footer">
        <span>© {new Date().getFullYear()} Pervyukt Agrinnovaters Private Limited</span>
        <i aria-hidden="true" />
        <span>Healing The Healthy Way</span>
        <i aria-hidden="true" />
        <span>Uttarakhand, India</span>
      </footer>
    </>
  );
}
