const AdminTeamManager = require('./index');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Mock external dependencies
jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('child_process');

// Mock filesystem operations
const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
};

// Replace fs functions with mocks
Object.keys(mockFs).forEach(key => {
  fs[key] = mockFs[key];
});

// Mock process.chdir
const originalChdir = process.chdir;
const mockChdir = jest.fn();
process.chdir = mockChdir;

const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');

describe('AdminTeamManager', () => {
  let manager;
  let mockOctokit;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock core inputs
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'github-token': 'mock-token',
        'organization': 'test-org',
        'issue-number': '123',
        'admin-team-repo-path': 'mock-github-repo'
      };
      return inputs[name] || '';
    });

    // Mock GitHub context
    github.context = {
      repo: {
        owner: 'test-owner',
        repo: 'test-repo'
      }
    };

    // Mock octokit
    mockOctokit = {
      rest: {
        issues: {
          get: jest.fn(),
          createComment: jest.fn(),
          update: jest.fn()
        }
      }
    };
    
    github.getOctokit.mockReturnValue(mockOctokit);
    
    manager = new AdminTeamManager();
  });

  afterAll(() => {
    // Restore original process.chdir
    process.chdir = originalChdir;
  });

  describe('extractUsername', () => {
    test('should extract username from GitHub issue form data', () => {
      const issueBody = `
### GitHub Handle

testuser

### Modification Type

add
`;
      const username = manager.extractUsername(issueBody);
      expect(username).toBe('testuser');
    });

    test('should extract username from issue body with @mention (backward compatibility)', () => {
      const issueBody = 'Please add @testuser to the admin team';
      const username = manager.extractUsername(issueBody);
      expect(username).toBe('testuser');
    });

    test('should return null if no username found', () => {
      const issueBody = 'No username in this text';
      const username = manager.extractUsername(issueBody);
      expect(username).toBeNull();
    });

    test('should extract first username if multiple present', () => {
      const issueBody = 'Add @firstuser and @seconduser';
      const username = manager.extractUsername(issueBody);
      expect(username).toBe('firstuser');
    });
  });

  describe('extractActionType', () => {
    test('should extract add action from GitHub issue form data', () => {
      const issueBody = `
### Modification Type

add
`;
      const actionType = manager.extractActionType(issueBody);
      expect(actionType).toBe('add');
    });

    test('should extract remove action from GitHub issue form data', () => {
      const issueBody = `
### Modification Type

remove
`;
      const actionType = manager.extractActionType(issueBody);
      expect(actionType).toBe('remove');
    });

    test('should default to add if no action type found', () => {
      const issueBody = 'No action type in this text';
      const actionType = manager.extractActionType(issueBody);
      expect(actionType).toBe('add');
    });
  });

  describe('validateUser', () => {
    test('should return valid result for existing org member', async () => {
      execSync.mockImplementation((command) => {
        if (command.includes('/users/')) {
          return JSON.stringify({ login: 'testuser' });
        }
        if (command.includes('/orgs/')) {
          return JSON.stringify({ login: 'testuser' });
        }
        return '';
      });

      const result = await manager.validateUser('testuser');
      expect(result.exists).toBe(true);
      expect(result.isOrgMember).toBe(true);
    });

    test('should handle non-existent user', async () => {
      execSync.mockImplementation(() => {
        throw new Error('User not found');
      });

      const result = await manager.validateUser('nonexistentuser');
      expect(result.exists).toBe(false);
      expect(result.isOrgMember).toBe(false);
    });

    test('should handle user exists but not org member', async () => {
      execSync.mockImplementation((command) => {
        if (command.includes('/users/')) {
          return JSON.stringify({ login: 'testuser' });
        }
        if (command.includes('/orgs/')) {
          throw new Error('Not found');
        }
        return '';
      });

      const result = await manager.validateUser('testuser');
      expect(result.exists).toBe(true);
      expect(result.isOrgMember).toBe(false);
    });
  });

  describe('addUserToAdminTeam', () => {
    test('should create new admin team file when it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});
      
      // Mock execSync for git operations
      execSync.mockImplementation(() => {});
      mockChdir.mockImplementation(() => {});

      const result = await manager.addUserToAdminTeam('newuser');
      
      expect(mockFs.mkdirSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should add user to existing admin team', async () => {
      const existingContent = yaml.dump({ team_admins: ['existinguser'] });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(existingContent);
      mockFs.writeFileSync.mockImplementation(() => {});
      
      // Mock execSync for git operations
      execSync.mockImplementation(() => {});
      mockChdir.mockImplementation(() => {});

      const result = await manager.addUserToAdminTeam('newuser');
      
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false when user already exists in team', async () => {
      const existingContent = yaml.dump({ team_admins: ['existinguser'] });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(existingContent);

      const result = await manager.addUserToAdminTeam('existinguser');
      
      expect(result).toBe(false);
    });
  });

  describe('removeUserFromAdminTeam', () => {
    test('should return false when admin team file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await manager.removeUserFromAdminTeam('anyuser');
      
      expect(result).toBe(false);
    });

    test('should remove user from admin team', async () => {
      const existingContent = yaml.dump({ team_admins: ['user1', 'user2'] });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(existingContent);
      mockFs.writeFileSync.mockImplementation(() => {});
      
      // Mock execSync for git operations
      execSync.mockImplementation(() => {});
      mockChdir.mockImplementation(() => {});

      const result = await manager.removeUserFromAdminTeam('user1');
      
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false when user is not in team', async () => {
      const existingContent = yaml.dump({ team_admins: ['user1', 'user2'] });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(existingContent);

      const result = await manager.removeUserFromAdminTeam('nonexistentuser');
      
      expect(result).toBe(false);
    });
  });
});