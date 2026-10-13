import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  reason?: string;
};

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path="/api/workouts/suggestions/mona@example.com"
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
