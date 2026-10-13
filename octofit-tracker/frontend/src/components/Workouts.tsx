import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  reason?: string;
};

type WorkoutsPayload = { suggestions?: WorkoutSuggestion[] };

function loadWorkouts() {
  return getJson<WorkoutsPayload>('/api/workouts/suggestions/mona@example.com');
}

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      load={loadWorkouts}
      emptyMessage="No workout suggestions"
      mapItems={(payload: { suggestions?: WorkoutSuggestion[] }) => payload.suggestions ?? []}
      renderItem={(item) => {
        const suggestion = item as WorkoutSuggestion;
        return (
          <div>
            <strong>{suggestion.title ?? 'Workout'}</strong>
            <div className="text-muted">{suggestion.reason ?? 'No reason provided'}</div>
          </div>
        );
      }}
    />
  );
}
