# Repo Sample

This repository serves as a **comprehensive playground and testing sandbox** for:

- 🧪 Playing with GitHub features
- 🔧 Testing apps and integrations
- ⚙️ Experimenting with GitHub Actions
- 🎯 Testing workflow automation patterns
- 🔐 Security scanning and analysis
- 🤖 IssueOps automation

Feel free to explore, experiment, and break things!

## 📦 What's Inside

### Node.js Express Application
A simple REST API built with Express.js (v5.2.1) for testing purposes:
- **Endpoint**: `GET /` returns `{ "message": "Hello World!" }`
- **Port**: Configurable via `PORT` environment variable (default: 5000)
- **Run**: `npm start`
- **Test**: `npm test` (uses Mocha + SuperTest)

### Docker Support
The application is containerized with:
- **Base Image**: `node:21-alpine`
- **Exposed Port**: 80
- **Build**: `docker build -t repo-sample .`
- **Run**: `docker run -p 80:80 repo-sample`

## 🔄 GitHub Actions Workflows

This repository contains several GitHub Actions workflows for testing and experimentation:

| Workflow | Description | Triggers |
|----------|-------------|----------|
| **CodeQL Advanced** | Automated code scanning for security vulnerabilities using CodeQL analysis for JavaScript/TypeScript and GitHub Actions | Push, PR, Schedule (weekly) |
| **Admin Team Management** | Automates admin team membership requests via issue-based workflows (IssueOps) | Issues with `admin-request` label |
| **Test Admin Team Management** | Manual workflow dispatch for testing admin team operations | Manual dispatch |
| **Dummy Security Scan** | Reusable security scanning workflow integration | Called by other workflows |
| **Merge Gatekeeper** | Ensures all required checks pass before allowing merges | PR status changes |
| **ARC Workflow** | Tests self-hosted runners with Actions Runner Controller (ARC) | Various triggers |
| **Label Workflow** | Handles PR label events (e.g., `review-completed` label logic) | PR label changes |
| **Dummy Reusable Workflow** | Demonstrates reusable workflow patterns with local custom actions | Manual/external calls |
| **Test Reusable Locally** | Tests reusable workflows locally before releasing/tagging | Manual dispatch |
| **Actions Demo** | General GitHub Actions demonstration workflow | Various triggers |

## 🎬 Custom Actions

### Admin Team Manager (`admin-team-manager`)
A Node.js-based custom action that manages team membership via IssueOps:
- Parses issue templates for admin requests
- Validates users and organization membership
- Automatically creates PRs to modify `admin-team.yml`
- Supports both add and remove operations

See [ADMIN_TEAM_MANAGEMENT.md](./ADMIN_TEAM_MANAGEMENT.md) for detailed documentation.

### Dummy Action (`dummy-action`)
A composite action demonstrating:
- Local custom action patterns
- Input/output handling
- Reusable workflow integration

## 🚀 Getting Started

### Prerequisites
- Node.js 21+ (or use Docker)
- npm (comes with Node.js)

### Local Development
```bash
# Install dependencies
npm install

# Run the application
npm start

# Run tests
npm test
```

### Using Docker
```bash
# Build the Docker image
docker build -t repo-sample .

# Run the container
docker run -p 5000:80 repo-sample

# Access the application
curl http://localhost:5000
```

## 🛡️ Security Features

- **CodeQL Analysis**: Automated security scanning for JavaScript/TypeScript and GitHub Actions
- **Secret Scanning**: Configured via `.github/secret_scanning.yml`
- **Dependabot**: Automated dependency updates configured
- **Security Policy**: See [SECURITY.md](./SECURITY.md)

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📚 Additional Documentation

- [Admin Team Management Guide](./ADMIN_TEAM_MANAGEMENT.md) - IssueOps-based admin team management
- [Code of Conduct](./CODE_OF_CONDUCT.md) - Community guidelines
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Security Policy](./SECURITY.md) - Security vulnerability reporting
