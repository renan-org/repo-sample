const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AdminTeamManager {
  constructor() {
    this.token = core.getInput('github-token');
    core.info(`Using token: ${this.token ? '***' : 'not set'}`);
    this.appPem = core.getInput('github-app-pem');
    core.info(`Using app PEM: ${this.appPem ? '***' : 'not set'}`);
    this.appId = core.getInput('github-app-id');
    core.info(`Using app ID: ${this.appId ? '***' : 'not set'}`);
    this.organization = core.getInput('organization');
    core.info(`Using organization: ${this.organization}`);
    this.issueNumber = core.getInput('issue-number');
    core.info(`Using issue number: ${this.issueNumber}`);
    this.adminTeamRepo = core.getInput('admin-team-repo') || '.github';
    core.info(`Using admin team repository path: ${this.adminTeamRepo}`);
    this.octokit = github.getOctokit(this.token);
    core.info('Initialized Octokit client');
    this.adminTeamPath = path.join(this.adminTeamRepo, 'admin-team.yml');
    core.info(`Admin team file path: ${this.adminTeamPath}`);
  }

  async run() {
    try {
      core.info('Starting admin team management process');
      
      // Get issue details
      const issue = await this.getIssue();
      const username = this.extractUsername(issue.body);
      const actionType = this.extractActionType(issue.body);
      
      if (!username) {
        await this.commentOnIssue('❌ Could not find a valid GitHub username in the issue body. Please provide a GitHub Handle.');
        return;
      }

      core.info(`Processing ${actionType} request for user: ${username}`);
      
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
      
      // Perform the requested action
      if (actionType === 'add') {
        const added = await this.addUserToAdminTeam(username);
        
        if (added) {
          await this.commentOnIssue(`✅ User @${username} has been successfully added to the admin team!`);
          await this.closeIssue();
        } else {
          await this.commentOnIssue(`ℹ️ User @${username} is already in the admin team.`);
          await this.closeIssue();
        }
      } else if (actionType === 'remove') {
        const removed = await this.removeUserFromAdminTeam(username);
        
        if (removed) {
          await this.commentOnIssue(`✅ User @${username} has been successfully removed from the admin team!`);
          await this.closeIssue();
        } else {
          await this.commentOnIssue(`ℹ️ User @${username} is not in the admin team.`);
          await this.closeIssue();
        }
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
    // First try to extract from GitHub issue form data
    const githubHandleMatch = issueBody.match(/###\s*GitHub Handle\s*\n\s*([a-zA-Z0-9-]+)/i);
    if (githubHandleMatch) {
      return githubHandleMatch[1];
    }
    
    // Fallback to @username pattern for backward compatibility
    const usernameMatch = issueBody.match(/@([a-zA-Z0-9-]+)/);
    return usernameMatch ? usernameMatch[1] : null;
  }

  extractActionType(issueBody) {
    // Extract action type from GitHub issue form data
    const actionMatch = issueBody.match(/###\s*Modification Type\s*\n\s*(add|remove)/i);
    return actionMatch ? actionMatch[1].toLowerCase() : 'add'; // default to add
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
      // Read current admin team file or create default structure
      let adminTeam = { team_admins: [] };
      
      if (fs.existsSync(this.adminTeamPath)) {
        const content = fs.readFileSync(this.adminTeamPath, 'utf8');
        adminTeam = yaml.load(content) || { team_admins: [] };
      } else {
        // Create the directory if it doesn't exist
        const dir = path.dirname(this.adminTeamPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        core.info('Created new admin team file structure');
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
      
      // Write updated file with proper YAML structure
      const yamlContent = yaml.dump(adminTeam, { 
        lineWidth: -1,
        noRefs: true,
        sortKeys: true
      });
      
      fs.writeFileSync(this.adminTeamPath, yamlContent);
      
      // Commit and push changes to .github repository
      await this.commitChanges(`Add ${username} to admin team via IssueOps`);
      
      core.info(`User ${username} added to admin team`);
      return true;
      
    } catch (error) {
      core.error(`Failed to add user to admin team: ${error.message}`);
      throw error;
    }
  }

  async removeUserFromAdminTeam(username) {
    try {
      // Read current admin team file
      if (!fs.existsSync(this.adminTeamPath)) {
        core.info('Admin team file does not exist');
        return false;
      }
      
      const content = fs.readFileSync(this.adminTeamPath, 'utf8');
      let adminTeam = yaml.load(content) || { team_admins: [] };
      
      // Ensure team_admins array exists
      if (!adminTeam.team_admins) {
        adminTeam.team_admins = [];
      }
      
      // Check if user is in the team
      const userIndex = adminTeam.team_admins.indexOf(username);
      if (userIndex === -1) {
        core.info(`User ${username} is not in the admin team`);
        return false;
      }
      
      // Remove user from admin team
      adminTeam.team_admins.splice(userIndex, 1);
      adminTeam.team_admins.sort(); // Keep the list sorted
      
      // Write updated file with proper YAML structure
      const yamlContent = yaml.dump(adminTeam, { 
        lineWidth: -1,
        noRefs: true,
        sortKeys: true
      });
      
      fs.writeFileSync(this.adminTeamPath, yamlContent);
      
      // Commit and push changes to .github repository
      await this.commitChanges(`Remove ${username} from admin team via IssueOps`);
      
      core.info(`User ${username} removed from admin team`);
      return true;
      
    } catch (error) {
      core.error(`Failed to remove user from admin team: ${error.message}`);
      throw error;
    }
  }

  async commitChanges(commitMessage) {
    const currentDir = process.cwd();
    process.chdir(this.adminTeamRepo);
    
    execSync('git config --global user.name "Admin Team Manager"');
    execSync('git config --global user.email "admin-team-manager@github.com"');
    execSync('git add admin-team.yml');
    execSync(`git commit -m "${commitMessage}"`);
    execSync('git push');
    
    process.chdir(currentDir);
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

// Run the action - This is the entry point when the action is executed
if (require.main === module) {
  const manager = new AdminTeamManager();
  manager.run();
}

module.exports = AdminTeamManager;
