# diogodev.pt

## 💡 About the Project

This website is my professional portfolio and showcase of projects. It was built to present both my academic and professional projects, along with my professional contact channels.

### 🧠 Learning & Development with AI
As a Computer Engineering student, I view technology and new Artificial Intelligence tools as learning catalysts.

This project was developed by applying the engineering knowledge acquired during my degree (software architecture, object-oriented programming, design patterns, and data structures) while using **AI as a pair-programming assistant**. Using AI allowed me to:
- Streamline writing boilerplate code and accelerate UI development.
- Explore and learn hands-on advanced concepts I hadn't covered in depth yet, such as web hosting, React Router, SPA architecture, email delivery systems, and DNS configuration.
- Maintain total focus on system architecture, code quality, and user experience.

---

## ✨ What the Site Features

- **🎨 Minimalist & Responsive Interface:**
  - Native support for **Dark Mode** and **Light Mode** with smooth transitions and CSS token design (`var(--accent)` in Amber `#FFB454`).
  - Bento-style grid for main projects with optimized visual glow effects via `requestAnimationFrame`.

- **🌍 Bilingual (Portuguese & English):**
  - Instant language switching across the application with automatic preference saving.

- **⚡ Quick Commands (Ctrl+K / ⌘K):**
  - Interactive command palette for quick keyboard navigation and search.

- **📬 Secure Contact Form:**
  - Multi-tier validation (invisible Honeypot for bots, 5-minute cooldown per browser, and MX mail server verification via Google DNS-over-HTTPS).
  - Direct delivery to my professional email via **Web3Forms** with `Reply-To` header configured for direct replies.
  - Automated confirmation email sent to the visitor with my professional contact information.

- **🗄️ Admin Dashboard & Backend (Supabase):**
  - Private control panel to manage projects, edit image galleries, update CV, and check metrics.
  - PostgreSQL database.

- **🚀 Automated Deployment (CI/CD):**
  - Continuous integration via **GitHub Actions** (`deploy.yml`) that compiles the project with TypeScript/Vite and deploys to **GitHub Pages** on every `git push` to the main branch.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, React Router 7, CSS (Design Tokens).
- **Backend & Database:** Supabase (PostgreSQL, RLS, Storage, Deno/TypeScript Edge Functions).
- **Integrations & Services:** Web3Forms API, Google DNS-over-HTTPS API, Resend.
- **Quality & Tools:** Git, GitHub Actions.

---

## 📂 Repository Structure

```text
Diogo.dev/
├── .github/workflows/deploy.yml   # CI/CD Workflow for GitHub Pages
├── public/                         # Favicon, og-image, and static assets
├── src/
│   ├── components/                 # Shared components (TopNav, Footer, CmdPalette, Logo, etc.)
│   ├── pages/                      # Main pages (Home, Project, Contact, Admin)
│   ├── App.tsx                     # Routing & SPA navigation
│   ├── data.ts                     # Original data & TypeScript definitions
│   ├── lang.tsx                    # Language provider (PT/EN)
│   ├── projectsStore.ts            # Data layer (Supabase with local fallback)
│   └── index.css                   # Global styles & design tokens
├── index.html                      # HTML entry point with SEO & Open Graph meta tags
├── vite.config.ts                  # Vite bundler configuration
└── package.json                    # Dependencies & scripts
```

---

## ✉️ Contact

- **Website:** [diogodev.pt](https://diogodev.pt)
- **GitHub:** [@DiogoFSP](https://github.com/DiogoFSP)
- **LinkedIn:** [diogofspinto17](https://www.linkedin.com/in/diogofspinto17/)
- **Email:** [diogo@diogodev.pt](mailto:diogo@diogodev.pt)

---

<div align="center">
  <sub>Created by <b>Diogo Pinto</b> · © 2026 diogodev.pt</sub>
</div>
