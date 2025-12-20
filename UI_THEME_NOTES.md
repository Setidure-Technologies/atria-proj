# UI Theme Notes: Atria University Branding

## Theme Assets Location

### Logo
- **Candidate Portal:** `/public/atria-logo.jpg`
- **Admin Portal:** `/public/atria-logo.jpg`

### CSS Theme Files
- **Candidate:** `Strenght-360/src/index.css`
- **Admin:** `Beyonders-360-main/src/index.css`

---

## Color Palette

### Candidate Portal
| Token | Hex | Usage |
|-------|-----|-------|
| `--atria-primary` | `#3B4DC9` | Buttons, links, active states |
| `--atria-primary-dark` | `#2E3DA1` | Hover states |
| `--atria-accent` | `#00C853` | Success, completed states |
| `--atria-bg` | `#F8FAFC` / `slate-50` | Page backgrounds |

### Admin Portal
| Token | Hex | Usage |
|-------|-----|-------|
| `--admin-primary` | `#EA580C` | Orange theme maintained |
| Background | `orange-50` to `orange-100` | Login gradient |

---

## Updated Components

### Candidate Portal
| Component | Status |
|-----------|--------|
| `Login.tsx` | ✅ Logo + blue theme |
| `Signup.tsx` | ✅ Logo + blue/green steps |
| `Dashboard.tsx` | ✅ Logo header |
| `Profile.tsx` | ✅ Logo header |
| `Results.tsx` | ✅ Logo + branded completion |

### Admin Portal
| Component | Status |
|-----------|--------|
| `AdminApp.tsx (LoginPage)` | ✅ Logo + orange theme |
| `AdminApp.tsx (Header)` | ✅ Logo + "Admin Portal" |

---

## Logo Usage Guidelines

```tsx
<img
  src="/atria-logo.jpg"
  alt="Atria University"
  className="h-10 md:h-12 w-auto"
/>
```

| Context | Height |
|---------|--------|
| Auth pages (login/signup) | `h-16` to `h-20` |
| Internal page headers | `h-10` to `h-12` |
| Compact (test runner) | `h-8` |

---

## Verification Checklist
- [x] Admin login shows Atria logo
- [x] Admin dashboard shows logo in header
- [x] Candidate login shows logo
- [x] Candidate signup shows logo
- [x] Candidate dashboard shows logo
- [x] Profile page shows logo
- [x] Results/completion page shows logo
