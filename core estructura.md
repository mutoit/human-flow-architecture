# BIOPHYSICAL FLOW MAPPER
## Platform Specification v2.0

---

# 1. PRODUCT VISION

## 1.1 The Core Problem

**Medicine today is fragmented.**

When a biological change occurs—a nutrient deficiency, a hormonal shift, an infection, a genetic mutation, a drug effect—the body responds as an integrated system. But medical practice treats each symptom separately:

```
                    ACTUAL BIOLOGICAL REALITY
                    ┌─────────────────────────┐
                    │   ONE PRIMARY CHANGE    │
                    │   (e.g., D deficiency)  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴───────────────────┐
                    │                               │
          ┌─────────▼─────────┐           ┌─────────▼─────────┐
          │   CASCADING FLOW  │           │   MULTI-ORGAN     │
          │   THROUGH LAYERS  │           │   EFFECTS         │
          └─────────┬─────────┘           └─────────┬─────────┘
                    │                               │
        ┌───────────┼───────────────────────────────┼───────────┐
        │           │                               │           │
    ┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
    │Heart  │   │Bone   │   │Brain  │   │Immune │   │Metab  │
    │Hypert │   │Osteo  │   │Depres │   │Infect │   │Diabetes│
    └───────┘   └───────┘   └───────┘   └───────┘   └───────┘
    
    MEDICAL FRAGMENTATION: Each specialist sees one symptom,
    NO ONE sees the cascading flow from the root cause.
```

**Physicians see symptoms. They cannot see the system.**

## 1.2 The Solution

**Biophysical Flow Mapper** is a visual debugger for biological systems.

It shows you:
- "If X changes, what cascade of events follows?"
- "At which layer does the failure occur?"
- "What are the critical control points (bottlenecks)?"
- "Where does the effect stop (natural isolation)?"
- "How long until each effect becomes visible?"

**It makes the invisible system, visible.**

## 1.3 Core Philosophy

> **"Every biological pathway is a flow that can be mapped, visualized, and debugged."**

This is not a Vitamin D app. This is not a cortisol app. This is not a COVID app.

This is a **universal framework** for mapping ANY biological process:

| Category | Examples |
|----------|----------|
| **Nutrients** | Vitamin D, Vitamin B12, Iron, Zinc, Calcium, Omega-3 |
| **Hormones** | Cortisol, Insulin, Thyroid Hormones, Estrogen, Testosterone |
| **Pathogens** | COVID-19, Influenza, Tuberculosis, Malaria, HIV |
| **Pathologies** | Diabetes Type 2, Hypertension, Chronic Inflammation, Cancer |
| **Drugs** | Corticosteroids, Metformin, Statins, ACE Inhibitors |
| **Genetic Variants** | MTHFR, APOE4, VDR mutations, HLA variants |
| **Physiological States** | Pregnancy, Aging, Menopause, Circadian Rhythm, Sleep Deprivation |

The **infrastructure** is built once. The **content** is fed via structured data (JSON). The platform scales infinitely.

---

# 2. UNIVERSAL ARCHITECTURE: THE 7 LAYERS

Every biological pathway flows through a consistent layer structure—a universal pattern that mirrors how complex systems organize change propagation.

