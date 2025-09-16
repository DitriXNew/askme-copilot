# 🧪 Manual Testing Guide for Ask Me Copilot Tools

Send to chat (it can be free version):

We are testing MCP call to expert, send each this case to expert:

#### 🧠 Ask Expert Tool
```
@workspace I need help choosing the best architecture pattern for this project. Should I use:
1. MVC (Model-View-Controller)
2. MVP (Model-View-Presenter) 
3. MVVM (Model-View-ViewModel)

What do you recommend and why?
```

#### 🎯 Select from List Tool  
```
@workspace I have multiple database options for this project:
- PostgreSQL
- MongoDB
- SQLite
- MySQL

Which one would be best for a small-to-medium scale application?
```

#### 📝 Review Code Tool
```
@workspace Please review this TypeScript function for potential issues:

function processUserData(data: any) {
    return data.map(item => item.name.toUpperCase());
}

Focus on type safety and error handling.
```

#### ⚠️ Confirm Action Tool
```
@workspace I want to delete all log files in the project directory. This will remove:
- log.log
- debug.log
- error.log

Should I proceed with this cleanup?
```
