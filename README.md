# EduRoster Pro — School Staff Duty & Task Allocation System

EduRoster Pro is a specialized, executive-grade duty allocation and rotation web application designed for school administrators, principals, and facility coordinators.

---

## 🌟 Key Features

- **Institutional Design (Non-AI Look)**: Styled with an academic, authoritative palette (oxford navy `#0f2b48`, slate, gold accents) and typography (**Cinzel** & **Plus Jakarta Sans**).
- **Preloaded School Duty Areas**:
  - School (Building 1) — Assembly & classroom supervision
  - School (Building 2) — Senior wing & science laboratories
  - Garden & Campus Grounds — Outdoor supervision & sports pavilion
  - Hostel (Boys) — Residential oversight & evening roll call
  - Hostel (Girls) — Residential oversight & evening roll call
  - *Add, edit, or delete duty locations and quotas as needed.*
- **Staff Directory Management**:
  - **Bulk Upload**: Import staff from Excel (`.xlsx`, `.xls`) or `.csv`.
  - **Quick Paste**: Paste lists of teacher names directly (`Name, Department, Role`).
  - **CRUD Operations**: Add, edit, delete staff, or mark active / on-leave.
- **Intelligent Grouping & Shuffle Engine**:
  - Balanced group distribution across active tasks.
  - **Shuffle & Rotate**: One-click re-allocation to ensure fair rotation of duties.
  - **Hostel Gender Policy**: Auto-assigns male staff to Boys Hostel and female staff to Girls Hostel when enabled.
  - **Manual Duty Swapper**: Swap any two teachers without re-shuffling the entire roster.
- **Multi-Format Export Suite**:
  - 📊 **Excel (`.xlsx`)**: Structured spreadsheet with column widths, duty breakdowns, and staff master directory.
  - 📄 **Official PDF (`.pdf`)**: Formatted landscape letterhead with table borders, notice directives, and signature lines for Principal & Coordinator.
  - 🖼️ **High-Res JPG/PNG (`.jpg`, `.png`)**: 2.5x high-DPI image snapshot for school WhatsApp groups and notice boards.
  - 🖨️ **Print Direct**: Dedicated ink-friendly print stylesheet.
- **100% Privacy & Local Storage**: Runs completely client-side in your browser; staff names and records are never sent to third-party servers.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/school-duty-roster.git

# Navigate to project directory
cd school-duty-roster

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Building for Production
```bash
npm run build
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Spreadsheets**: SheetJS (`xlsx`)
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Image Generation**: html-to-image
- **Animations**: canvas-confetti