## The Layer Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 7: CLINICAL MANIFESTATIONS                                         │
│  What the patient and physician actually observe                          │
│  ────────────────────────────────────────────────────────────────────────  │
│  Symptoms | Lab Results | Imaging | Quality of Life                       │
│  Lag: Immediate to weeks | Reversibility: Varies                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 6: SYSTEMIC REMODELING                                              │
│  Long-term adaptation and structural change                               │
│  ────────────────────────────────────────────────────────────────────────  │
│  Bone Mineral Density | Vascular Remodeling | Tissue Fibrosis             │
│  Lag: Months to years | Reversibility: Partial                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 5: HOMEOSTATIC REGULATION                                           │
│  Feedback loops that maintain balance                                     │
│  ────────────────────────────────────────────────────────────────────────  │
│  PTH → Ca → D Loop | Insulin → Glucose → Glucagon | Renin-Angiotensin    │
│  Lag: Hours to days | Reversibility: High                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 4: TISSUE UTILIZATION (Multi-Target)                               │
│  The primary changes propagate to multiple tissues independently         │
│  ────────────────────────────────────────────────────────────────────────  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │Bone  │ │Immune│ │Brain │ │Heart │ │Liver │ │Muscle│                  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
│  Lag: Hours to months | Reversibility: Tissue-dependent                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 3: ACTIVATION & REGULATION (The Bottleneck)                       │
│  Critical control point—if this fails, everything downstream fails       │
│  ────────────────────────────────────────────────────────────────────────  │
│  Kidney (D activation) | Liver (Cortisol) | Pancreas (Insulin)           │
│  Lag: Immediate | Reversibility: Depends on organ function              │
│  CRITICAL: Single point of failure                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 2: TRANSPORT & STABILIZATION                                       │
│  Distribution and conversion to active form                              │
│  ────────────────────────────────────────────────────────────────────────  │
│  Protein Binding | Hepatic Conversion | Cellular Uptake                  │
│  Lag: Hours | Reversibility: High                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: INPUT & ABSORPTION                                              │
│  Where the agent enters the system                                       │
│  ────────────────────────────────────────────────────────────────────────  │
│  Diet | UV Exposure | Endogenous Synthesis | Parenteral Administration   │
│  Lag: Immediate | Reversibility: Not applicable                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Why Layers Matter

**Layers = Isolation of failures.** Just as a debugger shows you which function broke and what depends on it, the layer model shows:

1. **Where the problem starts** (Layer 1 → poor input)
2. **Where it gets amplified or blocked** (Layer 3 → critical control)
3. **What tissues are affected** (Layer 4 → multi-target dispersion)
4. **What the patient experiences** (Layer 7 → clinical symptoms)

**Critical insight:** Some layers are independent. A failure in Layer 4a (bone) does not necessarily affect Layer 4b (immune). The platform shows you where the flow stops and where it continues.

---

# 3. SYSTEM ARCHITECTURE

## 3.1 Data-Driven Philosophy

// Ejemplo: cómo se vería un nodo en JSON
{
  "id": "pth_elevation",
  "nombre": "Elevación de PTH",
  "capa": 5,
  "tipo": "hormona",
  "depende_de": ["calcium_low", "vitamin_d_low"],
  "afecta": ["bone_resorption", "kidney_reabsorption"],
  "lag_hours": 6,
  "threshold_min": 15,
  "threshold_max": 65
}

**The application is content-agnostic.** It reads structured data and renders whatever is provided.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PLATFORM INFRASTRUCTURE                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  Graph Renderer Engine                   │    │
│  │  - Renders N layers dynamically                         │    │
│  │  - Positions nodes automatically                        │    │
│  │  - Draws directional edges                             │    │
│  │  - Applies color coding                                │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                Propagation Engine                       │    │
│  │  - Calculates cascading effects                        │    │
│  │  - Applies modulation functions (linear, sigmoid, etc) │    │
│  │  - Handles critical node failures                     │    │
│  │  - Computes lag times                                 │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                 Interaction Layer                       │    │
│  │  - Slider controls for primary variables              │    │
│  │  - Click-to-detail panels                             │    │
│  │  - Timeline visualization                             │    │
│  │  - Scenario loading                                   │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  Admin Panel                           │    │
│  │  - CRUD for nodes, edges, scenarios                   │    │
│  │  - Validation engine                                  │    │
│  │  - Import/Export (JSON, Excel)                      │    │
│  │  - Version control integration                       │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Reads
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (JSON)                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │nodos.json  │ │aristas.json│ │config.json │ │scenarios.json│  │
│  │(What exists│ │(How they   │ │(Metadata,  │ │(Clinical   │   │
│  │ in the     │ │ connect,   │ │colors,     │ │cases,      │   │
│  │ pathway)   │ │ propagate) │ │thresholds) │ │predictions)│   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              /data/{pathway_name}/                          │ │
│  │  /vitamin_d/  /cortisol/  /covid19/  /insulin/  ...        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 3.2 Core Data Structures

