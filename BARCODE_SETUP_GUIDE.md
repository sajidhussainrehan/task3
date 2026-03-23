# 🚀 Barcode Camera Setup Guide

## Quick Start

### Step 1: Install Dependencies
```bash
cd frontend
npm install html5-qrcode
```

### Step 2: Verify Component
The `AttendanceManager.js` component has been updated with camera functionality. No additional imports needed in parent components.

### Step 3: Configure Student Barcodes

Your students need barcodes. Choose one or more formats:

#### Option A: Generate Barcodes from Student IDs
```javascript
// Use the existing student.id (UUID format)
// Most barcodes can encode this directly
```

#### Option B: Create Custom Barcode Numbers
Add a `barcode` field to each student:

```python
# Backend: Student model
class Student(BaseModel):
    id: str  # UUID
    name: str
    email: str
    barcode: Optional[str] = None  # Add this field
    phone: Optional[str] = None
```

#### Option C: Generate QR Codes
Students can have QR codes pointing to their public profile:
```
https://yourdomain.com/public/{student_id}
```

### Step 4: Test the System

1. **Start your backend server**
   ```bash
   cd backend
   python -m uvicorn server:app --reload
   ```

2. **Start your frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Test Attendance Manager**
   - Navigate to Dashboard/Teacher section
   - Click "بدء جلسة الحضور" (Start Attendance Session)
   - Test manual input mode first
   - Test camera mode with a QR code or barcode

### Step 5: Print Student Barcodes

Generate and print barcodes for each student:

```javascript
// Example barcode generation
const studentId = "550e8400-e29b-41d4-a716-446655440000";
const barcodeValue = student.barcode || student.id;

// Use a barcode library to print:
// npm install jsbarcode
```

Sample printing setup:
```html
<img id="barcode" src="" />
<script>
  JsBarcode("#barcode", "STU-2024-001", {
    format: "CODE128"
  });
</script>
```

---

## Features Summary

### ✅ What's New

| Feature | Description |
|---------|-------------|
| **📷 Camera Mode** | Scan barcodes directly from device camera |
| **⌨️ Manual Mode** | Type or paste barcode/student ID |
| **🔄 Auto-Detection** | Automatically finds student from barcode |
| **⚡ Real-time** | Instant scan processing and feedback |
| **🛡️ Validation** | Prevents duplicate scans within 1 second |
| **🎯 QR Support** | Scans both barcodes and QR codes |
| **📱 Mobile Ready** | Works on phones and tablets |

### 🎨 UI Components

**Mode Toggle**
- Click button to switch between manual and camera modes
- Settings persist during session

**Camera Feed**
- Live video feed with detection overlay
- Focus on scanning area (yellow box)
- Auto-stop or manual stop button

**Manual Input**
- Text field for typing/pasting
- Submit button
- Keyboard shortcut: Enter key

**Feedback Display**
- Green success animation for valid scans
- Red error message for invalid barcodes
- Orange warning for duplicates
- Student name and points awarded shown immediately

---

## Configuration Options

### Adjust Camera Settings

Edit `AttendanceManager.js` line ~52:
```javascript
const scanner = new Html5QrcodeScanner(
  "barcode-scanner",
  {
    fps: 10,                              // Increase for faster detection
    qrbox: { width: 250, height: 250 },  // Increase detection area
    aspectRatio: 1.33,                   // Match your camera ratio
    disableFlip: false,                  // Allow device rotation
  },
  false
);
```

### Customize Duplicate Prevention
Edit `AttendanceManager.js` line ~70:
```javascript
const now = Date.now();
if (lastScannedRef.current && now - lastScannedRef.current < 1000) {
  // Change 1000 to different milliseconds if needed
  return;
}
```

### Adjust Student Search Logic
Edit `AttendanceManager.js` in `processBarcodeData()`:
```javascript
const student = students.find(s => 
  s.id.toLowerCase() === parsedInput.toLowerCase() ||
  // Add more conditions for different barcode formats
  s.customField?.toLowerCase() === parsedInput.toLowerCase()
);
```

---

## Barcode Format Examples

### Standard Code 128 Barcode
```
Value: STU2024001
Contains: Student number
```

### QR Code with URL
```
URL: http://localhost:3001/public/550e8400-e29b-41d4-a716-446655440000
Scans to: Student ID extraction
```

### Student UUID
```
Value: 550e8400-e29b-41d4-a716-446655440000
Format: Universal barcode format
```

### Custom Format
```
Prefix: STU-
Year: 2024
Number: 001
Full: STU-2024-001
```

---

## Troubleshooting

### Camera Won't Start
**Symptoms**: "❌ لا يمكن الوصول للكاميرا" message

**Solutions**:
1. Check browser permissions:
   - Chrome: ⚙️ Settings → Privacy → Camera
   - Firefox: ⋮ → Privacy → Permissions → Camera
   - Safari: Settings → Privacy → Camera

