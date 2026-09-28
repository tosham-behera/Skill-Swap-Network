import {
  getAllSkills,
  findSkillById,
  findOrCreateSkill,
  getTeachSkills,
  getWantedSkills,
  addTeachSkill,
  addWantedSkill,
  userTeachesSkill,
  userWantsSkill,
  MAX_SKILL_NAME,
} from '../models/Skill.js';
import { httpError } from '../middleware/errors.js';

function parseSkillPayload(req) {
  // Accept { skillId } OR { name } (get-or-create by name).
  const skillId = Number(req.body?.skillId);
  const name = req.body?.name;

  if (Number.isInteger(skillId) && skillId > 0) {
    return { skillId };
  }
  if (typeof name === 'string' && name.trim()) {
    const trimmed = name.trim();
    if (trimmed.length > MAX_SKILL_NAME) {
      throw httpError(400, 'VALIDATION_ERROR', `Skill name must be at most ${MAX_SKILL_NAME} characters.`);
    }
    return { name: trimmed };
  }
  throw httpError(400, 'VALIDATION_ERROR', 'Provide either "skillId" or "name" for the skill.');
}

// GET /api/skills - full catalog (for pickers/suggestions)
export async function listSkills(req, res, next) {
  try {
    const skills = await getAllSkills();
    return res.status(200).json({ skills });
  } catch (err) {
    next(err);
  }
}

// POST /api/skills - add a skill to the catalog (auth required)
export async function createSkill(req, res, next) {
  try {
    const name = String(req.body?.name ?? '').trim();
    if (!name) {
      throw httpError(400, 'VALIDATION_ERROR', 'Skill name is required.');
    }
    if (name.length > MAX_SKILL_NAME) {
      throw httpError(400, 'VALIDATION_ERROR', `Skill name must be at most ${MAX_SKILL_NAME} characters.`);
    }
    const skill = await findOrCreateSkill(name);
    return res.status(201).json({ skill });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/me/skills - my teach + wanted skills
export async function getMySkills(req, res, next) {
  try {
    const [teach, wanted] = await Promise.all([
      getTeachSkills(req.user.id),
      getWantedSkills(req.user.id),
    ]);
    return res.status(200).json({ teach, wanted });
  } catch (err) {
    next(err);
  }
}

// POST /api/users/me/skills - add a teach/wanted skill for me
// Body: { type: 'teach' | 'wanted', skillId } OR { type, name }
export async function addMySkill(req, res, next) {
  try {
    const type = req.body?.type;
    if (type !== 'teach' && type !== 'wanted') {
      throw httpError(400, 'VALIDATION_ERROR', 'Field "type" must be "teach" or "wanted".');
    }

    const payload = parseSkillPayload(req);
    const skill = payload.skillId
      ? await findSkillById(payload.skillId)
      : await findOrCreateSkill(payload.name);
    if (!skill) {
      throw httpError(404, 'SKILL_NOT_FOUND', 'Skill not found.');
    }

    const alreadyHas =
      type === 'teach'
        ? await userTeachesSkill(req.user.id, skill.id)
        : await userWantsSkill(req.user.id, skill.id);
    if (alreadyHas) {
      throw httpError(409, 'SKILL_ALREADY_ADDED', `You already added "${skill.name}".`);
    }

    if (type === 'teach') {
      await addTeachSkill(req.user.id, skill.id);
    } else {
      await addWantedSkill(req.user.id, skill.id);
    }

    const [teach, wanted] = await Promise.all([
      getTeachSkills(req.user.id),
      getWantedSkills(req.user.id),
    ]);
    return res.status(201).json({ skill, teach, wanted });
  } catch (err) {
    next(err);
  }
}