### Node Definition
```json
{
  "id": "unique_identifier",
  "name": "Human-Readable Name",
  "layer": 1,
  "type": "input|organ|enzyme|hormone|receptor|symptom|lab_marker",
  "description": "What this node represents, where it occurs, why it matters",
  "inputs": ["node_id_1", "node_id_2"],
  "outputs": ["node_id_3"],
  "vdr_dependent": true|false,   // Does this require the primary agent?
  "critical": true|false,        // If this fails, cascade breaks
  "lag_hours": 24,               // Time until effect becomes measurable
  "threshold_min": 20,           // Minimum normal value
  "threshold_max": 100,          // Maximum normal value
  "unit": "ng/mL",
  "papers": ["PMID:12345"],
  "clinical_notes": "Additional clinical context"
}
```

### Edge Definition
```json
{
  "from_id": "source_node",
  "to_id": "target_node",
  "relationship": "increases|decreases|inhibits|activates|synergizes",
  "strength": 0.85,              // 0.0 to 1.0, how strong is the effect
  "modulation": {
    "type": "linear|sigmoid|saturation|threshold",
    "params": {
      "k": 0.5,                  // Sigmoid steepness
      "x0": 30,                  // Sigmoid midpoint
      "max": 100,                // Saturation maximum
      "min": 0                   // Saturation minimum
    }
  },
  "papers": ["PMID:67890"],
  "mechanism": "Biological explanation of the relationship"
}
```

### Pathway Configuration
```json
{
  "name": "Vitamin D Metabolism",
  "description": "Full pathway from absorption to clinical effects",
  "primary_variable": "25(OH)D",
  "slider_min": 0,
  "slider_max": 150,
  "slider_default": 30,
  "num_layers": 7,
  "colors": {
    "ok": "#10b981",
    "warning": "#f59e0b",
    "critical": "#ef4444"
  },
  "featured_nodes": ["liver", "kidney", "bone", "immune"]
}
```

## 3.3 The Propagation Engine

**When the user moves the slider, the engine calculates cascades in real-time:**

```
Algorithm: propagate_change(primary_value)

For each node in pathway:
    If node has "primary_variable" dependency:
        new_value = apply_modulation(primary_value, node.modulation_params)
        
        Color = determine_color(
            new_value, 
            node.threshold_min, 
            node.threshold_max
        )
        
        If node.critical and new_value < node.threshold_min:
            trigger_critical_warning(node)
        
        For each outgoing_edge from node:
            propagate_to_target(
                node, 
                target, 
                new_value, 
                edge.strength,
                edge.modulation
            )
    
    Calculate_node_lag(node, primary_change_rate)
    Animate_node_state_change(node, new_color)
```

**Key features:**
- **Real-time color updates** (green → yellow → red)
- **Pulse animations** on affected nodes
- **Flow animations** on edges showing propagation
- **Critical warnings** when bottlenecks fail
- **Lag timers** showing when effects become visible

---

# 4. USER INTERFACE

