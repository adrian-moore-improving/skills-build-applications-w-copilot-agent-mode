import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' ||
    !mongoose.isValidObjectId(userId) ||
    typeof teamId !== 'string' ||
    !mongoose.isValidObjectId(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))
  ) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const memberIds = [...new Set(members as string[])];
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) {
      throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
    }
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  if (memberIds.length > 0) {
    await Promise.all([
      Team.updateMany({ _id: { $ne: team._id }, members: { $in: memberIds } }, { $pull: { members: { $in: memberIds } } }),
      User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } }),
    ]);
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map(({ _id, name }) => ({
      teamName: name,
      totalPoints: pointsByTeam.get(_id.toString()) ?? 0,
    }))
    .sort((first, second) => second.totalPoints - first.totalPoints || first.teamName.localeCompare(second.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [workouts, activities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).select('type minutes').lean(),
  ]);
  const activityMinutesByFocus = new Map<string, number>();
  const activityTypesByFocus = new Map<string, Set<string>>();
  for (const activity of activities) {
    const type = activity.type.trim().toLowerCase();
    const focus = ['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'swim', 'swimming'].includes(type)
      ? 'endurance'
      : type;
    activityMinutesByFocus.set(focus, (activityMinutesByFocus.get(focus) ?? 0) + activity.minutes);
    const types = activityTypesByFocus.get(focus) ?? new Set<string>();
    types.add(type);
    activityTypesByFocus.set(focus, types);
  }

  const goal = user.fitnessGoal.trim().toLowerCase();
  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const matchingActivities = activityTypesByFocus.get(focus);
      const activityDescription = matchingActivities ? [...matchingActivities].join(', ') : '';
      return {
        ...workout,
        reason: activityDescription
          ? `Recommended for your ${focus} goal and ${activityDescription} activity.`
          : `Recommended to support your ${goal} goal.`,
        goalMatch: focus === goal,
        activityMinutes: activityMinutesByFocus.get(focus) ?? 0,
      };
    })
    .sort((first, second) =>
      Number(second.goalMatch) - Number(first.goalMatch) ||
      second.activityMinutes - first.activityMinutes ||
      first.title.localeCompare(second.title),
    )
    .map(({ goalMatch: _goalMatch, activityMinutes: _activityMinutes, ...suggestion }) => suggestion);
}

export { User };
