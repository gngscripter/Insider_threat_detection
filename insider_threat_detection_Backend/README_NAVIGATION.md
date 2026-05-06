# 📖 Documentation Navigation Guide

Welcome! This document helps you quickly navigate the Insider Threat Detection project documentation and find the right resources for your use case.

---

# 🎯 Choose Your Path

## Path 1: "I Just Want to Run It" ⚡
**Time needed:** 5 minutes

1. Read: `USER_GUIDE.md` → Installation section
2. Run: `python test_quick.py`
3. View results: `alerts_export.json`
4. Done! ✅

---

## Path 2: "I Want to Understand How It Works" 📚
**Time needed:** 30 minutes

1. Read: `USER_GUIDE.md`
2. Run: `python test_quick.py`
3. Read: `QUICK_START.md`
4. Read: `IMPLEMENTATION_SUMMARY.md`
5. Done! ✅

---

## Path 3: "I Need Full Technical Details" 🔧
**Time needed:** 1–2 hours

1. Read: `USER_GUIDE.md`
2. Read: `IMPLEMENTATION_SUMMARY.md`
3. Read: `insider_threat_detection/README.md`
4. Study Python source files
5. Review `TEST_RESULTS.txt`
6. Done! ✅

---

## Path 4: "I Want to Integrate with My System" 🔌
**Time needed:** 30 minutes + integration time

1. Read: `USER_GUIDE.md` → Integration Guide
2. Read: `USER_GUIDE.md` → Customization
3. Configure the system for your platform
4. Test with your own data
5. Deploy! ✅

---

## Path 5: "I Want to Validate the System" ✅
**Time needed:** 15 minutes

1. Read: `TEST_RESULTS.txt`
2. Run: `python test_quick.py`
3. Compare outputs with validation results
4. Run: `python main.py`
5. Validation complete! ✅

---

# 📑 Documentation by Topic

## Getting Started

- Start here → `USER_GUIDE.md`
- Quick reference → `QUICK_START.md`
- Navigation help → `README_NAVIGATION.md`

---

## Running the System

### Quick Demo
```bash
python test_quick.py
```

### Full Pipeline
```bash
python main.py
```

### Start REST API
```bash
python -m uvicorn backend_api:app --host 0.0.0.0 --port 8000
```

---

## Understanding Results

Read:
- `USER_GUIDE.md`
- `QUICK_START.md`
- `TEST_RESULTS.txt`

You will learn:
- Detection scores
- Alert severity
- Risk interpretation
- Meta-detection behaviour
- Fused risk scoring

---

## Customization

Customize:
- Dataset size
- Detection thresholds
- Evasion strategies
- Feature engineering
- Integration logic

See:
- `USER_GUIDE.md` → Customization section

---

## Integration

Supported integration approaches:

- JSON alert export
- REST API integration
- SIEM integration
- Python application integration

See:
- `USER_GUIDE.md` → Integration Guide

---

## Technical Deep-Dive

Read:
- `IMPLEMENTATION_SUMMARY.md`
- `README.md`
- Source code comments

Topics include:
- System architecture
- Detection pipeline
- Meta-detection logic
- Backend implementation
- Dashboard workflow

---

## Troubleshooting

See:
- `USER_GUIDE.md` → Troubleshooting
- `USER_GUIDE.md` → FAQ

Covers:
- Installation issues
- Dependency errors
- API problems
- Dataset issues
- Output validation

---

# 🗂️ Project File Structure

```text
Insider_threat_detection/

📄 DOCUMENTATION
├── README_NAVIGATION.md
├── USER_GUIDE.md
├── QUICK_START.md
├── IMPLEMENTATION_SUMMARY.md
└── TEST_RESULTS.txt

📁 PROJECT FOLDER
└── insider_threat_detection/
    ├── README.md
    ├── requirements.txt
    ├── test_quick.py
    ├── main.py
    ├── data_pipeline.py
    ├── baseline_ueba.py
    ├── adversarial_evasion.py
    ├── meta_detection.py
    ├── backend_simple.py
    ├── backend_api.py
    ├── react_dashboard.jsx
    └── alerts_export.json
```