## 4.1 Main View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BIOPHYSICAL FLOW MAPPER                            [🔍] [⚙️] [📊] [👤]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Pathway: [Vitamin D ▼] | Scenario: [Normal ▼] | View: [Cascade ▼]        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  25(OH)D Level: [═══════════●════════════════] 30 ng/mL             │  │
│  │  ─────────────────────────────────────────────────────────────────  │  │
│  │                                                                      │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │  LAYER 1: INPUT & ABSORPTION                                │   │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │   │  │
│  │  │  │  Sun ☀️  │──│  Diet 🍖 │──│  Gut 🧬 │  ✅ OK           │   │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘                  │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                           ⬇                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  LAYER 2: TRANSPORT & STABILIZATION                        │   │  │
│  │  │  ┌──────────────┐    ┌──────────────┐                     │   │  │
│  │  │  │  Liver 🫁    │───▶│  25(OH)D 📦  │  ✅ OK (30 ng/mL)  │   │  │
│  │  │  │  (CYP2R1)    │    │  (Storage)   │                     │   │  │
│  │  │  └──────────────┘    └──────────────┘                     │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                           ⬇                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  LAYER 3: ACTIVATION & REGULATION  ⚠️ BORDERLINE          │   │  │
│  │  │  ┌──────────────────────────────────────────────────┐      │   │  │
│  │  │  │  Kidney 🫘  ───▶  1,25(OH)₂D  ⚠️ 27 pg/mL      │      │   │  │
│  │  │  │  (CYP27B1)       (Active Form)                   │      │   │  │
│  │  │  │  PTH: 65 pg/mL ↑  FGF23: 150 pg/mL              │      │   │  │
│  │  │  └──────────────────────────────────────────────────┘      │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                           ⬇                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  LAYER 4: TISSUE UTILIZATION                               │   │  │
│  │  │  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐              │   │  │
│  │  │  │🦴│  │🧬│  │🧠│  │🫀│  │🥗│  │🫁│  │👁️│              │   │  │
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │              │   │  │
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │              │   │  │
│  │  │  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘              │   │  │
│  │  │  [Bone] [Immune] [Brain] [Heart] [GI] [Lung] [Retina]   │   │  │
│  │  │  ⚠️     🔴      ⚠️     ✅      ✅      ✅      ✅        │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                           ⬇                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  LAYER 5: HOMEOSTASIS & REGULATION  ⚠️ COMPENSATING        │   │  │
│  │  │  Ca: 8.4 mg/dL (low-normal)  PTH: 65 pg/mL (↑)             │   │  │
│  │  │  PO4: 3.2 mg/dL (normal)                                   │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                           ⬇                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  LAYER 6: SYSTEMIC REMODELING  ⚠️ EARLY CHANGES           │   │  │
│  │  │  Bone resorption markers: ↑ (cross-laps)                   │   │  │
│  │  │  ALP: 110 U/L (↑)  Osteocalcin: 25 ng/mL (↓)              │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                           ⬇                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  LAYER 7: CLINICAL MANIFESTATIONS  ⚠️ SYMPTOMS             │   │  │
│  │  │  ▲ Fatigue  ▲ Bone pain  ▲ Infections  ▲ Muscle weakness  │   │  │
│  │  │  Dx: Osteopenia, Secondary Hyperparathyroidism             │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Details: [Click a node for information]                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Visual Quality & Impact

**Design Principles:**

1. **Clarity over complexity** — Each layer is visually distinct with clear grouping
2. **Color as information** — The color code (green/yellow/red) is instantly readable
3. **Flow animation** — Edges pulse to show direction and intensity of propagation
4. **Responsive depth** — Nodes enlarge when hovered, showing relevance
5. **Minimal cognitive load** — Information density increases only when user interacts

**Color Palette:**

| Color | Meaning | Use |
|-------|---------|-----|
| **#10b981** (Emerald) | Normal function | Node within threshold |
| **#f59e0b** (Amber) | Compensated/ Warning | Node approaching threshold, homeostasis compensating |
| **#ef4444** (Red) | Critical failure | Node outside threshold, system decompensating |
| **#6366f1** (Indigo) | Active regulation | Nodes currently modulating response |
| **#8b5cf6** (Purple) | Clinical symptom | Manifestations in Layer 7 |
| **#f43f5e** (Rose) | Urgent | Critical node failure requiring immediate attention |

**Typography & Spacing:**
- Clean sans-serif fonts for readability
- Generous spacing between layers to show separation
- Icons for organs and systems for quick recognition
- Hierarchical font sizes (node names > descriptions > metadata)

**Interaction Feedback:**
- **Hover:** Node glows, shows tooltip summary
- **Click:** Panel slides in with full details
- **Slider movement:** Smooth animated transitions
- **Scenario load:** Staggered cascade animation showing propagation

