Updated PRD: CRM with Predictive Dialing & VICIdial Adaptation
1. Executive Summary

Dial-Craft CRM is a comprehensive, secure CRM for call center agencies doing bank collections. It integrates with VICIdial and optionally includes Predictive Dialing / adaptive dialing features to optimize agent call efficiency. The CRM will support dynamic RBAC, dashboards, bulk uploads, reporting, and seamless call integration.

2. Goals & Objectives

Centralize all accounts, phone numbers, statuses, and call logs.

Automate outbound dialing using VICIdial’s predictive dialer capabilities.

Adapt dialing rates dynamically based on agent availability, answer rates, and call volume.

Provide real-time dashboards and performance metrics.

Enable bulk account uploads (CSV/Excel).

Support dynamic RBAC, ensuring secure, fine-grained permissions.

Maintain high security, auditing, and compliance.

3. Key Features
3.1 Account Management

(unchanged: CRUD, multi-phone, CSV upload, assignment, status tracking)

3.2 VICIdial Integration & Dialer Control

Predictive Dialing Support

Use VICIdial’s predictive dialing engine to auto-dial multiple numbers in the background and connect only answered calls to agents. (VICIdial supports predictive dialing as part of its dialer modes) 
vicidial.org
+1

Control dialing parameters: pacing ratio, max calls per agent, threshold settings.

Adaptive Dial Rate Logic

The CRM monitors agent availability, drop rate, answer rates, queue waiting times and adjusts dialing pace accordingly to optimize agent occupancy.

Implement feedback loop: if answer rates drop or abandonment rates increase, slow dialing pace.

Click-to-Dial & Call Initiation

CRM sends commands to VICIdial to initiate calls (outbound) using campaign context.

Call Log Ingestion

VICIdial pushes call events (start, end, duration, outcome) to CRM.

Screen Pop / Contextual Popup

When a call is connected, show account details (matching by phone) in agent UI.

Disposition Mapping & Recording Attachment

Map VICIdial’s disposition codes to CRM outcomes; attach recordings.

3.3 Disposition Module

(as before, supports custom outcomes, mapping, enforcement)

3.4 Dynamic RBAC & Permissions

(unchanged, but ensure role for dialer configuration, dialing parameters, etc.)

3.5 Dashboards & KPIs

Display dialer-level metrics: pacing, call attempts, drop rate, answer rate, agents in-call vs idle.

Manager dashboard to monitor dialing performance and adjust campaign settings.

3.6 Reports & Exports

Include dialer performance reports (calls attempted, connected, abandonment, average wait, idle time)

Filters: by campaign, date range, agent, dialing parameters.

3.7 Admin / Settings

UI for dialer settings: campaign pacing, thresholds, max simultaneous calls per agent, retry logic.

Permit only authorized roles (e.g. “Dialer Manager” or Super Admin) to modify dialer settings.

Audit log of changes to dialing parameters.

4. User Roles & Permissions (Updated)

Add roles/permissions for dialer control:

Role	New Permissions	Use Cases
Super Admin	dialer:configure, dialer:monitor, dialer:override	Full control over dialer settings, pacing, overrides
Admin / Dialer Manager	dialer:view, dialer:monitor	Observe dialer metrics, but not change pacing or overrides
Manager / Agent	dialer:status (for agents)	Agents see their own call status and queue info, but cannot change dialer settings
5. Technical Requirements
5.1 Frontend

Dashboards to visualize dialer metrics, pacing, agent status, real-time updates.

UI to configure dialing settings.

Agent UI: show call queue, call status, wait times.

5.2 Backend

APIs to receive dialer logs, agent state changes, pacing feedback loops.

Algorithm module to adjust dialing rate based on metrics.

Secure APIs to update dialing configuration.

5.3 Database

Additional tables for dialer campaigns, dialer settings, dialer metrics, agent state logs.

Store historical dialing performance for reporting.

5.4 VICIdial / Dialer Integration

Use VICIdial’s predictive dialing features (built in) as the underlying engine. 
kingasterisk.com
+1

Expose CRM → VICIdial API or database interface to manage campaign pacing, thresholds, call initiation.

Receive dialer events (calls attempted, agent accept, call dropped) as webhooks or push events.

6. KPIs & Reports (Extended)

Dialing metrics: calls attempted / minute, calls connected, abandonment rate, agent occupancy rate.

Answer rate, drop rate, average wait time.

Agent-level average talk times, wrap-up, idle times.

Trend charts to show dialing performance over time.

7. Non-Functional & Constraints

Real-Time Responsiveness: updates in dashboards and pacing must occur near real-time (few seconds).

Stability Under Load: when dialing many numbers, backend must scale to ingest large event streams.

Safety & Limits: enforce safe bounds (max call rates) to avoid dialing too aggressively and causing regulatory issues.

Audit & Safety: any change in dialing parameters must be audited, and possibly require approval flows.

Fallback / Safe Mode: if adaptive algorithm fails, revert to default pacing settings.

8. Success Criteria

Predictive dialing operates: system dials ahead and connects to available agents.

Dialer adapts: pacing adjusts based on real-time metrics without manual intervention.

Managers can configure dialing settings and see effects on performance.

Dialer metrics appear accurately in dashboards & reports.

System remains stable under high volumes, no major dropped calls or overload.