---

# ⏱️ Time Commitment Guide

| Task | Time |
|------|------|
| Installation | 2–5 minutes |
| Quick test | 15–30 seconds |
| Full pipeline | ~30 seconds |
| Learn architecture | 30 minutes |
| Customization | 15–30 minutes |
| Integration | Depends on platform |

---

# 🚀 Quick Commands Reference

## Navigate to Project

```bash
cd insider_threat_detection
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Run Quick Demo

```bash
python test_quick.py
```

---

## Run Full Detection Pipeline

```bash
python main.py
```

---

## View Alerts

```bash
cat alerts_export.json
```

---

## Start REST API

```bash
python -m uvicorn backend_api:app --host 0.0.0.0 --port 8000
```

---

## Access Swagger API Docs

```text
http://localhost:8000/docs
```

---

# 📋 Pre-Run Checklist

Before running the system:

- [ ] Installed Python 3.8+
- [ ] Installed required dependencies
- [ ] Read installation guide
- [ ] Verified project directory
- [ ] Ran quick test successfully

---

# 📋 Before Using Your Own Data

- [ ] Read customization guide
- [ ] Understand expected data format
- [ ] Modify `data_pipeline.py` if required
- [ ] Test using sample dataset first

---

# 📋 Before Deployment

- [ ] Read implementation summary
- [ ] Tested complete pipeline
- [ ] Validated outputs
- [ ] Reviewed API integration guide
- [ ] Planned deployment strategy

---

# 🎯 Document Purpose Summary

| Document | Purpose |
|----------|----------|
| `USER_GUIDE.md` | Installation and usage |
| `QUICK_START.md` | Quick reference |
| `IMPLEMENTATION_SUMMARY.md` | Technical architecture |
| `TEST_RESULTS.txt` | Validation and testing |
| `README.md` | Full project documentation |
| `README_NAVIGATION.md` | Documentation navigation |

---

# 🆘 Help Finder

## I don't know where to start
→ Read `USER_GUIDE.md`

## I want to understand the results
→ Read `QUICK_START.md`

## The system isn't working
→ Read `USER_GUIDE.md` → Troubleshooting

## I want to integrate with my platform
→ Read `USER_GUIDE.md` → Integration Guide

## I need technical details
→ Read `IMPLEMENTATION_SUMMARY.md`

## I want to validate outputs
→ Read `TEST_RESULTS.txt`

---

# 📞 Support Resources

## Installation Issues
- `USER_GUIDE.md` → Installation
- `USER_GUIDE.md` → Troubleshooting

## Unexpected Results
- `USER_GUIDE.md` → Understanding Results
- `TEST_RESULTS.txt`

## Customization
- `USER_GUIDE.md` → Customization
- Source code comments

## API Integration
- `README.md`
- `backend_api.py`

---

# ✅ Success Checklist

After following the documentation, you should be able to:

- ✅ Install the project successfully
- ✅ Run the detection pipeline
- ✅ Understand generated alerts
- ✅ Customize detection behaviour
- ✅ Integrate the backend API
- ✅ Use the dashboard
- ✅ Troubleshoot common issues

---

# 🎓 Learning Outcomes

After exploring the documentation and source code, you will understand:

- Insider threat detection concepts
- Adversarial evasion techniques
- UEBA-based anomaly detection
- Meta-detection strategies
- Risk score fusion
- API integration workflow
- Dashboard visualization concepts

---

# 🚀 Next Steps

1. Choose the path that matches your goal
2. Follow the recommended reading order
3. Run the quick demo
4. Explore the full pipeline
5. Customize the system for your needs

---

# 📝 Document Information

- **Project Type:** Academic Cybersecurity Project
- **Focus Area:** Insider Threat Detection
- **Technology Stack:** Python, FastAPI, React, Scikit-learn
- **Status:** Functional academic implementation

---

**Ready to begin? Start with `USER_GUIDE.md` and run `python test_quick.py` 🚀**
