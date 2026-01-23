# 🧪 Ask Me Copilot - Tool Tests

Tests for verifying all 7 tools. Each test guides you through the verification steps.

**How to use:** Copy each prompt, send to Copilot, follow the exact steps.

---

## 🧠 TEST 1: askExpert

**Send this to Copilot:**
```
This is a TEST for askExpert tool.

Call askExpert with:
- question: "TEST 1: This dialog tests askExpert. Please verify: 1) You see this question text 2) Context appears below 3) Priority indicator shows ⚡ HIGH. Then type 'askExpert works' and click Submit."
- context: "You should see this context text displayed separately from the question above."
- priority: "high"
```

**What to verify:**
1. ✅ Dialog appeared with the question text
2. ✅ Context text visible below question
3. ✅ HIGH priority indicator (⚡) shown
4. ✅ Type "askExpert works" in the input
5. ✅ Click Submit

---

## 🎯 TEST 2A: selectFromList (Single Selection)

**Send this to Copilot:**
```
This is a TEST for selectFromList (SINGLE selection mode).

Call selectFromList with:
- question: "TEST 2A: Single selection test. You should see 4 radio buttons. Verify 'Default Option' is pre-selected. Select 'Choose This One' and click Submit."
- options: ["Default Option", "Choose This One", "Don't select this", "Or this"]
- defaultSelection: 0
- multiSelect: false
```

**What to verify:**
1. ✅ 4 options displayed as RADIO BUTTONS
2. ✅ "Default Option" is pre-selected
3. ✅ Can only select ONE option at a time
4. ✅ Select "Choose This One"
5. ✅ Click Submit

---

## 🎯 TEST 2B: selectFromList (Multi Selection)

**Send this to Copilot:**
```
This is a TEST for selectFromList (MULTI selection mode).

Call selectFromList with:
- question: "TEST 2B: Multi selection test. You should see 5 checkboxes. Select exactly these three: First, Third, Fifth. Leave Second and Fourth unselected. Click Submit."
- options: ["First - SELECT", "Second - skip", "Third - SELECT", "Fourth - skip", "Fifth - SELECT"]
- multiSelect: true
```

**What to verify:**
1. ✅ 5 options displayed as CHECKBOXES
2. ✅ Can select MULTIPLE options
3. ✅ Select: First, Third, Fifth
4. ✅ Leave unselected: Second, Fourth
5. ✅ Click Submit - Copilot should receive 3 values

---

## 📝 TEST 3: reviewCode

**Send this to Copilot:**
```
This is a TEST for reviewCode tool.

Call reviewCode with:
- code: "// TEST CODE - Find 2 issues:\n// Issue 1: SQL injection\nconst user = db.query('SELECT * FROM users WHERE id=' + id);\n// Issue 2: Hardcoded secret\nconst token = jwt.sign(data, 'hardcoded-secret-123');"
- language: "javascript"
- question: "TEST 3: Code review test. Review the code above. Write in your response: 'Found issues: 1) SQL injection 2) Hardcoded secret' and click Submit."
- focusAreas: ["security"]
```

**What to verify:**
1. ✅ Code displayed with syntax highlighting
2. ✅ Question text visible
3. ✅ Focus area "security" listed
4. ✅ Type in response: "Found issues: 1) SQL injection 2) Hardcoded secret"
5. ✅ Click Submit

---

## ⚠️ TEST 4: confirmAction

**Send this to Copilot:**
```
This is a TEST for confirmAction tool.

Call confirmAction with:
- action: "TEST 4: Confirm action test"
- details: "You should see 3 buttons: Confirm, Reject, and Cancel (X). First click REJECT to test that button. Then run the test again and click CONFIRM."
```

**What to verify:**
1. ✅ Warning modal dialog appeared
2. ✅ Action text visible
3. ✅ Details text visible
4. ✅ THREE buttons present: Confirm, Reject, Cancel (X)
5. ✅ Click REJECT - Copilot sees "Expert explicitly rejected action"
6. ✅ Run test again, click CONFIRM - Copilot sees "Expert confirmed action"

