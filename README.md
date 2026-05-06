# Layered Insider Threat Detection System Using Behavioural Analysis & Machine Learning

A two-layer adversarial-aware insider threat detection system designed to detect both anomalous user behaviour and intelligent evasion strategies used by sophisticated insiders. The system combines traditional UEBA models with a meta-detection layer to improve robustness against stealthy insider attacks.

---

# Project Overview

Insider threats remain one of the most dangerous cybersecurity risks because attackers already possess legitimate system access. Traditional User and Entity Behaviour Analytics (UEBA) systems can detect anomalous activity, but they are vulnerable to adversarial evasion techniques such as threshold hugging, gradual drift, and temporal obfuscation.

This project presents a complete adversarial-aware insider threat detection framework that:

- Detects anomalous insider behaviour
- Simulates intelligent evasion strategies
- Identifies evasion patterns through meta-analysis
- Generates fused risk scores
- Provides a FastAPI backend and React-based SOC dashboard

---

# Key Features

## Two-Layer Detection Architecture

### Layer 1 — Baseline UEBA

Implements multiple anomaly detection models:

- Isolation Forest
- One-Class SVM
- PCA-Based Autoencoder

### Layer 2 — Meta-Detection

Detects evasion behaviour using temporal analysis:

- Threshold Proximity
- Behavioural Drift
- Variance Analysis
- Consistency Scoring

### Score Fusion

Combines baseline and meta-detection scores using:

- Weighted Fusion
- Adaptive Fusion
- Max Fusion

---

# System Architecture

```text
CERT Logs
    ↓
Data Pipeline & Feature Engineering
    ↓
┌─────────────────────────────────┐
│ Layer 1: Baseline UEBA          │
│ - Isolation Forest              │
│ - One-Class SVM                 │
│ - PCA Autoencoder               │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Layer 2: Meta Detection         │
│ - Threshold Proximity           │
│ - Behavioural Drift             │
│ - Variance Analysis             │
│ - Consistency Scoring           │
└─────────────────────────────────┘
    ↓
Score Fusion Engine
    ↓
FastAPI Backend
    ↓
React SOC Dashboard
```

---

# Adversarial Evasion Strategies

The system simulates realistic insider evasion techniques:

| Strategy | Description |
|---|---|
| Activity Splitting | Distributes malicious activity across time |
| Gradual Drift | Slowly increases suspicious behaviour |
| Threshold Hugging | Stays just below detection threshold |
| Temporal Obfuscation | Adds noise to hide behavioural patterns |
| Account Switching | Splits activity across multiple accounts |

---

# Tech Stack

## Backend

- Python
- FastAPI
- Scikit-learn
- Pandas
- NumPy

## Frontend

- React.js
- Tailwind CSS

## Machine Learning

- Isolation Forest
- One-Class SVM
- PCA-Based Autoencoder

---

# Project Structure

```text
Insider_threat_detection/
│
├── insider_threat_detection_Backend/
│   ├── insider_threat_detection/
│   │   ├── main.py
│   │   ├── backend_api.py
│   │   ├── baseline_ueba.py
│   │   ├── meta_detection.py
│   │   ├── adversarial_evasion.py
│   │   ├── data_pipeline.py
│   │   ├── react_dashboard.jsx
│   │   ├── requirements.txt
│   │   └── data/
│
├── threat-dashboard-frontend/
├── IMPLEMENTATION_SUMMARY.md
├── USER_GUIDE.md
├── QUICK_START.md
└── README.md
```

---

# Dataset

The system uses a synthetic CERT-like insider threat dataset containing:

- Logon activity
- File access logs
- Email logs
- HTTP activity
- USB usage activity

## Dataset Characteristics

| Attribute | Value |
|---|---|
| Total Users | 1000 |
| Total Records | 49,837 |
| Malicious Users | 70 |
| Features Per Record | 6 |
| Meta Window Size | 14 Days |

Large CSV datasets are excluded from the repository due to GitHub size limitations.

---

# Feature Engineering

Extracted behavioural features include:

- logon_count
- failed_logins
- off_hours_access
- files_accessed
- emails_sent
- websites_visited

Features are normalized using Min-Max scaling.

---

# Installation

## Clone Repository

```bash
git clone https://github.com/gngscripter/Insider_threat_detection.git
cd Insider_threat_detection
```

---

## Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

#### macOS/Linux

```bash
source venv/bin/activate
```

#### Windows

```bash
venv\Scripts\activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

# Running the Project

## Run Complete Detection Pipeline

```bash
python main.py
```

The pipeline performs:

1. Data ingestion
2. Feature engineering
3. Baseline UEBA training
4. Evasion simulation
5. Meta-feature extraction
6. Meta-detection training
7. Score fusion
8. Alert generation

---

# Running FastAPI Backend

```bash
uvicorn backend_api:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

---

# API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/alerts` | GET | Retrieve alerts |
| `/api/users/risk` | GET | User risk profiles |
| `/api/metrics` | GET | System metrics |
| `/api/analytics` | GET | Analytics dashboard data |
| `/api/load-detection-results` | POST | Upload model results |

Swagger Docs:

```text
http://127.0.0.1:8000/docs
```

---

# React SOC Dashboard

The React dashboard provides:

- Live alert monitoring
- Risk distribution charts
- User risk ranking
- Threat simulation controls
- Analytics visualizations
- Risk score timelines

Risk levels are colour-coded:

| Risk Level | Colour |
|---|---|
| CRITICAL | Red |
| HIGH | Orange |
| MEDIUM | Yellow |
| LOW | Green |

---

# Performance Results

## Baseline UEBA Performance

| Metric | Value |
|---|---|
| Precision | 0.417 |
| Recall | 0.173 |
| F1-Score | 0.245 |
| ROC-AUC | 0.969 |

## Final Fused System Performance

| Metric | Value |
|---|---|
| Precision | 0.340 |
| Recall | 0.775 |
| F1-Score | 0.473 |
| ROC-AUC | 0.942 |

The fused system significantly improves recall against adversarial insider behaviour.

---

# Dashboard Features

## Overview

- Total alerts
- Critical alerts
- Detection accuracy
- Risk distribution

## Alerts

- Filterable alert feed
- Severity classification
- Baseline/meta/fused scores

## Users

- User risk profiles
- Risk trends
- Top risky users

## Analytics

- ROC-AUC metrics
- Alert timelines
- Performance comparison

---

# Current Limitations

- Uses synthetic CERT-like dataset
- Batch processing only
- No real-time SIEM integration
- High computation cost for meta-features
- Limited to behavioural logs only

---

# Future Enhancements

- Real CERT dataset integration
- Reinforcement learning-based adversarial simulation
- SHAP/LIME explainability
- Graph Neural Networks
- Kafka/Flink real-time streaming
- Automated SOAR response integration

---

# Authors

- Akshat Chhetri
- Deveshi Nautiyal
- Manan Marwah

School of Computer Science  
University of Petroleum & Energy Studies (UPES)  
Dehradun, Uttarakhand

---

# Academic Information

Bachelor of Technology  
Computer Science & Engineering  
Specialization: Cybersecurity & Forensics

Project Guide:
Dr. Himanshu

Submitted: May 2026

---

# License

This project is intended for academic and research purposes only.

---

# References

- CERT Insider Threat Dataset
- FastAPI Documentation
- React Documentation
- Isolation Forest Research Paper
- Insider Threat Detection Literature
