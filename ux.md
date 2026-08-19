UX :


# USER EXPERIENCE: The "Event-Driven" Interface

## Core UX Principle: Show the Event, Not the Data

**The Biophysical Flow Mapper is NOT a data visualization tool.**

It is a **causal visualization tool**—it shows what happens WHEN something changes.

| Traditional Approach | This Approach |
|----------------------|----------------|
| "Here are all the nodes and edges" | "Here's what happened when X changed" |
| User must explore to find meaning | User sees the meaning immediately |
| Requires biological expertise | Usable by anyone who understands the question |
| Static knowledge representation | Dynamic problem-solving tool |

**The Interface Speaks for Itself:**

> **"I'm a doctor. I have a patient with low Vitamin D. Show me what that means."**

The app answers that question *instantly*.

---

## 1. Visual Hierarchy: 3-Second Rule

**Within 3 seconds of opening the app, the user must understand:**

1. **What is the primary variable?** (The slider shows it clearly)
2. **What is its current state?** (Color coding shows it instantly)
3. **What is happening downstream?** (The cascade reveals itself)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  THE 3-SECOND UNDERSTANDING                                                │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  [1] WHAT VARIABLE?   25(OH)D                              30 ng/mL │  │
│  │                                                                      │  │
│  │  [2] STATE?           ⚠️ BORDERLINE (Normal: 30-100)                │  │
│  │                                                                      │  │
│  │  [3] CASCADE?         ⚠️ Kidney activation reduced                   │  │
│  │                       🔴 Bone resorption increasing                  │  │
│  │                       ⚠️ Immune function decreasing                  │  │
│  │                       ✅ Cardiovascular: OK                          │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  👆 The user SEES the problem, doesn't have to FIND it.                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Main View: Visual Diagnostic Dashboard

### Top Bar: Context & Control

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🩺 BIOPHYSICAL FLOW MAPPER                              [Tutorial] [Help] │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Pathway: [Vitamin D ▾]     👤 Patient: [Default ▾]             │  │
│  │                                                                      │  │
│  │  📊 25(OH)D Level: [══════════●═════════════════]  30 ng/mL         │  │
│  │                   0             30             100           150     │  │
│  │                   ⚠️ Borderline   Normal Range   High               │  │
│  │                                                                      │  │
│  │  🎯 Clinical Summary:                                               │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │  Mild deficiency. 3 systems affected. Low urgency.           │  │  │
│  │  │  Recommendation: Supplement 1000-2000 IU/day.               │  │  │
│  │  │  Recheck in 3 months.                                       │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why this works:**
- The user sees the **problem** (low D) before they see the **graph**
- The **clinical summary** gives immediate actionable insight
- The **slider** is the primary interaction—simple, intuitive, direct

---

### The Graph: Cascade Visualization

Each layer is a **horizontal strip** that shows the status of nodes in that layer.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  THE CASCADE VIEW                                                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 1: INPUT & ABSORPTION                                        │  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                           │  │
│  │  │ ☀️    │──│ 🍖   │──│ 🧬   │──│ ⚡   │  ✅ All OK              │  │
│  │  │ Sun  │  │ Diet │  │ Gut  │  │ Uptake│                           │  │
│  │  └──────┘  └──────┘  └──────┘  └──────┘                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   ⬇                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 2: TRANSPORT & STABILIZATION                                 │  │
│  │  ┌──────┐     ┌──────┐     ┌──────┐                               │  │
│  │  │ 🫁   │────▶│ 💉   │────▶│ 📦   │  ✅ OK (30 ng/mL)             │  │
│  │  │ Liver│     │ DBP  │     │Storage│                               │  │
│  │  └──────┘     └──────┘     └──────┘                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   ⬇                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 3: ACTIVATION & REGULATION  ⚠️ CRITICAL                     │  │
│  │  ┌──────┐     ┌──────┐     ┌──────┐                               │  │
│  │  │ 🫘   │────▶│ ⚡   │────▶│ 🔄  │  ⚠️ Reduced (27 pg/mL)        │  │
│  │  │Kidney│     │CYP27B1│    │1,25(OH)│                               │  │
│  │  └──────┘     └──────┘     └──────┘                               │  │
│  │  PTH: 65 pg/mL ↑  FGF23: 150 pg/mL  Ca: 8.4 mg/dL ⚠️             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   ⬇                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 4: TISSUE UTILIZATION  ⚠️ MULTIPLE SYSTEMS AFFECTED         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ 🦴 BONE │ │ 🧬 IMMUNE│ │ 🧠 BRAIN│ │ 🫀 HEART│ │ 🥗 GI    │ │  │
│  │  │ ⚠️      │ │ 🔴      │ │ ⚠️      │ │ ✅      │ │ ✅      │ │  │
│  │  │ Resorp↑ │ │ Infect↑ │ │ Serot↓  │ │ OK      │ │ OK      │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   ⬇                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 5: HOMEOSTASIS  ⚠️ COMPENSATING                              │  │
│  │  Ca: 8.4 mg/dL ⚠️  PTH: 65 pg/mL ↑  PO4: 3.2 mg/dL ✅              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   ⬇                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 6: REMODELING  ⚠️ EARLY CHANGES                              │  │
│  │  ALP: 110 U/L ↑  Osteocalcin: 25 ng/mL ↓  Cross-laps: ↑           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   ⬇                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 7: CLINICAL MANIFESTATIONS                                   │  │
│  │  ▲ Fatigue (moderate)  ▲ Bone pain (mild)  ▲ Infections (mild)    │  │
│  │  ▲ Muscle weakness (mild)  Dx: Osteopenia, Secondary HPT          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Interaction Patterns

