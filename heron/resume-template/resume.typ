// Resume — deliberately typeset. Data arrives as JSON via:
//   typst compile --input data=<json> --font-path fonts --ignore-system-fonts resume.typ out.pdf
// The payload is the output of toJsonResume(): empty optional fields are
// absent, so every access below goes through a default.

#let data = json(bytes(sys.inputs.data))

// ── Inks ─────────────────────────────────────────────────────────────────────
// Two inks and one accent; the accent appears only in hairline rules.
#let bone = rgb("#FBF7F0")
#let ink = rgb("#2A0502")
#let warm = rgb("#6B5B4A")
#let copper = rgb("#B64B12")
#let hairline-color = rgb("#E0D5C2")

// ── Data access ──────────────────────────────────────────────────────────────
#let get(d, key, default) = {
  if type(d) == dictionary { d.at(key, default: default) } else { default }
}

#let basics = get(data, "basics", (:))
#let full-name = get(basics, "name", "")
#let meta = get(data, "meta", (:))
#let heron = get(meta, "heron", (:))
#let section-order = get(heron, "sectionOrder", ("work", "projects", "skills", "education", "certificates"))
#let hidden-sections = get(heron, "hiddenSections", ())
#let condensed-ids = get(heron, "condensedWorkIds", ())
#let custom-sections = get(heron, "customSections", ())

// ── Dates ────────────────────────────────────────────────────────────────────
#let month-names = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

#let is-digit-str(s) = {
  if type(s) != str or s.len() == 0 { return false }
  let i = 0
  while i < s.len() {
    let c = s.at(i)
    if c < "0" or c > "9" { return false }
    i += 1
  }
  true
}

#let fmt-partial(s) = {
  let t = if type(s) == str { s } else { str(s) }
  if t.len() == 7 and t.at(4) == "-" and is-digit-str(t.slice(0, 4)) and is-digit-str(t.slice(5, 7)) {
    let m = int(t.slice(5, 7))
    if m >= 1 and m <= 12 {
      month-names.at(m - 1) + " " + t.slice(0, 4)
    } else {
      t
    }
  } else if t.len() == 4 and is-digit-str(t) {
    t
  } else {
    t
  }
}

#let fmt-range(start, end) = {
  let s = if start != "" { fmt-partial(start) } else { "" }
  let e = if end == "" { "Present" } else { fmt-partial(end) }
  if s == "" {
    if end == "" { "" } else { e }
  } else {
    s + " \u{2013} " + e
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
#set page(
  paper: "us-letter",
  fill: bone,
  margin: (left: 0.85in, right: 0.85in, top: 0.72in, bottom: 0.6in),
  header: context {
    if counter(page).get().first() > 1 {
      text(
        font: "Inter",
        size: 7pt,
        fill: warm,
        tracking: 0.12em,
        upper(full-name),
      )
    }
  },
  footer: context {
    let page-number = counter(page).get().first()
    if page-number > 1 {
      align(center, text(
        font: "Inter",
        size: 8pt,
        fill: warm,
        features: ("tnum",),
        str(page-number),
      ))
    }
  },
)

#set text(font: "Inter", weight: 400, size: 9.5pt, fill: ink)
#set par(leading: 4pt, spacing: 4pt)

// Bullets: 2pt square marker, 10pt hanging indent, 4pt rhythm.
#set list(
  marker: box(baseline: -2.6pt, rect(width: 2pt, height: 2pt, fill: ink)),
  indent: 0pt,
  body-indent: 8pt,
  spacing: 4pt,
)

// ── Building blocks ──────────────────────────────────────────────────────────
#let section-heading(title) = {
  block(sticky: true, above: 18pt, below: 10pt, width: 100%, {
    text(font: "Inter", weight: 600, size: 8pt, tracking: 0.14em, fill: ink, upper(title))
    v(3.5pt)
    line(length: 100%, stroke: 0.5pt + hairline-color)
  })
}

#let entry-block(first, body) = {
  block(breakable: false, above: if first { 0pt } else { 12pt }, width: 100%, body)
}

#let dates-cell(range-text) = {
  align(right + top, text(
    font: "Inter",
    size: 9pt,
    fill: warm,
    features: ("tnum",),
    range-text,
  ))
}

#let title-row(left-content, range-text) = {
  grid(
    columns: (1fr, 118pt),
    column-gutter: 10pt,
    left-content,
    dates-cell(range-text),
  )
}

