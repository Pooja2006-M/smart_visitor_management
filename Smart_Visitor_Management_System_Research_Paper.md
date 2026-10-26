# AI-Driven Smart Visitor Management System (SVMS) Using Cloud-Based Access Control and Real-Time Notification

**Authors:** Muthu Mansha S, [Guide Name]

**Affiliation:** Department of [Department Name], [College Name]

## Abstract

This paper presents the design and implementation of an AI-Driven Smart Visitor Management System (SVMS) that automates visitor registration, approval, access control, and real-time notifications. Traditional manual visitor logbooks are time-consuming, error-prone, and lack security monitoring. The proposed system addresses these limitations through a web-based platform integrated with Firebase cloud services, role-based dashboards (Admin, Host, Guard, Visitor), OTP-based verification, QR code access, geolocation capture, and automated email notifications. The system generates time-bound digital entry passes, enforces check-in/check-out tracking, supports emergency walk-in appointments, and allows hosts to approve or reschedule visits. Implementation results demonstrate improved security, reduced paperwork, faster approval workflows, and real-time visibility of visitor activity. The system is scalable, cost-effective, and suitable for educational institutions, corporate offices, and secured premises.

**Keywords:** Smart Visitor Management, Cloud Computing, Firebase, QR Code, OTP Verification, Access Control, Role-Based System

## 1. Introduction

Visitor management is an essential component of security in organizations, institutions, and corporate campuses. Conventional methods such as paper-based registers or standalone logbooks expose critical vulnerabilities: forged entries, loss of records, unauthorized access, delayed approvals, and poor traceability. The post-pandemic emphasis on contactless operations further highlights the need for digitized, secure, and automated solutions.

This paper proposes an AI-Driven Smart Visitor Management System (SVMS) that digitizes the end-to-end visitor lifecycle: pre-registration by visitors, host approval, secure gate verification by guards, real-time alerts, and check-in/check-out logging. The key objective is to ensure only authorized visitors gain access by leveraging cloud-based authentication, QR-based passes, OTP-based gate verification, and automated communication. The system is lightweight, requires minimal infrastructure, and uses a local email server for notifications, making it suitable for organizations without enterprise-level messaging subscriptions.

## 2. Literature Review

Several researchers have explored digital visitor management using web and mobile technologies. Existing approaches often rely on static web forms, barcode-based passes, or expensive third-party visitor management platforms. While some systems support SMS/email alerts, most lack integrated guard-level OTP verification for walk-ins, emergency appointment handling with explicit time selection, and flexible rescheduling workflows.

The literature reveals a gap in unified platforms that combine pre-registration, host workflows, guard verification, emergency access, and real-time dashboards within a single low-cost solution. This research addresses that gap by implementing a role-aware SVMS with OTP-based emergency verification and automated notifications.

## 3. Existing System vs Proposed System

| Feature | Existing System | Proposed SVMS |
|---|---|---|
| Registration | Manual paper logbook | Online pre-registration & guard-led walk-in |
| Approval | Verbal/phone-based | Host approval via dashboard + automated emails |
| Access Control | ID check without audit trail | QR pass + OTP verification + check-in/check-out |
| Notifications | None or manual | Automated emails to host & visitor (via local email server) |
| Security | Easily forged, no accountability | Role-based access, timestamped logs, OTP entry |
| Emergency Access | Ad-hoc, unrecorded | Emergency appointment with entry OTP visible to guard |
| Rescheduling | Manual coordination | Host-initiated reschedule with email update |
| Monitoring | No live view | Admin dashboard with live visitor status & analytics |

## 4. System Architecture

The SVMS follows a three-tier architecture: presentation layer (React web app), application/business logic (React components, routing, validation), and data layer (Firebase Firestore, Authentication, and local email service).

**Core Modules:**

1. **Visitor Module:** Pre-registers visits, views status, reschedules requests.
2. **Host Module:** Receives requests, approves/rejects, reschedules, views QR passes.
3. **Guard Module:** Registers walk-ins, verifies QR/OTP, check-in/check-out, views emergency OTPs.
4. **Admin Module:** Monitors live visitors, analytics, audit logs, reports.
5. **Authentication & Authorization:** Firebase Auth with role-based access control.
6. **Notification Module:** Local Node.js email server using Nodemailer.

## 5. Methodology

The development follows an iterative, modular approach.

**Technologies Used:**
- **Frontend:** React.js (Vite), React Router, Recharts, HTML5 QR
- **Backend/Data:** Firebase Firestore, Firebase Authentication
- **Utilities:** jsPDF, html5-qrcode, react-webcam
- **Notifications:** Node.js + Express + Nodemailer (Gmail App Password)
- **Build:** Vite, Oxlint

**Key Functionalities:**
1. **User Authentication:** Secure login with role assignment (Admin/Host/Guard/Visitor/Student/Employee).
2. **Pre-Registration:** Visitor submits details (name, email, phone, host, purpose, date/time, location). Stores in Firestore.
3. **Host Approval Workflow:** Host reviews request and approves/rejects. On approval, visitor notified with QR/entry details.
4. **Guard Verification:** Guard scans QR or verifies 4-digit entry OTP for walk-ins/emergency visits.
5. **Emergency Appointment:** Guard/authorized flow creates urgent appointment with time, auto-generates OTP shown on guard panel.
6. **Walk-in Registration (Guard):** Guard registers walk-in, generates OTP emailed to visitor and notified to host.
7. **Rescheduling:** Host reschedules approved visits; visitor can request reschedule.
8. **Real-time Tracking:** Check-in/check-out with timestamps, live dashboards, and analytics.
9. **Reports & Analytics:** Admin views today’s visitors, inside-now, department-wise distribution, trends.

## 6. Results and Discussion

The system was implemented and tested in a local environment. Key outcomes:

- **Reduced Approval Time:** Automated routing eliminates manual follow-ups.
- **Enhanced Security:** OTP + QR prevents unauthorized entry; audit trail via Firestore timestamps.
- **Contactless Workflow:** Digital passes minimize physical interaction.
- **Emergency Readiness:** Guard sees urgent arrivals with OTP & full visitor details.
- **Operational Clarity:** Role dashboards give real-time status to all stakeholders.
- **Low Cost:** Uses Firebase free tier and local email server with no recurring SMS costs.

Sample test cases validated: pre-registration flow, host approval, guard walk-in OTP generation, emergency OTP verification, reschedule email flow, and check-in/check-out tracking. The UI adapts to roles and maintains consistent theming.

## 7. Conclusion

This paper presents a robust, secure, and scalable Smart Visitor Management System. By integrating cloud services, QR/OTP verification, and real-time notifications, the system overcomes the inefficiencies of manual registers. It improves security, accountability, and user experience while remaining cost-effective. Future work could include facial recognition integration, mobile app deployment (Capacitor/Android), integration with access control hardware (gates/readers), and AI-based anomaly detection for visitor patterns.

## 8. References

1. L. Chin, A. B. Zakaria, "Design and Development of Visitor Management System", *International Journal of Computer Applications*, 2015.
2. Firebase Documentation, [https://firebase.google.com/docs](https://firebase.google.com/docs)
3. React Documentation, [https://react.dev/](https://react.dev/)
4. Nodemailer Documentation, [https://nodemailer.com/](https://nodemailer.com/)
5. IEEE Access & ICITIIT Conference Guidelines (general reference for format alignment)
6. S. B. Chavan et al., "Smart Visitor Management System using IoT", *IJERT*, 2020.
