import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name?: string;
  members?: string[];
};

type TeamsPayload = { teams?: Team[] };

function loadTeams() {
  return getJson<TeamsPayload>('/api/teams');
}

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      load={loadTeams}
      emptyMessage="No teams"
      mapItems={(payload: { teams?: Team[] }) => payload.teams ?? []}
      renderItem={(item) => {
        const team = item as Team;
        return (
          <div>
            <strong>{team.name ?? 'Team'}</strong>
            <div className="text-muted">{team.members?.join(', ') || 'No members'}</div>
          </div>
        );
      }}
    />
  );
}