2. Try HTTPS (some browsers require it):
   ```bash
   # Use HTTPS in production
   # For local: localhost works without HTTPS
   ```

3. Try different browser (Firefox, Chrome, Edge)

4. Restart browser and try again

5. Clear camera cache:
   - Close all tabs using camera
   - Restart browser
   - Try again

### Barcode Won't Scan
**Symptoms**: Camera active but no detection

**Causes & Solutions**:
| Problem | Solution |
|---------|----------|
| Poor barcode quality | Print new barcodes with better resolution |
| Low light | Improve lighting (move to bright area) |
| Distance too far | Move camera closer (6-12 inches away) |
| Angle wrong | Align camera perpendicular to barcode |
| Dirty camera lens | Clean with soft cloth |
| Camera too fast | Decrease fps in settings |

### Student Not Found After Scan
**Symptoms**: Green scan but "Student not found" error

**Causes & Solutions**:
1. Check student exists in database
2. Verify barcode format matches:
   ```javascript
   // Edit parseBarcode() function if needed
   // Add debug logs to see what's being scanned
   ```
3. Ensure student.barcode field is populated
4. Try manual input to verify student exists

### Duplicate Scan Prevention Too Strict
**Symptoms**: Can't re-scan same student within 1 second

**Solution**: Adjust timing in code:
```javascript
const now = Date.now();
// Change 1000 to 500 for 0.5 second, or 2000 for 2 seconds
if (lastScannedRef.current && now - lastScannedRef.current < 1000) {
  return;
}
```

### Camera Freezes
**Symptoms**: Video feed stops moving

**Solution**:
1. Click "⏹️ إيقاف الكاميرا" (Stop Camera)
2. Click "▶️ تشغيل الكاميرا" (Start Camera) again
3. If still frozen, refresh page
4. Check browser resource usage (Task Manager)

---

## Performance Tips

### For Better Camera Performance
1. Close other applications using camera
2. Ensure good lighting conditions
3. Use modern browser (Chrome, Firefox, Edge)
4. Keep device cool (excessive heat reduces performance)
5. Use good quality USB camera if on desktop

### For Faster Barcode Detection
1. Increase fps:
   ```javascript
   fps: 20,  // Default 10, increase to 20-30
   ```

2. Increase detection box:
   ```javascript
   qrbox: { width: 350, height: 350 },  // Larger area
   ```

3. Print high-contrast barcodes
4. Maintain proper lighting

### Optimize for Mobile
1. Portrait orientation (camera works best)
2. Reduce screen brightness to avoid glare
3. Clear browser cache periodically
4. Close other tabs
5. Use modern mobile browser

---

## Integration Checklist

- [ ] Dependencies installed: `npm install html5-qrcode`
- [ ] Component updated with camera code
- [ ] Student database has `barcode` field (optional)
- [ ] Barcodes printed for all students
- [ ] Backend API running and accessible
- [ ] Frontend running without errors
- [ ] Manual input mode tested ✓
- [ ] Camera mode tested ✓
- [ ] QR code scanning works ✓
- [ ] Barcode scanning works ✓
- [ ] Duplicate prevention works ✓
- [ ] Attendance records saving ✓
- [ ] Mobile browsers tested ✓
- [ ] Production deployment ready ✓

---

## Next Steps

1. **Generate Student Barcodes**
   - Use barcode library: `npm install jsbarcode`
   - Or use online barcode generator

2. **Print Barcodes**
   - Print on durable labels
   - Laminate for durability
   - Distribute to students

3. **Train Staff**
   - Show how to use camera mode
   - Demonstrate barcode scanning
   - Provide manual mode backup

4. **Monitor & Improve**
   - Track scan success rate
   - Gather user feedback
   - Adjust settings as needed
   - Add more barcode formats if needed

---

## API Endpoints Used

### Start Attendance Session
```
POST /api/attendance/start
Response: { id, started_at, is_active }
```

### Scan Student Attendance
```
POST /api/attendance/{session_id}/scan
Body: { student_id, barcode }
Response: { student, status, points, already_scanned }
```

### Fetch Attendance
```
GET /api/attendance/today
Response: { session, records }
```

### Stop Timer
```
POST /api/attendance/{session_id}/stop
Response: { ended_at }
```

### Finalize Attendance
```
POST /api/attendance/{session_id}/finalize
Response: { present_count, absent_count }
```

---

## Support Resources

1. **html5-qrcode Documentation**
   - GitHub: https://github.com/mebjas/html5-qrcode
   - Docs: https://mebjas.github.io/html5-qrcode/

2. **Barcode Standards**
   - CODE128: General purpose barcode
   - QR Code: 2D barcode with more data
   - EAN: Product barcodes

3. **Browser Camera API**
   - MDN: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices

---

**Last Updated**: March 23, 2026  
**Version**: 1.0  
**Status**: ✅ Ready for Production
