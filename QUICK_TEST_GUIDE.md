# Quick Test Guide - Face Image Pipeline

## Current Status
✅ Backend: Running on http://localhost:5000
✅ Frontend: Running on http://localhost:3000
✅ All critical bugs fixed

## Test Sequence

### 1. Test Registration (Face Image Upload)

**Steps:**
1. Open http://localhost:3000
2. Click "Register"
3. Fill in form:
   - Name: Test User
   - Email: test2@example.com
   - Password: Test@123
   - Confirm Password: Test@123
   - PIN: 1234

4. **Capture Face:**
   - Allow camera permissions
   - Click "📸 Capture Face"
   - Verify green border appears
   - Verify "✓ Face captured successfully" message

5. Click "Register"

**Expected Result:**
- Registration succeeds
- Redirects to dashboard
- No console errors

**If Fails:**
- Check browser console for errors
- Check server logs for "Face verification: Missing face image data"
- Verify webcam permissions granted

---

### 2. Test Document Upload

**Steps:**
1. From dashboard, click "Upload Document"
2. Select any file (PDF, TXT, image)
3. Set expiry time (at least 1 hour from now)
4. Click "Upload & Secure Document"

**Expected Result:**
- Success message appears
- Redirects to vault
- Document appears in vault

---

### 3. Test Document Extraction (Main Test)

**Steps:**
1. Go to "Vault" page
2. Click "Extract" on uploaded document
3. **Capture Face:**
   - Click "📸 Capture Face"
   - Verify green border
   - Verify success message
4. Enter PIN: 1234
5. Click "✅ Verify & Extract"

**Expected Result:**
- File downloads successfully
- Success alert appears
- Modal closes
- No console errors

**Check Server Logs:**
```
Extract request received: {
  documentId: '...',
  userId: '...',
  hasCapturedFace: true,
  capturedFaceType: 'string',
  capturedFaceLength: [large number],
  capturedFacePrefix: 'data:image/jpeg;base64,...',
  hasPin: true,
  pinLength: 4
}
```

---

### 4. Test Error Cases

#### Test 4a: Wrong PIN
1. Click "Extract" on document
2. Capture face
3. Enter PIN: 9999
4. Click "Verify & Extract"

**Expected:**
- Error message: "Fingerprint verification failed"
- No server crash
- Modal stays open

#### Test 4b: No Face Capture
1. Click "Extract" on document
2. Don't capture face
3. Enter PIN: 1234
4. Click "Verify & Extract"

**Expected:**
- Button disabled (grayed out)
- Cannot submit

#### Test 4c: Expired Document
1. Wait for document to expire (or modify DB)
2. Try to extract

**Expected:**
- Error: "Document has expired"
- No server crash

---

## Debugging

### If "Missing face image data" appears:

**Check Frontend:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Extract"
4. Find POST request to `/api/documents/extract/...`
5. Check Request Payload:
   ```json
   {
     "capturedFace": "data:image/jpeg;base64,...",
     "fingerprintPin": "1234"
   }
   ```

**Verify:**
- `capturedFace` exists
- Starts with "data:image/"
- Has long base64 string
- `fingerprintPin` is "1234"

**Check Backend:**
1. Look at server console
2. Find "Extract request received" log
3. Verify:
   - `hasCapturedFace: true`
   - `capturedFaceType: 'string'`
   - `capturedFaceLength: > 1000`
   - `capturedFacePrefix: 'data:image/jpeg;base64,...'`

---

## Common Issues & Solutions

### Issue: Webcam not working
**Solution:**
- Allow camera permissions in browser
- Use HTTPS or localhost
- Check camera not in use by another app

### Issue: "Invalid face image format"
**Solution:**
- Retake photo
- Ensure good lighting
- Check browser console for errors

### Issue: "Face verification failed"
**Solution:**
- This is expected if faces don't match
- Try with same face used during registration
- Check similarity score in error message

### Issue: "Decryption failed"
**Solution:**
- Document may be corrupted
- Try uploading a new document
- Check server logs for details

---

## Success Indicators

✅ **Registration:**
- Face captured with green border
- Success message shown
- Redirects to dashboard

✅ **Upload:**
- File selected
- Success message
- Document in vault

✅ **Extraction:**
- Face captured
- PIN entered
- File downloads
- No errors in console
- Server logs show successful extraction

✅ **Error Handling:**
- Wrong PIN shows error
- No server crashes
- Clear error messages
- Modal stays open for retry

---

## Server Log Examples

### Successful Extraction:
```
Extract request received: {
  documentId: '507f1f77bcf86cd799439011',
  userId: '507f191e810c19729de860ea',
  hasCapturedFace: true,
  capturedFaceType: 'string',
  capturedFaceLength: 15234,
  capturedFacePrefix: 'data:image/jpeg;base64,/9j/4A',
  hasPin: true,
  pinLength: 4
}
```

### Failed Verification:
```
Extract request received: { ... }
Face verification: Missing face image data
```
OR
```
Extract request received: { ... }
Fingerprint verification failed
```

---

## Browser Console Check

**Should NOT see:**
- ❌ "Failed to read responseText"
- ❌ "Cannot read properties of undefined"
- ❌ "JWT malformed"
- ❌ "ERR_OSSL_BAD_DECRYPT"

**Should see:**
- ✅ Successful API calls (200, 201)
- ✅ Clear error messages (403, 500)
- ✅ No unhandled exceptions

---

## Final Verification

Run through complete flow:
1. ✅ Register with face capture
2. ✅ Login
3. ✅ Upload document
4. ✅ Extract with correct credentials
5. ✅ Test wrong PIN (should fail gracefully)
6. ✅ Check server logs (no crashes)
7. ✅ Check browser console (no errors)

**If all pass → System is working correctly!** 🎉
