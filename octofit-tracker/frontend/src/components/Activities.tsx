import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

type ActivitiesPayload = { activities?: Activity[] };

function loadActivities() {
  return getJson<ActivitiesPayload>('/api/activities');
}

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      load={loadActivities}
      emptyMessage="No activities"
      mapItems={(payload: { activities?: Activity[] }) => payload.activities ?? []}
      renderItem={(item, index) => {
        const activity = item as Activity;
        return (
          <div key={`activity-${index}`}>
            <strong>{activity.type ?? 'Activity'}</strong>
            <div className="text-muted">{activity.minutes ?? 0} minutes · {activity.points ?? 0} points</div>
          </div>
        );
      }}
    />
  );
}
