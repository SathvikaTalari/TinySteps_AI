import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_assignment_document():
    doc = docx.Document()
    
    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        
    primary_color = RGBColor(0x3B, 0x17, 0x68)   # Dark Purple / Burgundy
    dark_text = RGBColor(0x20, 0x0E, 0x3A)       # Text Dark
    gray_text = RGBColor(0x55, 0x55, 0x55)       # Text Gray
    
    # Document Header
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_inst = p_inst.add_run("STANLEY COLLEGE OF ENGINEERING & TECHNOLOGY FOR WOMEN")
    run_inst.bold = True
    run_inst.font.size = Pt(14)
    run_inst.font.color.rgb = primary_color
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(2)
    run_sub = p_sub.add_run("(A UGC Autonomous Institution)\nDepartment of Computer Science & Engineering")
    run_sub.bold = True
    run_sub.font.size = Pt(11)
    run_sub.font.color.rgb = dark_text
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(12)
    run_title = p_title.add_run("Assignment-1")
    run_title.bold = True
    run_title.font.size = Pt(13)
    run_title.font.color.rgb = primary_color
    
    # Subject & Assignment
    p_info = doc.add_paragraph()
    p_info.paragraph_format.space_after = Pt(8)
    r1 = p_info.add_run("Subject: ")
    r1.bold = True
    p_info.add_run("Full Stack Development\n")
    r2 = p_info.add_run("Assignment: ")
    r2.bold = True
    p_info.add_run("TinySteps AI - Personalized Student Learning & Goal Development Coach (Full Stack Web Application)")
    
    # Student Details Table
    p_sd = doc.add_paragraph()
    p_sd.paragraph_format.space_after = Pt(4)
    r_sd = p_sd.add_run("Student Details")
    r_sd.bold = True
    r_sd.font.size = Pt(11)
    
    table_sd = doc.add_table(rows=6, cols=2)
    table_sd.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_sd.autofit = False
    
    fields = [
        "Name",
        "Roll No.",
        "Semester",
        "Section",
        "GitHub Repository URL",
        "Live Application URL (if applicable)"
    ]
    
    for i, field in enumerate(fields):
        row = table_sd.rows[i]
        c0 = row.cells[0]
        c1 = row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        
        c0.text = field
        c0.paragraphs[0].runs[0].bold = True
        c0.paragraphs[0].runs[0].font.size = Pt(10)
        c1.text = "" # Left blank for student to fill
        
        set_cell_background(c0, "F3EFFC")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, 80, 80, 120, 120)
        set_cell_margins(c1, 80, 80, 120, 120)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # 1. Objective
    h1 = doc.add_heading(level=2)
    r_h1 = h1.add_run("1. Objective")
    r_h1.bold = True
    r_h1.font.color.rgb = primary_color
    
    p_obj = doc.add_paragraph()
    p_obj.paragraph_format.space_after = Pt(10)
    p_obj.paragraph_format.line_spacing = 1.15
    p_obj.add_run(
        "Design and develop an original, responsive, and accessible Full Stack Web Application entitled "
        "\"TinySteps AI – Personalized Student Learning and Goal Development Coach\" using HTML5, CSS3, modern UI components, "
        "and JavaScript/TypeScript ES6+ on the frontend, integrated with a Node.js + Express backend and Google Gemini Generative AI SDK, "
        "demonstrating foundational and advanced concepts covered in Unit I and Unit II.\n\n"
        "The application solves academic procrastination and study overwhelm by allowing students to discover goals, "
        "break large academic syllabi into manageable multi-day action steps (15–30 min intervals), track progress interactively, "
        "render dynamic visual Mermaid flowcharts, and maintain state persistence across page reloads via localStorage."
    )
    
    # 2. Technologies Used
    h2 = doc.add_heading(level=2)
    r_h2 = h2.add_run("2. Technologies Used")
    r_h2.bold = True
    r_h2.font.color.rgb = primary_color
    
    tech_data = [
        ("HTML5", "Semantic elements (<header>, <main>, <form>, <textarea>, <button>, <kbd>, <pre>, <code>), structured content hierarchy, data-attributes, accessible ARIA roles (role=\"progressbar\", aria-label), meta tags, inline SVG favicon."),
        ("CSS3", "Advanced selectors, CSS box model, Flexbox layout (header actions, chat bubbles, task items), CSS Grid (suggested prompt chips), custom CSS variables (:root design tokens), typography, keyframe animations (@keyframes bounce, fadeIn, slideDown), glassmorphism, responsive media queries (@media for mobile & tablet)."),
        ("UI Components & Architecture", "Component hierarchy, modern cards, status badges (.online-badge, .header-goal-badge), animated progress bars, alert banners, interactive checklists, modal-style confirmation prompts, responsive tables."),
        ("JavaScript ES6+ / TypeScript", "Strong typing with TypeScript interfaces, variables (const, let), arrow functions, array operations (.map, .filter, .reduce, .some), object destructuring, template literals, asynchronous programming (async/await, Promises), ES modules."),
        ("DOM & Events", "Component state reactivity, event listeners (onClick, onChange, onKeyDown, onSubmit), Enter key submission with Shift+Enter multi-line support, auto-scrolling with scrollIntoView(), Clipboard API (navigator.clipboard.writeText), dynamic SVG generation."),
        ("Validation", "Client-side validation preventing empty/whitespace message submission, automatic button state disabling during pending requests, error handling banners, resilient JSON parsing with syntax sanitization."),
        ("Fetch API & Backend Integration", "Asynchronous data retrieval via fetch() POST/GET requests, RESTful API endpoints (/api/chat, /api/health), Node.js Express server, secure .env API key isolation, Google Gemini Generative AI SDK (@google/generative-ai).")
    ]
    
    table_tech = doc.add_table(rows=len(tech_data)+1, cols=2)
    table_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_tech.autofit = False
    
    # Header Row
    hdr_cells = table_tech.rows[0].cells
    hdr_cells[0].width = Inches(2.2)
    hdr_cells[1].width = Inches(4.5)
    hdr_cells[0].text = "Technology"
    hdr_cells[1].text = "Concepts / Features Used"
    for cell in hdr_cells:
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].runs[0].font.size = Pt(10)
        set_cell_background(cell, "EDE7FB")
        set_cell_margins(cell, 80, 80, 120, 120)
        
    for idx, (tech, concepts) in enumerate(tech_data, start=1):
        row = table_tech.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        c0.text = tech
        c0.paragraphs[0].runs[0].bold = True
        c0.paragraphs[0].runs[0].font.size = Pt(9.5)
        c1.text = concepts
        c1.paragraphs[0].runs[0].font.size = Pt(9.5)
        set_cell_background(c0, "FBF9FF" if idx % 2 == 1 else "FFFFFF")
        set_cell_background(c1, "FBF9FF" if idx % 2 == 1 else "FFFFFF")
        set_cell_margins(c0, 80, 80, 120, 120)
        set_cell_margins(c1, 80, 80, 120, 120)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # 3. Portfolio / Application Features
    h3 = doc.add_heading(level=2)
    r_h3 = h3.add_run("3. Application & Portfolio Features")
    r_h3.bold = True
    r_h3.font.color.rgb = primary_color
    
    features = [
        ("Home / Profile / Header", "Features an elegant lavender-dark purple navigation header with the application brand icon, live online pulse indicator, active goal tracker with real-time completion fraction (e.g. 2/5 steps), and a conversation reset button with safety confirmation modal."),
        ("About Me / Purpose & Mission", "Introduces TinySteps AI as an empathetic student productivity coach that dissolves academic overwhelm by transforming daunting exam goals and revision plans into small 15–30 minute micro-habits with zero guilt for missed days."),
        ("Skills & Core Capabilities", "Displays AI tutoring capabilities across disciplines: visual Mermaid flowcharts for system architectures and processes, Markdown comparison tables for technical trade-offs, syntax-highlighted code blocks with 1-click copy, and step-by-step mathematical derivations."),
        ("Projects & Interactive Modules", "Features the Interactive Multi-Day Study Plan module. Breaks goals down into Day 1, Day 2, etc., complete with topic descriptions, estimated completion durations, interactive checklist buttons, and visual progress bars."),
        ("Achievements & Highlights", "Achieves production-grade security and reliability: zero API key exposure in frontend code (keys stored in backend .env), multi-model resilience (gemini-3.5-flash-lite with failover), dynamic .env reloading, and dual-layer localStorage persistence."),
        ("Contact & Chat Interface", "Provides a conversational user interface featuring auto-expanding textarea, Enter key to send (Shift+Enter for multi-line), keyboard helper hints, and an animated three-dot jumping typing indicator."),
        ("JavaScript Interactive Features", "Interactive task completion toggles that recalculate progress percentages in real-time, one-click 'Tell Coach' buttons to communicate milestones, interactive Mermaid diagrams with source code toggle, and 1-click clipboard copy with visual checkmark feedback."),
        ("Other Features", "Includes 4 quick-start suggested prompt chips ('Create my study plan', 'Help me stop procrastinating', 'Break my exam preparation into tasks', 'Help me manage my time'), plan adjustment action requests ('Ask Coach to adjust schedule'), and seamless mobile responsiveness (100dvh).")
    ]
    
    for title, desc in features:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_after = Pt(4)
        r_b = p.add_run(f"• {title}: ")
        r_b.bold = True
        r_b.font.color.rgb = dark_text
        p.add_run(desc)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # 4. Implementation Details
    h4 = doc.add_heading(level=2)
    r_h4 = h4.add_run("4. Implementation Details")
    r_h4.bold = True
    r_h4.font.color.rgb = primary_color
    
    # 4.1 HTML5 & CSS3
    p_sec1 = doc.add_paragraph()
    r_s1 = p_sec1.add_run("HTML5 & CSS3 Implementation")
    r_s1.bold = True
    r_s1.font.size = Pt(11)
    
    html_css_items = [
        ("Semantic HTML5 structure", "Employed meaningful semantic tags throughout the component hierarchy: <header> for application branding and control actions, <main> with role=\"main\" for the scrollable message stream, <form> and <textarea> for accessible input submission, <pre> and <code> for programming snippets, <kbd> for keyboard shortcuts, and <table> for comparison tables."),
        ("CSS Flexbox / Grid", "Leveraged CSS Flexbox for complex alignment: user message bubbles (flex-direction: row-reverse) and AI bubbles (flex-direction: row), header brand rows, day group headers, and progress bars. Used CSS Grid with gap properties for suggested prompt chips (prompts-grid)."),
        ("Styling and layout", "Crafted a cohesive, student-friendly lavender, white, and midnight-purple theme (:root variables --bg-page: #F6F4FD, --purple-primary: #3B1768, --purple-dark: #200E3A). Enhanced visual ergonomics using subtle box shadows, rounded corner tokens (8px, 14px, 20px, 9999px), glassmorphic backdrops, and customized slim scrollbars."),
        ("Responsive design and media queries", "Implemented mobile-first responsive architecture using viewport units (100dvh, 100vw). Defined targeted media queries (@media (max-width: 768px) and @media (max-width: 480px)) that eliminate outer card margins, adjust padding, compact header tags, and ensure zero horizontal overflow on mobile screens."),
        ("Accessibility features", "Enriched interface with accessible attributes including aria-label on interactive buttons, role=\"progressbar\" with aria-valuenow on progress tracks, distinct color contrasts meeting WCAG guidelines, and keyboard accessibility (Tab navigation and Enter key execution).")
    ]
    
    for title, desc in html_css_items:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_after = Pt(4)
        r_b = p.add_run(f"• {title}: ")
        r_b.bold = True
        p.add_run(desc)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    
    # 4.2 Bootstrap & UI Components
    p_sec2 = doc.add_paragraph()
    r_s2 = p_sec2.add_run("UI Component Architecture & Bootstrap Concepts")
    r_s2.bold = True
    r_s2.font.size = Pt(11)
    
    bootstrap_items = [
        ("Navbar / Header", "Created a full-width header component featuring brand sparkler icon, application title, pulsing green online status badge, live goal progress chip, and a clear conversation button."),
        ("Grid System", "Structured input forms, suggested prompts, and multi-day study cards using responsive flex and grid wrappers that stack cleanly on mobile viewports."),
        ("Cards", "Engineered modular cards: chat message cards with tailored borders, interactive multi-day goal cards (.goal-card-widget), day-group cards (.day-card-group), and Mermaid diagram containers."),
        ("Forms", "Constructed an auto-growing textarea form with Enter key submission handling, submit button with hover transitions, and keyboard instruction hints."),
        ("Tables", "Engineered responsive data tables wrapped in horizontal scroll containers (.table-responsive-wrapper), featuring gradient headers, alternating row striping, and cell hover highlights."),
        ("Other components", "Implemented animated SVG progress tracks, badges/pills (.goal-pill-deadline, .goal-pill-time), alert notification banners (.error-banner) with dismiss actions, and two-step confirmation bars (.clear-confirm-bar).")
    ]
    
    for title, desc in bootstrap_items:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_after = Pt(4)
        r_b = p.add_run(f"• {title}: ")
        r_b.bold = True
        p.add_run(desc)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    
    # 4.3 JavaScript / TypeScript
    p_sec3 = doc.add_paragraph()
    r_s3 = p_sec3.add_run("JavaScript ES6+ & TypeScript Implementation")
    r_s3.bold = True
    r_s3.font.size = Pt(11)
    
    js_items = [
        ("Variables / Data Types", "Enforced strict static typing using TypeScript interfaces (Message, GoalTask, GoalData, GroupedDay). Utilized ES6 block-scoped const and let declarations for immutable references."),
        ("Functions / Arrow Functions", "Implemented modular arrow functions for state setters and event handlers (handleSendMessage, handleToggleTask, handleReportProgress, handleRequestAdjustment, handleClearChat)."),
        ("Arrays / Objects", "Maintained state immutability via object spread operators (...prev, ...msg). Utilized array processing methods (.map(), .filter(), .reduce(), .some()) for task checklist updates and percentage calculations."),
        ("Conditions / Loops", "Built validation logic checking for empty/whitespace inputs, conditional class name resolution for completed states, and model failover iteration loops on the Express backend."),
        ("DOM Manipulation", "Utilized React Virtual DOM reconciliation for high-performance rendering. Interacted directly with the DOM via React useRef for auto-scrolling to the latest message and auto-sizing textarea height."),
        ("Event Handling", "Attached declarative event handlers: onChange for input synchronization, onKeyDown for Enter key interception (with Shift+Enter multiline detection), onSubmit for form handling, and onClick for task toggles."),
        ("Form Validation", "Implemented two-tier validation: frontend client-side validation disabling send buttons on empty input, and backend validation returning HTTP 400 for invalid strings and HTTP 503 for missing API configurations."),
        ("Dynamic Features", "Rendered interactive Mermaid SVG diagrams dynamically in the browser, computed live progress bar percentages, provided one-click clipboard copying via navigator.clipboard.writeText, and synchronized dual localStorage persistence keys.")
    ]
    
    for title, desc in js_items:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_after = Pt(4)
        r_b = p.add_run(f"• {title}: ")
        r_b.bold = True
        p.add_run(desc)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # 5. Screenshots
    h5 = doc.add_heading(level=2)
    r_h5 = h5.add_run("5. Screenshots")
    r_h5.bold = True
    r_h5.font.color.rgb = primary_color
    
    p_ss_intro = doc.add_paragraph()
    p_ss_intro.add_run("Include screenshots of the completed application running in the browser.")
    p_ss_intro.paragraph_format.space_after = Pt(8)
    
    screenshots = [
        ("Screenshot 1: Desktop / Home Page", "Full-width desktop view showing the application header, online status badge, initial welcome message from TinySteps AI, and 4 suggested quick-start prompt chips in the lavender-purple theme.", "[Insert Screenshot 1: Desktop Home Interface Here]"),
        ("Screenshot 2: Mobile / Responsive View", "Mobile screen view (375px/412px width) demonstrating full-height 100dvh layout, compact header, touch-friendly prompt chips, and adapted chat bubbles.", "[Insert Screenshot 2: Mobile Viewport Interface Here]"),
        ("Screenshot 3: JavaScript Interactive Feature (Goal Card & Mermaid Diagram)", "Interactive Multi-Day Study Plan card with Day 1/Day 2 task checklists, visual progress bar (e.g. 50% complete), and an embedded visual Mermaid flowchart diagram.", "[Insert Screenshot 3: Interactive Goal Card & Mermaid Flowchart Here]"),
        ("Screenshot 4: Form Validation & Dynamic Features", "Active chat conversation demonstrating client-side validation, three-dot jumping typing indicator while AI is reasoning, and copy-to-clipboard confirmation state.", "[Insert Screenshot 4: Form Validation & Typing Indicator Here]")
    ]
    
    for title, desc, placeholder in screenshots:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        r_t = p.add_run(title)
        r_t.bold = True
        p_d = doc.add_paragraph()
        p_d.paragraph_format.left_indent = Inches(0.25)
        p_d.paragraph_format.space_after = Pt(4)
        p_d.add_run(desc)
        
        # Placeholder Box
        p_box = doc.add_paragraph()
        p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_box.paragraph_format.space_after = Pt(12)
        r_box = p_box.add_run(f"\n{placeholder}\n")
        r_box.italic = True
        r_box.font.color.rgb = gray_text
        r_box.font.size = Pt(10)
        
    # 6. Testing
    h6 = doc.add_heading(level=2)
    r_h6 = h6.add_run("6. Testing")
    r_h6.bold = True
    r_h6.font.color.rgb = primary_color
    
    test_cases = [
        ("Navigation & Header Actions", "Header buttons click, 'Clear Chat' triggers two-step confirmation bar, confirmed reset clears history.", "Confirmation bar appears; confirming clears chat and active goal cleanly.", "Pass"),
        ("Chat Input with Valid Data", "Message is sent, textarea clears, typing indicator appears, AI response renders with markdown.", "Message posted, typing dots animate, AI responds with formatted coaching text.", "Pass"),
        ("Chat Input with Invalid/Empty Data", "Empty/whitespace input is prevented from sending; send button disabled.", "Send button is disabled, form submission blocked, no network calls fired.", "Pass"),
        ("Interactive Goal Checklist & Progress", "Clicking task checkbox toggles completion, updates progress bar percentage and header counter.", "Checkmark toggles, progress bar animates to new percentage, data saved to localStorage.", "Pass"),
        ("Mobile View & Responsiveness", "Application layout adapts cleanly on screens <= 768px without horizontal scrolling.", "Full-height 100dvh viewport utilized; text, buttons, and tables wrap and scroll cleanly.", "Pass"),
        ("Visual Mermaid Diagrams Rendering", "Mermaid code blocks render as visual SVG flowcharts with source code toggle.", "SVG flowchart renders visually in chat with toggle button to inspect code.", "Pass"),
        ("Plan Adjustment Request Action", "Clicking 'Ask Coach to adjust schedule' generates automated adjustment prompt to AI.", "Prompt is automatically dispatched to coach; coach responds with revised schedule.", "Pass")
    ]
    
    table_test = doc.add_table(rows=len(test_cases)+1, cols=4)
    table_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_test.autofit = False
    
    t_hdr = table_test.rows[0].cells
    t_hdr[0].width = Inches(1.8)
    t_hdr[1].width = Inches(2.2)
    t_hdr[2].width = Inches(2.0)
    t_hdr[3].width = Inches(0.8)
    t_hdr[0].text = "Test Case"
    t_hdr[1].text = "Expected Result"
    t_hdr[2].text = "Actual Result"
    t_hdr[3].text = "Status"
    for cell in t_hdr:
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].runs[0].font.size = Pt(9.5)
        set_cell_background(cell, "EDE7FB")
        set_cell_margins(cell, 80, 80, 100, 100)
        
    for idx, (tc, exp, act, stat) in enumerate(test_cases, start=1):
        row = table_test.rows[idx]
        c0, c1, c2, c3 = row.cells[0], row.cells[1], row.cells[2], row.cells[3]
        c0.width = Inches(1.8)
        c1.width = Inches(2.2)
        c2.width = Inches(2.0)
        c3.width = Inches(0.8)
        
        c0.text = tc
        c0.paragraphs[0].runs[0].bold = True
        c0.paragraphs[0].runs[0].font.size = Pt(9)
        c1.text = exp
        c1.paragraphs[0].runs[0].font.size = Pt(9)
        c2.text = act
        c2.paragraphs[0].runs[0].font.size = Pt(9)
        c3.text = stat
        c3.paragraphs[0].runs[0].bold = True
        c3.paragraphs[0].runs[0].font.size = Pt(9)
        c3.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x15, 0x80, 0x3D) # Green for Pass
        
        bg = "FBF9FF" if idx % 2 == 1 else "FFFFFF"
        for c in (c0, c1, c2, c3):
            set_cell_background(c, bg)
            set_cell_margins(c, 80, 80, 100, 100)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # 7. Learning Outcomes
    h7 = doc.add_heading(level=2)
    r_h7 = h7.add_run("7. Learning Outcomes")
    r_h7.bold = True
    r_h7.font.color.rgb = primary_color
    
    p_lo = doc.add_paragraph()
    p_lo.paragraph_format.line_spacing = 1.15
    p_lo.paragraph_format.space_after = Pt(6)
    p_lo.add_run(
        "Through this assignment, I achieved comprehensive hands-on learning across key Full Stack Development competencies:\n\n"
        "1. Full Stack Architecture & Separation of Concerns: Learned how to integrate a modern frontend (React 19 + TypeScript + Vite) "
        "with an Express.js backend, maintaining strict security standards by isolating external API keys in server-side environment variables.\n\n"
        "2. Advanced CSS3, Responsive Design & Accessibility: Mastered complex CSS layouts using Flexbox and Grid, mobile-first responsive "
        "design using viewport units (100dvh) and media queries, custom CSS variables for theme consistency, and accessibility standards with ARIA roles.\n\n"
        "3. Component-Based React & TypeScript: Gained deep expertise in React component hierarchy, custom hooks, reactive state management, "
        "and TypeScript interfaces ensuring robust static typing and maintainable codebases.\n\n"
        "4. Client-Side Persistence with localStorage: Implemented dual-key persistence strategies for storing chat conversation history and "
        "active study plan progress, ensuring state survives browser reloads.\n\n"
        "5. Asynchronous Programming & Generative AI Integration: Mastered asynchronous API handling using the Fetch API, Promises, and async/await. "
        "Learned prompt engineering and model failover strategies to connect Google's Gemini SDK with real-time conversational user interfaces.\n\n"
        "6. Dynamic Visualizations & Markdown Rendering: Learned how to embed live SVG flowcharts (Mermaid.js) and GitHub-Flavored Markdown "
        "tables within asynchronous text streams, creating an engaging and educational user experience."
    )
    
    output_path = r"C:\FSD\TinySteps_AI\Full_Stack_Development_Assignment_1.docx"
    doc.save(output_path)
    print(f"Assignment document successfully created at: {output_path}")

create_assignment_document()