**1. Scroll to Explore Layers**
- Each layer is a visual section
- Users scroll naturally to see the cascade flow
- No complex navigation required

**2. Click to Zoom Into Detail**
- Click any node → detail panel opens
- Shows: what it is, what affects it, what it affects, symptoms
- No need to remember complex navigation paths

**3. Hover for Quick Insight**
- Hover any node → tooltip shows:
  - Name and status
  - Quick summary
  - "Click for more"

**4. Drag to Adjust Slider**
- The primary interaction is the slider
- Moving it changes the ENTIRE view
- Immediate, direct feedback

---

## 3. The Detail Panel: Information On Demand

**Problem:** Too much information overwhelms. Too little is useless.

**Solution:** Progressive disclosure. Start with the 1-sentence summary. Expand on click.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DETAIL PANEL (Slides from right)                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ✕  Kidney CYP27B1 Activation                                       │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  ⚠️ Current Status: Reduced (27 pg/mL)                              │  │
│  │                                                                      │  │
│  │  In 1 sentence: The kidney converts 25(OH)D to active D.           │  │
│  │  Current levels are reduced, affecting bone and immune systems.    │  │
│  │                                                                      │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  ▶ Show Details (click to expand)                                  │  │
│  │                                                                      │  │
│  │  ▶ What affects this? (PTH, FGF23, Ca, PO4)                       │  │
│  │                                                                      │  │
│  │  ▶ What does this affect? (Bone, Immune, Intestine)               │  │
│  │                                                                      │  │
│  │  ▶ Clinical significance (osteoporosis, immune suppression)        │  │
│  │                                                                      │  │
│  │  ▶ References (3 papers)                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why this works:**
- The **1-sentence summary** is the most important thing
- **Details are hidden** until the user asks for them
- The user controls the information density

---

## 4. The "Action" Layer: From Understanding to Doing

**The app doesn't just show the problem—it suggests solutions.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ACTION PANEL (Bottom)                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  🎯 WHAT TO DO NEXT                                                 │  │
│  │                                                                      │  │
│  │  Based on your patient's D level (30 ng/mL):                       │  │
│  │                                                                      │  │
│  │  1. 💊 Supplement: 1000-2000 IU D3 daily                           │  │
│  │  2. 🩺 Monitor: Recheck 25(OH)D in 3 months                       │  │
│  │  3. 🥗 Diet: Increase fatty fish, eggs, fortified foods           │  │
│  │  4. ☀️ Sun: 15-30 minutes midday (if safe)                       │  │
│  │                                                                      │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  📊 RELATED METRICS:                                                │  │
│  │  PTH: 65 pg/mL ↑ (should improve with D supplementation)          │  │
│  │  Calcium: 8.4 mg/dL ⚠️ (monitor)                                  │  │
│  │                                                                      │  │
│  │  📖 PATIENT EXPLANATION:                                            │  │
│  │  [Generate visual for patient]  [Generate written summary]         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why this is critical:**
- Clinicians don't just want to know "what's happening"—they want to know "what to do"
- The **action panel** bridges the gap between understanding and practice
- It makes the app a **clinical decision support tool**, not just a visualization

---

## 5. Scenarios: Pre-Built Understanding

**Problem:** Moving the slider is powerful, but users need a starting point.