## 4.3 Detail Panel (On Node Click)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✕  [NODE NAME]                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📍 Layer 4 · Tissue Utilization                                   │
│  🏷️ Type: Organ                                                   │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  DESCRIPTION                                                       │
│  ────────────────────────────────────────────────────────────────  │
│  Full biological description...                                    │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  INPUTS                                                           │
│  ────────────────────────────────────────────────────────────────  │
│  • 1,25(OH)₂D (from Kidney)                                       │
│  • PTH (from Parathyroid)                                         │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  OUTPUTS                                                          │
│  ────────────────────────────────────────────────────────────────  │
│  • Osteocalcin (bone formation marker)                            │
│  • RANKL/OPG ratio (osteoclast regulation)                        │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  CLINICAL SIGNIFICANCE                                             │
│  ────────────────────────────────────────────────────────────────  │
│  Current Status: ⚠️ Warning                                       │
│  Severity: Moderate                                               │
│  Lag Time: 8-12 weeks until clinical effect                      │
│  Critical: No                                                     │
│  VDR-Dependent: Yes                                               │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  WHAT HAPPENS IF THIS FAILS?                                      │
│  ────────────────────────────────────────────────────────────────  │
│  • Decreased bone mineral density                                │
│  • Increased fracture risk                                       │
│  • Pain and reduced mobility                                     │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  REFERENCES                                                       │
│  ────────────────────────────────────────────────────────────────  │
│  • [PubMed:12345] Smith et al., 2020                            │
│  • [DOI:10.1016/...] Johnson et al., 2019                       │
│                                                                     │
│  [🔗 View in PubMed]  [📊 Show Subgraph]  [📋 Copy Details]      │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 5. ADMIN PANEL: DATA INTAKE

## 5.1 Purpose & Audience

**Who uses the Admin Panel:**
- **Subject Matter Experts** (physicians, biochemists, researchers)
- **Content Curators** (teams maintaining pathway data)
- **System Administrators** (validating and publishing updates)

**What it enables:**
- Add/Edit/Delete nodes and edges without coding
- Import from Excel, Google Sheets, or structured text
- Validate biological accuracy and graph integrity
- Publish updates to the main application
- Version control for data changes

## 5.2 Key Features

### Node Management
```
┌─────────────────────────────────────────────────────────────────────┐
│  📋 NODE MANAGEMENT                    [➕ Add Node] [📤 Import]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Search: [____________________]  Filter: [All Layers ▾]           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ID        │ Name          │ Layer │ Type  │ Critical │ Status │  │
│  ├───────────┼───────────────┼───────┼───────┼──────────┼────────┤  │
│  │ node_001  │ Sun Exposure  │ 1     │ Input │ No      │ ✅     │  │
│  │ node_002  │ Gut Absorption│ 1     │ Organ │ No      │ ✅     │  │
│  │ node_003  │ Liver CYP2R1  │ 2     │ Enzyme│ Yes     │ ✅     │  │
│  │ node_004  │ Kidney CYP27B1│ 3     │ Enzyme│ Yes     │ ⚠️     │  │
│  │ ...       │               │       │       │          │        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Showing 1-10 of 24 nodes                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Edge Management
```
┌─────────────────────────────────────────────────────────────────────┐
│  🔗 EDGE MANAGEMENT                    [➕ Add Edge] [📤 Import]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  From: [_______________▾]  →  To: [_______________▾]              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ From        │ To           │ Relationship │ Strength │ Papers │  │
│  ├─────────────┼──────────────┼──────────────┼──────────┼────────┤  │
│  │ Sun Exposure│ Gut          │ increases    │ 0.9      │ 3      │  │
│  │ 25(OH)D     │ Kidney       │ increases    │ 0.95     │ 5      │  │
│  │ 1,25(OH)₂D  │ Bone         │ activates    │ 0.85     │ 7      │  │
│  │ PTH         │ Kidney       │ increases    │ 0.8      │ 4      │  │
│  │ ...         │              │              │          │        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Validation Engine

**Automatically checks:**
- ✅ All nodes have unique IDs
- ✅ All edges reference valid existing nodes
- ✅ No orphaned nodes (unless intentionally terminal)
- ✅ No cycles (unless intentionally regulatory)
- ✅ Threshold values are within realistic ranges
- ✅ Required fields are populated
- ✅ Units are consistent within pathways
- ✅ Critical nodes have appropriate downstream effects

