# ArchionLabs Platform

**Automated 3D Floor Plan Generation and Accessibility Simulation through AI-Driven Analysis**

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Anthropic Claude](https://img.shields.io/badge/Claude_AI-Powered-D4A843?style=for-the-badge)](https://anthropic.com)

[**Live Demo**](https://archionlabs.com) · [**Documentation**](#documentation) · [**Report a Bug**](issues) · [**Request Feature**](issues)

</div>


## Overview

ArchionLabs is an integrated, end-to-end AI-driven platform that transforms how architects design, validate, and share building environments. By eliminating fragmented tools and manual processes, the ecosystem automates 3D model generation, realistically simulates human movement patterns, and enables secure, browser-based collaborative design review.


## Modules

| Module | Description |
|---|---|
| **Archion Build** | AI-powered floor plan generator — describe your space in plain language and get an interactive 2D/3D floor plan in seconds |
| **Archion Sim** | Agent-based pedestrian simulation — analyze movement patterns, detect accessibility violations, and generate compliance reports |
| **Archion Viewer** | Interactive 3D model viewer — visualize, annotate, and securely share architectural designs in the browser |
| **Landing Page** | Marketing website with animated hero and a unified Supabase-backed project dashboard |


## Key Features
 
<table>
  <tr>
    <td width="50%" valign="top" style="padding-bottom:20px">
      <h3>🤖 Natural Language Generation</h3>
      Describe any floor plan in plain text. AI extracts room requirements and builds the complete layout automatically.
    </td>
    <td width="50%" valign="top" style="padding-bottom:20px">
      <h3>📐 2D to 3D Conversion</h3>
      Automatic parametric 3D model generation from 2D plans — walls, doors, and windows included.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top" style="padding-bottom:20px">
      <h3>✏️ Interactive 2D Editor</h3>
      Draw walls, place doors and windows, add rooms, annotate, and drag elements — all with keyboard shortcuts on an HTML5 canvas.
    </td>
    <td width="50%" valign="top" style="padding-bottom:20px">
      <h3>🧑‍🤝‍🧑 Pedestrian Simulation</h3>
      MARL-powered AI agents navigate your building in real time, exposing congestion points and egress issues.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top" style="padding-bottom:20px">
      <h3>✅ Accessibility Compliance</h3>
      Automated audit against Sri Lankan Planning Regulations and ISO 21542:2011 with AI-generated remediation advice.
    </td>
    <td width="50%" valign="top" style="padding-bottom:20px">
      <h3>📊 Analytics & Reports</h3>
      Density heatmaps, velocity timelines, flow rates, congestion indexes, and downloadable 11-page PDF reports.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top" style="padding-bottom:20px">
      <h3>🔗 Secure Sharing</h3>
      Token-based share links with optional password protection, expiry controls, and dual-layer canvas watermarks.
    </td>
    <td width="50%" valign="top" style="padding-bottom:20px">
      <h3>🔐 Authentication</h3>
      Google OAuth and email/password login powered by Supabase with a unified project dashboard.
    </td>
  </tr>
</table>
 
---
 
## Project Structure
 
```
archionlabs/
├── archion-build/          # AI floor plan generator
│   ├── backend/            # FastAPI — generation, geometry, 3D export
│   └── frontend/           # Next.js — 2D canvas editor + 3D viewer
│
├── archion-sim/            # Pedestrian simulation & compliance
│   ├── backend/            # FastAPI — simulation engine, analytics, PDF reports
│   └── frontend/           # Next.js — 3D simulation viewer + analytics dashboard
│
├── archion-viewer/         # 3D model viewer & sharing
│   ├── backend/            # FastAPI — model upload, share tokens
│   └── frontend/           # Next.js — viewer, annotations, watermarked shares
│
└── landing-page/           # Marketing site & project dashboard
    └── frontend/           # Next.js — animated landing page + Supabase dashboard
```
 
---
 
## Getting Started
 
Each module has its own `README.md` with detailed setup instructions. The general pattern is:
 
**Backend**
```bash
cd <module>/backend
pip install -r requirements.txt
cp .env.example .env   # fill in API keys
uvicorn app.main:app --reload --port 800X
```
 
**Frontend**
```bash
cd <module>/frontend
npm install
npm run dev
```
 
> Refer to the `README.md` files in each module directory (`archion-build`, `archion-sim`, `archion-viewer`, `landing-page`) for specific environment variables and configuration.
 
---
 
## Team
 
| Name | GitHub |
|---|---|
| Oshadha Vimukthi | [@OshadhaVimuB](https://github.com/OshadhaVimuB) |
| Visula Siriwardana | [@ViuslaS16](https://github.com/ViuslaS16) |
| Chamath Anupama | [@chamath6136](https://github.com/chamath6136) |
| Sadewni Mendis | [@sadewni2023](https://github.com/sadewni2023) |
| Danuka Dulanjana | [@Danukad](https://github.com/Danukad) |
| Sachiro Hithosha | [@sachiro24](https://github.com/sachiro24) |


<div align="center">

[Archionlabs.com](https://archionlabs.com) · [LinkedIn](https://www.linkedin.com/company/achionlabs) · [Instagram](https://instagram.com/archionlabs)

</div>

<div align="center">
  <img src="./MarketingWebsite/Assets/Logo.svg" alt="ArchionLabs Logo" width="100"/>
</div>
