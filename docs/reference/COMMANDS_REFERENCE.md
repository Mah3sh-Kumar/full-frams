# FRAMS - Quick Commands Reference

## 🚀 Setup Commands

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd FRAMS-Project

# Setup Face_Reco
cd Face_Reco
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials

# Setup FRAMS
cd ../FRAMS
npm install
cp .env.example .env
# Edit .env with your credentials
```

---

## 🏃 Run Commands

### Face_Reco (Desktop App)

```bash
# Activate virtual environment
cd Face_Reco
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Run application
python main.py

# Run with debug mode
DEBUG_MODE=True python main.py

# Test database connection
python -c "from database.client import SupabaseClient; SupabaseClient()"

# Verify BSc CS subjects
python database/migrations/verify_bsc_cs_subjects.py
```

### FRAMS (Mobile App)

```bash
cd FRAMS

# Start development server
npx expo start

# Start with cache clear
npx expo start -c

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Run on web
npx expo start --web
```

---

## 🧪 Testing Commands

### Face_Reco Tests

```bash
cd Face_Reco

# Run all tests
pytest tests/

# Run specific test
pytest tests/test_integration_student_registration_flow.py

# Run with verbose output
pytest -v tests/

# Run with coverage
pytest --cov=. tests/
```

### FRAMS Tests

```bash
cd FRAMS

# Run all tests
npm test

# Run specific test
npm test -- AttendanceScreen

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## 🗄️ Database Commands

### Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Pull remote changes
supabase db pull

# Reset database (CAUTION!)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

### Direct SQL Queries

```bash
# Via Supabase CLI
supabase db query "SELECT * FROM users LIMIT 5;"

# Via Python
cd Face_Reco
python -c "
from database.client import SupabaseClient
client = SupabaseClient()
result = client.client.table('users').select('*').limit(5).execute()
print(result.data)
"
```

---

## 🧹 Cleanup Commands

### Clean Caches

```bash
# Clean Python caches
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Clean Node caches
cd FRAMS
rm -rf node_modules package-lock.json
npm install

# Clean Expo cache
cd FRAMS
rm -rf .expo
npx expo start -c
```

### Run Cleanup Script

```bash
# Run automated cleanup
python cleanup_codebase.py

# Dry run (see what will be removed)
# Edit cleanup_codebase.py and set dry_run=True
```

---

## 📦 Build Commands

### Face_Reco (Desktop)

```bash
cd Face_Reco

# Install PyInstaller
pip install pyinstaller

# Build executable
pyinstaller --onefile --windowed main.py

# Build with icon
pyinstaller --onefile --windowed --icon=icon.ico main.py

# Output in dist/ folder
```

### FRAMS (Mobile)

```bash
cd FRAMS

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for both
eas build --platform all

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 🔧 Development Commands

### Face_Reco

```bash
cd Face_Reco

# Install new package
pip install package-name
pip freeze > requirements.txt

# Update all packages
pip install --upgrade -r requirements.txt

# Check for outdated packages
pip list --outdated

# Format code
black .

# Lint code
pylint **/*.py
```

### FRAMS

```bash
cd FRAMS

# Install new package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update packages
npm update

# Check for outdated packages
npm outdated

# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

---

## 📊 Monitoring Commands

### Check Application Status

```bash
# Check Face_Reco process
ps aux | grep python | grep main.py

# Check Expo process
ps aux | grep expo

# Check ports
netstat -ano | findstr :19000  # Expo default port
netstat -ano | findstr :8081   # Metro bundler
```

### View Logs

```bash
# Face_Reco logs
cd Face_Reco
tail -f logs/app.log

# Expo logs
cd FRAMS
npx expo start
# Press 'j' to open debugger
```

---

## 🔐 Security Commands

### Check for Secrets

```bash
# Check for exposed secrets
git secrets --scan

# Check for .env files in git
git ls-files | grep .env

# Remove .env from git history (if accidentally committed)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

### Update Dependencies

```bash
# Check for security vulnerabilities (Python)
cd Face_Reco
pip install safety
safety check

# Check for security vulnerabilities (Node)
cd FRAMS
npm audit
npm audit fix
```

---

## 📝 Git Commands

### Basic Workflow

```bash
# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Your message"

# Push
git push origin main

# Pull
git pull origin main
```

### Branching

```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# Merge branch
git merge feature/new-feature

# Delete branch
git branch -d feature/new-feature
```

### Tagging

```bash
# Create tag
git tag -a v1.0.0 -m "Version 1.0.0"

# Push tag
git push origin v1.0.0

# List tags
git tag

# Delete tag
git tag -d v1.0.0
```

### Archive

```bash
# Create submission archive
git archive -o FRAMS-Submission.zip HEAD

# Create archive of specific branch
git archive -o FRAMS-v1.0.0.zip v1.0.0

# Create archive with prefix
git archive --prefix=FRAMS/ -o FRAMS.zip HEAD
```

---

## 🐛 Debugging Commands

### Face_Reco

```bash
cd Face_Reco

# Run with Python debugger
python -m pdb main.py

# Check imports
python -c "import mediapipe; print(mediapipe.__version__)"
python -c "import cv2; print(cv2.__version__)"

# Test camera
python -c "import cv2; cap = cv2.VideoCapture(0); print('Camera OK' if cap.isOpened() else 'Camera Error')"
```

### FRAMS

```bash
cd FRAMS

# Check React Native environment
npx react-native doctor

# Check Expo environment
npx expo-doctor

# Clear Metro bundler cache
npx react-native start --reset-cache

# Check TypeScript
npx tsc --noEmit
```

---

## 📱 Device Commands

### Android

```bash
# List connected devices
adb devices

# Install APK
adb install app.apk

# View logs
adb logcat

# Clear app data
adb shell pm clear com.yourapp.package
```

### iOS

```bash
# List simulators
xcrun simctl list devices

# Boot simulator
xcrun simctl boot "iPhone 14"

# Install app
xcrun simctl install booted app.app
```

---

## 🔄 Reset Commands

### Complete Reset

```bash
# Reset Face_Reco
cd Face_Reco
rm -rf venv __pycache__
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Reset FRAMS
cd FRAMS
rm -rf node_modules .expo package-lock.json
npm install
npx expo start -c
```

---

## 📚 Documentation Commands

### Generate Docs

```bash
# Python docs
cd Face_Reco
pip install pdoc3
pdoc --html --output-dir docs .

# TypeScript docs
cd FRAMS
npm install -g typedoc
typedoc --out docs src/
```

---

## ⚡ Quick Shortcuts

```bash
# One-line setup Face_Reco
cd Face_Reco && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt

# One-line setup FRAMS
cd FRAMS && npm install && npx expo start

# One-line cleanup
python cleanup_codebase.py

# One-line submission
git add . && git commit -m "Final submission" && git tag v1.0.0 && git archive -o FRAMS.zip HEAD
```

---

## 💡 Useful Aliases

Add to your shell profile (.bashrc, .zshrc, etc.):

```bash
# Face_Reco aliases
alias fr-activate='cd Face_Reco && source venv/bin/activate'
alias fr-run='cd Face_Reco && source venv/bin/activate && python main.py'
alias fr-test='cd Face_Reco && source venv/bin/activate && pytest tests/'

# FRAMS aliases
alias frams-run='cd FRAMS && npx expo start'
alias frams-clean='cd FRAMS && rm -rf node_modules .expo && npm install'
alias frams-test='cd FRAMS && npm test'

# Git aliases
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push'
```

---

**Save this file for quick reference during development! 📖**
