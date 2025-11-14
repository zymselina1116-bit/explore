# 3D Exploration Adventure Game

A stylized 3D first-person exploration game with multiple scenes, collectible items, interactive objects, and a narrative structure. Built with HTML, CSS, and Three.js.

## 🎮 Game Overview

Experience a charming adventure through 5 unique scenes:
1. **Metallic Room** - Find the card key and unlock the door
2. **Office Floor** - Collect three evidence items from a glowing desk
3. **Dreamlike Garden** - Discover three decorative artifacts among flowers
4. **Courtyard** - Deliver all collected items to the mailbox
5. **Celebration** - Meet friendly characters and celebrate your success!

## 🕹️ Controls

### Movement
- **Arrow Keys** / **WASD** - Move forward/backward and strafe left/right
- **Click + Drag** - Rotate camera view
- **Single Click** - Interact with objects (open doors, drawers, etc.)
- **Double Click** - Pick up special items (keys, collectibles)

### UI
- **Backpack Icon** (right side) - Click to view collected items
- **Progress Tracker** (top right) - Shows collection progress in scenes 2 & 3

## 🎯 How to Play

### Scene 1: Metallic Room
1. Look around the room with red pulsing lights
2. Find the key board on the wall
3. **Double-click** the card-type key (orange/golden colored)
4. Approach the card reader next to the glass door
5. **Single-click** the card reader to unlock the door
6. Walk through to Scene 2

### Scene 2: Office Floor
1. Explore the large office space
2. Find the glowing desk (it emits a blue glow)
3. **Single-click** the drawer to open it
4. **Single-click** each evidence item to collect:
   - Creature Sketch 🎨
   - Profile Card 📋
   - Location Map 🗺️
5. Once all 3 items are collected, find the key board near the wooden door
6. **Double-click** the golden key to pick it up
7. **Single-click** the wooden door to unlock and proceed

### Scene 3: Dreamlike Garden
1. Enjoy the warm, dusk-lit indoor garden with a central fountain
2. Search among the flower patches for glowing artifacts
3. **Single-click** each bone-shaped artifact to collect (3 total)
4. Find the decorative bell next to the double doors
5. **Double-click** the bell to ring it and unlock the doors
6. Proceed to Scene 4

### Scene 4: Courtyard
1. You're in a bright, open courtyard
2. Click the **Backpack Icon** on the right side of the screen
3. **Double-click** each item in your backpack to drop it
4. Close the backpack
5. **Single-click** the mailbox to deliver all items
6. Watch the transition to the celebration!

### Scene 5: Celebration
1. Meet the friendly creature and cheering characters
2. Enjoy the confetti and celebration
3. Click **Play Again** to restart the adventure

## 🎨 Features

### Visual Style
- Stylized 3D indie game aesthetic
- Soft volumetric lighting and atmospheric fog
- Metallic surfaces with realistic reflections
- Warm and cool color palettes for different moods
- Pulsing lights and animated elements

### Animated Avatar
A cute cartoon character at the bottom center of the screen reacts to your actions:
- **Idle** - Gentle bouncing when holding items
- **Picking Up** - Bends and lifts with a bounce
- **Using Keys** - Weight-shift animation
- **Opening Drawers** - Forward lean
- **Dropping Items** - Playful toss animation
- **Item Glow** - Golden glow appears at waist when holding items

### Interactive Objects
- Keys with different designs (card keys, vintage keys, ordinary keys)
- Doors that slide or swing open
- Drawers that reveal hidden items
- Collectible evidence and artifacts
- Decorative elements (fountain, flowers, lights)
- Mailbox for item delivery
- Bell that rings when activated

## 🚀 Running the Game

### Option 1: Simple HTTP Server (Recommended)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then open your browser to: `http://localhost:8000`

### Option 2: Live Server (VS Code)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Direct File Opening (May have limitations)
Simply open `index.html` in a modern web browser. Note: Some browsers may restrict certain features when opening files directly.

## 🛠️ Customization Guide

### Changing Colors

**Scene 1 - Metallic Room:**
```javascript
// In script.js, find setupScene1()
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x8899aa, // Change this hex color
    metalness: 0.7,
    roughness: 0.3
});
```

