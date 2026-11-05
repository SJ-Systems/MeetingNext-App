# ARCHITECTURAL FEASIBILITY & REGULATORY ASSESSMENT
## Outbound Banking Telephony & Customer Calling from CRMNEXT via AWS-Native Services
### Compliance with TRAI Guidelines (140xx Promotional & 1600xx Service Series)

---

## Executive Summary

This assessment evaluates the feasibility of enabling branch employees to initiate compliant outbound calls directly from **CRMNEXT** to customers using AWS-native cloud communication services (**Amazon Chime SDK Voice Connector** and **Amazon Connect**) without deploying a heavy standalone call-center PBX or using branch employees' personal mobile numbers.

---

## 1. Evaluation of the 5 Core Requirements

### Requirement 1: Can AWS services support outbound calling initiated directly from CRMNEXT?
**Verdict: YES (Feasible & Recommended)**
* **Mechanism**:
  - **Option A (Lightweight / Recommended - Amazon Chime SDK Voice Connector)**: CRMNEXT invokes a simple REST API (e.g., `POST /api/calls/outbound`) on AWS API Gateway + Lambda. The Lambda triggers the Amazon Chime SDK PSTN Audio service or Voice Connector to place a dual-leg bridge call or WebRTC softphone call directly from CRMNEXT UI.
  - **Option B (Amazon Connect Outbound API)**: CRMNEXT triggers the Amazon Connect `StartOutboundVoiceContact` API. The contact flow dials the customer and bridges the branch employee's browser softphone.
* **Result**: Branch employees click "Call" in CRMNEXT, and the call is orchestrated entirely via cloud APIs without external physical desktop phones.

---

### Requirement 2: Can AWS support the bank's authorized 140xx (Promotional) and 1600xx (Service/Transactional) number series?
**Verdict: YES (Feasible with TRAI-Compliant Telecom Carrier Interconnect)**
* **TRAI Regulatory Framework**:
  - **140xx Series**: Mandatory for promotional/commercial communication under TRAI UCC (Unsolicited Commercial Communication) Regulations.
  - **1600xx Series / 1800 Toll-Free**: Mandated by RBI and TRAI for service/transactional communication (fraud alerts, KYC verification, EMI notices, service reminders).
  - **Employee Privacy & Anti-Spoofing**: Bank employees' personal mobile numbers must NEVER be presented to customers.
* **AWS Integration Architecture**:
  - In India, outbound CLI (Calling Line Identification) spoofing is strictly prohibited by the Department of Telecommunications (DoT). Therefore, you cannot simply type "140xx" as an arbitrary header on public VoIP.
  - **Solution via AWS BYOC (Bring Your Own Carrier) / Indian SIP Trunking**:
    1. The bank contracts an authorized Indian telecom service provider (TSP) (e.g., Tata Communications, Bharti Airtel, Reliance Jio, or Vodafone Idea) who allocates the bank's official `140xx` and `1600xx` number blocks and registers the bank on the DLT (Distributed Ledger Technology) portal.
    2. The TSP provides SIP trunks terminating directly into **AWS Asia Pacific (Mumbai) `ap-south-1`** via AWS Direct Connect or secure TLS/SRTP SIP interconnect.
    3. **Amazon Chime SDK Voice Connector** routes the call over this dedicated SIP trunk, passing the official `140xx` or `1600xx` CLI as the authenticated SIP `From` header.
  - **Customer Experience**: The customer's mobile screen rings showing `140 910 8820` (for promotional calls) or `1600 200 4810` (for service reminders). The branch employee's personal mobile number is never exposed.

---

### Requirement 3: Can branch employees initiate calls directly from CRMNEXT with AWS handling call orchestration, validation, initiation, and status tracking?
**Verdict: YES (Feasible & Implemented in MeetingNext / CRMNEXT)**
* **End-to-End Orchestration Flow**:
  1. **Validation & DND Check**: When an employee selects "Promote New Schemes", CRMNEXT automatically scrubs the customer's mobile number against the National Customer Preference Register (NCPR / DND registry). If opted out, promotional calls are blocked automatically.
  2. **Call Initiation**: CRMNEXT passes `customerId`, `customerNumber`, `callPurposeCategory`, and `assignedCli` to the backend.
  3. **AWS Orchestration**:
     - Leg 1: Connects branch employee (via in-browser WebRTC audio or cellular callback).
     - Leg 2: Dials the customer mobile with the authorized CLI.
  4. **Status Tracking & Audit Logging**: AWS emits real-time EventBridge events for `CALL_INITIATED`, `RINGING`, `CONNECTED`, and `COMPLETED`. CRMNEXT logs the exact duration, timestamp, employee ID, and regulatory classification for compliance reporting.

