# GitHub Configuration for MindSpace

This directory contains GitHub-specific configuration files for the MindSpace repository.

## Files Overview

### `copilot-instructions.md`
**Purpose**: Provides comprehensive instructions for GitHub Copilot coding agents working on this repository.

**Key sections**:
- Project overview and tech stack
- Development commands and workflows
- Code patterns and conventions
- Testing and quality standards
- Agent workflow best practices
- Security guidelines

**Usage**: When a GitHub Copilot agent is assigned an issue, it will automatically read this file to understand the project context, conventions, and expectations.

### `workflows/copilot-setup-steps.yml`
**Purpose**: Defines the setup steps that GitHub Copilot agents will run to prepare their environment.

**What it does**:
- Checks out the repository code
- Sets up Node.js and pnpm (version 9.12.0)
- Configures Java/Android SDK for mobile builds
- Sets up .NET for Windows/MSIX builds
- Configures Python for API scripts
- Installs all necessary dependencies

**Job name**: `copilot-setup-steps` (required name for Copilot to recognize it)

**Triggers**:
- Manual workflow dispatch
- On push to `copilot-setup-steps.yml`
- On PR affecting `copilot-setup-steps.yml`

## How GitHub Copilot Uses These Files

1. **Issue Assignment**: When you assign an issue to `@copilot`, the coding agent is activated
2. **Context Loading**: The agent reads `copilot-instructions.md` to understand the project
3. **Environment Setup**: The agent runs the steps in `copilot-setup-steps.yml` to prepare its environment
4. **Work Execution**: The agent follows the guidelines and conventions documented in the instructions
5. **PR Creation**: The agent creates a pull request with its changes for human review

## Best Practices for Maintainers

### Keeping Instructions Updated
- Update `copilot-instructions.md` whenever:
  - New conventions are established
  - Tech stack changes (new dependencies, frameworks)
  - Development workflows evolve
  - Security policies change
  - New testing requirements are added

### Setup Steps Maintenance
- Update `copilot-setup-steps.yml` whenever:
  - Node.js, Java, .NET, or Python versions change
  - New build tools are required
  - New environment variables are needed
  - New SDK components are required

### Testing Changes
- Test setup steps by running the workflow manually
- Verify instructions by reviewing agent-created PRs
- Gather feedback from human developers using the same instructions

## Resources

- [GitHub Copilot Coding Agent Documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent)
- [Best Practices for Copilot in Repositories](https://gh.io/copilot-coding-agent-tips)
- [MindSpace Design Document](../design.md)
- [MindSpace Integration Guide](../INTEGRATION_GUIDE.md)

## Support

If you encounter issues with Copilot agents:
1. Check the agent's logs in the GitHub UI
2. Review the PR description for error messages
3. Verify the setup steps run successfully
4. Update the instructions if needed
5. Contact @21leahcimhtiek-oss for assistance

---

Last updated: 2026-03-25
