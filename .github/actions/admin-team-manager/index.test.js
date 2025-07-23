const AdminTeamManager = require('./index');
const fs = require('fs');
const path = require('path');

// Mock external dependencies
jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('child_process');

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

  describe('extractUsername', () => {
    test('should extract username from issue body', () => {
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
  });
});