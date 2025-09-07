# Skip-Worktree

## 1. Ignora le modifiche locali del file

git update-index --skip-worktree .gitignore

---

## 2. Ripristina

git update-index --no-skip-worktree .gitignore

---

## 3. Controlla quali file hanno il flag skip-worktree

git ls-files -v | findstr "^S"

PS C:\Users\andre\Desktop\And\Coding\script-testing> git ls-files -v | findstr "^S"
S .gitignore
