const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AdminTeamManager {
  constructor() {
    this.token = core.getInput('github-token');
    this.appPem = core.getInput('github-app-pem');
    this.appId = core.getInput('github-app-id');
    this.organization = core.getInput('organization');
    this.issueNumber = core.getInput('issue-number');
    this.adminTeamRepoPath = core.getInput('admin-team-repo-path') || 'github-repo';
    this.octokit = github.getOctokit(this.token);
    this.adminTeamPath = path.join(this.adminTeamRepoPath, 'admin-team.yml');
  }

  async run() {
    try {
      core.info('Starting admin team management process');
      
      // Get issue details
      const issue = await this.getIssue();
      const username = this.extractUsername(issue.body);
      
      if (!username) {
        await this.commentOnIssue('❌ Could not find a valid GitHub username in the issue body. Please use the format `@username`.');
        return;
      }

      core.info(`Processing request for user: ${username}`);
      
      // Validate user exists and is org member
      const validationResult = await this.validateUser(username);
      
      if (!validationResult.exists) {
        await this.commentOnIssue(`❌ User @${username} does not exist on GitHub.`);
        return;
      }
      
      if (!validationResult.isOrgMember) {
        await this.commentOnIssue(`❌ User @${username} is not a member of the ${this.organization} organization.`);
        return;
      }
      
      // Add user to admin team
      const added = await this.addUserToAdminTeam(username);
      
      if (added) {
        await this.commentOnIssue(`✅ User @${username} has been successfully added to the admin team!`);
        await this.closeIssue();
      } else {
        await this.commentOnIssue(`ℹ️ User @${username} is already in the admin team.`);
        await this.closeIssue();
      }
      
    } catch (error) {
      core.setFailed(`Action failed: ${error.message}`);
      await this.commentOnIssue(`❌ Error processing request: ${error.message}`);
    }
  }

  async getIssue() {
    const { data: issue } = await this.octokit.rest.issues.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: this.issueNumber
    });
    return issue;
  }

  extractUsername(issueBody) {
    // Look for @username pattern
    const usernameMatch = issueBody.match(/@([a-zA-Z0-9-]+)/);
    return usernameMatch ? usernameMatch[1] : null;
  }

  async validateUser(username) {
    const result = { exists: false, isOrgMember: false };
    
    try {
      // Check if user exists using gh CLI
      const userCheck = execSync(`gh api /users/${username}`, { encoding: 'utf8' });
      result.exists = true;
      core.info(`User ${username} exists on GitHub`);
      
      // Check organization membership
      try {
        const memberCheck = execSync(`gh api /orgs/${this.organization}/members/${username}`, { encoding: 'utf8' });
        result.isOrgMember = true;
        core.info(`User ${username} is a member of ${this.organization}`);
      } catch (memberError) {
        // User might exist but not be a public member, try different endpoint
        try {
          const publicMemberCheck = execSync(`gh api /orgs/${this.organization}/public_members/${username}`, { encoding: 'utf8' });
          result.isOrgMember = true;
          core.info(`User ${username} is a public member of ${this.organization}`);
        } catch (publicMemberError) {
          core.info(`User ${username} is not a member of ${this.organization} or membership is private`);
          result.isOrgMember = false;
        }
      }
    } catch (userError) {
      core.info(`User ${username} does not exist on GitHub`);
    }
    
    return result;
  }

  async addUserToAdminTeam(username) {
    try {
      // Read current admin team file
      let adminTeam = { team_admins: [] };
      
      if (fs.existsSync(this.adminTeamPath)) {
        const content = fs.readFileSync(this.adminTeamPath, 'utf8');
        adminTeam = yaml.load(content) || { team_admins: [] };
      }
      
      // Ensure team_admins array exists
      if (!adminTeam.team_admins) {
        adminTeam.team_admins = [];
      }
      
      // Check if user is already in the team
      if (adminTeam.team_admins.includes(username)) {
        core.info(`User ${username} is already in the admin team`);
        return false;
      }
      
      // Add user to admin team
      adminTeam.team_admins.push(username);
      adminTeam.team_admins.sort(); // Keep the list sorted
      
      // Write updated file
      const yamlContent = yaml.dump(adminTeam, { lineWidth: -1 });
      
      fs.writeFileSync(this.adminTeamPath, yamlContent);
      
      // Commit and push changes to .github repository
      const currentDir = process.cwd();
      process.chdir(this.adminTeamRepoPath);
      
      execSync('git config --global user.name "Admin Team Manager"');
      execSync('git config --global user.email "admin-team-manager@github.com"');
      execSync('git add admin-team.yml');
      execSync(`git commit -m "Add ${username} to admin team via IssueOps"`);
      execSync('git push');
      
      process.chdir(currentDir);
      
      core.info(`User ${username} added to admin team`);
      return true;
      
    } catch (error) {
      core.error(`Failed to add user to admin team: ${error.message}`);
      throw error;
    }
  }

  async commentOnIssue(message) {
    await this.octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: this.issueNumber,
      body: message
    });
  }

  async closeIssue() {
    await this.octokit.rest.issues.update({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: this.issueNumber,
      state: 'closed'
    });
  }
}

// Run the action
if (require.main === module) {
  const manager = new AdminTeamManager();
  manager.run();
}

module.exports = AdminTeamManager;