**Validation report:**
```
✅ Validation Complete
   Nodes: 24 valid, 0 errors, 2 warnings
   Edges: 35 valid, 0 errors, 1 warning
   
⚠️ Warnings:
   1. Node "node_004" has no papers associated (critical node)
   2. Edge "node_003 → node_004" has low strength (0.4) for a critical pathway
   
No errors found. Ready for publishing.
```

### Version Control

```
┌─────────────────────────────────────────────────────────────────────┐
│  📦 VERSION CONTROL                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Current Version: v2.1.3                                           │
│  Last Updated: 2026-08-18 14:32                                    │
│  Updated By: Dr. Sarah Chen                                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Version │ Date       │ Author      │ Changes                │  │
│  ├─────────┼────────────┼─────────────┼────────────────────────┤  │
│  │ v2.1.3  │ 2026-08-18 │ S. Chen     │ Added 3 immune nodes  │  │
│  │ v2.1.2  │ 2026-08-15 │ M. Johnson  │ Fixed threshold on #12 │  │
│  │ v2.1.1  │ 2026-08-12 │ S. Chen     │ Updated paper refs   │  │
│  │ v2.1.0  │ 2026-08-10 │ S. Chen     │ Added cortisol path   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [🔄 Rollback] [📥 Download] [📤 Push to GitHub]                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 5.3 Import/Export Workflow

**Acceptable input formats:**
1. **JSON** — Direct import, full fidelity
2. **Google Sheets** — Pull from collaborative spreadsheet
3. **CSV/Excel** — Bulk upload nodes and edges
4. **PubMed Export** — Import paper metadata for references

**Export options:**
1. **JSON** — Full data package for backup
2. **PDF Report** — Documentation of the pathway
3. **Presentation** — Slides for clinical education
4. **Images** — PNG/SVG of the graph

---

# 6. PHASE 2 & FUTURE CAPABILITIES

## 6.1 Phase 2: Cross-Pathway Interactions

**Problem:** Real biology doesn't happen in isolation. Vitamin D affects cortisol. Cortisol affects insulin. Insulin affects D.

**Solution:** Add interaction layer that shows combined effects.

```
INTERACTION: Vitamin D Deficiency + Chronic Stress (Cortisol ↑)

┌─────────────────────────────────────────────────────────────────────┐
│  Combined Effect: Inflammatory Collapse                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Vitamin D Pathway  │  Cortisol Pathway  │  Combined Effect        │
│  ─────────────────  │  ────────────────  │  ────────────────      │
│  D ↓                │  Cortisol ↑        │                         │
│  └─ Immune ↓        │  └─ Immune ↓       │  Immune ↓↓ (synergy)   │
│  └─ Bone ↓          │  └─ Bone ↓         │  Bone ↓↓ (synergy)     │
│  └─ Serotonin ↓     │  └─ Serotonin ↓    │  Mood ↓↓↓ (additive)   │
│                                                                     │
│  Clinical Pattern: Severe fatigue, frequent infections,           │
│  depression, osteopenia—all driven by two interacting systems    │
└─────────────────────────────────────────────────────────────────────┘
```

**Technical implementation:** Additional JSON file `interactions.json` that defines cross-pathway edges. The engine calculates both pathways simultaneously and applies interaction effects.

## 6.2 Phase 3: Predictive Modeling

**Goal:** "Given these lab values, what's the likely progression?"

**Features:**
- **Risk scores** — Based on cascading failures
- **Trajectory simulation** — "If you don't intervene, this will happen in X months"
- **Intervention modeling** — "If you supplement D, here's the recovery timeline"
- **Personalization** — Input patient-specific factors (age, BMI, genetics, comorbidities)

**Example:**
```
PATIENT PROFILE:
- Age: 65, BMI: 32, GFR: 60
- 25(OH)D: 16 ng/mL
- PTH: 75 pg/mL

