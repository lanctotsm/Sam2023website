export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="hero">
        <h1 className="hero__title">Samuel Lanctot</h1>
        <p className="hero__subtitle">
          Developer, creator, and lifelong learner passionate about building meaningful experiences
          through technology and art.
        </p>
      </section>

      <section className="card">
        <header className="section-header">
          <h2 className="section-header__title">About Me</h2>
        </header>
        <div className="mt-4 space-y-4 text-[1.05rem] leading-relaxed text-chestnut-dark dark:text-dark-text">
          <p>
            Hello! My name is Sam Lanctot, I&apos;m a software engineer in the DC metro area.
            Currently I&apos;m employed at <strong>GEICO</strong> as a Senior Software Engineer
            working on commercial software dealing with DuckCreek and Next.js based service
            applications.
          </p>
          <p>
            I have 7 years experience in full stack .NET development and 2 years experience in
            Node.js/Python/Scala development. My journey began with a fascination for how things
            work, which evolved into a passion for building solutions that matter.
          </p>
          <p>
            My hobbies include photography, Magic the Gathering, Dungeons & Dragons, and video
            games. I also enjoy traveling especially by train. I live in Silver Spring with my wife
            Caitlin and our two wonderful cats, Catniss and Byron.
          </p>
        </div>
      </section>

      <section>
        <header className="section-header">
          <h2 className="section-header__title">What I Do</h2>
        </header>
        <div className="feature-grid">
          {[
            { icon: "💻", title: "Software Development", text: "Building robust applications with modern technologies. From backend systems to responsive frontends, I enjoy crafting elegant solutions to complex problems." },
            { icon: "📷", title: "Photography", text: "Capturing moments and telling stories through the lens. I'm drawn to landscapes, street photography, and the quiet beauty of everyday life." },
            { icon: "🎨", title: "Creative Projects", text: "Exploring the boundaries between art and technology. Whether it's generative art, interactive installations, or digital experiments, I love pushing creative limits." },
            { icon: "📚", title: "Continuous Learning", text: "Always expanding my horizons through books, courses, and hands-on experimentation. The tech landscape is ever-evolving, and I aim to evolve with it." }
          ].map((item) => (
            <div key={item.title} className="card feature-card">
              <div className="feature-card__icon">{item.icon}</div>
              <h3 className="feature-card__title">{item.title}</h3>
              <p className="feature-card__text">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <header className="section-header">
          <h2 className="section-header__title">My Journey</h2>
        </header>
        <div className="mt-4 space-y-4 text-[1.05rem] leading-relaxed text-chestnut-dark dark:text-dark-muted">
          <p>My path has been anything but linear—and I wouldn&apos;t have it any other way. What started as tinkering with computers in my youth has grown into a fulfilling career building software that people actually use. Along the way, I&apos;ve had the privilege of working with talented teams, tackling interesting challenges, and continuously refining my craft.</p>
          <p>I&apos;ve learned that the most rewarding work happens at the intersection of passion and purpose. Whether I&apos;m debugging a tricky issue at 2 AM or capturing the perfect golden hour shot, the common thread is the joy of creating something meaningful.</p>
        </div>
      </section>

      <section>
        <header className="section-header">
          <h2 className="section-header__title">Beyond the Screen</h2>
        </header>
        <div className="tag-cloud">
          {[["🏔️", "Hiking & Nature"], ["☕", "Coffee Culture"], ["🎵", "Music Discovery"], ["📖", "Science Fiction"], ["🎮", "Indie Games"], ["✈️", "Travel"]].map(([emoji, label]) => (
            <div key={String(label)} className="tag-item">
              <span className="text-xl">{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card connect-section">
        <header className="section-header">
          <h2 className="section-header__title">Let&apos;s Connect</h2>
        </header>
        <p className="mx-auto mb-6 max-w-[600px] text-[1.05rem] leading-relaxed text-chestnut-dark dark:text-dark-text">I&apos;m always open to interesting conversations, collaboration opportunities, or just saying hello. Whether you have a project in mind, want to discuss photography, or simply want to chat about the latest in tech—feel free to reach out.</p>
        <div className="connect-section__actions">
          <a href="mailto:lanctotsm@gmail.com" className="btn btn--primary"><span className="text-xl">📧</span> Email</a>
          <a href="https://github.com/samlanctot" target="_blank" rel="noopener noreferrer" className="btn btn--primary"><span className="text-xl">💻</span> GitHub</a>
          <a href="https://www.linkedin.com/in/samuel-lanctot/" target="_blank" rel="noopener noreferrer" className="btn btn--primary"><span className="text-xl">💼</span> LinkedIn</a>
          <a href="/resume" className="btn btn--primary"><span className="text-xl">📄</span> Resume</a>
        </div>
      </section>
    </div>
  );
}
