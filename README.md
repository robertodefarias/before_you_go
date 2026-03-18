# 🚀 Before You Go

> Community-powered safety map to help people decide whether a place is safe before going out.

---

## 📌 Overview

**Before You Go** is a web application designed to help users make safer decisions before visiting bars, restaurants, and social venues.

The platform allows users to:

* Search for a place
* View safety reports based on real experiences
* Identify potential risks such as violence, harassment, or discrimination
* Contribute by sharing their own experiences

The goal is to provide a **simple and transparent way to assess safety before going out.**

---

## 🎯 Problem

Many people go out without knowing whether a place is safe.
Experiences such as:

* Violence
* Harassment
* Discrimination

are often shared too late — after something has already happened.

There is no focused platform that allows users to check **safety-related experiences only**, separate from general reviews like food or service.

---

## 💡 Solution

Before You Go creates a **community-driven safety layer** on top of real-world locations.

Instead of rating the place itself, users report **safety-related experiences**, allowing others to:

* Identify patterns
* Avoid risky environments
* Make more informed decisions

---

## 🧪 MVP (Minimum Viable Product)

The MVP focuses on a **single core user flow**:

1. User searches for a place
2. The place appears on a map
3. The user sees the safety status:

   * 🟢 Safe (positive experiences)
   * 🔴 Risk (negative experiences)
   * ⚪ No data
4. The user can submit a report about:

   * Violence
   * Harassment
   * Discrimination

---

## 🛠 Tech Stack

* **Ruby on Rails** – backend framework
* **PostgreSQL** – database
* **JavaScript (Stimulus)** – frontend behavior
* **Mapbox / Google Maps API** – map & location search
* **Devise** – authentication
* **Bootstrap / CSS** – UI

---

## 🧱 Core Models

### User

* Authentication (Devise)
* Can create reports

### Place

* Name
* Address
* Latitude / Longitude
* Has many reports

### Report

* Category (violence, harassment, discrimination)
* Description
* Linked to a user and a place

---

## 🔄 Main User Flow

User → searches location → views map → checks safety status → decides to go or not → optionally submits report

---

## 👥 Team

* 👨‍💻 Roberto de Farias
  👉 https://github.com/robertodefarias

* 👨‍💻 Pedro Abreu
  👉 https://github.com/peedroabreu

* 👨‍💻 Bruno Wallace Nable
  👉 https://github.com/bruno-wallace-nable

---

## 🚧 Status

🚀 Currently under development as part of a full-stack web development project.

---

## 🌍 Future Improvements

* Moderation system
* AI-based risk detection
* Real-time alerts
* Advanced filtering
* Mobile version

---

## 🔗 Live Demo

Coming soon

---
