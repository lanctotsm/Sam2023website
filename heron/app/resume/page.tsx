const iconClass = "inline-block size-5 shrink-0 align-middle";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export default function ResumePage() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 text-center shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
        <h1 className="mb-2 text-center text-chestnut">Samuel Lanctot</h1>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-olive-dark">
          <span>Silver Spring, MD</span>
          <a href="mailto:lanctotsm@gmail.com" className="text-copper hover:text-chestnut hover:underline">lanctotsm@gmail.com</a>
          <a href="https://www.linkedin.com/in/samuel-lanctot/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-copper hover:text-chestnut hover:underline" aria-label="LinkedIn">
            <LinkedInIcon className={iconClass} />
            LinkedIn
          </a>
          <a href="https://github.com/samlanctot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-copper hover:text-chestnut hover:underline" aria-label="GitHub">
            <GitHubIcon className={iconClass} />
            GitHub
          </a>
        </p>
      </section>

      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
        <h2 className="text-chestnut">Experience</h2>
        <div className="border-b border-desert-tan-dark pb-6 pt-4 last:border-b-0 last:pb-0">
          <div className="mb-2 flex flex-wrap items-baseline gap-3">
            <h3 className="m-0 text-xl text-chestnut">Senior Software Engineer</h3>
            <span className="text-base font-semibold text-olive-dark">GEICO</span>
            <span className="ml-auto text-sm italic text-olive">Present</span>
          </div>
          <p className="m-0 leading-relaxed text-chestnut-dark">Working on commercial software dealing with DuckCreek and Next.js based service applications. Building robust, scalable solutions for commercial insurance products.</p>
        </div>
        <div className="border-b border-desert-tan-dark pb-6 pt-4 last:border-b-0 last:pb-0">
          <div className="mb-2 flex flex-wrap items-baseline gap-3">
            <h3 className="m-0 text-xl text-chestnut">Software Engineer</h3>
            <span className="text-base font-semibold text-olive-dark">Capital One</span>
            <span className="ml-auto text-sm italic text-olive">Previous</span>
          </div>
          <p className="m-0 leading-relaxed text-chestnut-dark">Full stack development with Node.js, Python, and Scala. Built and maintained microservices and distributed systems in a cloud-native environment.</p>
        </div>
      </section>

      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
        <h2 className="text-chestnut">Technical Skills</h2>
        <div className="mt-4 grid gap-5">
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-olive-dark">Languages</h3>
            <p className="m-0 leading-relaxed text-chestnut-dark">.NET (C#), JavaScript/TypeScript, Node.js, Python, Scala, SQL</p>
          </div>
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-olive-dark">Frameworks & Technologies</h3>
            <p className="m-0 leading-relaxed text-chestnut-dark">Next.js, React, DuckCreek, .NET Core, ASP.NET, REST APIs, Microservices</p>
          </div>
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-olive-dark">Tools & Platforms</h3>
            <p className="m-0 leading-relaxed text-chestnut-dark">Git, Docker, AWS, CI/CD, Agile/Scrum</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)]">
        <h2 className="text-chestnut">Experience Summary</h2>
        <ul className="mt-4 list-outside pl-6 leading-relaxed text-chestnut-dark [&>li]:mb-2">
          <li>7+ years of full stack .NET development experience</li>
          <li>2+ years of Node.js/Python/Scala development experience</li>
          <li>Experience building and maintaining commercial insurance software</li>
          <li>Proficient in modern web frameworks including Next.js and React</li>
          <li>Experience with DuckCreek platform integration</li>
          <li>Strong background in microservices architecture and distributed systems</li>
        </ul>
      </section>
    </div>
  );
}
