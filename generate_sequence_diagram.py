"""
Generate publication-quality Sequence Diagram (Figure 4.11.2) for AutoCX.
100% programmatic Python using Matplotlib - zero AI generation.
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs", "corrections_report", "figures")
os.makedirs(OUTPUT_DIR, exist_ok=True)

fig, ax = plt.subplots(figsize=(15, 10.5), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis("off")

# Column positions for lifelines
lifelines = [
    ("User / Client\n(React Cockpit)", 8, "#1565C0", "#E3F2FD"),
    ("FastAPI Router\n(api/routes.py)", 23, "#2E7D32", "#E8F5E9"),
    ("Pydantic Schema\n(schemas/car.py)", 38, "#00838F", "#E0F7FA"),
    ("Model Registry\n(In-Memory)", 53, "#455A64", "#ECEFF1"),
    ("Feature Engineer\n& Catalog Anchor", 68, "#E65100", "#FFF3E0"),
    ("Module A: Ridge\nResale Pipeline", 80, "#C2185B", "#FCE4EC"),
    ("Guardrails &\nDomain Engine", 89, "#D84315", "#FBE9E7"),
    ("Module B: RF SOH\nDiagnostic Engine", 96, "#6A1B9A", "#F3E5F5"),
]

# Draw headers and dashed lifelines
for title, x, border, bg in lifelines:
    rect = patches.FancyBboxPatch(
        (x - 5.5, 91), 11, 6.5,
        boxstyle="round,pad=0.5,rounding_size=1.2",
        facecolor=bg, edgecolor=border, linewidth=1.5
    )
    ax.add_patch(rect)
    ax.text(x, 94.2, title, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#111111")
    ax.plot([x, x], [91, 5], color="#B0BEC5", linestyle="--", linewidth=1.2, zorder=1)

def draw_msg(y, x1, x2, label, is_return=False, is_conditional=False, color="#37474F"):
    style = "--" if is_return else ("-." if is_conditional else "-")
    arrow = "<-" if is_return else "->"
    ax.annotate(
        "", xy=(x2, y), xytext=(x1, y),
        arrowprops=dict(arrowstyle=f"{arrow},head_width=0.35,head_length=0.55",
                        color=color, linestyle=style, lw=1.4)
    )
    mid_x = (x1 + x2) / 2
    bg = "white"
    box = dict(boxstyle="round,pad=0.25", facecolor=bg, edgecolor="#CFD8DC", alpha=0.95, linewidth=0.8)
    ax.text(mid_x, y + 1.2, label, ha="center", va="bottom", fontsize=8.0, fontweight="bold", color=color, bbox=box)

def draw_self_loop(y, x, label, color="#D84315"):
    ax.annotate(
        "", xy=(x, y - 2.5), xytext=(x, y),
        arrowprops=dict(arrowstyle="->,head_width=0.35,head_length=0.55",
                        color=color, connectionstyle="arc,angleA=0,armA=18,angleB=0,armB=18,rad=7", lw=1.4)
    )
    ax.text(x + 2.2, y - 1.2, label, ha="left", va="center", fontsize=7.8, fontweight="bold", color=color,
            bbox=dict(boxstyle="round,pad=0.2", facecolor="#FFFDE7", edgecolor="#FFF59D", alpha=0.9))

# Sequence Steps
draw_msg(87.0, 8, 23, "1.0 POST /api/predict/car-value (Vehicle specs & EV telemetry)")
draw_msg(82.5, 23, 38, "2.0 Validate payload bounds (Year 1980-2026, KM, Fuel enum)")
draw_msg(78.5, 38, 23, "2.1 Payload verified (Pydantic model object)", is_return=True, color="#00838F")
draw_msg(74.5, 23, 53, "3.0 Fetch in-memory model pipelines (Zero disk I/O)")
draw_msg(70.5, 53, 23, "3.1 Return Ridge & Random Forest artifacts", is_return=True, color="#455A64")
draw_msg(66.0, 23, 68, "4.0 Extract catalog profile, segment anchor & synthesize ratios")
draw_msg(61.5, 68, 23, "4.1 Return 13-feature DataFrame", is_return=True, color="#E65100")
draw_msg(57.0, 23, 80, "5.0 Execute Module A: Ridge Regressor on log-target ln(1+y)")
draw_msg(52.5, 80, 23, "5.1 Return raw predicted price: exp(z) - 1", is_return=True, color="#C2185B")
draw_msg(48.0, 23, 89, "6.0 Apply Domain Guardrails (High-mileage, Age ceiling, Salvage floor)")
draw_self_loop(44.0, 89, "Enforce Chassis Floor:\nmax(₹1.40L EV / ₹25k ICE)", color="#D84315")
draw_msg(38.0, 89, 23, "6.1 Guarded vehicle resale value (INR ₹)", is_return=True, color="#D84315")

# Conditional EV Box
cond_rect = patches.FancyBboxPatch(
    (18, 24), 80, 11,
    boxstyle="round,pad=0.5,rounding_size=1.0",
    facecolor="#F3E5F5", edgecolor="#7B1FA2", linestyle=":", linewidth=1.2, alpha=0.4
)
ax.add_patch(cond_rect)
ax.text(20, 33.2, "[CONDITIONAL: If Fuel == 'Electric' and Battery Telemetry Provided]", fontsize=7.8, fontweight="bold", color="#4A148C")

draw_msg(30.0, 23, 96, "7.0 Dispatch telemetry to Module B: Random Forest Regressor", is_conditional=True, color="#6A1B9A")
draw_msg(26.0, 96, 23, "7.1 Return SOH % (65.37% fit) + 5 Condition Tiers + 3 Repair Tiers", is_return=True, is_conditional=True, color="#6A1B9A")

draw_self_loop(21.0, 23, "8.0 Financial Conservation:\nRetention % + Deprec % == 100.0%", color="#2E7D32")
draw_msg(14.0, 23, 8, "9.0 HTTP 200 OK: CarPredictionResponse JSON", is_return=True, color="#1565C0")

draw_self_loop(9.5, 8, "10.0 Render Cockpit:\nSpeedometer, Tachometer, Dyno Curve & Audio", color="#1565C0")

ax.set_title("Figure 4.11.2: Sequence Diagram for Dual-Stream Analytical Request Lifecycle in AutoCX", fontsize=13, fontweight="bold", pad=15)

out_file = os.path.join(OUTPUT_DIR, "figure_4_11_2_sequence_diagram.png")
plt.savefig(out_file, dpi=300, bbox_inches="tight")
plt.close()
print(f"Figure 4.11.2 Sequence Diagram saved successfully to:\n{out_file}")
