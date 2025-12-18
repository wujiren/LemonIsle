# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **frontend web application demo** for "联萌岛" (LemonIsle), a child safety escort service. The application simulates a child's journey from school to a safe island and then home with a guardian escort. It's a **single-page interactive demonstration** designed for mobile devices.

## Technology Stack

- **HTML5** - Semantic structure with mobile-first design
- **CSS3** - Advanced styling with Flexbox, Grid, animations, and responsive design
- **Vanilla JavaScript (ES6+)** - No frameworks or libraries
- **SVG** - For path drawing and map routes
- **Font Awesome 6.4.0** - Icon library via CDN
- **Google Fonts** - "Noto Sans SC" Chinese font via CDN

## Architecture

### Three-Layer Visual Design
The application uses a three-layer visual hierarchy:

1. **Background Map Layer** (`map-background` class)
   - Static location markers (school, safe island, home)
   - SVG paths connecting locations
   - Visual landmarks and decorations

2. **Dynamic Character Layer** (`character-layer` class)
   - Child avatar (warm color theme: orange/yellow)
   - Guardian avatar (cool color theme: blue/green)
   - Animated movement along predefined paths

3. **Floating Control Layer** (`control-panel` class)
   - State information and status updates
   - Interactive action buttons
   - Time simulation display

### State Management
The application uses a **finite state machine** with 5 phases defined in `script.js:2-9`:

1. `PHASE_0_READY` - Initial state, ready to start
2. `PHASE_1_WALKING` - Child walking from school to safe island
3. `PHASE_2_WAITING` - Child waiting/playing at safe island
4. `PHASE_3_MATCHING` - Guardian matching/dispatch phase
5. `PHASE_4_ESCORTING` - Guardian escorting child home
6. `PHASE_5_FINISHED` - Journey completed

### Animation System
- **Promise-based sequential animations** using `moveCharacter()` function
- **CSS transitions** for smooth movement (`transition: all 3s linear`)
- **Visual feedback** through CSS class toggling (breathing effects, pulsing)

### Time Simulation
- **Accelerated time** during waiting phase (10 minutes per second)
- **Mock clock** displayed in control panel
- **Stay time counter** tracks duration at safe island

## Development Workflow

### No Build System Required
This is a pure frontend project that runs directly in the browser. There is no compilation, bundling, or transpilation needed.

### Common Development Commands

**Open the application in browser:**
```bash
# macOS
open index.html

# Using Python HTTP server (for cross-device testing)
python3 -m http.server 8000
# Then open http://localhost:8000 in browser
```

**Development workflow:**
1. Edit HTML/CSS/JS files directly
2. Refresh browser to see changes
3. Use browser Developer Tools (F12) for debugging

**Debugging:**
- Check browser console for `console.log` statements
- Inspect elements and CSS styles
- Monitor network requests (none required - all static)

### File Structure
```
index.html      # Main HTML with three-layer UI structure
script.js       # Core JavaScript: state machine, animations, event handlers
style.css       # CSS: responsive design, animations, visual effects
界面布局.md     # UI Layout Design (Chinese documentation)
业务流程.md     # Business Process Flow (Chinese documentation)
```

## Key Implementation Details

### Coordinate System
- Uses **percentage-based positioning** for cross-device compatibility
- Key coordinates defined in `MAP_POINTS` object (`script.js:12-20`)
- Paths drawn with SVG `<path>` elements using cubic Bézier curves

### Character Movement
- `moveCharacter(element, target, duration)` function handles all movement
- Returns a Promise for sequential animation chaining
- Uses CSS transforms for smooth transitions

### UI Updates
- State changes trigger UI updates via `updateUI()` function
- Button text and state dynamically change based on current phase
- Toast notifications provide user feedback

### Responsive Design
- Mobile-first approach with `@media` queries for small screens
- Percentage-based sizing and positioning
- Touch-friendly interface with appropriate button sizes

## Mock Data
All data is hardcoded in `script.js`:
- `MAP_POINTS` - Location coordinates
- `GUARD_INFO` - Guardian information (name, rating, phone)
- Time simulation variables
- State machine definitions

## Testing
No formal testing framework. Testing is done manually:
1. Open application in browser
2. Follow the interactive demo flow
3. Verify state transitions and animations
4. Check responsive behavior on different screen sizes

## Documentation
- **`界面布局.md`** - Detailed UI design specifications and demo script
- **`业务流程.md`** - Business process flow and functional requirements
- Code is well-commented with clear function purposes
- CSS organized with logical sections and comments

## Deployment
- Can be deployed to any static web hosting service
- No server-side requirements
- Works offline after initial load (all dependencies via CDN)