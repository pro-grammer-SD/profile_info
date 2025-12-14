import { GitHubRepo, GitHubUser } from '../types';

const BASE_URL = 'https://api.github.com';
const USERNAME = 'pro-grammer-SD';

export class RateLimitError extends Error {
  resetTime: number;
  constructor(message: string, resetTime: number) {
    super(message);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      const resetHeader = response.headers.get('x-ratelimit-reset');
      // If header is missing, default to 1 hour from now to be safe and still show the cool UI
      const resetTime = resetHeader ? parseInt(resetHeader, 10) : Math.floor(Date.now() / 1000) + 3600;
      throw new RateLimitError('API Rate Limit Exceeded', resetTime);
    }
    throw new Error(`GitHub API Error: ${response.statusText}`);
  }
  return response.json();
};

export const fetchProfile = async (): Promise<GitHubUser> => {
  const response = await fetch(`${BASE_URL}/users/${USERNAME}`);
  return handleResponse(response);
};

export const fetchRepos = async (): Promise<GitHubRepo[]> => {
  const response = await fetch(`${BASE_URL}/users/${USERNAME}/repos?sort=updated&per_page=100`);
  return handleResponse(response);
};

// Fetch pinned repositories with fallback to Official GitHub API (Top Starred)
export const fetchPinnedRepos = async (): Promise<GitHubRepo[]> => {
    // Strategy 1: Try 3rd party proxy to get actual pinned repos (scraped)
    try {
        const response = await fetch(`https://gh-pinned-repos.egoist.dev/?username=${USERNAME}`);
        if (response.ok) {
            const pinnedData = await response.json();
            
            if (Array.isArray(pinnedData) && pinnedData.length > 0) {
                 // Map the pinned data structure to our GitHubRepo structure partially
                return pinnedData.map((pin: any, index: number) => ({
                    id: 999000 + index, // Fake ID
                    name: pin.repo,
                    full_name: `${pin.owner}/${pin.repo}`,
                    html_url: pin.link,
                    description: pin.description,
                    language: pin.language,
                    stargazers_count: parseInt(pin.stars) || 0,
                    forks_count: parseInt(pin.forks) || 0,
                    updated_at: new Date().toISOString(), // Fallback
                    clone_url: `https://github.com/${pin.owner}/${pin.repo}.git`,
                    default_branch: 'main', // Assumption
                    topics: []
                }));
            }
        }
    } catch (e) {
        console.warn("Proxy failed, falling back to GitHub API sorting", e);
    }

    // Strategy 2: Fallback to Official GitHub API (Top Starred)
    const response = await fetch(`${BASE_URL}/users/${USERNAME}/repos?sort=stargazers_count&direction=desc&per_page=6`);
    return handleResponse(response);
};

export const fetchFollowers = async (): Promise<GitHubUser[]> => {
    // Fetch first 12 followers
    const response = await fetch(`${BASE_URL}/users/${USERNAME}/followers?per_page=12`);
    const simpleUsers = await handleResponse(response);

    // OPTIMIZATION: Do NOT fetch detailed user info for each follower to save 12 API calls.
    // Map simple user data to GitHubUser interface with safe defaults.
    return simpleUsers.map((u: any) => ({
        id: u.id,
        login: u.login,
        avatar_url: u.avatar_url,
        html_url: u.html_url,
        name: u.login, // Simple endpoint doesn't provide name
        bio: "Coffee Club Member", // Simple endpoint doesn't provide bio
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: new Date().toISOString()
    }));
};

export const fetchReadme = async (repoName: string, branch: string = 'main'): Promise<string | null> => {
  const branches = [branch, 'master', 'main'];
  
  for (const b of branches) {
    const url = `https://raw.githubusercontent.com/${USERNAME}/${repoName}/${b}/README.md`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      console.warn(`Could not fetch README for ${repoName} on branch ${b}`);
    }
  }
  return null;
};

export const analyzeRepo = (repo: GitHubRepo): { roast: string; description: string } => {
  const lang = repo.language || 'Unknown';
  const stars = repo.stargazers_count;
  const forks = repo.forks_count;
  
  // Calculate a "Quality Score"
  let score = stars * 3 + forks * 2;
  
  if (repo.description && repo.description.length > 50) score += 5;
  if (repo.topics && repo.topics.length > 0) score += 5;

  let roast = 'Light Roast';
  let descTemplate = 0;

  if (score < 5) {
      roast = 'Light Roast'; // Mild, beginner, or new
      descTemplate = 0;
  } else if (score >= 5 && score < 20) {
      roast = 'Medium Roast'; // Balanced, standard
      descTemplate = 1;
  } else if (score >= 20 && score < 50) {
      roast = 'Dark Roast'; // Bold, popular
      descTemplate = 2;
  } else if (score >= 50 && score < 100) {
      roast = 'Espresso Blend'; // Intense, high activity
      descTemplate = 3;
  } else {
      roast = 'Double Shot Signature'; // The best of the best
      descTemplate = 4;
  }

  const descriptions = [
    [
        `A delicate ${lang} brew with subtle notes.`,
        `Light and airy ${lang} project, perfect for a morning start.`,
        `Freshly ground ${lang} concepts, steeping gently.`
    ],
    [
        `A balanced ${lang} blend with a smooth body.`,
        `Medium-bodied ${lang} architecture with a pleasant finish.`,
        `Classic ${lang} flavor profile, reliable and tasty.`
    ],
    [
        `Bold ${lang} flavors with a rich, full body.`,
        `Deep-roasted ${lang} logic for the refined palate.`,
        `A robust ${lang} creation with lingering complexity.`
    ],
    [
        `Intense ${lang} energy packed into every byte.`,
        `Concentrated ${lang} power, not for the faint of heart.`,
        `A high-caffeine ${lang} solution for heavy workloads.`
    ],
    [
        `The Master's Reserve: Premium ${lang} beans, perfectly extracted.`,
        `Award-winning ${lang} profile with complex undertones.`,
        `The ultimate ${lang} experience. Pure liquid gold.`
    ]
  ];

  // Pick a random description from the appropriate roast level tier
  const tierDescs = descriptions[descTemplate];
  const selectedDesc = tierDescs[repo.id % tierDescs.length]; // Deterministic random
  
  return {
    roast,
    description: selectedDesc
  };
};