PREDICTED TRAJECTORY (no intervention):
┌─────────────────────────────────────────────────────────────────────┐
│  Timeline: 12 months                                               │
├─────────────────────────────────────────────────────────────────────┤
│  Month 0:  D↓ → PTH↑ (compensating)                              │
│  Month 3:  Bone resorption begins → ALP ↑                        │
│  Month 6:  Osteopenia → fracture risk +30%                      │
│  Month 9:  Immune ↓ → respiratory infections ↑                   │
│  Month 12: Clinical osteomalacia, fracture event risk 40%        │
└─────────────────────────────────────────────────────────────────────┘

RECOMMENDATION: Supplement 2000 IU D3 daily + monitor PTH in 3 months
```

**Implementation:** Machine learning layer over the causal graph, trained on clinical data.

## 6.3 Phase 4: Collaborative Data Integration

**Goal:** Turn the platform into a living knowledge base.

**Features:**
- **Community contributions** — Experts submit data for review
- **Peer validation** — Multiple experts approve before publishing
- **Versioned knowledge** — Track how understanding evolves
- **Citation tracking** — Every relationship traced to published evidence

**Data sources:**
- Auto-fetch from PubMed
- Integration with KEGG, Reactome
- Clinical trial data integration
- Electronic Health Record de-identified data (with proper permissions)

## 6.4 Phase 5: Clinical Decision Support

**Goal:** Embed into clinical workflow.

**Features:**
- **EHR integration** — Automatically pull patient labs
- **Alerts** — "Your patient's D level puts them at risk for X, Y, Z"
- **Treatment recommendations** — Evidence-based protocols
- **Patient education** — Generate visual explanations for patients
- **Follow-up planning** — "When to re-check labs based on lag times"

**The value:** Physicians see the system, not just the numbers.

---

# 7. COMMERCIALIZATION & SUSTAINABILITY

## 7.1 Target Audience & Value Proposition

| User Group | What They Get | Why They Pay |
|------------|---------------|--------------|
| **Physicians** | Visual explanation for patients, system-level understanding | Saves time explaining, improves patient compliance |
| **Researchers** | Integrated knowledge, gap identification, collaboration | Accelerates research, finds new hypotheses |
| **Medical Educators** | Teaching tool for systems biology | Engaging, memorable, visual |
| **Health Systems** | Standardized understanding across specialties | Reduces fragmentation, improves outcomes |
| **Pharma** | Target identification, mechanism visualization | R&D acceleration, better trial design |

## 7.2 Revenue Model

**Freemium (Individual Users):**
- **Free:** One pathway (e.g., Vitamin D), basic visualization
- **Pro ($9/mo):** All pathways, export reports, scenario generation
- **Pro+ ($29/mo):** Predictive modeling, custom pathways, collaboration tools

**Enterprise (Institutions):**
- **Team ($99/mo/seat):** Shared workspaces, custom branding, admin controls
- **Enterprise ($Custom):** EHR integration, training, dedicated support, white-label

**Data & API:**
- **API Access ($299/mo):** Programmatic access to pathway data
- **Custom Pathways ($5k+):** Build and validate new pathways for specific needs

## 7.3 Competitive Advantage

| Aspect | KEGG / Reactome | Biophysical Flow Mapper |
|--------|-----------------|-------------------------|
| **Primary Purpose** | "What is connected?" | "What happens when X changes?" |
| **Interactivity** | Static | Dynamic + Real-time |
| **Clinical Context** | None | Integrated symptoms, diagnoses |
| **User Experience** | Technical (researchers only) | Intuitive (clinicians + researchers + patients) |
| **Layer Structure** | Not organized | 7-layer universal framework |
| **Temporal Information** | None | Lag times, timelines |
| **Cross-pathway** | Separate views | Integrated interactions |
| **Data Entry** | Manual curation | Admin panel + collaborative |

---

# 8. TECHNICAL SPECIFICATIONS

## 8.1 Technology Stack

**Frontend:**
- **Framework:** React 18+ (components, hooks, contexts)
- **Graph Rendering:** Cytoscape.js (flexible, high-performance graphs)
- **Animations:** Framer Motion (smooth transitions, cascades)
- **Styling:** Tailwind CSS (utility-first, responsive)
- **State:** Zustand (lightweight, scalable)

**Backend:**
- **API:** Node.js + Express
- **Database:** PostgreSQL (nodes, edges, scenarios)
- **Cache:** Redis (performance for graph calculations)
- **Authentication:** JWT + OAuth (Google, GitHub)

**Data Layer:**
- **Storage:** JSON files in `/data` (version controlled)
- **Validation:** JSON Schema (structure validation)
- **Import/Export:** CSV, Excel, JSON, PubMed API

**Deployment:**
- **Frontend:** Vercel / Netlify (CDN, serverless)
- **Backend:** Railway / Render (managed hosting)
- **Database:** Supabase / Neon (managed PostgreSQL)
- **CI/CD:** GitHub Actions (auto-deploy on merge)

## 8.2 Performance Requirements

- **Load time:** < 2 seconds for main graph
- **Animation:** 60fps for slider interactions
- **Scalability:** Support up to 500 nodes, 1000 edges
- **Concurrency:** 100+ simultaneous users
- **Mobile:** Responsive design for tablets and desktop

## 8.3 Data Integrity

- **Validation:** Automatic validation on every change
- **Versioning:** Git-based history with rollback
- **Backup:** Daily automated backups
- **Audit:** Full change history with user attribution

---

# 9. ROADMAP

## Phase 1: MVP (Months 1-3)

**Core Platform:**
- ✅ Graph renderer with 7-layer architecture
- ✅ Slider interaction with real-time propagation
- ✅ Detail panels on node click
- ✅ 3 pre-loaded scenarios
- ✅ Admin panel (basic CRUD)
- ✅ Validation engine
- ✅ One reference pathway (Vitamin D)

**Launch:** Private beta with 10-20 clinicians

## Phase 2: Expansion (Months 4-6)

**Content:**
- ✅ Add 3-5 new pathways (Cortisol, Insulin, Iron, COVID-19)
- ✅ Cross-pathway interactions

**Features:**
- ✅ Timeline visualization
- ✅ Report generation (PDF, PPT)
- ✅ Scenario comparison

**Users:** Expand beta to 100+ users

## Phase 3: Intelligence (Months 7-9)

**Predictive:**
- ✅ Risk scoring
- ✅ Trajectory simulation
- ✅ Intervention modeling

**Data:**
- ✅ PubMed auto-import
- ✅ Community contributions
- ✅ Peer validation workflow

**Launch:** Public release with freemium model

## Phase 4: Integration (Months 10-12)

**Clinical:**
- ✅ EHR integration (HL7/FHIR)
- ✅ Clinical decision support
- ✅ Patient education modules

**Scale:**
- ✅ Enterprise onboarding
- ✅ API access
- ✅ White-label options

---

# 10. SUCCESS METRICS

## 10.1 Product Metrics

| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|-------------------|
| Active Users | 500 | 5,000 |
| Pathways Created | 5 | 25+ |
| Nodes Defined | 200 | 1,000+ |
| Community Contributors | 20 | 100+ |
| Clinical Reports Generated | 1,000 | 10,000+ |

## 10.2 User Satisfaction

| Metric | Target |
|--------|--------|
| NPS (Net Promoter Score) | > 50 |
| Time-to-understanding (from opening to "I get it") | < 60 seconds |
| % of users who recommend to colleague | > 70% |
| Weekly active usage | > 40% |

---

# 11. SUMMARY

## One Sentence

**Biophysical Flow Mapper** is a universal visual debugger for biological systems that shows you what happens when any agent changes—making the invisible cascade of effects visible, understandable, and actionable.

## The Why

Medicine needs to see the system, not just the symptoms. Researchers need to integrate knowledge, not fragment it. Patients need to understand their bodies, not just their diagnoses.

This platform makes that possible—for any biological process, at any scale, for any user.

---

**Document Version:** 2.0  
**Date:** 2026-08-19  
**Status:** Final Specification  
**Next:** Development Kickoff