#let role-summary(summary) = {
  if summary != "" {
    v(3pt)
    text(font: "Inter", style: "italic", size: 9pt, fill: warm, summary)
  }
}

#let bullet-list(items) = {
  if items.len() > 0 {
    v(5pt)
    list(..items.map(item => text(size: 9.5pt, item)))
  }
}

// ── Section renderers ────────────────────────────────────────────────────────
#let work-entry(entry, first) = {
  let position = get(entry, "position", "")
  let company = get(entry, "name", "")
  let location = get(entry, "location", "")
  let range-text = fmt-range(get(entry, "startDate", ""), get(entry, "endDate", ""))

  entry-block(first, {
    title-row({
      text(font: "Fraunces", weight: 600, size: 11.5pt, if position != "" { position } else { company })
      if position != "" and company != "" {
        v(2.5pt)
        let url = get(entry, "url", "")
        text(font: "Inter", weight: 600, size: 10pt, if url != "" { link(url, company) } else { company })
        if location != "" {
          text(font: "Inter", weight: 400, size: 9pt, fill: warm, "   " + location)
        }
      }
    }, range-text)
    role-summary(get(entry, "summary", ""))
    bullet-list(get(entry, "highlights", ()))
  })
}

// The "Earlier" treatment: one line plus a sentence, no bullets.
#let condensed-entry(entry, first) = {
  let position = get(entry, "position", "")
  let company = get(entry, "name", "")
  let head = (position, company).filter(part => part != "").join("  \u{00B7}  ")
  let range-text = fmt-range(get(entry, "startDate", ""), get(entry, "endDate", ""))
  let summary = get(entry, "summary", "")

  entry-block(first, {
    title-row(
      text(font: "Inter", weight: 600, size: 9.5pt, head),
      range-text,
    )
    if summary != "" {
      v(2.5pt)
      text(font: "Inter", size: 9pt, fill: warm, summary)
    }
  })
}

#let render-work(entries) = {
  for (index, entry) in entries.enumerate() {
    if condensed-ids.contains(get(entry, "id", "")) {
      condensed-entry(entry, index == 0)
    } else {
      work-entry(entry, index == 0)
    }
  }
}

#let render-projects(entries) = {
  for (index, entry) in entries.enumerate() {
    let name = get(entry, "name", "")
    let url = get(entry, "url", "")
    let keywords = get(entry, "keywords", ())
    entry-block(index == 0, {
      title-row({
        text(font: "Fraunces", weight: 600, size: 11.5pt, if url != "" { link(url, name) } else { name })
        if keywords.len() > 0 {
          v(2.5pt)
          text(font: "Inter", size: 8.5pt, fill: warm, keywords.join("  \u{00B7}  "))
        }
      }, fmt-range(get(entry, "startDate", ""), get(entry, "endDate", "")))
      let description = get(entry, "description", "")
      if description != "" {
        v(3pt)
        text(size: 9.5pt, description)
      }
      bullet-list(get(entry, "highlights", ()))
    })
  }
}

#let render-skills(groups) = {
  for (index, group) in groups.enumerate() {
    block(breakable: false, above: if index == 0 { 0pt } else { 7pt }, width: 100%, {
      grid(
        columns: (110pt, 1fr),
        column-gutter: 10pt,
        text(font: "Inter", weight: 600, size: 8pt, tracking: 0.08em, fill: warm, upper(get(group, "name", ""))),
        text(size: 9.5pt, get(group, "keywords", ()).join(", ")),
      )
    })
  }
}

#let render-education(entries) = {
  for (index, entry) in entries.enumerate() {
    let institution = get(entry, "institution", "")
    let url = get(entry, "url", "")
    let degree = (get(entry, "studyType", ""), get(entry, "area", "")).filter(part => part != "").join(" ")
    entry-block(index == 0, {
      title-row({
        text(font: "Inter", weight: 600, size: 10pt, if url != "" { link(url, institution) } else { institution })
        if degree != "" {
          text(font: "Inter", size: 9.5pt, fill: warm, "   " + degree)
        }
      }, fmt-range(get(entry, "startDate", ""), get(entry, "endDate", "")))
    })
  }
}