**Solution:** Pre-built clinical scenarios that show "here's what this patient looks like."

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SCENARIOS                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Load a clinical scenario to see the cascade:                     │  │
│  │                                                                      │  │
│  │  ○ Normal Patient (D=30)           ✅ All systems OK              │  │
│  │  ● Mild Deficiency (D=25)          ⚠️ Early changes              │  │
│  │  ○ Moderate Deficiency (D=15)      🔴 Significant effects         │  │
│  │  ○ Severe Deficiency (D=5)         ❌ Critical cascade           │  │
│  │  ○ CKD + D Deficiency              ⚠️ Layer 3 failure            │  │
│  │  ○ Malabsorption + D Deficiency    ❌ Layer 1 failure            │  │
│  │                                                                      │  │
│  │  [Load Scenario]  [Compare Two]  [Save as Custom]                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why this works:**
- Users see **real clinical examples** immediately
- They learn what different levels look like
- They can compare "normal" vs "patient" side by side
- It builds intuition for the cascade concept

---

## 6. Comparison View: See the Difference

**Problem:** A single view shows one state. Clinicians often need to compare "before" and "after" or "patient" and "normal."

**Solution:** Side-by-side comparison.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPARE VIEW                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐               │
│  │  NORMAL (D=30)           │  │  PATIENT (D=15)          │               │
│  │                          │  │                          │               │
│  │  Layer 1: OK             │  │  Layer 1: OK             │               │
│  │  Layer 2: OK             │  │  Layer 2: OK             │               │
│  │  Layer 3: OK             │  │  Layer 3: ⚠️ Reduced     │               │
│  │  Layer 4: All OK        │  │  Layer 4: Bone 🔴        │               │
│  │  Layer 5: OK             │  │  Layer 4: Immune 🔴     │               │
│  │  Layer 6: OK             │  │  Layer 4: Brain ⚠️      │               │
│  │  Layer 7: Asymptomatic  │  │  Layer 5: ⚠️ Compensating│               │
│  │                          │  │  Layer 6: ⚠️ Early      │               │
│  │  ⭐ Normal               │  │  Layer 7: Symptoms      │               │
│  │                          │  │                          │               │
│  │                          │  │  ❗ 7 systems affected   │               │
│  └──────────────────────────┘  └──────────────────────────┘               │
│                                                                             │
│  ✅ Difference Summary: 15 ng/mL difference leads to 7 affected systems   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Timeline View: When Do Effects Appear?

**Problem:** Static state doesn't show TEMPORAL dynamics. When does this happen? How fast?

**Solution:** A timeline that shows the emergence of effects over time.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TIMELINE VIEW                                                             │
│                                                                             │
│  At D=15 ng/mL (Moderate Deficiency):                                     │
│                                                                             │
│  Now:              Layer 1-2: OK  Layer 3: Reduced                        │
│  ──────────────────────────────────────────────────────────────────────    │
│  24h:              PTH begins to rise (compensating)                     │
│  ──────────────────────────────────────────────────────────────────────    │
│  1 week:           Bone resorption begins (RANKL ↑)                      │
│  ──────────────────────────────────────────────────────────────────────    │
│  4 weeks:          ⚠️ Symptoms: Fatigue, muscle weakness                  │
│  ──────────────────────────────────────────────────────────────────────    │
│  8 weeks:          🔴 Bone pain, immune suppression (infections)         │
│  ──────────────────────────────────────────────────────────────────────    │
│  6 months:         Osteopenia detectable on DEXA                        │
│  ──────────────────────────────────────────────────────────────────────    │
│  1 year:           🚨 Fracture risk +30%                                │
│  ──────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  Intervention at 4 weeks: Recovery begins within 2-4 weeks.              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why this is powerful:**
- Clinicians can say: "If we don't treat this, here's the timeline"
- Patients understand urgency: "I need to do this now, not in 6 months"
- It makes the cascade REAL and TEMPORAL

---

## 8. Search & Discovery: Find What Matters

**Problem:** The graph is complex. Users need to find specific things quickly.

**Solution:** A simple search bar that highlights relevant nodes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SEARCH & FILTER                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Search: [Bone__________________]  🔄 Clear                     │  │
│  │                                                                      │  │
│  │  🦴 Bone-related nodes:                                            │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │ ● Bone resorption   (Layer 4)  ⚠️ Affected                  │  │  │
│  │  │ ○ Bone mineralization (Layer 6)  ✅ OK                      │  │  │
│  │  │ ○ Osteocalcin       (Layer 6)  ✅ OK                        │  │  │
│  │  │ ○ ALP               (Layer 6)  ⚠️ Elevated                 │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │  💡 Tip: Click a result to highlight it in the graph.              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Mobile & Tablet Design

