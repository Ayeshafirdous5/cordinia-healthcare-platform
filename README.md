# Cordinia — Connected Healthcare Platform

> A healthcare coordination platform designed to improve doctor-round visibility and reduce waiting uncertainty for patients and attendants.

Cordinia is a frontend MVP focused on making hospital doctor rounds more predictable.

In hospitals, doctor rounds can be delayed because of patient volume, longer consultations, emergencies, and movement between floors or wards. Patients and attendants may not know when the doctor will arrive or how many visits are ahead of them.

Cordinia addresses this by organizing hospital structure, clinical staff, patient assignments, doctor rounds, live queue progression, and estimated waiting time into one connected workflow.

---

## 🚀 Current Status

**MVP — Actively Developed**

The current version is a working frontend prototype built with React and Vite.

The application currently uses browser `localStorage` for data persistence. Firebase, authentication infrastructure, push notifications, and production backend services are planned for later development.

---

## ✨ Current Features

### 🏥 Hospital Onboarding

Hospital administrators can create a hospital workspace with:

- Hospital name
- Registration ID
- Location
- Contact information
- Floor count
- Ward count
- Initial setup status

Hospital information is persisted locally in the browser.

---
### 🏢 Hospital Structure Management

Cordinia models the hospital hierarchy as:

```text
Hospital
   └── Floor
        └── Ward
             └── Room
                  └── Bed
```

Supported functionality includes:

- Create and manage floors
- Create wards under individual floors
- Configure ward types
- Create rooms within wards
- Configure room types
- Configure bed counts
- Automatic bed creation
- Bed availability tracking
- Edit and delete structure records
- Duplicate room-number validation within the same ward
- Cascading deletion of dependent structure records

Supported ward types include:

- General Ward
- Private
- Semi-Private
- ICU
- Emergency
- Pediatric
- Other

Room numbers are treated as identifiers and are **not used to determine doctor-round order**.

---

### 👨‍⚕️ Clinical Staff Management

Hospital administrators can manage clinical staff records for:

#### Doctors

- Name
- Employee ID
- Department
- Specialization
- Phone
- Email
- Active/Inactive status

#### Nurses

- Name
- Employee ID
- Department/Ward
- Phone
- Email
- Active/Inactive status

The system also provides:

- Add / edit / delete operations
- Employee ID validation
- Staff summary counters
- Active/inactive status tracking

---

### 🧑‍🤝‍🧑 Patient Management

Cordinia supports patient registration and hospital assignment.

Each active patient can be assigned to:

```text
Doctor
   ↓
Floor
   ↓
Ward
   ↓
Room
   ↓
Bed
```

Current patient-management capabilities include:

- Patient registration
- Automatic Patient ID generation
- Automatic hospital-generated Access Code
- Doctor assignment
- Floor → Ward → Room → Bed cascading selection
- Bed availability filtering
- Occupied-bed protection
- Patient transfer between beds/rooms
- Automatic release of the previous bed
- Patient discharge
- Automatic bed release after discharge
- Patient search
- Patient status tracking
- Persistent local data

### 🔐 Patient Access

Patients and attendants can access their information using a hospital-generated access code.

Room numbers are **not used as authentication credentials**.

The current prototype stores only the patient ID in the browser session after successful access-code validation.

---

## 🩺 Doctor Round Management

Cordinia's core workflow is doctor-round coordination.

A doctor can start a round from the Doctor Dashboard.

Once a round begins, Cordinia automatically creates a queue from the doctor's assigned active patients.

The queue is based on:

- Hospital floor
- Ward structure
- Patient assignment
- Patient creation/order information

**Room numbers are deliberately not used as the queue sequence.**

This is important because hospital room numbers are not necessarily continuous or geographically meaningful for a doctor's assigned patients.

### Live Round Progress

During an active round, patients move through:

```text
Waiting
   ↓
Current
   ↓
Done
```

The doctor can:

- Start a round
- View the active queue
- See the current patient
- Complete the current visit
- Automatically advance to the next patient
- Complete the round

Round progress is persisted locally and survives page refreshes.

Duplicate active rounds for the same doctor are prevented.

---

## ⏱️ ETA & Delay Intelligence

Cordinia currently includes a deterministic ETA system designed to provide approximate waiting times.

The current ETA model considers:

- Current consultation progress
- Expected consultation duration
- Number of patients ahead
- Floor transitions
- Actual consultation durations from completed visits
- Observed delay during the current round

### Current Baseline

```text
Expected consultation duration: 10 minutes
Floor transition estimate: 2 minutes
```

When previous consultations take longer than the baseline, Cordinia calculates the observed positive delay from completed visits and adjusts the estimated waiting time for patients still in the queue.

For example:

```text
Observed round delay: +5 min/patient

Estimated wait:
Baseline ETA + observed round delay
```

The interface explains these adjustments to the user rather than presenting an unexplained number.

> ETA values are estimates intended for coordination and visibility, not medical or operational guarantees.

---

## 👤 Patient / Attendant Live Round View

Patients can view the current status of their assigned doctor's round.

Depending on their position in the round, the patient may see:

### Before Rounds

> Doctor rounds have not started yet.

### Waiting

> Doctor is currently in rounds.

The dashboard can display:

- Number of patients ahead
- Estimated waiting time
- Round progress
- ETA adjustment caused by current round pace