---

## 🖼️ TEST 5: readImage

**Send this to Copilot:**
```
This is a TEST for readImage tool.

Call readImage with:
- filePath: "icon.png"
- description: "TEST 5: Reading project icon. Describe what you see in the image - colors, shapes, any text or symbols."
- quality: 80
```

**What to verify:**
1. ✅ Tool called without errors
2. ✅ Copilot describes the image content
3. ✅ If error: check icon.png exists in project root

---

## 📊 TEST 6: checkTaskStatus

**Send this to Copilot:**
```
This is a TEST for checkTaskStatus tool.

Call checkTaskStatus with:
- reason: "TEST 6: Checking if there are pending expert messages"

Report what status you received. Expected: "No pending actions" if queue is empty.
```

**What to verify:**
1. ✅ Tool called successfully
2. ✅ Status response received
3. ✅ Expected: "No pending actions from expert"

---

## 📋 TEST 7: questionnaire

**Send this to Copilot:**
```
This is a TEST for questionnaire tool.

Call questionnaire with:
- title: "TEST 7: Questionnaire Test"
- description: "Follow the instructions for each field exactly as described."
- sections: [
    {
      "title": "Section 1: Basic Fields",
      "fields": [
        { "type": "text", "name": "textTest", "label": "Text Field - Type: hello", "required": true },
        { "type": "textarea", "name": "textareaTest", "label": "Textarea - Type: This is a longer text" },
        { "type": "number", "name": "numberTest", "label": "Number - Enter: 42", "defaultValue": 0 }
      ]
    },
    {
      "title": "Section 2: Selection Fields",
      "fields": [
        { "type": "checkbox", "name": "checkTest", "label": "Checkbox - CHECK this box", "defaultValue": false },
        { "type": "select", "name": "selectTest", "label": "Select - Choose: Second", "options": ["First", "Second", "Third"] },
        { "type": "radio", "name": "radioTest", "label": "Radio - Select: Option B", "options": ["Option A", "Option B", "Option C"] }
      ]
    },
    {
      "title": "Section 3: Conditional Field",
      "fields": [
        { "type": "checkbox", "name": "showHidden", "label": "Toggle this checkbox to show/hide the field below" },
        { "type": "text", "name": "conditionalField", "label": "CONDITIONAL - This field should HIDE when checkbox is unchecked", "showWhen": { "field": "showHidden", "value": true } }
      ]
    }
  ]
```

**What to verify:**
1. ✅ Form title "TEST 7: Questionnaire Test" visible
2. ✅ Description visible
3. ✅ 3 sections displayed

**Section 1 - Fill in:**
- ✅ Text Field → type: `hello`
- ✅ Textarea → type: `This is a longer text`
- ✅ Number → enter: `42`

**Section 2 - Fill in:**
- ✅ Checkbox → CHECK the box
- ✅ Select → choose: `Second`
- ✅ Radio → select: `Option B`

**Section 3 - Test conditional:**
- ✅ With checkbox UNCHECKED: conditional field is HIDDEN
- ✅ CHECK the checkbox: conditional field APPEARS
- ✅ UNCHECK: field HIDES again

**Finally:**
- ✅ Try Submit without "hello" in text field - should show required error
- ✅ Fill all required fields and Submit

---

## ✅ Test Checklist

| # | Tool | What to verify | Done |
|---|------|----------------|------|
| 1 | askExpert | Dialog, context, priority indicator | ⬜ |
| 2A | selectFromList | Radio buttons, default selection, single pick | ⬜ |
| 2B | selectFromList | Checkboxes, multi-selection works | ⬜ |
| 3 | reviewCode | Code highlight, question, focus areas | ⬜ |
| 4 | confirmAction | 3 buttons: Confirm/Reject/Cancel | ⬜ |
| 5 | readImage | Image reading and description | ⬜ |
| 6 | checkTaskStatus | Status response | ⬜ |
| 7 | questionnaire | All field types + conditional visibility | ⬜ |

**Total: 8 tests covering all 7 tools**
