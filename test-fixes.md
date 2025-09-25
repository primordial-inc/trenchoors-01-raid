# 🧪 Testing Guide for Player Animations & Boss Mechanics Fixes

## 🚀 Quick Test Commands

### 1. Start the Server
```bash
cd packages/server
yarn dev
```

### 2. Start the React App
```bash
cd packages/app  
yarn dev
```

### 3. Start Player CLI
```bash
cd packages/server
yarn player
```

## 🎮 Test Movement Animations

1. **Join the game:**
   ```bash
   join TestPlayer
   ```

2. **Test movement commands:**
   ```bash
   right
   up
   left
   down
   ```

3. **Expected Result:** Player should smoothly glide between positions (no teleporting)

4. **Check Console Logs:** Look for:
   - `🎬 SERVER: Processing move right for player TestPlayer`
   - `🎬 SERVER: Move successful! Broadcasting playerMoved event`
   - `🎬 Starting smooth movement animation...`
   - `🎬 Smooth movement completed, updating game state`

## ⚔️ Test Attack Animations

1. **Start the game via admin CLI:**
   ```bash
   cd packages/server
   yarn admin
   ```
   Then run: `start`

2. **Attack via player CLI:**
   ```bash
   attack
   ```

3. **Expected Result:** Player sprite should play attack animation

4. **Check Console Logs:** Look for:
   - `🎬 SERVER: Processing attack for player TestPlayer`
   - `🎬 SERVER: Attack successful! Broadcasting playerAttacked event`
   - `🎬 Calling triggerPlayerAttack...`

## 🔥 Test Boss Mechanics

1. **Start game and join with a player** (as above)

2. **Wait for automatic mechanic OR manually trigger:**
   ```bash
   curl -X POST http://localhost:3000/admin/trigger-mechanic
   ```

3. **Expected Result:** You should see warning indicators on the grid with countdown timers (same as your manual control buttons)

4. **Check Console Logs:** Look for:
   - `🔥 SERVER: Broadcasting boss mechanic:`
   - `🎬 Triggering mechanic visualization: meteor_strike`
   - `🚀 Showing meteor strike warning:`

## 🐛 Debug Checklist

### Server Logs Should Show:
- ✅ `🎬 SERVER: Broadcasting playerMoved event`
- ✅ `🎬 SERVER: Broadcasting playerAttacked event` 
- ✅ `🔥 SERVER: Broadcasting boss mechanic:`

### React Console Should Show:
- ✅ `📥 Socket received: playerMoved`
- ✅ `📥 Socket received: playerAttacked`
- ✅ `📥 Socket received: bossMechanic`
- ✅ `🎬 Battlefield ref available: true`

### Visual Indicators:
- ✅ **Movement:** Players glide smoothly instead of teleporting
- ✅ **Attack:** Attack animation plays when attacking
- ✅ **Mechanics:** Visual warnings appear automatically from server (not just manual buttons)

## 🔧 Manual Testing in React App

1. **Open React app** in browser (usually http://localhost:5173)

2. **Switch to Server Mode** using the toggle button

3. **Use the debug test button** in the connection status panel to manually test mechanics

4. **Verify battlefield reference** is properly set (should show ✅ in debug info)

## 🚨 Troubleshooting

### If Movement Still Teleports:
- Check that `movePlayerSmooth` returns a Promise
- Verify battlefield reference is set before movement events
- Check console for animation completion logs

### If Attack Animations Don't Work:
- Verify `triggerPlayerAttack` method exists on GridBattlefield
- Check that playerAttacked events are being received
- Ensure battlefield reference is available

### If Boss Mechanics Don't Show:
- Check server logs for mechanic broadcast
- Verify mechanic data structure matches expected format
- Test manual mechanic buttons to confirm visual systems work
- Check battlefield reference is set in server mode

## 📊 Success Criteria

All fixes are working when:
1. ✅ Players move smoothly with animations
2. ✅ Attack animations play on successful attacks  
3. ✅ Boss mechanics show visual warnings automatically
4. ✅ Console shows proper event flow logs
5. ✅ Manual control buttons still work for testing
