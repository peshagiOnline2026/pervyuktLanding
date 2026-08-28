import Image from "next/image";
import { AboutHeadline, ContactForm, HeroVideo, ParallaxScene, SiteHeader } from "./interactive";

// The flagship personal-care brand has its own site; the panel in #impact is
// the one outbound link on the page.
const PESHAGI_URL = "https://peshagi.com";

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

      {/* ============================== HERO ==============================
          The film carries its own burned-in captions through the middle and
          lower thirds, so everything of ours sits in the top band above them:
          one eyebrow, one headline, one line of support. The capture form that
          used to sit here has moved to the header CTA and the contact section,
          which is the only place a form now appears. */}
      <section className="hero">
        <HeroVideo />

        <div className="hero__content">
          <p className="label label--air hero__eyebrow">India’s first vertically integrated medicinal mushroom wellness platform</p>
          <h1 className="hero__title">Healing the healthy way.</h1>
          <p className="hero__tagline">From Himalayan farms to your daily life.</p>
        </div>

        <p className="label hero__cue">
          <span>Farm</span><i aria-hidden="true" />
          <span>Science</span><i aria-hidden="true" />
          <span>Wellness</span>
        </p>
      </section>

      {/* ============================== BEATS ==============================
          One idea per beat, and one spine down the page: a heading rail on the
          left, its own body on the right. Nothing sits beside anything it is
          not about — the two full-width plates (vision, mission) and the media
          inside a body are the only things that break the rail's rhythm. */}
      <ParallaxScene>

      {/* ------------------------------ identity ------------------------------ */}
      <section className="beat container" id="story">
        <div className="beat__rail">
          <p className="label label--water">Pervyukt Agrinnovaters</p>
          <h2 className="script beat__script">Who we are</h2>
        </div>

        {/* No .plx here: the hero and this first beat are the reader's
            footing, and copy that shifts underneath them costs more than the
            depth is worth. Content depth starts at "Why medicinal mushrooms". */}
        <div className="beat__body">
          <div className="prose">
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
      </section>

      {/* Vision — a statement, so it gets the full width and no neighbour. */}
      <section className="plate container" id="vision">
        <p className="label label--air">Our vision</p>
        <AboutHeadline text={VISION} />
      </section>

      {/* Mission — the same treatment on a dark ground, the same rail-and-body split
          as a beat: the mark, label and values against the statement itself. */}
      <section className="plate container">
        <aside className="mission">
          <span className="drift drift--glow" aria-hidden="true" />
          <div className="mission__side">
            {/* Decorative: PARVYUKT is named in the statement beside it. */}
            <Image className="mission__emblem" src="/pervyukt-emblem.png" alt="" width={586} height={589} />
            <p className="label label--air">Our mission</p>
            <ul className="mission__values">
              {VALUES.map((value) => <li key={value}>{value}</li>)}
            </ul>
          </div>
          <p className="mission__quote">{MISSION}</p>
        </aside>
      </section>

      {/* ------------------------------ category ------------------------------ */}
      <section className="beat container" id="mushrooms">
        <div className="beat__rail">
          <p className="label label--water">Why medicinal mushrooms</p>
          <h2>Medicinal mushrooms bridge traditional wisdom and modern evidence.</h2>
          <p className="beat__note">
            Consumers still face low trust, uneven sourcing and inconsistent quality. PARVYUKT focuses only
            on high-value functional mushrooms, on a science-anchored platform — not a broad “everything
            wellness” story.
          </p>
        </div>

        <div className="beat__body">
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
        </div>
      </section>

      {/* ------------------------------ platform ------------------------------ */}
      <section className="beat container" id="platform">
        <div className="beat__rail">
          <p className="label label--air">Our integrated wellness platform</p>
          <h2>We control the chain from spawn to shelf.</h2>
        </div>

        <div className="beat__body">
          <div className="turn plx">
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

      {/* ------------------------------- science ------------------------------- */}
      <section className="beat container" id="science">
        <div className="beat__rail">
          <p className="label label--water">Science, technology and standards</p>
          <h2>Biotechnology leads the work, and compliance sets its limits.</h2>
        </div>

        <div className="beat__body">
          <div className="prose plx">
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
            <p className="claim">
              We make only responsible, regulation-aligned claims. Commercial products are positioned as
              supportive wellness offerings, not as medical treatments.
            </p>
          </div>

          {/* Media supporting the copy directly above it — the certificate is
              what the standards claim rests on, so this pair belongs. */}
          <figure className="cert plx">
            <span className="cert__media">
              <Image
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
      </section>

      {/* ------------------------------- impact ------------------------------- */}
      <section className="beat container" id="impact">
        <div className="beat__rail">
          <p className="label label--fire">Rural impact and Himalayan bio-resources</p>
          <h2>Better wellbeing begins with better livelihoods.</h2>
        </div>

        <div className="beat__body">
          <div className="prose plx">
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

          <a className="peshagi plx" href={PESHAGI_URL} target="_blank" rel="noopener noreferrer">
            <span className="peshagi__mark">
              <span className="drift drift--mark" aria-hidden="true" />
              <Image src="/logo_word_dark.svg" alt="PESHAGI" width={164} height={50} />
            </span>
            <span className="peshagi__copy">
              <span className="label label--water">Extending the ecosystem</span>
              <span className="peshagi__text">
                Under its flagship brand <strong>PESHAGI</strong>, PARVYUKT has developed a 100% natural
                premium personal-care range built around Himalayan Seabuckthorn — the same
                science-anchored, AYUSH-aligned approach applied to broader Himalayan bio-resources.
              </span>
              <span className="peshagi__go">
                Visit peshagi.com
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 18 18 6M9 6h9v9" />
                </svg>
              </span>
            </span>
          </a>
        </div>
      </section>

      {/* ------------------------------ audiences ------------------------------ */}
      <section className="beat container" id="audiences">
        <div className="beat__rail">
          <p className="label">Who we serve</p>
          <h2>Wellness is stronger when it is shared.</h2>
        </div>

        <div className="beat__body">
          <ul className="audiences plx">
            {AUDIENCES.map(([title, text], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------- leadership ----------------------------- */}
      <section className="beat container" id="leadership">
        <div className="beat__rail">
          <p className="label label--fire">Founder and leadership</p>
          <h2>Two decades of international experience meet a decade in medicinal mushroom research.</h2>
        </div>

        <div className="beat__body">
          <div className="founder plx">
            <div className="prose">
              <p>
                Founder, MD &amp; CEO <strong>Rrahul Dalmia</strong> brings experience across Wall Street
                finance, strategy consulting at Microsoft, media with Doordarshan and health-tech
                entrepreneurship.
              </p>
              <p>
                That range is what lets PARVYUKT hold operating ambition, category education, premium
                positioning and strategic partnership-building together in one company.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- meaning ------------------------------- */}
      <section className="beat container" id="meaning">
        <div className="beat__rail">
          <p className="label label--air">Meaning of PARVYUKT</p>
          <h2>PARVYUKT means full of festivities.</h2>
        </div>

        <div className="beat__body">
          <div className="meaning plx">
            <p className="lede">
              It names a joyful union of cultures, traditions and contributions that shape who you are.
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
        <h2 className="script contact__title">Let’s shape the next chapter together</h2>
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
      </footer>
    </>
  );
}
