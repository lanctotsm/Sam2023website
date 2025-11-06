---
inclusion: always
---

# Windows Command Guidelines

This project is being developed on a Windows machine. Always use Windows-compatible commands:

## Shell Commands
- Use PowerShell or CMD commands only
- Never use Unix/Linux commands like `ls`, `grep`, `cat`, `find`, etc.
- Use Windows equivalents:
  - `dir` instead of `ls`
  - `type` instead of `cat`
  - `findstr` instead of `grep`
  - PowerShell cmdlets like `Get-ChildItem`, `Get-Content`, etc.

## File Paths
- Use Windows path separators (`\`) when needed
- Be aware of Windows file system limitations

## Testing
- Use `go test` commands which work cross-platform
- Avoid shell-specific test runners or scripts

## Development Environment
- Operating System: Windows
- Platform: win32
- Shell: cmd/PowerShell