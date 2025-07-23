# Admin Team Management via IssueOps

This repository implements an automated admin team management system using GitHub IssueOps.

## How to Request Admin Access

1. **Create an Issue**: Use the "Admin Team Request" issue template
2. **Fill in Details**: Provide your GitHub username and justification
3. **Submit**: The system will automatically process your request

## Process Flow

1. Issue is created with the `admin-request` label
2. GitHub Action triggers and validates:
   - User exists on GitHub
   - User is a member of the organization
3. If valid, user is added to the organization's `.github/admin-team.yml` file
4. Issue is automatically closed with a success/failure comment

## Authentication

The system supports two authentication methods:

### GitHub Personal Access Token (PAT)
Set `GITHUB_TOKEN` secret in repository settings.

### GitHub App (Recommended)
Set the following secrets:
- `GITHUB_APP_ID`: Your GitHub App ID
- `GITHUB_APP_PEM`: Your GitHub App private key in PEM format

## Admin Team File

The admin team members are stored in the organization's `.github/admin-team.yml` file:

```yaml
team_admins:
  - user1
  - user2
```

This file is located in the `.github` repository of your organization (e.g., `https://github.com/yourorg/.github/blob/main/admin-team.yml`).

## Technical Implementation

- **Language**: Node.js
- **Dependencies**: @actions/core, @actions/github, js-yaml
- **CLI Tools**: GitHub CLI (gh)
- **Testing**: Jest
- **Validation**: User existence and organization membership

## Security Features

- Validates user exists on GitHub
- Ensures user is organization member
- Automated commit signing
- Proper error handling and reporting
- No manual file editing required

## Workflow Triggers

The workflow activates on:
- Issue opened with `admin-request` label
- Issue edited with `admin-request` label

## Permissions Required

The workflow needs:
- `issues: write` - To comment and close issues
- `contents: write` - To modify the .github repository's admin-team.yml
- `pull-requests: write` - For repository operations