### Current Patient

> Doctor is visiting you now.

The dashboard shows the estimated remaining time for the current visit.

### Completed Visit

> Your round visit is complete.

No future ETA is displayed after the patient's visit has finished.

### Completed Round

> Doctor's round is complete.

The patient dashboard intentionally avoids exposing other patients' identities or medical information.

---

## 🔒 Privacy-Oriented Prototype Design

The patient-facing dashboard does not display:

- Other patients' names
- Other patients' IDs
- Other patients' room numbers
- Other patients' medical information

Instead, the patient receives only relevant progress information such as:

```text
2 patients ahead
Estimated wait: ~10 min
Round progress: 2 of 4
```

The prototype also uses hospital-generated access codes instead of treating room numbers as credentials.

> This is a prototype security model. Production deployment would require proper authentication, authorization, secure credential storage, session management, auditing, and healthcare-compliant security controls.

---

## 🧩 Application Roles

The current application structure includes role-specific experiences for:

- Hospital / Admin
- Doctor
- Nurse
- Patient / Attendant

The current implemented workflow primarily covers:

```text
Hospital Admin
      ↓
Hospital Structure
      ↓
Clinical Staff
      ↓
Patient Assignment
      ↓
Doctor Round
      ↓
Live Patient Progress
      ↓
ETA / Delay Visibility
```

---

## 🏗️ Current Architecture

The current prototype follows a frontend-service architecture:

```text
React UI
   │
   ├── Pages
   ├── Components
   └── Layouts
        │
        ▼
     Services
        │
        ▼
    localStorage
```

Current service modules include:

- `hospitalService.js`
- `hospitalStructureService.js`
- `clinicalStaffService.js`
- `patientService.js`
- `roundService.js`
- `etaService.js`

The service layer keeps the application logic separated from the UI and provides a foundation for replacing localStorage with a backend later.

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- React Router

### Data & Persistence

- Browser `localStorage`
- Browser `sessionStorage` for patient session state

### Development

- Node.js
- npm
- Git
- GitHub

---

## ▶️ Running Locally

Clone the repository:

```bash
git clone https://github.com/Ayeshafirdous5/cordinia-healthcare-platform.git
```

Navigate into the project:

```bash
cd cordinia-healthcare-platform
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local development URL shown by Vite in the terminal.

---

## 🧪 Current Prototype Testing

The current MVP has been manually tested across the major implemented workflows.

Tested areas include:

- Hospital registration
- Hospital structure configuration
- Floor / ward / room / bed relationships
- Duplicate room validation
- Clinical staff CRUD
- Employee ID validation
- Patient registration
- Doctor assignment
- Bed occupancy protection
- Patient transfers
- Patient discharge
- Patient access-code validation
- Patient session persistence
- Doctor round creation
- Automatic round queue generation
- Live round progression
- Round completion
- Basic ETA calculation
- Consultation-duration tracking
- Delay-aware ETA adjustment
- Patient live round status
- Page refresh persistence
- Privacy of patient-facing round information

---

## 🔮 Planned Development

The following features are **planned and are not yet implemented in the current GitHub version**.

### Notifications

Planned round-related notifications such as:

- Round started
- Patients ahead updated
- Doctor approaching
- ETA changed
- Round completed

### Firebase Backend

Planned migration from browser-only storage to:

- Firebase Authentication
- Firestore
- Real-time synchronization
- Firebase Hosting

### Authentication & Security

Planned improvements include:

- Role-based authentication
- Secure patient access
- Session management
- Authorization rules
- Production-grade credential handling
- Audit logging

### Advanced ETA Intelligence

Future ETA improvements may incorporate:

- Historical consultation patterns
- Doctor-specific round pace
- Floor-to-floor movement patterns
- Real-time delays
- More explainable prediction adjustments

### Production UX & Integration

- Final responsive UX refinement
- Notification center
- Real-time multi-user synchronization
- End-to-end integration testing
- Demo-ready deployment

---

## ⚠️ Prototype Disclaimer

Cordinia is currently a development prototype.

The application uses synthetic/demo data and browser storage and is **not intended for production healthcare use**.

It should not be used for:

- Clinical decision-making
- Diagnosis
- Treatment decisions
- Medical record management
- Emergency response
- Real-world patient care coordination

A production healthcare implementation would require appropriate security, privacy, compliance, authentication, authorization, reliability, monitoring, and clinical validation.

---

## 🎯 Project Goal

Cordinia focuses on a specific operational problem:

> **Patients should not have to wait without knowing what is happening during doctor rounds.**

The goal is to transform an uncertain waiting experience into a more transparent coordination flow:

```text
Doctor starts rounds
        ↓
System creates queue
        ↓
Visits progress
        ↓
ETA updates
        ↓
Delays are reflected
        ↓
Patient sees meaningful progress
```

---

## Author

**Ayesha Firdous**

CSE Student 

GitHub: [Ayeshafirdous5](https://github.com/Ayeshafirdous5)

---

## 📌 Project Status

**Cordinia MVP — In Active Development**

Built incrementally with a focus on:

- Practical healthcare workflow design
- Clear user roles
- Privacy-aware patient visibility
- Maintainable frontend architecture
- Explainable ETA logic
- Future real-time backend integration
