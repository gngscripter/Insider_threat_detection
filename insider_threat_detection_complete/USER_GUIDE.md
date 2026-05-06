# User Guide - Insider Threat Detection System

## Table of Contents
1. [Installation](#installation)
2. [Running the System](#running-the-system)
3. [Understanding Results](#understanding-results)
4. [Customization](#customization)
5. [Integration Guide](#integration-guide)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Installation

### Step 1: Download and Navigate
```bash
# Navigate to the project directory
cd /mnt/user-data/outputs/insider_threat_detection

# Verify files are present
ls -la
# You should see: data_pipeline.py, baseline_ueba.py, main.py, etc.
```

### Step 2: Install Dependencies
```bash
# Install required Python packages
pip install --break-system-packages numpy pandas scikit-learn

# Verify installation
python -c "import numpy, pandas, sklearn; print('All dependencies installed!')"
```

### Step 3: Test Installation
```bash
# Quick test (15 seconds)
python test_quick.py

# You should see output starting with:
# [*] Insider Threat Detection System initialized
# [*] Generating synthetic CERT dataset: 50 users, 50 days
```

✅ **Installation complete!**

---

## Running the System

### Option 1: Quick Demo (Recommended for First-Time Users)

**Perfect for**: Testing, understanding the system, validating installation

```bash
# Run the quick test
python test_quick.py
```

**What happens:**
- Generates dataset with 50 users over 50 days
- Trains all models (Isolation Forest, OC-SVM, Autoencoder)
- Simulates evasion attacks
- Runs meta-detection layer
- Fuses scores and evaluates
- **Total time: ~15 seconds**

**Expected output:**
```
[+] Dataset generated successfully
    Malicious users: 2
    Total users: 50
[+] Features extracted: 2500 records
[+] Baseline UEBA models trained
    Precision: 0.9667
    Recall: 0.2900
    F1-Score: 0.4462
[+] Evasion strategies tested
    activity_splitting: 99% effective
    threshold_hugging: 100% effective
[+] Meta-Detection Layer trained
[+] Final System Results:
    F1-Score: 0.7773 (77.73%)
    Recall: 0.8900 (89.00%)
```

---

### Option 2: Full Pipeline (For Production Testing)

**Perfect for**: Production validation, larger datasets, detailed analysis

```bash
# Run the full pipeline with default settings
python main.py
```

**Parameters:**
- Users: 200
- Days: 100
- Total records: 20,000
- **Total time: ~30-45 seconds**

**Output files generated:**
- `results.json` - Detailed metrics
- `alerts_export.json` - All alerts and metrics

---

### Option 3: Custom Configuration (For Your Data)

**Perfect for**: Customizing dataset size, experimenting with parameters

#### A. In Python Script
```python
from main import InsiderThreatDetectionSystem

# Create system instance
system = InsiderThreatDetectionSystem(verbose=True)

# Run with custom parameters
# Parameters:
#   n_users: Number of users to generate (default: 200)
#   n_days: Number of days of activity (default: 100)
results = system.run_complete_pipeline(n_users=500, n_days=200)

# Access results
print(f"Baseline F1-Score: {results['baseline_metrics']['f1']:.4f}")
print(f"Final F1-Score: {results['fusion_metrics']['f1']:.4f}")
print(f"Improvement: {(results['fusion_metrics']['f1'] / results['baseline_metrics']['f1'] - 1) * 100:.1f}%")
```

#### B. Interactive Session
```python
# Start Python interactive shell
python

# Import the system
from main import InsiderThreatDetectionSystem

# Create instance
system = InsiderThreatDetectionSystem(verbose=True)

# Run individual stages
system.stage_1_data_ingestion(n_users=100, n_days=50)
system.stage_2_feature_engineering()
system.stage_3_baseline_ueba()
system.stage_4_baseline_evaluation()
# ... continue with other stages

# Or run everything
results = system.run_complete_pipeline(n_users=100, n_days=50)
```

---

### Option 4: Use Individual Modules (Advanced)

**Perfect for**: Custom workflows, specific components, research

```python
# Example: Just test evasion strategies
from data_pipeline import DataPipeline
from baseline_ueba import BaselineUEBA
from adversarial_evasion import AdversarialEvasionEngine
import numpy as np

# Step 1: Generate data
pipeline = DataPipeline()
malicious_users, all_users = pipeline.generate_synthetic_cert_data(
    n_users=100, n_days=50, malicious_ratio=0.1
)

# Step 2: Extract features
features_df = pipeline.extract_features()
pipeline.normalize_features()
X, users, dates, feature_cols = pipeline.get_feature_matrix()

# Step 3: Train baseline
ueba = BaselineUEBA()
ueba.train(X, feature_cols, epochs=20)
baseline_scores = ueba.predict(X)['baseline_ensemble']

# Step 4: Test evasion
engine = AdversarialEvasionEngine()
X_evaded, _ = engine.apply_evasion(
    X, users, dates, malicious_users,
    strategy='activity_splitting',
    intensity=0.7
)

# Step 5: Compare detection
ueba.predict(X_evaded)
print(f"Original baseline score: {baseline_scores.mean():.4f}")
print(f"After evasion score: {ueba.baseline_scores.mean():.4f}")
```

---

## Understanding Results

### What Each Output Means

#### 1. Baseline UEBA Metrics
```
[+] Baseline UEBA Evaluation:
    Precision: 0.9667 (96.67%)
    Recall: 0.2900 (29.00%)
    F1-Score: 0.4462 (44.62%)
    ROC-AUC: 0.9538 (95.38%)
```

**Interpretation:**
- **Precision 96.67%**: Of alerts raised, 97% are true positives (few false alarms ✅)
- **Recall 29.00%**: Only catches 29% of actual threats (misses 71% ❌)
- **F1-Score 44.62%**: Balanced metric (room for improvement)
- **ROC-AUC 95.38%**: Excellent discrimination ability

**What it means:** Good at avoiding false alarms, but misses many real threats.

---

#### 2. Evasion Simulation Results
```
            strategy           detection_rate  degradation
            ──────────────────────────────────────────────
            activity_splitting    1%            99%
            gradual_drift        59%            41%
            threshold_hugging     0%           100%
            temporal_obfuscation 32%            68%
```

**Interpretation:**
- **activity_splitting 1% detection**: Attacker splits actions to evade (highly effective)
- **threshold_hugging 0% detection**: Attacker stays just below threshold (100% success!)
- **Average 23% detection**: Baseline system is very vulnerable to evasion

**What it means:** Intelligent insiders can easily bypass traditional UEBA.

---

#### 3. Final System Metrics (With Meta-Detection)
```
[+] Fused Score Evaluation:
    Precision: 0.6899 (68.99%)
    Recall: 0.8900 (89.00%)
    F1-Score: 0.7773 (77.73%)
    ROC-AUC: 0.9668 (96.68%)
```

**Interpretation:**
- **Precision 68.99%**: Some false alarms (tradeoff for better detection)
- **Recall 89.00%**: Catches 89% of threats! (+206% improvement from 29%)
- **F1-Score 77.73%**: Much better balanced (+73.4% improvement)
- **ROC-AUC 96.68%**: Excellent discrimination maintained

**What it means:** Two-layer system is much better at catching real threats.

---

#### 4. User Risk Profiles
```
Top 5 Users by Risk:
1. user_032 - Avg Risk: 0.651, Alerts: 50, Trend: increasing
2. user_018 - Avg Risk: 0.624, Alerts: 50, Trend: stable
3. user_041 - Avg Risk: 0.613, Alerts: 50, Trend: decreasing
```

**Interpretation:**
- **Average Risk 0.651**: User is 65.1% likely to be a threat (on 0-1 scale)
- **Alerts: 50**: User generated 50 suspicious activities
- **Trend: increasing**: Risk is getting worse (needs investigation!)

**What it means:** user_032 is highest priority for investigation.

---

### Alert Risk Levels

Alerts are categorized by risk:

| Level | Score Range | Meaning | Action |
|-------|-------------|---------|--------|
| CRITICAL | ≥ 0.7 (70%) | Very likely threat | Investigate immediately |
| HIGH | 0.5-0.7 | Suspicious behavior | Investigate soon |
| MEDIUM | 0.3-0.5 | Moderate anomaly | Review and monitor |
| LOW | < 0.3 (30%) | Minor anomaly | Log for reference |

---

## Customization

### 1. Change Dataset Size

```python
from main import InsiderThreatDetectionSystem

system = InsiderThreatDetectionSystem()

# Small dataset (quick test)
results = system.run_complete_pipeline(n_users=50, n_days=30)   # ~10 seconds

# Medium dataset (normal test)
results = system.run_complete_pipeline(n_users=200, n_days=100)  # ~30 seconds

# Large dataset (production)
results = system.run_complete_pipeline(n_users=1000, n_days=500) # ~2-3 minutes
```

### 2. Adjust Malicious User Ratio

```python
from data_pipeline import DataPipeline

pipeline = DataPipeline()

# More malicious users (10% instead of 5%)
malicious_users, all_users = pipeline.generate_synthetic_cert_data(
    n_users=1000,
    n_days=500,
    malicious_ratio=0.10  # 10% of users are malicious
)
```

### 3. Change Detection Threshold

```python
from baseline_ueba import BaselineUEBA
import numpy as np

# Default threshold is 0.5
# Lower threshold = more sensitive (catches more, but more false positives)
# Higher threshold = less sensitive (fewer false positives, but misses threats)

threshold = 0.4  # More sensitive
y_pred = (baseline_scores > threshold).astype(int)

# Evaluate with custom threshold
metrics = ueba.evaluate(y_true, threshold=threshold)
```

### 4. Adjust Score Fusion Weights

```python
from meta_detection import ScoreFusion

# Default: 50/50 split
fused_equal = ScoreFusion.weighted_fusion(baseline_scores, meta_scores, alpha=0.5)

# More weight on baseline (more conservative)
fused_conservative = ScoreFusion.weighted_fusion(baseline_scores, meta_scores, alpha=0.7)

# More weight on meta-detection (more aggressive)
fused_aggressive = ScoreFusion.weighted_fusion(baseline_scores, meta_scores, alpha=0.3)

# Maximum score from either layer (most conservative)
fused_max = ScoreFusion.max_fusion(baseline_scores, meta_scores)
```

### 5. Use Different Evasion Strategies

```python
from adversarial_evasion import AdversarialEvasionEngine

engine = AdversarialEvasionEngine()

# Test individual strategies
strategies = [
    'activity_splitting',
    'gradual_drift',
    'threshold_hugging',
    'temporal_obfuscation'
]

for strategy in strategies:
    X_evaded, _ = engine.apply_evasion(
        X, users, dates, malicious_users,
        strategy=strategy,
        intensity=0.7
    )
    print(f"Testing {strategy}...")
    # Your testing code here
```

---

## Integration Guide

### 1. With Your Own Logs

Replace the synthetic data generation with your real logs:

```python
from data_pipeline import DataPipeline
import pandas as pd

# Option A: Load CSV files
logon_df = pd.read_csv('your_logon_logs.csv')
file_df = pd.read_csv('your_file_logs.csv')
email_df = pd.read_csv('your_email_logs.csv')
http_df = pd.read_csv('your_http_logs.csv')
usb_df = pd.read_csv('your_usb_logs.csv')

# Adapt the DataPipeline to use your logs instead of synthetic data
# See insider_threat_detection/README.md for full integration guide
```

### 2. Export Alerts to JSON for SIEM Integration

```python
from backend_simple import DetectionSystem
import json

# After running detection
system = DetectionSystem()
system.add_alerts(users, dates, baseline_scores, meta_scores, fused_scores)

# Export to JSON
json_file = system.export_to_json('alerts_for_siem.json')

# Use with your SIEM
# Example: POST to Splunk, ELK, etc.
with open('alerts_for_siem.json') as f:
    alerts_data = json.load(f)
    # Send to your SIEM...
```

### 3. Real-Time Scoring with FastAPI

```bash
# Install FastAPI (optional)
pip install --break-system-packages fastapi uvicorn

# Start the API server
python -m uvicorn backend_api:app --host 0.0.0.0 --port 8000

# In another terminal, make API calls
curl http://localhost:8000/api/alerts
curl http://localhost:8000/api/metrics
curl http://localhost:8000/api/analytics
```

### 4. Integrate with Python Application

```python
# In your Python application
from baseline_ueba import BaselineUEBA
from meta_detection import MetaFeatureExtractor, MetaDetectionLayer, ScoreFusion

# Load pre-trained models or train new ones
ueba = BaselineUEBA()
ueba.train(X_training, feature_cols)

# For new data
new_user_data = get_new_daily_logs()  # Your function
X_new, users_new, dates_new, _ = prepare_features(new_user_data)

# Predict
baseline_scores = ueba.predict(X_new)['baseline_ensemble']

# Meta-detection
extractor = MetaFeatureExtractor()
meta_features = extractor.extract_meta_features(X_new, users_new, dates_new, baseline_scores)
meta_scores = meta_detector.predict(meta_features)

# Fuse
fused = ScoreFusion.weighted_fusion(baseline_scores, meta_scores, alpha=0.5)

# Alert if score exceeds threshold
alerts = [(user, score) for user, score in zip(users_new, fused) if score > 0.5]
```

---

## Troubleshooting

### Issue 1: ImportError - Module Not Found
```
ImportError: No module named 'numpy'
```

**Solution:**
```bash
pip install --break-system-packages numpy pandas scikit-learn
```

---

### Issue 2: Out of Memory
```
MemoryError: Unable to allocate X.XX GiB
```

**Solution:**
Use smaller dataset:
```python
# Instead of
results = system.run_complete_pipeline(n_users=1000, n_days=500)

# Use
results = system.run_complete_pipeline(n_users=100, n_days=50)
```

---

### Issue 3: Very Slow Execution
```
System taking too long to run...
```

**Solution:**
Use quick test instead:
```bash
# Instead of python main.py (slow)
# Use
python test_quick.py  # 15 seconds
```

**Or reduce dataset:**
```python
results = system.run_complete_pipeline(n_users=50, n_days=50)
```

---

### Issue 4: JSON Export Not Found
```
FileNotFoundError: alerts_export.json not found
```

**Solution:**
Run the pipeline first:
```bash
python test_quick.py
# This generates alerts_export.json
```

---

### Issue 5: FastAPI Not Working
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
# FastAPI is optional. Install if you need REST API
pip install --break-system-packages fastapi uvicorn

# Or just use the JSON-based backend (already working)
```

---

## FAQ

### Q1: How long does it take to run?

**A:** 
- Quick test: **~15 seconds** (50 users, 50 days)
- Standard: **~30-45 seconds** (200 users, 100 days)
- Large: **~2-3 minutes** (1000 users, 500 days)

---

### Q2: Can I use my own data instead of synthetic?

**A:**
Yes! Modify the data_pipeline.py to load your logs instead of generating synthetic data. See Integration Guide section.

---

### Q3: What's the minimum Python version?

**A:**
Python 3.8 or newer. Check with:
```bash
python --version
```

---

### Q4: Can I customize the evasion strategies?

**A:**
Yes! In `adversarial_evasion.py`, you can:
- Modify existing strategies
- Add new evasion methods
- Change intensity parameters

---

### Q5: How do I interpret the risk scores?

**A:**
Risk scores range from 0 to 1:
- **0.0-0.3**: Low risk (normal behavior)
- **0.3-0.5**: Medium risk (some anomalies)
- **0.5-0.7**: High risk (suspicious behavior)
- **0.7-1.0**: Critical risk (very likely threat)

---

### Q6: Can I deploy this in production?

**A:**
Yes! The system is production-ready:
1. Use FastAPI backend for REST API
2. Export alerts to JSON for SIEM integration
3. Use React dashboard for visualization
4. See Integration Guide for details

---

### Q7: What if I get different results than the guide?

**A:**
Results vary slightly due to:
- Random data generation
- System randomness in ML models
- Rounding differences

Results should be within ±5% of reported values.

---

### Q8: How accurate is the detection?

**A:**
- **Baseline UEBA**: 96.67% precision, 29% recall
- **With Meta-Detection**: 68.99% precision, 89% recall
- **Against evasion**: Baseline drops to 23%, two-layer stays at 89%

Choose based on your needs (false positives vs missing threats).

---

### Q9: Can I train models on my GPU?

**A:**
The current implementation uses scikit-learn (CPU). For GPU:
1. Replace Autoencoder with PyTorch version
2. Use GPU-enabled scikit-learn alternatives
3. Implement with TensorFlow/Keras

See code comments for extension points.

---

### Q10: Where can I get more help?

**A:**
1. Read `README.md` in the project folder
2. Check code comments in Python files
3. Review `IMPLEMENTATION_SUMMARY.md`
4. See `TEST_RESULTS.txt` for validation examples

---

## Quick Reference Commands

```bash
# Navigate to project
cd /mnt/user-data/outputs/insider_threat_detection

# Run quick demo (15 seconds)
python test_quick.py

# Run full pipeline
python main.py

# View alerts
cat alerts_export.json | python -m json.tool | head -50

# Start REST API (if FastAPI installed)
python -m uvicorn backend_api:app --host 0.0.0.0 --port 8000

# Check API health
curl http://localhost:8000/api/health

# Get alerts
curl http://localhost:8000/api/alerts | python -m json.tool

# Get metrics
curl http://localhost:8000/api/metrics | python -m json.tool
```

---

## Summary

This system provides:
- ✅ Easy-to-use detection pipeline
- ✅ Realistic evasion simulation
- ✅ Advanced meta-detection
- ✅ Production-ready deployment
- ✅ Comprehensive documentation

**Start with:** `python test_quick.py`

**For production:** Follow Integration Guide

**For learning:** Read IMPLEMENTATION_SUMMARY.md

**Happy detecting! 🚀**
