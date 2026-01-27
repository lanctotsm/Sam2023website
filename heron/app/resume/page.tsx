export default function ResumePage() {
  return (
    <div className="resume-page">
      <section className="card">
        <h1>Samuel Lanctot</h1>
        <p className="resume-contact">
          Silver Spring, MD | <a href="mailto:lanctotsm@gmail.com">lanctotsm@gmail.com</a> | 
          <a href="https://www.linkedin.com/in/samuel-lanctot/" target="_blank" rel="noopener noreferrer"> LinkedIn</a> | 
          <a href="https://github.com/samlanctot" target="_blank" rel="noopener noreferrer"> GitHub</a>
        </p>
      </section>

      <section className="card">
        <h2>Experience</h2>
        
        <div className="resume-item">
          <div className="resume-header">
            <h3>Senior Software Engineer</h3>
            <span className="resume-company">GEICO</span>
            <span className="resume-date">Present</span>
          </div>
          <p className="resume-description">
            Working on commercial software dealing with DuckCreek and Next.js based service applications. 
            Building robust, scalable solutions for commercial insurance products.
          </p>
        </div>

        <div className="resume-item">
          <div className="resume-header">
            <h3>Software Engineer</h3>
            <span className="resume-company">Capital One</span>
            <span className="resume-date">Previous</span>
          </div>
          <p className="resume-description">
            Full stack development with Node.js, Python, and Scala. Built and maintained 
            microservices and distributed systems in a cloud-native environment.
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Technical Skills</h2>
        <div className="skills-list">
          <div className="skill-category">
            <h3>Languages</h3>
            <p>.NET (C#), JavaScript/TypeScript, Node.js, Python, Scala, SQL</p>
          </div>
          <div className="skill-category">
            <h3>Frameworks & Technologies</h3>
            <p>Next.js, React, DuckCreek, .NET Core, ASP.NET, REST APIs, Microservices</p>
          </div>
          <div className="skill-category">
            <h3>Tools & Platforms</h3>
            <p>Git, Docker, AWS, CI/CD, Agile/Scrum</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Experience Summary</h2>
        <ul className="resume-summary">
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
