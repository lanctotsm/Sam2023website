export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="-mx-5 mt-0 rounded-2xl bg-gradient-to-br from-chestnut to-chestnut-light px-5 py-12 text-center text-desert-tan dark:from-chestnut-dark dark:to-chestnut md:-mx-5 md:px-10 md:py-20">
        <h1 className="mb-4 text-3xl font-bold text-desert-tan md:text-5xl">Samuel Lanctot</h1>
        <p className="mx-auto max-w-[600px] text-lg leading-relaxed text-desert-tan-light md:text-xl">
          Developer, creator, and lifelong learner passionate about building meaningful experiences
          through technology and art.
        </p>
      </section>

      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
        <h2 className="text-chestnut dark:text-dark-text">About Me</h2>
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
        <h2 className="mb-6 text-chestnut dark:text-dark-text">What I Do</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { icon: "💻", title: "Software Development", text: "Building robust applications with modern technologies. From backend systems to responsive frontends, I enjoy crafting elegant solutions to complex problems." },
            { icon: "📷", title: "Photography", text: "Capturing moments and telling stories through the lens. I'm drawn to landscapes, street photography, and the quiet beauty of everyday life." },
            { icon: "🎨", title: "Creative Projects", text: "Exploring the boundaries between art and technology. Whether it's generative art, interactive installations, or digital experiments, I love pushing creative limits." },
            { icon: "📚", title: "Continuous Learning", text: "Always expanding my horizons through books, courses, and hands-on experimentation. The tech landscape is ever-evolving, and I aim to evolve with it." }
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-desert-tan-dark bg-surface p-6 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(72,9,3,0.12)] dark:border-dark-muted dark:bg-dark-surface dark:hover:shadow-none">
              <div className="mb-3 text-4xl">{item.icon}</div>
              <h3 className="mb-3 text-lg text-chestnut dark:text-dark-text">{item.title}</h3>
              <p className="text-sm leading-relaxed text-olive-dark dark:text-dark-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
        <h2 className="text-chestnut dark:text-dark-text">My Journey</h2>
        <div className="mt-4 space-y-4 text-[1.05rem] leading-relaxed text-chestnut-dark dark:text-dark-muted">
          <p>My path has been anything but linear—and I wouldn&apos;t have it any other way. What started as tinkering with computers in my youth has grown into a fulfilling career building software that people actually use. Along the way, I&apos;ve had the privilege of working with talented teams, tackling interesting challenges, and continuously refining my craft.</p>
          <p>I&apos;ve learned that the most rewarding work happens at the intersection of passion and purpose. Whether I&apos;m debugging a tricky issue at 2 AM or capturing the perfect golden hour shot, the common thread is the joy of creating something meaningful.</p>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-chestnut dark:text-dark-text">Beyond the Screen</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[["🏔️", "Hiking & Nature"], ["☕", "Coffee Culture"], ["🎵", "Music Discovery"], ["📖", "Science Fiction"], ["🎮", "Indie Games"], ["✈️", "Travel"]].map(([emoji, label]) => (
            <div key={String(label)} className="flex items-center gap-2 rounded-full border border-desert-tan-dark bg-surface px-4 py-2.5 text-[0.95rem] text-chestnut-dark transition-all hover:scale-105 hover:bg-white dark:border-dark-muted dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-bg">
              <span className="text-xl">{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
        <h2 className="text-chestnut dark:text-dark-text">Let&apos;s Connect</h2>
        <p className="mx-auto mb-6 max-w-[600px] text-[1.05rem] leading-relaxed text-chestnut-dark dark:text-dark-text">I&apos;m always open to interesting conversations, collaboration opportunities, or just saying hello. Whether you have a project in mind, want to discuss photography, or simply want to chat about the latest in tech—feel free to reach out.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="mailto:lanctotsm@gmail.com" className="flex items-center gap-2 rounded-lg bg-chestnut px-6 py-3 font-semibold text-desert-tan transition-all hover:-translate-y-0.5 hover:bg-chestnut-light dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"><span className="text-xl">📧</span> Email</a>
          <a href="https://github.com/samlanctot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-chestnut px-6 py-3 font-semibold text-desert-tan transition-all hover:-translate-y-0.5 hover:bg-chestnut-light dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"><span className="text-xl">💻</span> GitHub</a>
          <a href="https://www.linkedin.com/in/samuel-lanctot/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-chestnut px-6 py-3 font-semibold text-desert-tan transition-all hover:-translate-y-0.5 hover:bg-chestnut-light dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"><span className="text-xl">💼</span> LinkedIn</a>
          <a href="/resume" className="flex items-center gap-2 rounded-lg bg-chestnut px-6 py-3 font-semibold text-desert-tan transition-all hover:-translate-y-0.5 hover:bg-chestnut-light dark:bg-caramel dark:text-chestnut-dark dark:hover:bg-caramel-light"><span className="text-xl">📄</span> Resume</a>
        </div>
      </section>
    </div>
  );
}