**Problem:** Clinicians use iPads during patient consultations. The desktop UI doesn't translate.

**Solution:** Adaptive design with touch-first interactions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TABLET VIEW (iPad)                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  🩺 D: 30 ng/mL  ⚠️ Borderline  [≡ Menu]                        │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  LAYER 3: Activation ⚠️ Reduced                                    │  │
│  │  ┌──────┐                                                         │  │
│  │  │ 🫘   │  PTH: 65 ↑  Ca: 8.4 ⚠️  (Tap for detail)              │  │
│  │  └──────┘                                                         │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  LAYER 4: Tissue Utilization  ⚠️ 2 systems affected                │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                             │  │
│  │  │🦴 Bone│ │🧬 Imm│ │🧠 Brain│ │🫀 Heart│                        │  │
│  │  │ ⚠️   │ │ 🔴  │ │ ⚠️    │ │ ✅   │                        │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                             │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  👆 Tap any node for details. 🤚 Pinch to zoom.                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Touch interactions:**
- Tap → opens detail panel
- Pinch → zoom in/out on the graph
- Swipe → navigate between layers
- Long press → context menu (share, copy, etc.)

---

## 10. UX Decisions That Make It Simple

### 10.1 Default State: Show Something Meaningful

**Bad:** Open the app and see an empty graph.

**Good:** Open the app and see a complete scenario (e.g., "Normal Patient") with the graph fully loaded.

**Why:** Users understand the app immediately because they see a complete example.

### 10.2 The Slider is the Primary Interaction

**Bad:** Users have to click multiple buttons to see changes.

**Good:** Move the slider → everything changes in real-time.

**Why:** It's intuitive, immediate, and direct. No learning curve.

### 10.3 Color Coding is Universal

**Bad:** Users have to learn a new color scheme.

**Good:** Green = good, Yellow = warning, Red = danger.

**Why:** Everyone already understands this. No explanation needed.

### 10.4 Progressive Disclosure

**Bad:** All information visible at once (overwhelming).

**Good:** Summary first → details on request.

**Why:** Users can control how much information they see.

### 10.5 Smart Defaults

**Bad:** Users have to configure everything.

**Good:** Defaults are sensible (e.g., "Normal" scenario selected, slider at 30 ng/mL).

**Why:** Users can start exploring immediately without setup.

---

## 11. What Competitors Do (and What We Do Better)

| Aspect | KEGG / Reactome | This App |
|--------|-----------------|----------|
| **First impression** | "What is this?" | "Oh, I see the problem" |
| **Interaction** | Click to explore | Slider to see change |
| **Default view** | All pathways | One clear cascade |
| **Clinical relevance** | None | Built-in from the start |
| **User goal** | "What is connected?" | "What happens if X changes?" |
| **Learning curve** | Steep | Gentle |
| **Time to insight** | Minutes | Seconds |

---

## 12. The User's Journey: From Open to Action

```
Open App
   │
   ▼
See the cascade (3 seconds)   ← The "Aha" moment
   │
   ▼
Adjust slider to see different states
   │
   ▼
Click a node → understand why
   │
   ▼
Load a scenario → see a real case
   │
   ▼
Compare views → understand differences
   │
   ▼
Generate patient explanation ← The "Action" moment
   │
   ▼
Make clinical decision
```

---

## 13. Metrics for UX Success

| Metric | Definition | Target |
|--------|------------|--------|
| **Time to first understanding** | Time from opening to "I see the cascade" | < 10 seconds |
| **Time to action** | Time from opening to "I know what to do" | < 30 seconds |
| **Click depth** | How many clicks to find information | < 3 clicks |
| **Satisfaction** | "Would you use this in practice?" | > 80% |
| **Return rate** | Users who return after first visit | > 60% |

---

## Summary: The User Experience Philosophy

> **"The app should solve the problem before the user knows they have a problem."**

1. **See the cascade** (the problem is obvious)
2. **Understand the cascade** (why is this happening?)
3. **Act on the cascade** (what should I do?)

**Every interaction is designed to move the user from 1 to 2 to 3 as quickly as possible.**

---

*Document: UX Section - Biophysical Flow Mapper*  
*Date: 2026-08-19*  
*Status: Integrated into Core Specification*