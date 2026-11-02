import os
import io
from pygments import highlight
from pygments.lexers import PythonLexer, TypeScriptLexer
from pygments.formatters import ImageFormatter
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIRS = [
    "docs/corrections_report/appendix",
    "docs/figures"
]

for d in OUTPUT_DIRS:
    os.makedirs(d, exist_ok=True)

def create_light_ide_screenshot(
    code_text: str,
    file_path: str,
    tab_name: str,
    start_line: int,
    is_python: bool = True,
    filename_out: str = "screenshot.png"
):
    lexer = PythonLexer() if is_python else TypeScriptLexer()
    
    # Use Visual Studio / Light theme for crisp white background
    formatter = ImageFormatter(
        style="vs",
        font_name="Consolas",
        font_size=15,
        line_numbers=True,
        line_number_start=start_line,
        line_number_bg="#f3f4f6",
        line_number_fg="#6b7280",
        background_color="#ffffff",
        image_pad=18
    )
    code_img_bytes = highlight(code_text, lexer, formatter)
    code_img = Image.open(io.BytesIO(code_img_bytes)).convert("RGBA")
    
    cw, ch = code_img.size
    total_w = max(cw, 860)
    title_bar_h = 42
    status_bar_h = 28
    total_h = title_bar_h + ch + status_bar_h
    
    final_img = Image.new("RGBA", (total_w, total_h), "#ffffff")
    draw = ImageDraw.Draw(final_img)
    
    # Title bar (clean light gray macOS/VS Code style)
    draw.rectangle([0, 0, total_w, title_bar_h], fill="#f3f4f6")
    draw.line([0, title_bar_h, total_w, title_bar_h], fill="#e5e7eb", width=1)
    
    # Window controls (macOS / VS Code dots)
    dot_y = 21
    draw.ellipse([14, dot_y - 6, 26, dot_y + 6], fill="#ff5f56", outline="#e0443e")
    draw.ellipse([34, dot_y - 6, 46, dot_y + 6], fill="#ffbd2e", outline="#dea123")
    draw.ellipse([54, dot_y - 6, 66, dot_y + 6], fill="#27c93f", outline="#1aab29")
    
    # Fonts
    try:
        ui_font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 13)
        ui_font_bold = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
    except Exception:
        ui_font = ImageFont.load_default()
        ui_font_bold = ui_font
        
    # Active Tab (White tab with blue accent line on top)
    tab_x = 80
    tab_w = max(180, len(tab_name) * 9 + 40)
    draw.rectangle([tab_x, 6, tab_x + tab_w, title_bar_h], fill="#ffffff")
    draw.line([tab_x, 6, tab_x + tab_w, 6], fill="#007acc", width=2)
    draw.line([tab_x, 6, tab_x, title_bar_h], fill="#e5e7eb", width=1)
    draw.line([tab_x + tab_w, 6, tab_x + tab_w, title_bar_h], fill="#e5e7eb", width=1)
    draw.text((tab_x + 16, 14), tab_name, fill="#1f2937", font=ui_font_bold)
    
    # Breadcrumbs / Path
    draw.text((tab_x + tab_w + 25, 14), file_path, fill="#6b7280", font=ui_font)
    
    # Paste code image onto white canvas
    final_img.paste(code_img, (0, title_bar_h), code_img)
    
    # Status bar (VS Code blue with white typography)
    draw.rectangle([0, total_h - status_bar_h, total_w, total_h], fill="#007acc")
    lang_name = "Python 3.10" if is_python else "TypeScript (React)"
    end_line = start_line + len(code_text.strip().splitlines()) - 1
    status_text = f" AutoCX Production Engine  |  Lines {start_line}-{end_line}  |  UTF-8  |  Spaces: 4  |  {lang_name} "
    draw.text((12, total_h - status_bar_h + 6), status_text, fill="#ffffff", font=ui_font)
    
    # Crisp outer border for clean definition on white report pages
    draw.rectangle([0, 0, total_w - 1, total_h - 1], outline="#d1d5db", width=1)
    
    # Save image
    for d in OUTPUT_DIRS:
        out_p = os.path.join(d, filename_out)
        final_img.save(out_p)
        print(f"Generated Light Mode Screenshot: {out_p} ({total_w}x{total_h})")

def read_lines(filepath, start, end):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    return "".join(lines[start-1:end])

def main():
    print("Generating White-Background / Light-Theme IDE Code Screenshots for Project Report...")
    
    # 1. train_car_model.py
    code1 = read_lines("backend/src/ml/training/train_car_model.py", 94, 158)
    create_light_ide_screenshot(
        code_text=code1,
        file_path="backend/src/ml/training/train_car_model.py",
        tab_name="train_car_model.py",
        start_line=94,
        is_python=True,
        filename_out="code_1_train_car_model.png"
    )
    
    # 2. train_battery_model.py
    code2 = read_lines("backend/src/ml/training/train_battery_model.py", 60, 126)
    create_light_ide_screenshot(
        code_text=code2,
        file_path="backend/src/ml/training/train_battery_model.py",
        tab_name="train_battery_model.py",
        start_line=60,
        is_python=True,
        filename_out="code_2_train_battery_model.png"
    )
    
    # 3. prediction_service.py
    code3 = read_lines("backend/src/services/prediction_service.py", 251, 321)
    create_light_ide_screenshot(
        code_text=code3,
        file_path="backend/src/services/prediction_service.py",
        tab_name="prediction_service.py",
        start_line=251,
        is_python=True,
        filename_out="code_3_prediction_service.png"
    )
    
    # 4. routes.py
    code4 = read_lines("backend/src/api/routes.py", 10, 85)
    create_light_ide_screenshot(
        code_text=code4,
        file_path="backend/src/api/routes.py",
        tab_name="routes.py",
        start_line=10,
        is_python=True,
        filename_out="code_4_api_routes.png"
    )
    
    # 5. AnalyzePage.tsx
    code5 = read_lines("frontend/src/pages/AnalyzePage.tsx", 420, 488)
    create_light_ide_screenshot(
        code_text=code5,
        file_path="frontend/src/pages/AnalyzePage.tsx",
        tab_name="AnalyzePage.tsx",
        start_line=420,
        is_python=False,
        filename_out="code_5_cockpit_analyzer.png"
    )

    print("All 5 white-background screenshots generated successfully!")

if __name__ == "__main__":
    main()
