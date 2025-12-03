# 🐙 Git Workflow

**Strategy:** Feature Branches. No direct commits to `main`.

### 1. Start New Task

```bash
# Sync main
git checkout main
git pull origin main

# Create branch (naming: feature/task-name)
git checkout -b feature/backend-zod-schema
```

### 2\. Dev Loop

Code... Save... Test.

```bash
# Check status
git status

# Stage & Commit
git add .
git commit -m "[BE] Work in progress..."
```

### 3\. Sync with Main (Pre-Push)

**Do this often to avoid huge conflicts.**

```bash
# 1. Save current changes first!
git add .
git commit -m "Save before sync"

# 2. Update local main
git checkout main
git pull

# 3. Merge main into your branch
git checkout -  # Shortcut to go back to previous branch
git merge main

# 4. IF CONFLICTS:
# - Fix files in VS Code
# - git add .
# - git commit -m "Resolve conflicts"
```

### 4\. Push & PR

```bash
# Push
git push -u origin feature/backend-zod-schema
```

1.  Go to GitHub.
2.  Click **Compare & Pull Request**.
3.  Review changes.
4.  **Squash and Merge**.

### 5\. Cleanup

After merge:

```bash
git checkout main
git pull
git branch -d feature/backend-zod-schema
```