---

### Requirement 4: Can this be achieved without implementing a complete call-center solution or heavy telecom infrastructure?
**Verdict: YES (Amazon Chime SDK Voice Connector provides serverless telephony)**
* Unlike complex contact center solutions (Genesys, Avaya, Cisco, or full-blown Amazon Connect contact flows with complex IVR routing, queues, agent skillsets, and supervisor monitoring desks), **Amazon Chime SDK Voice Connector** is purely a serverless SIP/VoIP trunking bridge.
* It operates pay-per-second, requires no per-agent monthly contact center licensing fees, and integrates directly into CRMNEXT's existing CRM interface via a lightweight browser WebRTC SDK or dialer bridge.

---

### Requirement 5: AWS Service Limitations, Regional Availability Constraints, Telecom Dependencies, and Licensing

| Factor | Detail / Constraint | Mitigation / Architecture Decision |
| :--- | :--- | :--- |
| **AWS Region** | Outbound calls terminating to Indian PSTN numbers should originate from **AWS Asia Pacific (Mumbai) `ap-south-1`**. | Deploy telephony microservices and SIP interfaces in `ap-south-1` to minimize latency (<30ms) and comply with Indian data localization guidelines. |
| **DoT OSP & Toll Bypass Regulations** | Indian DoT regulations forbid interconnecting Indian PSTN with international public internet VoIP without toll separation. | Terminate calls through authorized Indian TSPs (Airtel, Tata, Jio) with registered Indian CLI and local media termination. |
| **DLT & Scrubbing** | TRAI requires commercial promotional callers (140xx) to scrub against DND. | CRMNEXT pre-call validation layer checks customer consent flag prior to sending SIP INVITE. |
| **Licensing** | No per-seat call center licensing required. | Pay-as-you-go per minute voice rates (~$0.004 - $0.008/min for AWS Voice Connector + carrier SIP rates). |
| **Free-Tier Optimization for Meetings** | Amazon Chime SDK WebRTC native meetings for video KYC and branch consultations can run in browser peer-to-peer / mesh sessions for free, minimizing recurring cloud costs. | MeetingNext uses client WebRTC media pipelines for zero-cost branch video meetings. |

---

## 2. Recommended AWS Target Architecture

```
+-----------------------------------------------------------------------------------+
|                                  CRMNEXT BROWSER UI                              |
|                                                                                   |
|  [ Customer Profile ] ----> Click "Call Customer"                                 |
|  [ Select Purpose   ] ----> [ Service Reminder (1600xx) ] or [ Promo (140xx) ]     |
+------------------------------------------+----------------------------------------+
                                           | HTTPS REST API (Payload + JWT Token)
                                           v
+-----------------------------------------------------------------------------------+
|                        AWS ASIA PACIFIC (MUMBAI - ap-south-1)                     |
|                                                                                   |
|  +--------------------+       +---------------------+       +------------------+  |
|  | AWS API Gateway    | ----> | AWS Lambda          | ----> | Amazon Chime SDK |  |
|  | (Auth & Rate Limit)|       | (Validation & DND)  |       | Voice Connector  |  |
|  +--------------------+       +---------------------+       +--------+---------+  |
|                                                                      |            |
|                                                                      | SIP / TLS  |
+----------------------------------------------------------------------|------------+
                                                                       v
                               +----------------------------------------------------+
                               | INDIAN AUTHORIZED TELCO (Airtel / Tata / Jio)       |
                               | - Authorized Bank 140xx CLI Trunk (Promotional)    |
                               | - Authorized Bank 1600xx CLI Trunk (Service)       |
                               +-----------------------+----------------------------+
                                                       | Indian PSTN Network
                                                       v
                               +----------------------------------------------------+
                               | CUSTOMER MOBILE PHONE                              |
                               | Caller ID Displayed: 1600-200-4810 or 140-910-8820 |
                               | (Branch RM Personal Mobile Number is Never Shown)  |
                               +----------------------------------------------------+
```

---

## 3. Product & Cloud Teams Actionable Next Steps

1. **Procure Authorized CLI Series**: Bank Treasury / Operations procures `1600xx` toll-free/service blocks and `140xx` telemarketer promotional blocks from Indian TSP (Airtel, Tata, or Jio).
2. **SIP Interconnect in AWS Mumbai**: Establish an AWS Voice Connector SIP trunk with the telco carrier terminating in AWS Mumbai (`ap-south-1`).
3. **Configure CRMNEXT Outbound Webhook**: Point CRMNEXT click-to-call webhook to the `/api/meetingnext/calls/dispatch` endpoint.
4. **Deploy Application**: Package code from Google AI Studio and deploy directly to Vercel or AWS Amplify / ECS.
