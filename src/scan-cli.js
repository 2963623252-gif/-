const { scanSkills } = require('./skill-service');
const { getActiveProfile } = require('./agent-profiles');

const customRoot = process.argv[2];
const activeProfile = getActiveProfile();
const result = customRoot
  ? scanSkills(customRoot)
  : scanSkills({ ...activeProfile, agentName: activeProfile.name });
console.log(JSON.stringify(result, null, 2));