**Red Lights:**
```javascript
const redLight1 = new THREE.PointLight(0xff0000, 2, 15);
// Change 0xff0000 to any color (e.g., 0x00ff00 for green)
```

### Adjusting Movement Speed
```javascript
// In animate() function
const moveSpeed = 0.1; // Increase for faster movement (e.g., 0.2)
```

### Modifying Camera Sensitivity
```javascript
// In mousemove event listener
cameraRotation.yaw -= deltaX * 0.003; // Increase 0.003 for more sensitivity
cameraRotation.pitch -= deltaY * 0.003;
```

### Adding More Items
**Scene 2 Evidence Items:**
```javascript
// In createOfficeDesk() function, add:
createEvidenceItem(deskGroup, x, y, z, 'newItem', '🎁');
// Remember to update GameState.progressMax
```

**Scene 3 Artifacts:**
```javascript
// In setupScene3(), add:
createFlowerPatch(x, y, z, 0xff6699, true, 'artifact4', '🦴');
// Remember to update GameState.progressMax
```

### Changing Lighting
**Ambient Light (overall brightness):**
```javascript
const ambientLight = new THREE.AmbientLight(0x666666, 0.5);
// First parameter: color, Second parameter: intensity (0-1)
```

**Point Lights (localized glow):**
```javascript
const light = new THREE.PointLight(0xffffff, 1, 10);
// Parameters: color, intensity, distance
```

### Modifying Fog
```javascript
// In scene setup
scene.fog = new THREE.FogExp2(0x000000, 0.015);
// Parameters: color, density (higher = thicker fog)
```

### Customizing Avatar
**Avatar colors are in the HTML SVG:**
```html
<!-- In index.html, find #player-avatar -->
<rect fill="#4A90E2" ... /> <!-- Body color -->
<rect fill="#2C3E50" ... /> <!-- Pants color -->
```

**Avatar animations in CSS:**
```css
/* In style.css, modify keyframes */
@keyframes avatar-pickup {
    /* Adjust timing and transforms */
}
```

## 📁 File Structure

```
/
├── index.html          # Main HTML structure and UI elements
├── style.css          # All styling and avatar animations
├── script.js          # Game logic, Three.js scenes, interactions
└── README.md          # This file
```

## 🔧 Technical Details

### Dependencies
- **Three.js r128** - Loaded via CDN (no installation needed)

### Browser Compatibility
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance Notes
- The game uses WebGL for 3D rendering
- Recommended: GPU with WebGL 2.0 support
- Lower-end devices may experience reduced frame rates in Scene 3 (garden) due to particle effects

### Known Limitations
- No mobile touch controls (keyboard + mouse required)
- No save/load system (progress resets on page reload)
- Simplified collision detection (player can walk through some objects)

## 🎭 Safety & Content

This game is designed to be:
- ✅ Safe for all audiences
- ✅ Non-violent and wholesome
- ✅ Fictional and narrative-focused
- ✅ Educational and playful
- ❌ No real-world harmful content
- ❌ No horror, gore, or violent elements
- ❌ No sensitive or restricted themes

## 🐛 Troubleshooting

**Issue: Black screen on load**
- Solution: Make sure you're running via HTTP server, not opening file directly
- Check browser console for errors (F12)

**Issue: Controls not working**
- Solution: Click on the game canvas to focus it
- Make sure you're not clicking while a modal is open

**Issue: Items not appearing**
- Solution: Make sure you've followed the interaction steps correctly
- Some items only appear after completing previous steps (e.g., drawer must be opened first)

**Issue: Can't progress to next scene**
- Solution: Check the progress tracker (top right) to ensure all items are collected
- Make sure you're using the correct interaction (single vs double click)

## 📝 Credits

- Built with **Three.js** - 3D library for WebGL
- Font: System fonts (Segoe UI, Verdana, sans-serif)
- Icons: Unicode emoji characters
- Design: Inspired by stylized indie adventure games

## 📄 License

This project is open source and free to use for educational and personal purposes.

---

**Enjoy your adventure! 🎮✨**
