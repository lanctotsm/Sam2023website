export default function HomePage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1>Samuel Lanctot</h1>
        <p className="hero-tagline">
          Developer, creator, and lifelong learner passionate about building 
          meaningful experiences through technology and art.
        </p>
      </section>

      {/* About Section */}
      <section className="about-section card">
        <h2>About Me</h2>
        <p>
          Hello! My name is Sam Lanctot, I&apos;m a software engineer in the DC metro area. 
          Currently I&apos;m employed at <strong>GEICO</strong> as a Senior Software Engineer 
          working on commercial software dealing with DuckCreek and Next.js based service applications.
        </p>
        <p>
          I have 7 years experience in full stack .NET development and 2 years experience in 
          Node.js/Python/Scala development. My journey began with a fascination for how things work, 
          which evolved into a passion for building solutions that matter.
        </p>
        <p>
          My hobbies include photography, Magic the Gathering, Dungeons & Dragons, and video games. 
          I also enjoy traveling especially by train. I live in Silver Spring with my wife Caitlin 
          and our two wonderful cats, Catniss and Byron.
        </p>
      </section>

      {/* What I Do Section */}
      <section className="skills-section">
        <h2>What I Do</h2>
        <div className="skills-grid">
          <div className="skill-card card">
            <div className="skill-icon">💻</div>
            <h3>Software Development</h3>
            <p>
              Building robust applications with modern technologies. From backend systems 
              to responsive frontends, I enjoy crafting elegant solutions to complex problems.
            </p>
          </div>
          <div className="skill-card card">
            <div className="skill-icon">📷</div>
            <h3>Photography</h3>
            <p>
              Capturing moments and telling stories through the lens. I&apos;m drawn to 
              landscapes, street photography, and the quiet beauty of everyday life.
            </p>
          </div>
          <div className="skill-card card">
            <div className="skill-icon">🎨</div>
            <h3>Creative Projects</h3>
            <p>
              Exploring the boundaries between art and technology. Whether it&apos;s 
              generative art, interactive installations, or digital experiments, I love 
              pushing creative limits.
            </p>
          </div>
          <div className="skill-card card">
            <div className="skill-icon">📚</div>
            <h3>Continuous Learning</h3>
            <p>
              Always expanding my horizons through books, courses, and hands-on 
              experimentation. The tech landscape is ever-evolving, and I aim to evolve with it.
            </p>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="journey-section card">
        <h2>My Journey</h2>
        <p>
          My path has been anything but linear—and I wouldn&apos;t have it any other way. 
          What started as tinkering with computers in my youth has grown into a fulfilling 
          career building software that people actually use. Along the way, I&apos;ve had the 
          privilege of working with talented teams, tackling interesting challenges, and 
          continuously refining my craft.
        </p>
        <p>
          I&apos;ve learned that the most rewarding work happens at the intersection of 
          passion and purpose. Whether I&apos;m debugging a tricky issue at 2 AM or 
          capturing the perfect golden hour shot, the common thread is the joy of creating 
          something meaningful.
        </p>
      </section>

      {/* Interests Section */}
      <section className="interests-section">
        <h2>Beyond the Screen</h2>
        <div className="interests-grid">
          <div className="interest-item">
            <span className="interest-emoji">🏔️</span>
            <span>Hiking & Nature</span>
          </div>
          <div className="interest-item">
            <span className="interest-emoji">☕</span>
            <span>Coffee Culture</span>
          </div>
          <div className="interest-item">
            <span className="interest-emoji">🎵</span>
            <span>Music Discovery</span>
          </div>
          <div className="interest-item">
            <span className="interest-emoji">📖</span>
            <span>Science Fiction</span>
          </div>
          <div className="interest-item">
            <span className="interest-emoji">🎮</span>
            <span>Indie Games</span>
          </div>
          <div className="interest-item">
            <span className="interest-emoji">✈️</span>
            <span>Travel</span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section card">
        <h2>Let&apos;s Connect</h2>
        <p>
          I&apos;m always open to interesting conversations, collaboration opportunities, 
          or just saying hello. Whether you have a project in mind, want to discuss 
          photography, or simply want to chat about the latest in tech—feel free to reach out.
        </p>
        <div className="contact-links">
          <a href="mailto:lanctotsm@gmail.com" className="contact-link">
            <span>📧</span> Email
          </a>
          <a href="https://github.com/samlanctot" className="contact-link" target="_blank" rel="noopener noreferrer">
            <span>💻</span> GitHub
          </a>
          <a href="https://www.linkedin.com/in/samuel-lanctot/" className="contact-link" target="_blank" rel="noopener noreferrer">
            <span>💼</span> LinkedIn
          </a>
          <a href="/resume" className="contact-link">
            <span>📄</span> Resume
          </a>
        </div>
      </section>
    </div>
  );
}