#let render-certificates(entries) = {
  for (index, entry) in entries.enumerate() {
    let name = get(entry, "name", "")
    let url = get(entry, "url", "")
    let issuer = get(entry, "issuer", "")
    let date = get(entry, "date", "")
    entry-block(index == 0, {
      title-row({
        text(font: "Inter", weight: 600, size: 10pt, if url != "" { link(url, name) } else { name })
        if issuer != "" {
          text(font: "Inter", size: 9.5pt, fill: warm, "   " + issuer)
        }
      }, if date != "" { fmt-partial(date) } else { "" })
    })
  }
}

#let render-custom(section) = {
  for (index, entry) in get(section, "entries", ()).enumerate() {
    let title = get(entry, "title", "")
    let subtitle = get(entry, "subtitle", "")
    entry-block(index == 0, {
      if title != "" or subtitle != "" {
        title-row(
          text(font: "Fraunces", weight: 600, size: 11.5pt, title),
          subtitle,
        )
      }
      let detail = get(entry, "detail", "")
      if detail != "" {
        v(3pt)
        text(size: 9.5pt, detail)
      }
      bullet-list(get(entry, "bullets", ()))
    })
  }
}

// ── Masthead ─────────────────────────────────────────────────────────────────
#align(center, {
  text(font: "Fraunces", weight: 600, size: 26pt, tracking: -0.01em, fill: ink, full-name)

  let label = get(basics, "label", "")
  if label != "" {
    v(7pt)
    text(font: "Inter", weight: 400, size: 10pt, tracking: 0.08em, fill: warm, upper(label))
  }

  // Contact line with hairline separators.
  let location = get(basics, "location", (:))
  let location-text = (get(location, "city", ""), get(location, "region", "")).filter(part => part != "").join(", ")
  let contact-items = ()
  if location-text != "" { contact-items.push(text(location-text)) }
  let email = get(basics, "email", "")
  if email != "" { contact-items.push(link("mailto:" + email, email)) }
  let phone = get(basics, "phone", "")
  if phone != "" { contact-items.push(text(phone)) }
  let site = get(basics, "url", "")
  if site != "" {
    contact-items.push(link(site, site.replace("https://", "").replace("http://", "").trim("/")))
  }
  for profile in get(basics, "profiles", ()) {
    let profile-url = get(profile, "url", "")
    if profile-url != "" {
      let profile-label = get(profile, "network", "")
      contact-items.push(link(profile-url, if profile-label != "" { profile-label } else { profile-url }))
    }
  }
  if contact-items.len() > 0 {
    v(8pt)
    text(font: "Inter", size: 8.5pt, fill: warm, features: ("tnum",), {
      contact-items.join({
        h(7pt)
        box(baseline: 1.5pt, line(angle: 90deg, length: 8pt, stroke: 0.5pt + hairline-color))
        h(7pt)
      })
    })
  }

  // The one copper moment on the page.
  v(11pt)
  line(length: 34pt, stroke: 0.75pt + copper)
})

#let summary = get(basics, "summary", "")
#if summary != "" {
  v(12pt)
  par(leading: 5pt, justify: false, text(size: 9.5pt, summary))
}

// ── Sections in stored order ─────────────────────────────────────────────────
#let standard-labels = (
  work: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  certificates: "Certifications",
)

#for section-id in section-order {
  if hidden-sections.contains(section-id) { continue }
  if section-id == "work" {
    let entries = get(data, "work", ())
    if entries.len() > 0 {
      section-heading(standard-labels.work)
      render-work(entries)
    }
  } else if section-id == "projects" {
    let entries = get(data, "projects", ())
    if entries.len() > 0 {
      section-heading(standard-labels.projects)
      render-projects(entries)
    }
  } else if section-id == "skills" {
    let groups = get(data, "skills", ())
    if groups.len() > 0 {
      section-heading(standard-labels.skills)
      render-skills(groups)
    }
  } else if section-id == "education" {
    let entries = get(data, "education", ())
    if entries.len() > 0 {
      section-heading(standard-labels.education)
      render-education(entries)
    }
  } else if section-id == "certificates" {
    let entries = get(data, "certificates", ())
    if entries.len() > 0 {
      section-heading(standard-labels.certificates)
      render-certificates(entries)
    }
  } else {
    let custom = custom-sections.find(section => get(section, "id", "") == section-id)
    if custom != none and get(custom, "entries", ()).len() > 0 {
      section-heading(get(custom, "heading", ""))
      render-custom(custom)
    }
  }
}
